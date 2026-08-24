import React, { useState } from 'react';

interface FinishRideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (valor: string, voucher: string) => void;
}

export const FinishRideModal: React.FC<FinishRideModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [valor, setValor] = useState('120,00');
    const [voucher, setVoucher] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-sm p-5 shadow-xl">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Finalizar Corrida</h3>

                <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-1">Valor do taxímetro:</label>
                    <input
                        type="text"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        className="w-full border-b-2 border-blue-400 outline-none py-1 text-lg"
                    />
                </div>

                <div className="mb-4 flex justify-between items-center font-bold text-lg">
                    <span>Total:</span>
                    <span>R$ {valor}</span>
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-gray-600 mb-1">Pagamento: VOU</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Voucher"
                            value={voucher}
                            onChange={(e) => setVoucher(e.target.value)}
                            className="flex-1 border-b border-gray-400 outline-none py-1"
                        />
                        <button className="bg-gray-200 p-2 rounded text-gray-600">📷</button>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="text-blue-500 font-semibold text-sm">CANCELAR</button>
                    <button onClick={() => onConfirm(valor, voucher)} className="text-blue-500 font-semibold text-sm">OK</button>
                </div>
            </div>
        </div>
    );
};