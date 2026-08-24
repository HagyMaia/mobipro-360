import React from 'react';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
            <div className="bg-[#1F2C34] rounded-3xl w-full max-w-sm p-6 shadow-xl text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Precisa de ajuda?</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Entre em contato com nossa equipe de suporte.
                </p>

                <div className="flex flex-col gap-3 mb-6">
                    {/* Botão Chat */}
                    <button className="flex items-center gap-4 bg-[#121B22] border border-slate-700 p-4 rounded-2xl hover:bg-slate-800 transition">
                        <div className="bg-[#1F2C34] p-2 rounded-lg text-blue-400">
                            💬
                        </div>
                        <div className="text-left flex-1">
                            <h4 className="text-white font-bold text-base">Chat online</h4>
                            <p className="text-slate-500 text-xs">Fale com nossa equipe agora</p>
                        </div>
                        <span className="text-slate-500">›</span>
                    </button>

                    {/* Botão Ligar */}
                    <button className="flex items-center gap-4 bg-[#121B22] border border-slate-700 p-4 rounded-2xl hover:bg-slate-800 transition">
                        <div className="bg-[#1F2C34] p-2 rounded-lg text-green-400">
                            📞
                        </div>
                        <div className="text-left flex-1">
                            <h4 className="text-white font-bold text-base">Ligar para o suporte</h4>
                            <p className="text-slate-500 text-xs">Abrir o discador com nosso número</p>
                        </div>
                        <span className="text-slate-500">›</span>
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-[#E55B5B] text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-600 transition"
                >
                    Voltar
                </button>
            </div>
        </div>
    );
};