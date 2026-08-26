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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-[color:var(--surface)] rounded-lg w-full max-w-sm p-5 shadow-xl border border-white/6">
                <h3 className="text-lg font-medium text-slate-100 mb-4">Finalizar Corrida</h3>

                <div className="mb-4">
                    <label className="block text-sm text-slate-300 mb-1">Valor do taxímetro:</label>
                    <input
                        type="text"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        className="w-full border-b-2 border-brand outline-none py-1 text-lg bg-transparent text-slate-100"
                    />
                </div>

                <div className="mb-4 flex justify-between items-center font-bold text-lg text-slate-100">
                    <span>Total:</span>
                    <span>R$ {valor}</span>
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-slate-300 mb-1">Pagamento: VOU</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Voucher"
                            value={voucher}
                            onChange={(e) => setVoucher(e.target.value)}
                            className="flex-1 border-b border-white/10 outline-none py-1 bg-transparent text-slate-100"
                        />
                        <input ref={voucherInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => setVoucher(event.target.files?.[0]?.name || '')} />
                        <button type="button" aria-label="Fotografar voucher" onClick={() => voucherInputRef.current?.click()} className="bg-white/6 p-2 rounded text-slate-200">
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="text-brand font-semibold text-sm">CANCELAR</button>
                    <button onClick={() => onConfirm(valor, voucher)} className="bg-brand text-white px-4 py-2 rounded-lg font-semibold">OK</button>
                </div>
            </div>
        </div>
    );
};