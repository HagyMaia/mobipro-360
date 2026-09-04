import React from 'react';

interface QuickMessagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendMessage: (msg: string) => void;
}

export const QuickMessagesModal: React.FC<QuickMessagesModalProps> = ({ isOpen, onClose, onSendMessage }) => {
    if (!isOpen) return null;

    const messages = [
        'Digitar Mensagem ao Passageiro',
        'Mensagem ao Monitor / Central - SR Logística',
        'Passageiro não estava no local',
        'Preso no trânsito - atraso de 5 a 10 minutos',
        'Impossível parar no ponto exato, dando a volta',
        'Estou a caminho, previsão de 3 minutos',
        'Número / Endereço não confere',
        'Passageiro solicita mais um veículo'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200/80 dark:border-dark-700/80 bg-white dark:bg-dark-900 shadow-2xl">
                <div className="border-b border-slate-200/80 dark:border-dark-700/80 p-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Mensagens Rápidas</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                    <ul className="flex flex-col">
                        {messages.map((msg, index) => (
                            <li key={index}>
                                <button
                                    onClick={() => onSendMessage(msg)}
                                    className="w-full border-b border-slate-100 dark:border-dark-800/80 px-4 py-3.5 text-left text-sm font-medium text-slate-800 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-dark-800"
                                >
                                    {msg}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex justify-end p-4 bg-slate-50/50 dark:bg-dark-950/50">
                    <button onClick={onClose} className="text-sm font-bold text-brand-700 dark:text-brand transition hover:underline">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};