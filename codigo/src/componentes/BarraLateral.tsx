import type { Pagina } from "../dados";
import { useSessao } from "../sessao";

interface BarraLateralProps {
  paginaAtual: Pagina;
  onNavegar: (pagina: Pagina) => void;
}

const itensMenu = [
  { id: "inicio" as Pagina, rotulo: "Início", icone: IconeInicio },
  { id: "atividades" as Pagina, rotulo: "Atividades", icone: IconeLista },
  { id: "materias" as Pagina, rotulo: "Matérias", icone: IconeLivro },
  { id: "calendario" as Pagina, rotulo: "Calendário", icone: IconeCalendario },
  { id: "progresso" as Pagina, rotulo: "Progresso", icone: IconeGrafico },
  { id: "configuracoes" as Pagina, rotulo: "Configurações", icone: IconeConfiguracoes },
];

export default function BarraLateral({ paginaAtual, onNavegar }: BarraLateralProps) {
  const { estudante, sair } = useSessao();
  const classeAtiva = "bg-[#7C3AED] text-white shadow-sm";
  const classeInativa = "text-[#6B7280] hover:bg-[#EDE9FE] hover:text-[#7C3AED]";

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-white border-r border-[#DDD6FE] flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#DDD6FE]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7C3AED] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" opacity="0.3"/>
              <path d="M8 4L12.5 6.5V11L8 13.5L3.5 11V6.5L8 4Z" fill="white"/>
              <circle cx="8" cy="8" r="2" fill="#7C3AED"/>
            </svg>
          </div>
          <div>
            <span style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-lg text-[#1E1B2E] tracking-tight">OrganizaAI</span>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {itensMenu.map((item, i) => {
            return (
              <button
                key={i}
                onClick={() => onNavegar(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  paginaAtual === item.id ? classeAtiva : classeInativa
                }`}
              >
                <item.icone tamanho={18} />
                {item.rotulo}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Perfil do usuário */}
      <div className="px-4 py-4 border-t border-[#DDD6FE]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white text-sm font-semibold">
            {estudante.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: "'Outfit', sans-serif" }} className="text-sm font-semibold text-[#1E1B2E] truncate">{estudante.nome}</p>
            <p className="text-xs text-[#6B7280] truncate">{estudante.email}</p>
          </div>
          <button onClick={sair} title="Sair" className="text-xs text-[#6B7280] hover:text-[#7C3AED] font-medium">Sair</button>
        </div>
      </div>
    </aside>
  );
}

function IconeInicio({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L10 3L17 9.5V17H13V13H7V17H3V9.5Z"/>
    </svg>
  );
}
function IconeLista({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="12" height="14" rx="2"/>
      <path d="M8 4V3a1 1 0 011-1h2a1 1 0 011 1v1"/>
      <path d="M7 9h6M7 12h4"/>
    </svg>
  );
}
function IconeLivro({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3h7a2 2 0 012 2v11a2 2 0 01-2 2H4V3z"/>
      <path d="M13 3h1a2 2 0 012 2v11a2 2 0 01-2 2h-1"/>
      <path d="M7 7h4M7 10h4M7 13h2"/>
    </svg>
  );
}
function IconeCalendario({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="14" height="14" rx="2"/>
      <path d="M7 2v3M13 2v3M3 9h14"/>
    </svg>
  );
}
function IconeGrafico({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14l4-4 3 3 5-6"/>
      <rect x="3" y="3" width="14" height="14" rx="2"/>
    </svg>
  );
}
function IconeConfiguracoes({ tamanho = 20 }: { tamanho?: number }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.5"/>
      <path d="M10 3v1.5M10 15.5V17M3 10h1.5M15.5 10H17M5.05 5.05l1.06 1.06M13.9 13.9l1.06 1.06M5.05 14.95l1.06-1.06M13.9 6.1l1.06-1.06"/>
    </svg>
  );
}
