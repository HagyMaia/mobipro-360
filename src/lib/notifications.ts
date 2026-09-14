// src/lib/notifications.ts
import { RideOffer } from '@/types';

let wakeLockSentinel: any = null;

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
        // Toca vibração do dispositivo se suportado
        if (navigator.vibrate) {
            navigator.vibrate([400, 200, 400, 200, 400]);
        }

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
            data: {
                url: '/',
                rideId: offer.id,
                time: Date.now(),
            },
        };

        // 1. Tenta exibir via Service Worker (Funciona mesmo com app em background / minimizado)
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
