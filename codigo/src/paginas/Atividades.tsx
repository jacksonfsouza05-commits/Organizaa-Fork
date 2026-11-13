import { useState } from "react";
import type { Atividade, Pagina } from "../dados";
import { formatarData, diasAte, rotuloPrioridade } from "../dados";
import Cabecalho from "../componentes/Cabecalho";

interface AtividadesProps {
  atividades: Atividade[];
  onNavegar: (pagina: Pagina) => void;
  onConcluir: (id: number) => void;
  onReabrir: (id: number) => void;
  onExcluir: (id: number) => void;
  onEditar: (a: Atividade) => void;
}

type Filtro = "todas" | "pendente" | "concluida" | "prazo-proximo";
type Agrupamento = "materia" | "mes";

interface Grupo {
  chave: string;
  titulo: string;
  itens: Atividade[];
  materiaId?: number;
}

const titulo = { fontFamily: "'Outfit', sans-serif" };

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const dataConclusao = (a: Atividade) => {
  if (!a.concluidaEm) return null;
  const d = new Date(a.concluidaEm);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

const rotuloMes = (prazo: string) => {
  const [y, m] = prazo.split("-").map(Number);
  return capitalizar(new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
};

const rotuloPrazo = (dias: number) => {
  if (dias < 0) return "Atrasada";
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `Em ${dias} dias`;
};

const corPrazo = (dias: number) => (dias <= 1 ? "#B91C1C" : dias <= 7 ? "#B45309" : "#6B7280");

const coresPrioridade: Record<string, string> = {
  alta: "bg-red-50 text-red-700",
  media: "bg-amber-50 text-amber-700",
  baixa: "bg-green-50 text-green-700",
};

export default function Atividades({ atividades, onNavegar, onConcluir, onReabrir, onExcluir }: AtividadesProps) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [agrupar, setAgrupar] = useState<Agrupamento>("materia");
  const [busca, setBusca] = useState("");
  const [confirmarExcluir, setConfirmarExcluir] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<Atividade | null>(null);

  const termo = busca.trim().toLowerCase();
  const filtradas = atividades.filter(a => {
    const combinaFiltro = filtro === "todas" || a.status === filtro;
    const combinaBusca = a.nome.toLowerCase().includes(termo) || a.materia.toLowerCase().includes(termo);
    return combinaFiltro && combinaBusca;
  });

  const filtros: { chave: Filtro; rotulo: string; quantidade: number }[] = [
    { chave: "todas", rotulo: "Todas", quantidade: atividades.length },
    { chave: "pendente", rotulo: "Pendentes", quantidade: atividades.filter(a => a.status === "pendente").length },
    { chave: "prazo-proximo", rotulo: "Prazo próximo", quantidade: atividades.filter(a => a.status === "prazo-proximo").length },
    { chave: "concluida", rotulo: "Concluídas", quantidade: atividades.filter(a => a.status === "concluida").length },
  ];

  // Ordem dentro de cada grupo: pendentes por prazo, concluídas da mais recente para a mais antiga
  const ordenar = (lista: Atividade[]) =>
    [...lista].sort((a, b) => {
      const ca = a.status === "concluida";
      const cb = b.status === "concluida";
      if (ca !== cb) return ca ? 1 : -1;
      if (ca && cb) return (b.concluidaEm ?? "").localeCompare(a.concluidaEm ?? "");
      return a.prazo.localeCompare(b.prazo);
    });

  const grupos: Grupo[] = (() => {
    const mapa = new Map<string, Grupo>();
    for (const a of filtradas) {
      const chave = agrupar === "materia" ? `m${a.materiaId}` : a.prazo.slice(0, 7);
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          chave,
          titulo: agrupar === "materia" ? a.materia : rotuloMes(a.prazo),
          itens: [],
          materiaId: agrupar === "materia" ? a.materiaId : undefined,
        });
      }
      mapa.get(chave)!.itens.push(a);
    }
    const lista = [...mapa.values()].map(g => ({ ...g, itens: ordenar(g.itens) }));
    if (agrupar === "mes") return lista.sort((a, b) => a.chave.localeCompare(b.chave));
    const completa = (g: Grupo) => {
      const todas = atividades.filter(a => a.materiaId === g.materiaId);
      return todas.length > 0 && todas.every(a => a.status === "concluida");
    };
    return lista.sort((a, b) => Number(completa(b)) - Number(completa(a)) || a.titulo.localeCompare(b.titulo));
  })();

  const botaoContorno =
    "px-3.5 py-1.5 text-sm font-medium text-[#6D28D9] bg-white border border-[#DDD6FE] rounded-lg hover:bg-[#F5F3FF] flex-shrink-0";

  return (
    <div className="flex flex-col h-full">
      <Cabecalho titulo="Minhas Atividades" onAdicionarAtividade={() => onNavegar("adicionar-atividade")} />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Busca */}
        <label htmlFor="busca-atividade" className="block text-xs text-[#4B5563] mb-1.5">Buscar</label>
        <input
          id="busca-atividade"
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar atividade ou matéria..."
          className="w-full px-4 py-2.5 mb-4 bg-white border border-[#DDD6FE] rounded-xl text-sm text-[#1E1B2E] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"
        />

        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {filtros.map(f => (
            <button
              key={f.chave}
              onClick={() => setFiltro(f.chave)}
              aria-pressed={filtro === f.chave}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                filtro === f.chave
                  ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                  : "bg-white border-[#DDD6FE] text-[#1E1B2E] hover:bg-[#F5F3FF]"
              }`}
            >
              {f.rotulo} ({f.quantidade})
            </button>
          ))}
        </div>

        {/* Agrupar por */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-[#4B5563]">Agrupar por:</span>
          {([["materia", "Matéria"], ["mes", "Mês"]] as const).map(([chave, rotulo]) => (
            <button
              key={chave}
              onClick={() => setAgrupar(chave)}
              aria-pressed={agrupar === chave}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                agrupar === chave
                  ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                  : "bg-white border-[#DDD6FE] text-[#1E1B2E] hover:bg-[#F5F3FF]"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>

        {/* Grupos */}
        {grupos.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DDD6FE] text-center py-12 text-[#6B7280] text-sm">
            Nenhuma atividade encontrada
          </div>
        ) : (
          <div className="space-y-4">
            {grupos.map(g => {
              const daMateria = g.materiaId !== undefined ? atividades.filter(a => a.materiaId === g.materiaId) : [];
              const feitas = daMateria.filter(a => a.status === "concluida").length;
              const materiaConcluida = daMateria.length > 0 && feitas === daMateria.length;

              return (
                <section
                  key={g.chave}
                  className={`bg-white rounded-xl border px-5 pt-4 pb-2 ${materiaConcluida ? "border-[#6EE7B7]" : "border-[#DDD6FE]"}`}
                >
                  <header className="flex items-center gap-3 pb-3 border-b border-[#EDE9FE]">
                    <h3 style={titulo} className="font-semibold text-[#1E1B2E]">{g.titulo}</h3>
                    <span className="text-xs text-[#6B7280]">
                      {agrupar === "materia"
                        ? `${feitas} de ${daMateria.length} atividades`
                        : `${g.itens.length} atividade${g.itens.length > 1 ? "s" : ""}`}
                    </span>
                    {materiaConcluida && (
                      <span className="text-xs font-semibold text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded-md">Matéria concluída</span>
                    )}
                  </header>

                  <ul className="divide-y divide-[#EDE9FE]">
                    {g.itens.map(a => {
                      const concluida = a.status === "concluida";
                      const dias = diasAte(a.prazo);
                      const feitaEm = dataConclusao(a);
                      return (
                        <li key={a.id} className="flex items-center gap-3 py-3">
                          <button
                            onClick={() => setDetalhe(a)}
                            title="Ver detalhes"
                            className="flex-1 min-w-0 text-left"
                          >
                            <span className={`block text-sm truncate hover:underline ${concluida ? "text-[#1E1B2E]" : "font-medium text-[#1E1B2E]"}`}>{a.nome}</span>
                            {agrupar === "mes" && <span className="block text-xs text-[#6B7280]">{a.materia}</span>}
                          </button>

                          {concluida ? (
                            <>
                              <span className="text-xs text-[#6B7280] text-right">
                                {feitaEm ? `Concluída em ${feitaEm}` : "Concluída"}
                              </span>
                              <button onClick={() => onReabrir(a.id)} className={botaoContorno}>Reabrir</button>
                            </>
                          ) : (
                            <>
                              <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-md font-medium ${coresPrioridade[a.prioridade]}`}>
                                {rotuloPrioridade[a.prioridade]}
                              </span>
                              <div className="text-right">
                                <p className="text-xs font-semibold" style={{ color: corPrazo(dias) }}>{rotuloPrazo(dias)}</p>
                                <p className="text-xs text-[#6B7280]">{formatarData(a.prazo)}</p>
                              </div>
                              <button onClick={() => onConcluir(a.id)} className={botaoContorno}>Concluir</button>
                            </>
                          )}
                          <button
                            onClick={() => setConfirmarExcluir(a.id)}
                            title="Excluir"
                            aria-label={`Excluir ${a.nome}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:bg-red-50 hover:text-red-500 flex-shrink-0"
                          >
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
                              <path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9"/>
                            </svg>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Janela de detalhes */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDetalhe(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 style={titulo} className="font-bold text-lg text-[#1E1B2E]">{detalhe.nome}</h3>
                <p className="text-sm text-[#6B7280]">{detalhe.materia}</p>
              </div>
              <button onClick={() => setDetalhe(null)} aria-label="Fechar" className="text-[#9CA3AF] hover:text-[#6B7280]">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 5l10 10M15 5L5 15"/>
                </svg>
              </button>
            </div>
            {detalhe.descricao && <p className="text-sm text-[#374151] mb-4">{detalhe.descricao}</p>}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#F5F3FF] rounded-lg p-3">
                <p className="text-xs text-[#6B7280]">Prazo</p>
                <p className="text-sm font-semibold text-[#1E1B2E]">{formatarData(detalhe.prazo)}</p>
              </div>
              <div className="bg-[#F5F3FF] rounded-lg p-3">
                <p className="text-xs text-[#6B7280]">Prioridade</p>
                <p className="text-sm font-semibold text-[#1E1B2E]">{rotuloPrioridade[detalhe.prioridade]}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {detalhe.status !== "concluida" ? (
                <button
                  onClick={() => { onConcluir(detalhe.id); setDetalhe(null); }}
                  className="flex-1 py-2.5 bg-[#7C3AED] text-white rounded-lg text-sm font-medium hover:bg-[#6D28D9]"
                >
                  Marcar como concluída
                </button>
              ) : (
                <button
                  onClick={() => { onReabrir(detalhe.id); setDetalhe(null); }}
                  className="flex-1 py-2.5 bg-[#7C3AED] text-white rounded-lg text-sm font-medium hover:bg-[#6D28D9]"
                >
                  Reabrir atividade
                </button>
              )}
              <button onClick={() => setDetalhe(null)} className="flex-1 py-2.5 border border-[#DDD6FE] text-[#6B7280] rounded-lg text-sm hover:bg-[#F5F3FF]">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {confirmarExcluir !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 style={titulo} className="font-bold text-lg text-[#1E1B2E] text-center mb-2">Excluir atividade?</h3>
            <p className="text-sm text-[#6B7280] text-center mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { onExcluir(confirmarExcluir); setConfirmarExcluir(null); }}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
              >
                Excluir
              </button>
              <button onClick={() => setConfirmarExcluir(null)} className="flex-1 py-2.5 border border-[#DDD6FE] text-[#6B7280] rounded-lg text-sm hover:bg-[#F5F3FF]">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
