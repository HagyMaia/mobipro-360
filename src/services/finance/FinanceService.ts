// src/services/finance/FinanceService.ts
import { createClient } from '@/lib/supabase';

export interface DriverFinancialRide {
    id: string;
    created_at: string;
    distance_km: number;
    fare_amount: number; // Valor líquido creditado na carteira (já com 20% de desconto se particular)
    gross_fare: number;  // Valor bruto da corrida
    discount_amount: number; // Valor do desconto da plataforma (20% para particulares)
    discount_rate: number; // 0.20 ou 0.00
    payment_method: 'pix' | 'voucher' | string;
    is_particular: boolean;
    passenger_name?: string;
    pickup_address?: string;
    dropoff_address?: string;
}

export interface DriverEarningsSummary {
    rides: DriverFinancialRide[];
    totalEarned: number; // Saldo líquido total acumulado na carteira
    grossTotal: number;  // Total bruto movimentado
    totalDiscount: number; // Total de taxa/desconto de 20% retido
}

export class FinanceService {
    public static async getDriverEarnings(driverId?: string): Promise<DriverEarningsSummary> {
        const supabase = createClient();
        const rawList: any[] = [];
        const seenIds = new Set<string>();

        // 1. Carrega do armazenamento local imediato para não perder corridas salvas no cliente
        if (typeof window !== 'undefined') {
            try {
                const rawV2 = window.localStorage.getItem('mobipro_ride_history_v2');
                if (rawV2) {
                    const parsed = JSON.parse(rawV2);
                    if (Array.isArray(parsed)) {
                        for (const item of parsed) {
                            if (item && item.id && !seenIds.has(String(item.id))) {
                                const st = String(item.status || '').toLowerCase();
                                if (st === 'completed' || st === 'finalizada' || st === 'concluida') {
                                    seenIds.add(String(item.id));
                                    rawList.push(item);
                                }
                            }
                        }
                    }
                }
            } catch (_) {}

            try {
                const rawState = window.localStorage.getItem('mobipro_state_v1');
                if (rawState) {
                    const parsed = JSON.parse(rawState);
                    if (Array.isArray(parsed?.rideHistory)) {
                        for (const item of parsed.rideHistory) {
                            if (item && item.id && !seenIds.has(String(item.id))) {
                                const st = String(item.status || '').toLowerCase();
                                if (st === 'completed' || st === 'finalizada' || st === 'concluida') {
                                    seenIds.add(String(item.id));
                                    rawList.push(item);
                                }
                            }
                        }
                    }
                }
            } catch (_) {}
        }

        // 2. Busca corridas concluídas no Supabase (tabela rides)
        try {
            let query = supabase
                .from('rides')
                .select('*')
                .in('status', ['COMPLETED', 'FINALIZADA', 'CONCLUIDA'])
                .order('created_at', { ascending: false });

            if (driverId) {
                query = query.or(`driver_id.eq.${driverId},driver_id.is.null`);
            }

            const { data: rides, error } = await query;
            if (!error && Array.isArray(rides)) {
                for (const r of rides) {
                    if (r && r.id && !seenIds.has(String(r.id))) {
                        seenIds.add(String(r.id));
                        rawList.push(r);
                    }
                }
            }
        } catch (_) {}

        // 3. Fallback para tabela corridas
        try {
            const { data: corridas } = await supabase
                .from('corridas')
                .select('*')
                .in('status', ['FINALIZADA', 'COMPLETED', 'CONCLUIDA'])
                .order('criado_em', { ascending: false });

            if (Array.isArray(corridas)) {
                for (const c of corridas) {
                    if (c && c.id && !seenIds.has(String(c.id))) {
                        seenIds.add(String(c.id));
                        rawList.push(c);
                    }
                }
            }
        } catch (_) {}

        const formattedRides: DriverFinancialRide[] = rawList.map((ride: any) => {
            const rawPayment = String(
                ride.payment_method ||
                ride.paymentMethod ||
                ride.metodo_pagamento ||
                ride.forma_pagamento ||
                (ride.is_voucher || ride.voucher_code || ride.codigo_voucher ? 'voucher' : '') ||
                ''
            ).toLowerCase();

            const isVoucher = rawPayment.includes('voucher') ||
                Boolean(ride.voucher_code) ||
                Boolean(ride.codigo_voucher) ||
                ride.is_voucher === true ||
                ride.voucher === true ||
                String(ride.passenger_type || ride.tipo_passageiro || ride.tipo || '').toLowerCase().includes('conven') ||
                String(ride.passenger_type || ride.tipo_passageiro || ride.tipo || '').toLowerCase().includes('empresa');

            const isParticular = !isVoucher;

            const grossFare = Number(
                ride.gross_fare ||
                ride.fare_amount ||
                ride.fare ||
                ride.valor ||
                ride.preco ||
                ride.valor_total ||
                0
            );

            // Regra de Negócio Essencial:
            // - Corrida particular (PIX): 20% de desconto retido pela plataforma (motorista recebe 80%)
            // - Corrida por Voucher (Convênio / Empresa): ZERO desconto, 100% de repasse integral
            const discountRate = isParticular ? 0.20 : 0.0;
            const discountAmount = isParticular ? Number((grossFare * discountRate).toFixed(2)) : 0.0;
            const netFare = isParticular ? Number((grossFare - discountAmount).toFixed(2)) : grossFare;

            const dist = Number(
                ride.distance_km ||
                ride.distancia_km ||
                ride.distance ||
                4.5
            );

            return {
                id: String(ride.id),
                created_at: ride.completed_at || ride.completedAt || ride.created_at || ride.criado_em || ride.requestedAt || new Date().toISOString(),
                distance_km: dist,
                fare_amount: netFare, // Saldo líquido real creditado ao motorista
                gross_fare: grossFare,
                discount_amount: discountAmount,
                discount_rate: discountRate,
                payment_method: isVoucher ? 'voucher' : 'pix',
                is_particular: isParticular,
                passenger_name: ride.passenger_name || ride.passengerName || ride.cliente_nome || ride.nome_passageiro,
                pickup_address: ride.pickup_address || ride.pickup || ride.origem_endereco || ride.embarque,
                dropoff_address: ride.dropoff_address || ride.dropoff || ride.destino_endereco || ride.desembarque,
            };
        });

        // Ordena por data decrescente (mais recente primeiro)
        formattedRides.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const totalEarned = formattedRides.reduce((acc, r) => acc + r.fare_amount, 0);
        const grossTotal = formattedRides.reduce((acc, r) => acc + r.gross_fare, 0);
        const totalDiscount = formattedRides.reduce((acc, r) => acc + r.discount_amount, 0);

        return {
            rides: formattedRides,
            totalEarned: Number(totalEarned.toFixed(2)),
            grossTotal: Number(grossTotal.toFixed(2)),
            totalDiscount: Number(totalDiscount.toFixed(2)),
        };
    }
}