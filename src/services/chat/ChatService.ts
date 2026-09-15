// src/services/chat/ChatService.ts
import { createClient } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/types';

/**
 * Toca um aviso sonoro sintetizado no navegador quando uma nova mensagem é recebida
 */
export function playMessageReceivedChime() {
    try {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        osc.frequency.setValueAtTime(1046.50, now + 0.16); // C6

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);

        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    } catch {
        // ignore audio failure on muted browsers
    }
}

export class ChatService {
    /**
     * Busca todas as mensagens da corrida no Supabase
     */
    public static async getMessages(rideId: string): Promise<ChatMessage[]> {
        if (!rideId) return [];
        const supabase = createClient();

        try {
            // 1. Tenta buscar na tabela ride_messages
            const { data, error } = await supabase
                .from('ride_messages')
                .select('*')
                .eq('ride_id', rideId)
                .order('created_at', { ascending: true });

            if (!error && Array.isArray(data)) {
                return data.map((item: any) => ({
                    id: String(item.id),
                    ride_id: String(item.ride_id),
                    sender_id: item.sender_id ? String(item.sender_id) : undefined,
                    sender_role: item.sender_role || (item.sender_type === 'passenger' ? 'passenger' : 'driver'),
                    sender_name: item.sender_name || (item.sender_role === 'passenger' ? 'Passageiro' : 'Motorista'),
                    content: item.content || item.message || item.text || '',
                    created_at: item.created_at || new Date().toISOString(),
                    read: Boolean(item.read || item.is_read),
                }));
            }

            // 2. Fallback para tabela alternativa 'messages' ou 'mensagens'
            try {
                const { data: altData } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('ride_id', rideId)
                    .order('created_at', { ascending: true });

                if (Array.isArray(altData) && altData.length > 0) {
                    return altData.map((item: any) => ({
                        id: String(item.id),
                        ride_id: String(item.ride_id),
                        sender_id: item.sender_id ? String(item.sender_id) : undefined,
                        sender_role: item.sender_role || 'passenger',
                        sender_name: item.sender_name || 'Passageiro',
                        content: item.content || item.message || item.text || '',
                        created_at: item.created_at || new Date().toISOString(),
                        read: Boolean(item.read),
                    }));
                }
            } catch (_) {}

            return [];
        } catch (err) {
            console.error('[ChatService] Erro ao buscar mensagens:', err);
            return [];
        }
    }

    /**
     * Envia uma mensagem no chat da corrida
     */
    public static async sendMessage(params: {
        rideId: string;
        senderId?: string;
        senderRole: 'driver' | 'passenger' | 'system' | 'central';
        senderName: string;
        content: string;
    }): Promise<ChatMessage | null> {
        if (!params.rideId || !params.content.trim()) return null;
        const supabase = createClient();
        const nowIso = new Date().toISOString();

        const payload = {
            ride_id: params.rideId,
            sender_id: params.senderId || null,
            sender_role: params.senderRole,
            sender_name: params.senderName,
            content: params.content.trim(),
            read: false,
            created_at: nowIso,
        };

        try {
            // 1. Tenta inserir em ride_messages
            let { data, error } = await supabase
                .from('ride_messages')
                .insert([payload])
                .select()
                .single();

            if (error) {
                console.warn('[ChatService] Tentando inserção com payload adaptado:', error.message);
                // Tenta sem sender_id se falhar por FK
                const { data: retryData, error: retryErr } = await supabase
                    .from('ride_messages')
                    .insert([{
                        ride_id: params.rideId,
                        sender_role: params.senderRole,
                        sender_name: params.senderName,
                        content: params.content.trim(),
                    }])
                    .select()
                    .single();

                if (!retryErr && retryData) {
                    data = retryData;
                }
            }

            if (data) {
                return {
                    id: String(data.id),
                    ride_id: String(data.ride_id),
                    sender_id: data.sender_id ? String(data.sender_id) : undefined,
                    sender_role: data.sender_role || params.senderRole,
                    sender_name: data.sender_name || params.senderName,
                    content: data.content || params.content,
                    created_at: data.created_at || nowIso,
                    read: false,
                };
            }

            // Mock local fallback se o banco estiver offline
            return {
                id: `local-${Date.now()}`,
                ride_id: params.rideId,
                sender_id: params.senderId,
                sender_role: params.senderRole,
                sender_name: params.senderName,
                content: params.content.trim(),
                created_at: nowIso,
                read: false,
            };
        } catch (err) {
            console.error('[ChatService] Erro ao enviar mensagem:', err);
            return null;
        }
    }

    /**
     * Marca mensagens como lidas
     */
    public static async markAsRead(rideId: string, currentRole: 'driver' | 'passenger' = 'driver'): Promise<void> {
        if (!rideId) return;
        const supabase = createClient();
        const oppositeRole = currentRole === 'driver' ? 'passenger' : 'driver';

        try {
            await supabase
                .from('ride_messages')
                .update({ read: true })
                .eq('ride_id', rideId)
                .eq('sender_role', oppositeRole);
        } catch {
            // ignore
        }
    }

    /**
     * Escuta em tempo real as mensagens da corrida via WebSocket e Polling fallback
     */
    public static subscribeToRideMessages(
        rideId: string,
        onNewMessage: (msg: ChatMessage) => void
    ): () => void {
        if (!rideId) return () => {};
        const supabase = createClient();
        const processedIds = new Set<string>();

        let channel: any = null;
        try {
            channel = supabase
                .channel(`chat_realtime_${rideId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'ride_messages',
                        filter: `ride_id=eq.${rideId}`,
                    },
                    (payload: any) => {
                        const item = payload.new;
                        if (item && item.id && !processedIds.has(String(item.id))) {
                            processedIds.add(String(item.id));
                            const parsed: ChatMessage = {
                                id: String(item.id),
                                ride_id: String(item.ride_id),
                                sender_id: item.sender_id ? String(item.sender_id) : undefined,
                                sender_role: item.sender_role || 'passenger',
                                sender_name: item.sender_name || 'Passageiro',
                                content: item.content || item.message || '',
                                created_at: item.created_at || new Date().toISOString(),
                                read: Boolean(item.read),
                            };
                            onNewMessage(parsed);
                        }
                    }
                )
                .subscribe();
        } catch (err) {
            console.warn('[ChatService] Erro ao criar canal Realtime:', err);
        }

        // Polling fallback a cada 2.5s para conexões instáveis
        const interval = setInterval(async () => {
            try {
                const { data } = await supabase
                    .from('ride_messages')
                    .select('*')
                    .eq('ride_id', rideId)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (Array.isArray(data)) {
                    for (const item of data) {
                        if (item && item.id && !processedIds.has(String(item.id))) {
                            processedIds.add(String(item.id));
                            onNewMessage({
                                id: String(item.id),
                                ride_id: String(item.ride_id),
                                sender_id: item.sender_id ? String(item.sender_id) : undefined,
                                sender_role: item.sender_role || 'passenger',
                                sender_name: item.sender_name || 'Passageiro',
                                content: item.content || item.message || '',
                                created_at: item.created_at || new Date().toISOString(),
                                read: Boolean(item.read),
                            });
                        }
                    }
                }
            } catch (_) {}
        }, 2500);

        return () => {
            clearInterval(interval);
            if (channel) {
                try {
                    supabase.removeChannel(channel);
                } catch {}
            }
        };
    }
}
