import React from 'react';

interface QuickMessagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendMessage: (msg: string) => void;
}

export const QuickMessagesModal: React.FC<QuickMessagesModalProps> = ({ isOpen, onClose, onSendMessage }) => {
    if (!isOpen) return null;

    const messages = [
        "Digitar Mensagem ao Cliente APP",
        "Digitar Mensagem ao Monitor - GRL...",
        "QRL já foi embora",
        "Preso no trânsito - atraso de 5 a 10 minutos",
        "Impossível parar, dando a volta",
        "O Cliente não quer meu taxi...",
        "Estou a Caminho, logo chegarei",
        "Número não Confere",
        "O Cliente quer mais um taxi"
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-sm overflow-hidden shadow-xl">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-medium text-gray-800">Mensagem para Base</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    <ul className="flex flex-col">
                        {messages.map((msg, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => onSendMessage(msg)}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-50"
                                >
                                    {msg}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-4 flex justify-end">
                    <button onClick={onClose} className="text-blue-500 font-semibold text-sm">
                        CANCELAR
                    </button>
                </div>
            </div>
        </div>
    );
};