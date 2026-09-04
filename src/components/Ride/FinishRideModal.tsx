import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';

interface FinishRideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (valor: string, voucher: string) => void;
}

export const FinishRideModal: React.FC<FinishRideModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [valor, setValor] = useState('120,00');
    const [voucher, setVoucher] = useState('');
    const voucherInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 p-5 shadow-2xl">
                <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Finalizar Corrida</h3>

                <div className="mb-4">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Valor do taxímetro / Corrida:</label>
                    <div className="flex items-center gap-2 border-b-2 border-brand pb-1">
                        <span className="text-lg font-bold text-slate-500">R$</span>
                        <input
                            type="text"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            className="w-full bg-transparent text-xl font-black text-slate-900 dark:text-white outline-none"
                        />
                    </div>
                </div>

                <div className="mb-4 flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-dark-800 p-3 text-base font-bold text-slate-900 dark:text-white">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Total a registrar:</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">R$ {valor}</span>
                </div>

                <div className="mb-6">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Comprovante / Voucher (opcional):</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Número do voucher ou cupom"
                            value={voucher}
                            onChange={(e) => setVoucher(e.target.value)}
                            className="flex-1 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
                        />
                        <input ref={voucherInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => setVoucher(event.target.files?.[0]?.name || '')} />
                        <button type="button" aria-label="Fotografar voucher" onClick={() => voucherInputRef.current?.click()} className="flex items-center justify-center rounded-xl bg-slate-100 dark:bg-dark-700 px-3 text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-dark-600">
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                        Cancelar
                    </button>
                    <button onClick={() => onConfirm(valor, voucher)} className="rounded-xl bg-brand px-6 py-2.5 font-bold text-slate-950 shadow-md shadow-brand/20 transition hover:bg-brand-hover active:scale-95">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};