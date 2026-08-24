import React from 'react';

export default function SegurancaPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-slate-800 text-white p-4">
        <h1 className="text-2xl font-bold">Segurança <span className="text-blue-400">ativa</span></h1>
        <p className="text-sm text-gray-300">Proteção durante o trabalho diário</p>
      </header>

      <main className="p-4 flex-1">
        <div className="bg-white p-4 rounded-lg shadow-md text-center mb-6">
          <p className="text-gray-600 text-sm mb-4">
            Em emergência, pressione o botão acima ou pressione o botão de volume do celular 3 vezes rapidamente.
          </p>
          <button className="bg-slate-800 text-white px-4 py-2 rounded-full text-sm font-semibold">
            🎥 Câmera ativa em corrida
          </button>
        </div>

        <h2 className="text-gray-500 font-bold mb-3 text-sm">CONTATOS DE EMERGÊNCIA</h2>

        {/* Exemplo de contato mantido */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-500">📞</div>
            <div>
              <p className="text-gray-800 font-medium">Maria Silva (Esposa)</p>
              <p className="text-gray-500 text-sm">Família · (11) 99888-1122</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-red-500">🗑️</button>
        </div>

        <button className="w-full border-2 border-dashed border-gray-300 text-gray-400 py-3 rounded-lg font-medium hover:bg-gray-50">
          + Adicionar contato
        </button>
      </main>
    </div>
  );
}