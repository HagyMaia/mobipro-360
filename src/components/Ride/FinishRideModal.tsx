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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-dark-700 bg-dark-800 p-5 shadow-2xl shadow-black/30">
                <h3 className="mb-4 text-lg font-semibold text-[color:var(--text)] dark:text-white">Finalizar Corrida</h3>

                <div className="mb-4">
                    <label className="mb-1 block text-sm text-slate-300">Valor do taxímetro:</label>
                    <input
                        type="text"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        className="w-full border-b-2 border-brand-500 bg-transparent py-1 text-lg text-[color:var(--text)] dark:text-white outline-none"
                    />
                </div>

                <div className="mb-4 flex items-center justify-between text-lg font-bold text-[color:var(--text)] dark:text-white">
                    <span>Total:</span>
                    <span>R$ {valor}</span>
                </div>

                <div className="mb-6">
                    <label className="mb-1 block text-sm text-slate-300">Pagamento: VOU</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Voucher"
                            value={voucher}
                            onChange={(e) => setVoucher(e.target.value)}
                            className="flex-1 border-b border-dark-600 bg-transparent py-1 text-slate-100 outline-none placeholder:text-slate-500"
                        />
                        <input ref={voucherInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => setVoucher(event.target.files?.[0]?.name || '')} />
                        <button type="button" aria-label="Fotografar voucher" onClick={() => voucherInputRef.current?.click()} className="rounded-lg bg-dark-700 p-2 text-slate-200 transition hover:bg-dark-600">
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="text-sm font-semibold text-brand-400 transition hover:text-brand-300">
                        CANCELAR
                    </button>
                    <button onClick={() => onConfirm(valor, voucher)} className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-[color:var(--text)] dark:text-white transition hover:bg-brand-500">
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};