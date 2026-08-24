"use client";
import React, { useState } from 'react';
import { QuickMessagesModal } from '@/components/Ride/QuickMessagesModal';
import { FinishRideModal } from '@/components/Ride/FinishRideModal';

export default function DetalheCorrida() {
    const [isMessageModalOpen, setMessageModalOpen] = useState(false);
    const [isFinishModalOpen, setFinishModalOpen] = useState(false);
    const [isRideFinished, setRideFinished] = useState(false);

    const handleSendMessage = (msg: string) => {
        console.log("Mensagem selecionada:", msg);
        // TODO: Integrar com API para disparar a mensagem
        setMessageModalOpen(false);
    };

    const handleFinishConfirm = (valor: string, voucher: string) => {
        console.log("Corrida finalizada! Valor:", valor, "Voucher:", voucher);
        // TODO: Chamada para API de finalização de corrida (PATCH status)
        setFinishModalOpen(false);
        setRideFinished(true);
        alert(`Atenção\nCorrida finalizada com sucesso!\nValor final: R$ ${valor}`);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* HEADER */}
            <header className="bg-indigo-700 text-white p-4 flex items-center gap-3">
                <button className="text-xl">←</button>
                <h1 className="text-lg font-medium">633.998 ( QTR 01:00h )</h1>
            </header>

            {/* DADOS DA CORRIDA */}
            <main className="p-4 flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-[100px_1fr] gap-y-3 text-sm text-gray-800 flex-1">
                    <span className="font-bold text-gray-600">Cliente:</span>
                    <span>6301 - SESC</span>

                    <span className="font-bold text-gray-600">Pagamento:</span>
                    <span>VOU</span>

                    <span className="font-bold text-gray-600">Passageiro:</span>
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-700">ELY CARDOSO DE ASSUNCAO <br /><span className="font-normal">(Tel: 92 98232-9629)</span></span>
                        <button className="text-gray-500">📞</button>
                    </div>

                    <span className="font-bold text-gray-600 flex items-center gap-1">Origem: 👁️</span>
                    <span>RUA AMOR-PERFEITO, 130 (ANTIGA RUA BOM JESUS), Gilberto Mestrinho</span>

                    <span className="font-bold text-gray-600">Destino:</span>
                    <span>Rua Barao do Acai, n 291 Parque das Laranjeiras - OZIMAR - 98582-3292 V SESC CAMPOS ELISEOS</span>

                    <span className="font-bold text-gray-600">Obs:</span>
                    <div className="h-32 overflow-y-auto bg-gray-50 p-2 rounded border border-gray-200">
                        <p className="text-gray-600 text-xs leading-relaxed uppercase">
                            Convenio novo atraves de licitacao com inicio em 01.09.2025, o boleto sera impresso azul de empresa carimbado e assinado pela gestora Sra. Luciana Souza. OBS: Mandar veiculos em bom estado de conservacao. Sem mais. A direx.
                        </p>
                    </div>
                </div>
            </main>

            {/* BOTÕES DE AÇÃO */}
            <footer className="p-4 bg-gray-100 flex flex-col gap-3">
                <button
                    onClick={() => setMessageModalOpen(true)}
                    disabled={isRideFinished}
                    className="w-full bg-slate-600 text-white py-3 rounded text-sm font-medium disabled:opacity-50"
                >
                    MENSAGEM
                </button>
                <button
                    onClick={() => setFinishModalOpen(true)}
                    disabled={isRideFinished}
                    className="w-full bg-red-600 text-white py-3 rounded text-sm font-medium disabled:opacity-50"
                >
                    FINALIZAR
                </button>
            </footer>

            {/* RENDERIZAÇÃO DOS MODAIS */}
            <QuickMessagesModal
                isOpen={isMessageModalOpen}
                onClose={() => setMessageModalOpen(false)}
                onSendMessage={handleSendMessage}
            />
            <FinishRideModal
                isOpen={isFinishModalOpen}
                onClose={() => setFinishModalOpen(false)}
                onConfirm={handleFinishConfirm}
            />
        </div>
    );
}