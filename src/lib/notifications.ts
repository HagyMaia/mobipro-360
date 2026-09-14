// src/lib/notifications.ts
import { RideOffer } from '@/types';

let wakeLockSentinel: any = null;

/**
 * Toca o som de nova corrida sintetizado via Web Audio API
 */
export function playRideNotificationSound() {
    try {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.setValueAtTime(880.00, now + 0.12); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880.00, now);
        osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.45);
        osc2.stop(now + 0.45);

        if (navigator.vibrate) {
            navigator.vibrate([300, 150, 300, 150, 400]);
        }
    } catch (err) {
        console.warn('[Notifications] Som de nova corrida indisponível:', err);
    }
}

/**
 * Toca o som de cancelamento de corrida sintetizado via Web Audio API (tom descendente de alerta)
 */
export function playCancellationSound() {
    try {
        if (typeof window === 'undefined') return;
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(440.00, now + 0.15); // A4
        osc.frequency.setValueAtTime(293.66, now + 0.30); // D4

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.55);

        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500]);
        }
    } catch (err) {
        console.warn('[Notifications] Som de cancelamento indisponível:', err);
    }
}

/**
 * Solicita permissão do sistema para notificações push/nativas do navegador
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        console.warn('[Notifications] Notificações não são suportadas neste navegador.');
        return false;
    }

    try {
        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
    } catch (err) {
        console.warn('[Notifications] Erro ao solicitar permissão de notificação:', err);
    }

    return false;
}

/**
 * Exibe notificação pop-up nativa do sistema mesmo com o aplicativo em segundo plano / minimizado
 */
export async function showRideSystemNotification(offer: RideOffer) {
    if (typeof window === 'undefined') return;

    try {
        playRideNotificationSound();

        const fareFormatted = Number(offer.fareAmount || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });

        const title = `🚖 Nova Corrida: ${fareFormatted}`;
        const body = `Passageiro: ${offer.passengerName}\n📍 Embarque: ${offer.pickupAddress}\n🎯 Destino: ${offer.dropoffAddress}\n⏱️ ${offer.estimatedMinutes} min (${offer.distanceKm} km)`;

        const notificationOptions: any = {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `ride-offer-${offer.id}`,
            renotify: true,
            requireInteraction: true,
            silent: false,
            vibrate: [400, 200, 400, 200, 400],
            data: {
                url: '/',
                rideId: offer.id,
                time: Date.now(),
            },
        };

        // 1. Tenta exibir via Service Worker (Funciona com app em background / minimizado)
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if (registration && registration.showNotification) {
                    await registration.showNotification(title, notificationOptions);
                    return;
                }
            } catch (swErr) {
                console.warn('[Notifications] Falha ao exibir via Service Worker, tentando Notification nativa:', swErr);
            }
        }

        // 2. Fallback para Notification API nativa direta
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, notificationOptions);
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    } catch (err) {
        console.warn('[Notifications] Erro ao disparar notificação:', err);
    }
}

/**
 * Exibe notificação de cancelamento de corrida em segundo plano
 */
export async function showRideCancelledNotification(passengerName?: string, reason?: string) {
    if (typeof window === 'undefined') return;

    try {
        playCancellationSound();

        const title = '⚠️ Corrida Cancelada pelo Passageiro';
        const body = passengerName
            ? `O passageiro ${passengerName} cancelou a solicitação de corrida.`
            : 'A corrida em andamento foi cancelada pelo passageiro.';

        const notificationOptions: any = {
            body: reason ? `${body} Motivo: ${reason}` : body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'ride-cancelled',
            renotify: true,
            requireInteraction: true,
            vibrate: [500, 200, 500],
            data: {
                url: '/',
                time: Date.now(),
            },
        };

        // 1. Tenta exibir via Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if (registration && registration.showNotification) {
                    await registration.showNotification(title, notificationOptions);
                    return;
                }
            } catch (swErr) {
                console.warn('[Notifications] Falha SW no cancelamento:', swErr);
            }
        }

        // 2. Fallback nativo
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, notificationOptions);
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    } catch (err) {
        console.warn('[Notifications] Erro ao disparar notificação de cancelamento:', err);
    }
}

/**
 * Ativa o Wake Lock para manter o dispositivo ativo enquanto o motorista estiver Online
 */
export async function enableScreenWakeLock() {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    try {
        if (!wakeLockSentinel) {
            wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
            wakeLockSentinel.addEventListener('release', () => {
                wakeLockSentinel = null;
            });
            console.info('[WakeLock] Tela mantida ativa para recepção de corridas.');
        }
    } catch (err) {
        console.warn('[WakeLock] Não foi possível ativar WakeLock:', err);
    }
}

/**
 * Libera o Wake Lock quando o motorista fica Offline
 */
export async function disableScreenWakeLock() {
    if (wakeLockSentinel) {
        try {
            await wakeLockSentinel.release();
            wakeLockSentinel = null;
        } catch {
            // ignore
        }
    }
}
