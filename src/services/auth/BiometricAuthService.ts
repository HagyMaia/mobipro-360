// src/services/auth/BiometricAuthService.ts
'use client';

const BIOMETRIC_STORAGE_KEY = 'mobipro_biometric_credential_v2';

export interface BiometricCredentialData {
    credentialId: string;
    email: string;
    userId: string;
    token?: string;
    authSecret?: string;
    registeredAt: string;
    deviceName?: string;
}

/**
 * Utilitários de codificação Base64URL para WebAuthn
 */
function bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

export class BiometricAuthService {
    /**
     * Verifica se o aparelho/navegador suporta autenticação biométrica (Digital / Face Unlock / Touch ID)
     */
    public static async isBiometricAvailable(): Promise<boolean> {
        if (typeof window === 'undefined') return false;

        try {
            if (
                window.PublicKeyCredential &&
                typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
            ) {
                const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                return Boolean(available);
            }
        } catch (err) {
            console.warn('[BiometricAuth] Erro ao checar suporte biométrico:', err);
        }

        return false;
    }

    /**
     * Verifica se já existe uma digital cadastrada neste aparelho
     */
    public static isBiometricEnrolled(): boolean {
        if (typeof window === 'undefined') return false;
        try {
            const raw = localStorage.getItem(BIOMETRIC_STORAGE_KEY);
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            return Boolean(parsed && parsed.email && parsed.credentialId);
        } catch {
            return false;
        }
    }

    /**
     * Retorna os dados cadastrados da biometria local
     */
    public static getEnrolledData(): BiometricCredentialData | null {
        if (typeof window === 'undefined') return null;
        try {
            const raw = localStorage.getItem(BIOMETRIC_STORAGE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    /**
     * Cadastra a digital do celular para o usuário autenticado
     */
    public static async registerBiometrics(params: {
        email: string;
        userId: string;
        passwordOrSecret?: string;
    }): Promise<{ success: boolean; error?: string }> {
        if (typeof window === 'undefined' || !window.PublicKeyCredential) {
            return { success: false, error: 'Biometria não suportada neste aparelho.' };
        }

        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const userIdBuffer = new TextEncoder().encode(params.userId);

            const publicKeyOptions: PublicKeyCredentialCreationOptions = {
                challenge,
                rp: {
                    name: 'SR Logística - App do Motorista',
                    id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
                },
                user: {
                    id: userIdBuffer,
                    name: params.email,
                    displayName: params.email.split('@')[0],
                },
                pubKeyCredParams: [
                    { type: 'public-key', alg: -7 },  // ES256
                    { type: 'public-key', alg: -257 }, // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform', // Leitor biométrico do celular / Windows Hello
                    userVerification: 'required',        // Exige digital ou reconhecimento facial
                    residentKey: 'preferred',
                },
                timeout: 60000,
                attestation: 'none',
            };

            const credential = (await navigator.credentials.create({
                publicKey: publicKeyOptions,
            })) as PublicKeyCredential | null;

            if (!credential) {
                return { success: false, error: 'Cadastro biométrico cancelado pelo usuário.' };
            }

            const credentialId = bufferToBase64Url(credential.rawId);

            // Criptografa ou empacota o token de autorização biométrica
            const payload: BiometricCredentialData = {
                credentialId,
                email: params.email.trim().toLowerCase(),
                userId: params.userId,
                authSecret: params.passwordOrSecret ? btoa(params.passwordOrSecret) : undefined,
                registeredAt: new Date().toISOString(),
                deviceName: navigator.userAgent.includes('Android')
                    ? 'Dispositivo Android'
                    : navigator.userAgent.includes('iPhone')
                    ? 'Apple iPhone'
                    : 'Celular Cadastrado',
            };

            localStorage.setItem(BIOMETRIC_STORAGE_KEY, JSON.stringify(payload));
            return { success: true };
        } catch (err: any) {
            console.error('[BiometricAuth] Erro ao cadastrar biometria:', err);
            const msg = err.name === 'NotAllowedError'
                ? 'Leitura biométrica cancelada ou recusada no aparelho.'
                : err.message || 'Falha ao registrar digital.';
            return { success: false, error: msg };
        }
    }

    /**
     * Realiza a leitura biométrica da digital e autentica o motorista
     */
    public static async authenticate(): Promise<{
        success: boolean;
        credentials?: { email: string; password?: string; userId: string };
        error?: string;
    }> {
        if (typeof window === 'undefined' || !window.PublicKeyCredential) {
            return { success: false, error: 'Biometria não suportada neste aparelho.' };
        }

        const enrolled = this.getEnrolledData();
        if (!enrolled) {
            return { success: false, error: 'Nenhuma digital cadastrada neste aparelho ainda.' };
        }

        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const allowCredentials: PublicKeyCredentialDescriptor[] = enrolled.credentialId
                ? [
                      {
                          id: base64UrlToBuffer(enrolled.credentialId),
                          type: 'public-key',
                          transports: ['internal'],
                      },
                  ]
                : [];

            const publicKeyOptions: PublicKeyCredentialRequestOptions = {
                challenge,
                rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
                userVerification: 'required',
                timeout: 60000,
                allowCredentials,
            };

            const assertion = await navigator.credentials.get({
                publicKey: publicKeyOptions,
            });

            if (!assertion) {
                return { success: false, error: 'Leitura biométrica cancelada.' };
            }

            // Sucesso na leitura da digital pelo hardware nativo
            const password = enrolled.authSecret ? atob(enrolled.authSecret) : undefined;

            return {
                success: true,
                credentials: {
                    email: enrolled.email,
                    password,
                    userId: enrolled.userId,
                },
            };
        } catch (err: any) {
            console.error('[BiometricAuth] Erro na autenticação biométrica:', err);
            const msg = err.name === 'NotAllowedError'
                ? 'Leitura da digital cancelada pelo usuário.'
                : 'Não foi possível validar a digital no aparelho.';
            return { success: false, error: msg };
        }
    }

    /**
     * Remove o cadastro biométrico do aparelho
     */
    public static disableBiometrics(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(BIOMETRIC_STORAGE_KEY);
    }
}
