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
    public static async getDriverEarnings(driverId: string): Promise<DriverEarningsSummary> {
        const supabase = createClient();

        let ridesData: any[] = [];

        const { data: rides, error } = await supabase
            .from('rides')
            .select('*')
            .eq('driver_id', driverId)
            .eq('status', 'COMPLETED')
            .order('created_at', { ascending: false });

        if (rides && rides.length > 0) {
            ridesData = rides;
        } else {
            // Fallback para tabela de corridas em português se houver
            try {
                const { data: corridas } = await supabase
                    .from('corridas')
                    .select('*')
                    .eq('motorista_id', driverId)
                    .eq('status', 'FINALIZADA')
                    .order('criado_em', { ascending: false });
                if (corridas && corridas.length > 0) {
                    ridesData = corridas;
                }
            } catch (_) {}
        }

        const formattedRides: DriverFinancialRide[] = ridesData.map((ride: any) => {
            const rawPayment = String(
                ride.payment_method ||
                ride.metodo_pagamento ||
                ride.forma_pagamento ||
                'pix'
            ).toLowerCase();

            const isVoucher = rawPayment.includes('voucher');
            const isParticular = !isVoucher;

            const grossFare = Number(
                ride.fare_amount ||
                ride.valor ||
                ride.fare ||
                ride.preco ||
                ride.valor_total ||
                0
            );

            // Regra de Negócio: Corrida particular tem 20% de desconto retido pela plataforma
            // Corrida por voucher (empresa) não tem desconto (100% de repasse)
            const discountRate = isParticular ? 0.20 : 0.0;
            const discountAmount = Number((grossFare * discountRate).toFixed(2));
            const netFare = Number((grossFare - discountAmount).toFixed(2));

            const dist = Number(
                ride.distance_km ||
                ride.distancia_km ||
                ride.distance ||
                4.5
            );

            return {
                id: String(ride.id),
                created_at: ride.created_at || ride.criado_em || new Date().toISOString(),
                distance_km: dist,
                fare_amount: netFare, // O valor na carteira já exibe o valor líquido com desconto
                gross_fare: grossFare,
                discount_amount: discountAmount,
                discount_rate: discountRate,
                payment_method: isVoucher ? 'voucher' : 'pix',
                is_particular: isParticular,
                passenger_name: ride.passenger_name || ride.cliente_nome || ride.nome_passageiro,
                pickup_address: ride.pickup_address || ride.origem_endereco || ride.embarque,
                dropoff_address: ride.dropoff_address || ride.destino_endereco || ride.desembarque,
            };
        });

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