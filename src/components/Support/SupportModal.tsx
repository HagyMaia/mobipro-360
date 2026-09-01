import React from 'react';
import { MessageCircle, Phone, MessageSquare, X, ChevronRight, Headphones, ShieldQuestion } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-end sm:items-center z-50 p-4 transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[color:var(--surface)] dark:bg-dark-800 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center relative animate-in slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-slate-400 hover:text-[color:var(--text)] dark:hover:text-white p-2 rounded-full hover:bg-white/10 transition"
        >
          <X size={20} />
        </button>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand/20 border border-brand-300 flex items-center justify-center text-brand mb-3">
          <Headphones size={28} />
        </div>

        <h3 className="text-xl font-extrabold text-[color:var(--text)] dark:text-white mb-1">Central de Ajuda</h3>
        <p className="text-slate-400 text-xs mb-5">
          Suporte 24h para motoristas e parceiros SR Logística.
        </p>

        <div className="flex flex-col gap-2.5 mb-5 text-left">
          {/* Botão Chat WhatsApp */}
          <a
            href="https://wa.me/5511999999999?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20a%20SR%20Log%C3%ADstica"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 bg-[color:var(--surface)] hover:bg-[color:var(--surface)]/90 border border-white/10 p-3.5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[color:var(--text)] dark:text-white font-bold text-sm">WhatsApp de Plantão</h4>
              <p className="text-slate-400 text-xs truncate">Atendimento imediato via chat</p>
            </div>
            <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition" />
          </a>

          {/* Botão Ligar 0800 */}
          <a
            href="tel:0800000360"
            className="flex items-center gap-3.5 bg-[color:var(--surface)] hover:bg-[color:var(--surface)]/90 border border-white/10 p-3.5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand/20 text-brand flex items-center justify-center shrink-0">
              <Phone size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[color:var(--text)] dark:text-white font-bold text-sm">Ligar para a Central</h4>
              <p className="text-slate-400 text-xs truncate">0800 000 360 (Ligação Gratuita)</p>
            </div>
            <ChevronRight size={18} className="text-slate-500 group-hover:text-white transition" />
          </a>

          {/* Dúvidas Frequentes */}
          <a href="mailto:suporte@mobipro360.com?subject=Dúvidas%20frequentes" className="flex items-center gap-3.5 bg-[color:var(--surface)] hover:bg-[color:var(--surface)]/90 border border-white/10 p-3.5 rounded-2xl transition group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldQuestion size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[color:var(--text)] dark:text-white font-bold text-sm">Dúvidas Frequentes</h4>
              <p className="text-slate-400 text-xs truncate">Tarifas, repasse e cadastro</p>
            </div>
            <ChevronRight size={18} className="text-slate-500 group-hover:text-[color:var(--text)] dark:group-hover:text-white transition" />
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-3.5 rounded-xl font-bold text-sm transition border border-white/10"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};