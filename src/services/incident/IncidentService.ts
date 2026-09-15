// src/services/incident/IncidentService.ts
import { createClient } from '@/lib/supabase';
import type { IncidentReport, IncidentType } from '@/lib/types';

const STORAGE_KEY = 'mobipro_incidents_v1';

function generateProtocol(): string {
  const random = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `OC-${year}-${random}`;
}

export class IncidentService {
  /**
   * Registra uma nova ocorrência com persistência no Supabase e fallback local
   */
  public static async reportIncident(params: {
    rideId: string;
    driverId?: string;
    passengerName?: string;
    incidentType: IncidentType;
    description: string;
    amountUnpaid?: number;
    itemDescription?: string;
    evidenceNotes?: string;
  }): Promise<IncidentReport> {
    const protocol = generateProtocol();
    const newReport: IncidentReport = {
      id: crypto.randomUUID ? crypto.randomUUID() : `inc_${Date.now()}`,
      rideId: params.rideId,
      driverId: params.driverId,
      passengerName: params.passengerName,
      incidentType: params.incidentType,
      description: params.description,
      amountUnpaid: params.amountUnpaid,
      itemDescription: params.itemDescription,
      evidenceNotes: params.evidenceNotes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      protocolNumber: protocol,
    };

    // 1. Salvar no Supabase
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ride_incidents')
        .insert({
          ride_id: params.rideId,
          driver_id: params.driverId,
          passenger_name: params.passengerName,
          incident_type: params.incidentType,
          description: params.description,
          amount_unpaid: params.amountUnpaid || 0,
          item_description: params.itemDescription,
          evidence_notes: params.evidenceNotes,
          protocol_number: protocol,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && data) {
        newReport.id = data.id;
      }
    } catch (err) {
      console.warn('[IncidentService] Falha ao persistir no Supabase, salvando localmente:', err);
    }

    // 2. Salvar no LocalStorage (Garantia offline)
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        const list: IncidentReport[] = raw ? JSON.parse(raw) : [];
        list.unshift(newReport);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }
    } catch (err) {
      console.warn('[IncidentService] Falha ao salvar no localStorage:', err);
    }

    return newReport;
  }

  /**
   * Busca todas as ocorrências do motorista
   */
  public static async getDriverIncidents(driverId?: string): Promise<IncidentReport[]> {
    let list: IncidentReport[] = [];

    // Busca do Supabase
    try {
      const supabase = createClient();
      let query = supabase.from('ride_incidents').select('*').order('created_at', { ascending: false });

      if (driverId) {
        query = query.eq('driver_id', driverId);
      }

      const { data, error } = await query;
      if (!error && data) {
        list = data.map((d: any) => ({
          id: d.id,
          rideId: d.ride_id,
          driverId: d.driver_id,
          passengerName: d.passenger_name,
          incidentType: d.incident_type,
          description: d.description,
          amountUnpaid: Number(d.amount_unpaid || 0),
          itemDescription: d.item_description,
          evidenceNotes: d.evidence_notes,
          status: d.status || 'pending',
          createdAt: d.created_at,
          protocolNumber: d.protocol_number,
        }));
      }
    } catch (err) {
      console.warn('[IncidentService] Erro ao buscar do Supabase:', err);
    }

    // Mesclar com o localStorage
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const localList: IncidentReport[] = JSON.parse(raw);
          const seen = new Set(list.map((i) => i.id || i.protocolNumber));
          for (const item of localList) {
            if (!seen.has(item.id) && (!item.protocolNumber || !seen.has(item.protocolNumber))) {
              list.push(item);
            }
          }
        }
      }
    } catch {}

    return list;
  }
}
