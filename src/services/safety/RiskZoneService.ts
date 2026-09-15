// src/services/safety/RiskZoneService.ts
import type { Coordinates, RiskAssessment } from '@/lib/types';

export interface RiskZoneDefinition {
  id: string;
  name: string;
  keywords: string[];
  level: 'low' | 'medium' | 'high';
  reason: string;
  tips: string[];
  center?: Coordinates;
  radiusKm?: number;
}

// Catálogo de Zonas de Atenção / Restrição Operacional e Segurança
export const RISK_ZONES_CATALOG: RiskZoneDefinition[] = [
  {
    id: 'risk-becos-geral',
    name: 'Beco ou Acesso Restrito',
    keywords: ['beco', 'vielas', 'escadão', 'rip-rap', 'igarape', 'igarapé', 'invasao', 'invasão'],
    level: 'high',
    reason: 'Via estreita com manobra limitada ou histórico de ponto cego.',
    tips: [
      'Não entre em becos sem saída ou sem iluminação.',
      'Solicite ao passageiro que aguarde na via principal asfaltada.',
      'Mantenha as travas e vidros acionados.'
    ]
  },
  {
    id: 'risk-ramais-isolados',
    name: 'Ramal Isolado / Sem Pavimentação',
    keywords: ['ramal', 'vicinal', 'estrada de barro', 'sitio', 'chacara', 'km '],
    level: 'medium',
    reason: 'Região com sinal de internet intermitente e via não pavimentada.',
    tips: [
      'Confirme se o veículo possui tração adequada para a via.',
      'Verifique se há sinal de celular antes de prosseguir.',
      'Compartilhe a rota com seus contatos de confiança.'
    ]
  },
  {
    id: 'risk-comunidades-perimetro',
    name: 'Área com Restrição Noturna',
    keywords: ['grande vitoria', 'mauazinho', 'comunidade sao pedro', 'purapura', 'puraquequara', 'colonia antonio aleixo', 'caceribu'],
    level: 'high',
    reason: 'Região com histórico de restrição de segurança no período noturno.',
    tips: [
      'Atenção redobrada após as 20h.',
      'Evite paradas longas com o motor desligado.',
      'Embarque preferencialmente em postos de combustível ou comércio movimentado.'
    ]
  },
  {
    id: 'risk-porto-estaleiros',
    name: 'Área Portuária / Fluvial',
    keywords: ['porto', 'estaleiro', 'balsa', 'orla fluvial', 'rodway', 'panair'],
    level: 'medium',
    reason: 'Área de grande fluxo de cargas com iluminação reduzida na madrugada.',
    tips: [
      'Confirme o nome e destino do passageiro antes de liberar o embarque.',
      'Desembarque em locais com presença de vigias ou movimento.'
    ]
  }
];

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class RiskZoneService {
  /**
   * Avalia se um endereço ou coordenadas geográficas caem em área de risco / alerta
   */
  public static checkAddressRisk(address?: string, coords?: Coordinates): RiskAssessment | null {
    if (!address && !coords) return null;

    const normalizedAddress = (address || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 1. Verificação por proximidade geográfica
    if (coords?.latitude && coords?.longitude) {
      for (const zone of RISK_ZONES_CATALOG) {
        if (zone.center && zone.radiusKm) {
          const dist = calculateDistanceKm(
            coords.latitude,
            coords.longitude,
            zone.center.latitude,
            zone.center.longitude
          );
          if (dist <= zone.radiusKm) {
            return {
              isRisk: true,
              level: zone.level,
              reason: zone.reason,
              areaName: zone.name,
              tips: zone.tips,
            };
          }
        }
      }
    }

    // 2. Verificação por palavras-chave no endereço
    for (const zone of RISK_ZONES_CATALOG) {
      for (const kw of zone.keywords) {
        const normalizedKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const regex = new RegExp(`\\b${normalizedKw}\\b`, 'i');
        if (regex.test(normalizedAddress) || normalizedAddress.includes(normalizedKw)) {
          return {
            isRisk: true,
            level: zone.level,
            reason: zone.reason,
            areaName: zone.name,
            tips: zone.tips,
          };
        }
      }
    }

    return null;
  }

  /**
   * Retorna todas as zonas cadastradas
   */
  public static getAllRiskZones(): RiskZoneDefinition[] {
    return RISK_ZONES_CATALOG;
  }
}
