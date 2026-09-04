import React from 'react';
import { MessageCircle, Phone, X, ChevronRight, Headphones, Globe, ExternalLink } from 'lucide-react';

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
        className="bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center relative animate-in slide-in-from-bottom-6 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-dark-800 transition"
        >
          <X size={20} />
        </button>

        <div className="mx-auto w-14 h-14 rounded-2xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand-700 dark:text-brand mb-3">
          <Headphones size={28} />
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Central de Suporte</h3>
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
          Canais oficiais de atendimento da <strong>SR Logística & Transporte</strong>.
        </p>

        <div className="flex flex-col gap-2.5 mb-5 text-left">
          {/* Site Oficial */}
          <a
            href="http://srlogisticatrasporte.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 bg-slate-50 dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-750 border border-slate-200 dark:border-dark-700 p-3.5 rounded-2xl transition group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Globe size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-slate-900 dark:text-white font-bold text-sm">Site Oficial</h4>
                <ExternalLink size={12} className="text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs truncate">srlogisticatrasporte.vercel.app</p>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
          </a>

          {/* WhatsApp Suporte 1 */}
          <a
            href="https://wa.me/559284923316?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20no%20aplicativo%20SR%20Log%C3%ADstica"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 bg-slate-50 dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-750 border border-slate-200 dark:border-dark-700 p-3.5 rounded-2xl transition group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">WhatsApp Suporte 1</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs truncate">(92) 8492-3316</p>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
          </a>

          {/* WhatsApp Suporte 2 */}
          <a
            href="https://wa.me/559291306160?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20no%20aplicativo%20SR%20Log%C3%ADstica"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 bg-slate-50 dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-750 border border-slate-200 dark:border-dark-700 p-3.5 rounded-2xl transition group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">WhatsApp Suporte 2</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs truncate">(92) 9130-6160</p>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
          </a>

          {/* Ligação Telefônica */}
          <a
            href="tel:+559284923316"
            className="flex items-center gap-3.5 bg-slate-50 dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-750 border border-slate-200 dark:border-dark-700 p-3.5 rounded-2xl transition group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-brand/20 text-brand-700 dark:text-brand flex items-center justify-center shrink-0">
              <Phone size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-slate-900 dark:text-white font-bold text-sm">Ligar para Atendimento</h4>
              <p className="text-slate-500 dark:text-slate-400 text-xs truncate">Ligação direta via operadora</p>
            </div>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition" />
          </a>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-800 dark:text-slate-200 py-3.5 rounded-2xl font-bold text-sm transition border border-slate-200 dark:border-dark-700"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};