import React from 'react';
import { Instagram, MessageCircle, ExternalLink, Code2 } from 'lucide-react';

export default function Footer() {
  const whatsappUrl = "https://wa.me/5586998030143?text=Ol%C3%A1%2C%20gostaria%20de%20conhecer%20sobre%20o%20produto...";
  const instagramUrl = "https://www.instagram.com/wp.integrada?igsh=eTR0c3EwcWNoOWVi";

  return (
    <footer className="w-full bg-surface-container-lowest/80 border-t border-white/5 py-8 px-6 mt-12 pb-28 md:pb-10 select-text">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        {/* Company credit */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary-orange/10 border border-primary-orange/20 text-primary-orange shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-on-surface-variant/70 uppercase tracking-wider">
              Desenvolvido por
            </p>
            <span className="text-sm font-black text-white tracking-tight">
              WP Integrada
            </span>
          </div>
        </div>

        {/* Links: Instagram & WhatsApp */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Instagram link */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container border border-white/10 hover:border-primary-orange/40 text-xs font-bold text-on-surface-variant hover:text-white transition-all active:scale-95 group shadow-sm"
          >
            <Instagram className="w-4 h-4 text-pink-500 group-hover:scale-110 transition-transform" />
            <span>@WP.INTEGRADA</span>
            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>

          {/* WhatsApp link */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container border border-white/10 hover:border-emerald-500/40 text-xs font-bold text-on-surface-variant hover:text-white transition-all active:scale-95 group shadow-sm"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>WhatsApp: (86) 99803-0143</span>
            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      </div>
    </footer>
  );
}
