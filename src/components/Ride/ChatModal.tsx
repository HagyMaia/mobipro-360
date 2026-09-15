'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, MessageSquare, Check, CheckCheck, Loader2, Sparkles, UserCheck, RefreshCw } from 'lucide-react';
import { ChatService, playMessageReceivedChime } from '@/services/chat/ChatService';
import type { ChatMessage } from '@/lib/types';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    rideId: string;
    passengerName?: string;
    driverName?: string;
    driverId?: string;
    onSendMessage?: (msg: string) => void;
}

const QUICK_RESPONSES = [
    'Estou a caminho!',
    'Cheguei no local de embarque!',
    'Preso no trânsito - chego em 5 min',
    'Qual o ponto exato de referência?',
    'Estou aguardando no ponto!',
    'Ok, tudo certo!',
];

const SIMULATED_PASSENGER_MESSAGES = [
    'Estou aguardando no portão principal!',
    'Estou de camisa preta com uma mala pequena.',
    'Pode avisar quando chegar? Já estou descendo.',
    'Estou na recepção do prédio.',
    'Perfeito, muito obrigado!',
];

export const ChatModal: React.FC<ChatModalProps> = ({
    isOpen,
    onClose,
    rideId,
    passengerName = 'Passageiro',
    driverName = 'Você',
    driverId,
    onSendMessage,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showSimulateMenu, setShowSimulateMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    };

    const loadChatHistory = useCallback(async () => {
        if (!rideId) return;
        try {
            const data = await ChatService.getMessages(rideId);
            setMessages(data);
            setTimeout(() => scrollToBottom(false), 50);
        } catch (err) {
            console.warn('[ChatModal] Erro ao carregar histórico:', err);
        } finally {
            setLoading(false);
        }
    }, [rideId]);

    // 1. Carrega histórico inicial ao abrir o modal
    useEffect(() => {
        if (!isOpen || !rideId) return;

        let isMounted = true;
        setLoading(true);

        loadChatHistory();
        ChatService.markAsRead(rideId, 'driver');

        // 2. Inscreve no Realtime para novas mensagens do passageiro e motorista
        const unsubscribe = ChatService.subscribeToRideMessages(rideId, (newMsg) => {
            if (!isMounted) return;
            setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                if (newMsg.sender_role !== 'driver') {
                    playMessageReceivedChime();
                }
                return [...prev, newMsg];
            });
            setTimeout(() => scrollToBottom(true), 50);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [isOpen, rideId, loadChatHistory]);

    // Foca o input ao abrir
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        }
    }, [isOpen]);

    const handleSend = useCallback(
        async (textToSend?: string) => {
            const content = (textToSend || input).trim();
            if (!content || sending || !rideId) return;

            setSending(true);
            if (!textToSend) {
                setInput('');
            }

            try {
                const sent = await ChatService.sendMessage({
                    rideId,
                    senderId: driverId,
                    senderRole: 'driver',
                    senderName: driverName,
                    content,
                });

                if (sent) {
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === sent.id)) return prev;
                        return [...prev, sent];
                    });
                    setTimeout(() => scrollToBottom(true), 50);
                }

                if (onSendMessage) {
                    onSendMessage(content);
                }
            } catch (err) {
                console.error('[ChatModal] Falha ao enviar:', err);
            } finally {
                setSending(false);
            }
        },
        [input, sending, rideId, driverId, driverName, onSendMessage]
    );

    const handleSimulatePassenger = async (text: string) => {
        setShowSimulateMenu(false);
        try {
            const sent = await ChatService.simulatePassengerMessage(rideId, passengerName, text);
            if (sent) {
                playMessageReceivedChime();
                setMessages((prev) => {
                    if (prev.some((m) => m.id === sent.id)) return prev;
                    return [...prev, sent];
                });
                setTimeout(() => scrollToBottom(true), 50);
            }
        } catch (err) {
            console.error('[ChatModal] Erro ao simular mensagem do passageiro:', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-[fadeIn_.2s_ease-out]">
            <div className="flex h-[90vh] sm:h-[600px] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-slate-200/80 dark:border-dark-700 bg-white dark:bg-dark-900 shadow-2xl">
                {/* Header do Chat */}
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-dark-700 bg-slate-50/80 dark:bg-dark-950/80 px-4 py-3.5 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand font-black text-slate-950 text-base shadow-sm">
                            {passengerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                                    {passengerName}
                                </h3>
                                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                Chat da Corrida · Tempo real ativo
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => loadChatHistory()}
                            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-200/60 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-dark-700 transition"
                            title="Atualizar mensagens"
                            aria-label="Atualizar mensagens"
                        >
                            <RefreshCw size={15} />
                        </button>

                        <button
                            onClick={() => setShowSimulateMenu(!showSimulateMenu)}
                            className="flex h-9 px-2.5 items-center gap-1.5 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition"
                            title="Testar resposta do passageiro"
                        >
                            <UserCheck size={14} />
                            <span className="hidden sm:inline">Simular</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-200/60 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-dark-700 transition"
                            aria-label="Fechar chat"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Menu de simulação de mensagens do passageiro */}
                {showSimulateMenu && (
                    <div className="border-b border-emerald-500/30 bg-emerald-500/10 p-3 animate-[fadeIn_.2s_ease-out]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300">
                                💬 Simular envio pelo passageiro:
                            </span>
                            <button
                                onClick={() => setShowSimulateMenu(false)}
                                className="text-xs text-slate-500 hover:text-slate-700"
                            >
                                Fechar
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {SIMULATED_PASSENGER_MESSAGES.map((msg, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSimulatePassenger(msg)}
                                    className="rounded-xl border border-emerald-500/30 bg-white dark:bg-dark-900 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500 hover:text-slate-950 transition"
                                >
                                    {msg}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista de Mensagens */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-dark-950/40">
                    {loading ? (
                        <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400 font-medium">
                            <Loader2 size={18} className="animate-spin text-brand" /> Carregando mensagens...
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
                            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 dark:bg-dark-800 text-slate-400 mb-3">
                                <MessageSquare size={26} />
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                Nenhuma mensagem ainda
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                                Envie uma mensagem rápida ou digite abaixo para falar com {passengerName}.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_role === 'driver';
                            const timeStr = msg.created_at
                                ? new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  })
                                : '';

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-[fadeIn_.2s_ease-out]`}
                                >
                                    <div
                                        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm ${
                                            isMe
                                                ? 'bg-brand text-slate-950 font-bold rounded-br-none'
                                                : 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white border border-slate-200/80 dark:border-dark-700 rounded-bl-none font-medium'
                                        }`}
                                    >
                                        {!isMe && (
                                            <p className="text-[10px] font-black uppercase text-brand-600 dark:text-brand tracking-wider mb-0.5">
                                                {msg.sender_name || passengerName}
                                            </p>
                                        )}
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>
                                    <div className="mt-1 flex items-center gap-1 px-1 text-[10px] text-slate-400 font-semibold">
                                        <span>{timeStr}</span>
                                        {isMe && (
                                            <span className="text-brand-700 dark:text-brand">
                                                {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Respostas Rápidas em formato de Chips horizontais */}
                <div className="border-t border-slate-200/60 dark:border-dark-800 bg-white dark:bg-dark-900 px-3 py-2 overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 pl-1 pr-1.5 shrink-0">
                            <Sparkles size={12} className="text-brand" /> Rápidas:
                        </div>
                        {QUICK_RESPONSES.map((quick, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(quick)}
                                disabled={sending}
                                className="inline-flex items-center rounded-xl border border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-800/80 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-brand hover:text-slate-950 dark:hover:bg-brand dark:hover:text-slate-950 active:scale-95"
                            >
                                {quick}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Input e Botão de Envio */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="flex items-center gap-2 border-t border-slate-200/80 dark:border-dark-700 bg-white dark:bg-dark-900 p-3"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite uma mensagem ao passageiro..."
                        disabled={sending}
                        className="flex-1 rounded-2xl border border-slate-200/80 dark:border-dark-700 bg-slate-50 dark:bg-dark-950 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand font-black text-slate-950 shadow-md shadow-brand/20 transition hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};
