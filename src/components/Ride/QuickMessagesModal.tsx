import React from 'react';

interface QuickMessagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendMessage: (msg: string) => void;
}

export const QuickMessagesModal: React.FC<QuickMessagesModalProps> = ({ isOpen, onClose, onSendMessage }) => {
    if (!isOpen) return null;

    const messages = [
        'Digitar Mensagem ao Cliente APP',
        'Digitar Mensagem ao Monitor - GRL...',
        'QRL já foi embora',
        'Preso no trânsito - atraso de 5 a 10 minutos',
        'Impossível parar, dando a volta',
        'O Cliente não quer meu taxi...',
        'Estou a Caminho, logo chegarei',
        'Número não Confere',
        'O Cliente quer mais um taxi'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-dark-700 bg-dark-800 shadow-2xl shadow-black/30">
                <div className="border-b border-dark-700 p-4">
                    <h3 className="text-lg font-semibold text-white">Mensagem para Base</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    <ul className="flex flex-col">
                        {messages.map((msg, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => onSendMessage(msg)}
                                    className="w-full border-b border-dark-700 px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-dark-700/80"
                                >
                                    {msg}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex justify-end p-4">
                    <button onClick={onClose} className="text-sm font-semibold text-brand-400 transition hover:text-brand-300">
                        CANCELAR
                    </button>
                </div>
            </div>
        </div>
    );
};