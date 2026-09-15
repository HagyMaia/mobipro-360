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

        gain.gain.setValueAtTime(0.2, now);
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

/**
 * Normaliza qualquer formato de remetente (passageiro, passageira, cliente, user, motorista, etc.)
 */
export function normalizeSenderRole(item: any): 'driver' | 'passenger' | 'system' | 'central' {
    const raw = String(
        item?.sender_role ||
        item?.sender_type ||
        item?.role ||
        item?.remetente ||
        item?.tipo_remetente ||
        item?.autor ||
        (item?.is_driver ? 'driver' : '') ||
        (item?.is_passenger ? 'passenger' : '') ||
        ''
    ).toLowerCase().trim();

    if (raw.includes('driver') || raw.includes('motorista') || raw.includes('condutor') || raw.includes('taxista')) {
        return 'driver';
    }
    if (raw.includes('system') || raw.includes('sistema') || raw.includes('bot')) {
        return 'system';
    }
    if (raw.includes('central') || raw.includes('suporte') || raw.includes('admin') || raw.includes('atendente')) {
        return 'central';
    }
    // Qualquer outro papel é considerado passageiro
    return 'passenger';
}

/**
 * Normaliza registro bruto de banco ou payload Realtime em ChatMessage tipado
 */
export function parseRawMessage(item: any): ChatMessage | null {
    if (!item || typeof item !== 'object') return null;

    const content = String(
        item.content ??
        item.message ??
        item.mensagem ??
        item.text ??
        item.texto ??
        item.body ??
        item.msg ??
        ''
    ).trim();

    if (!content) return null;

    const id = String(item.id || item.message_id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    const ride_id = String(item.ride_id || item.corrida_id || item.trip_id || item.rideId || '');
    const sender_role = normalizeSenderRole(item);
    const sender_name = String(
        item.sender_name ||
        item.nome_remetente ||
        item.nome ||
        (sender_role === 'driver' ? 'Motorista' : sender_role === 'passenger' ? 'Passageiro' : 'Central')
    );

    return {
        id,
        ride_id,
        sender_id: item.sender_id ? String(item.sender_id) : undefined,
        sender_role,
        sender_name,
        content,
        created_at: item.created_at || item.enviada_em || item.data || item.timestamp || new Date().toISOString(),
        read: Boolean(item.read || item.is_read || item.lida || item.visualizada),
    };
}

const LOCAL_STORAGE_CHAT_PREFIX = 'mobipro_chat_messages_';

function getLocalMessages(rideId: string): ChatMessage[] {
    if (typeof window === 'undefined' || !rideId) return [];
    try {
        const raw = window.localStorage.getItem(`${LOCAL_STORAGE_CHAT_PREFIX}${rideId}`);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.map(parseRawMessage).filter((m): m is ChatMessage => m !== null);
        }
    } catch {
        // ignore
    }
    return [];
}

function saveLocalMessage(msg: ChatMessage): void {
    if (typeof window === 'undefined' || !msg.ride_id) return;
    try {
        const existing = getLocalMessages(msg.ride_id);
        if (!existing.some((m) => m.id === msg.id)) {
            const updated = [...existing, msg];
            window.localStorage.setItem(`${LOCAL_STORAGE_CHAT_PREFIX}${msg.ride_id}`, JSON.stringify(updated));
        }
    } catch {
        // ignore
    }
}

export class ChatService {
    /**
     * Busca todas as mensagens da corrida com tolerância a múltiplos schemas e fallbacks
     */
    public static async getMessages(rideId: string): Promise<ChatMessage[]> {
        if (!rideId) return [];
        const supabase = createClient();
        const messageMap = new Map<string, ChatMessage>();

        // 1. Carrega do armazenamento local primeiro (resiliente e instantâneo)
        const localList = getLocalMessages(rideId);
        for (const msg of localList) {
            messageMap.set(msg.id, msg);
        }

        try {
            // 2. Busca na tabela ride_messages
            try {
                const { data, error } = await supabase
                    .from('ride_messages')
                    .select('*')
                    .eq('ride_id', rideId)
                    .order('created_at', { ascending: true });

                if (!error && Array.isArray(data)) {
                    for (const item of data) {
                        const parsed = parseRawMessage(item);
                        if (parsed) {
                            messageMap.set(parsed.id, parsed);
                            saveLocalMessage(parsed);
                        }
                    }
                } else if (error) {
                    // Fallback com busca OR
                    const { data: orData } = await supabase
                        .from('ride_messages')
                        .select('*')
                        .or(`ride_id.eq.${rideId},corrida_id.eq.${rideId}`)
                        .order('created_at', { ascending: true });

                    if (Array.isArray(orData)) {
                        for (const item of orData) {
                            const parsed = parseRawMessage(item);
                            if (parsed) {
                                messageMap.set(parsed.id, parsed);
                                saveLocalMessage(parsed);
                            }
                        }
                    }
                }
            } catch (err1) {
                console.warn('[ChatService] Erro ao buscar ride_messages:', err1);
            }

            // 3. Busca na tabela alternativa 'messages'
            try {
                const { data: altData, error: altErr } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('ride_id', rideId)
                    .order('created_at', { ascending: true });

                if (!altErr && Array.isArray(altData) && altData.length > 0) {
                    for (const item of altData) {
                        const parsed = parseRawMessage(item);
                        if (parsed) {
                            messageMap.set(parsed.id, parsed);
                            saveLocalMessage(parsed);
                        }
                    }
                } else if (altErr) {
                    const { data: altOrData } = await supabase
                        .from('messages')
                        .select('*')
                        .or(`ride_id.eq.${rideId},corrida_id.eq.${rideId}`)
                        .order('created_at', { ascending: true });
                    if (Array.isArray(altOrData)) {
                        for (const item of altOrData) {
                            const parsed = parseRawMessage(item);
                            if (parsed) {
                                messageMap.set(parsed.id, parsed);
                                saveLocalMessage(parsed);
                            }
                        }
                    }
                }
            } catch (_) {}

            // 4. Busca na tabela 'chat_messages' se existir
            try {
                const { data: chatData } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .eq('ride_id', rideId)
                    .order('created_at', { ascending: true });

                if (Array.isArray(chatData)) {
                    for (const item of chatData) {
                        const parsed = parseRawMessage(item);
                        if (parsed) {
                            messageMap.set(parsed.id, parsed);
                            saveLocalMessage(parsed);
                        }
                    }
                }
            } catch (_) {}

            const results = Array.from(messageMap.values());
            results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return results;
        } catch (err) {
            console.error('[ChatService] Erro ao buscar mensagens:', err);
            return Array.from(messageMap.values());
        }
    }

    /**
     * Envia uma mensagem no chat da corrida (suporta motorista e passageiro)
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

        const localMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ride_id: params.rideId,
            sender_id: params.senderId,
            sender_role: params.senderRole,
            sender_name: params.senderName,
            content: params.content.trim(),
            created_at: nowIso,
            read: false,
        };

        // Salva localmente de imediato
        saveLocalMessage(localMessage);

        // Notifica canais de broadcast locais (multi-abas ou simulação)
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            try {
                const bc = new BroadcastChannel(`mobipro_chat_${params.rideId}`);
                bc.postMessage(localMessage);
                bc.close();
            } catch (_) {}
        }

        const payload: Record<string, any> = {
            ride_id: params.rideId,
            corrida_id: params.rideId,
            sender_id: params.senderId || null,
            sender_role: params.senderRole,
            sender_type: params.senderRole,
            sender_name: params.senderName,
            content: params.content.trim(),
            message: params.content.trim(),
            mensagem: params.content.trim(),
            read: false,
            is_read: false,
            created_at: nowIso,
        };

        try {
            // 1. Tenta inserir em ride_messages
            let { data, error } = await supabase
                .from('ride_messages')
                .insert([payload])
                .select()
                .maybeSingle();

            // 2. Fallback com payload enxuto
            if (error) {
                const { data: retryData, error: retryErr } = await supabase
                    .from('ride_messages')
                    .insert([{
                        ride_id: params.rideId,
                        sender_role: params.senderRole,
                        sender_name: params.senderName,
                        content: params.content.trim(),
                    }])
                    .select()
                    .maybeSingle();

                if (!retryErr && retryData) {
                    data = retryData;
                    error = null;
                }
            }

            // 3. Fallback para tabela messages
            if (error) {
                try {
                    const { data: altData } = await supabase
                        .from('messages')
                        .insert([{
                            ride_id: params.rideId,
                            sender_role: params.senderRole,
                            sender_name: params.senderName,
                            content: params.content.trim(),
                        }])
                        .select()
                        .maybeSingle();
                    if (altData) {
                        data = altData;
                    }
                } catch (_) {}
            }

            if (data) {
                const parsed = parseRawMessage(data);
                if (parsed) {
                    saveLocalMessage(parsed);
                    return parsed;
                }
            }

            return localMessage;
        } catch (err) {
            console.error('[ChatService] Erro ao enviar mensagem no banco, retornado local:', err);
            return localMessage;
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
                .update({ read: true, is_read: true })
                .eq('ride_id', rideId)
                .or(`sender_role.eq.${oppositeRole},sender_type.eq.${oppositeRole}`);
        } catch {
            // ignore
        }
    }

    /**
     * Envia uma mensagem simulada do passageiro (útil para testes, homologação e demonstração)
     */
    public static async simulatePassengerMessage(
        rideId: string,
        passengerName = 'Passageiro',
        content = 'Olá motorista, estou aguardando no portão principal!'
    ): Promise<ChatMessage | null> {
        return this.sendMessage({
            rideId,
            senderRole: 'passenger',
            senderName: passengerName,
            content,
        });
    }

    /**
     * Escuta em tempo real as mensagens da corrida via Realtime WebSocket, BroadcastChannel e Polling proativo
     */
    public static subscribeToRideMessages(
        rideId: string,
        onNewMessage: (msg: ChatMessage) => void
    ): () => void {
        if (!rideId) return () => {};
        const supabase = createClient();
        const processedIds = new Set<string>();

        // Preenche IDs locais já conhecidos para não duplicar
        const initialLocals = getLocalMessages(rideId);
        for (const m of initialLocals) {
            processedIds.add(m.id);
        }

        const handleIncoming = (raw: any) => {
            const parsed = parseRawMessage(raw);
            if (!parsed) return;

            // Se o ride_id for de outra corrida específica diferente, ignora
            const isMatchingRide =
                !parsed.ride_id ||
                parsed.ride_id === rideId ||
                rideId.includes(parsed.ride_id) ||
                parsed.ride_id.includes(rideId) ||
                raw?.corrida_id === rideId ||
                raw?.ride_id === rideId;

            if (!isMatchingRide) return;

            if (!processedIds.has(parsed.id)) {
                processedIds.add(parsed.id);
                saveLocalMessage(parsed);
                onNewMessage(parsed);
            }
        };

        // 1. Canal Realtime do Supabase (WebSocket)
        let channel: any = null;
        try {
            channel = supabase
                .channel(`chat_realtime_${rideId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'ride_messages',
                    },
                    (payload: any) => {
                        const row = payload.new || payload.old;
                        if (row) handleIncoming(row);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'messages',
                    },
                    (payload: any) => {
                        const row = payload.new || payload.old;
                        if (row) handleIncoming(row);
                    }
                )
                .on('broadcast', { event: 'new_message' }, (payload: any) => {
                    if (payload.payload) handleIncoming(payload.payload);
                })
                .on('broadcast', { event: 'message' }, (payload: any) => {
                    if (payload.payload) handleIncoming(payload.payload);
                })
                .subscribe();
        } catch (err) {
            console.warn('[ChatService] Erro ao criar canal Realtime:', err);
        }

        // 2. BroadcastChannel para comunicação instantânea entre abas no mesmo navegador
        let bc: BroadcastChannel | null = null;
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
            try {
                bc = new BroadcastChannel(`mobipro_chat_${rideId}`);
                bc.onmessage = (event) => {
                    if (event.data) handleIncoming(event.data);
                };
            } catch (_) {}
        }

        // 3. Listener de Storage Event (fallback multi-abas)
        const storageListener = (e: StorageEvent) => {
            if (e.key === `${LOCAL_STORAGE_CHAT_PREFIX}${rideId}` && e.newValue) {
                try {
                    const parsedArray = JSON.parse(e.newValue);
                    if (Array.isArray(parsedArray)) {
                        for (const item of parsedArray) {
                            handleIncoming(item);
                        }
                    }
                } catch (_) {}
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', storageListener);
        }

        // 4. Polling proativo a cada 1.5s (garante entrega mesmo com rede instável ou sem WebSockets)
        const pollMessages = async () => {
            try {
                const latestList = await ChatService.getMessages(rideId);
                for (const item of latestList) {
                    if (!processedIds.has(item.id)) {
                        processedIds.add(item.id);
                        saveLocalMessage(item);
                        onNewMessage(item);
                    }
                }
            } catch (_) {}
        };

        // Executa primeira busca logo após montar
        pollMessages();
        const interval = setInterval(pollMessages, 1500);

        return () => {
            clearInterval(interval);
            if (typeof window !== 'undefined') {
                window.removeEventListener('storage', storageListener);
            }
            if (bc) {
                try {
                    bc.close();
                } catch {}
            }
            if (channel) {
                try {
                    supabase.removeChannel(channel);
                } catch {}
            }
        };
    }
}
