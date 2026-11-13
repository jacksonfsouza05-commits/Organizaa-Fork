import { useState } from "react";
import type { Materia, Pagina } from "../dados";
import Cabecalho from "../componentes/Cabecalho";

interface MateriasProps {
  materias: Materia[];
  onNavegar: (pagina: Pagina) => void;
  onSelectMateria: (m: Materia) => void;
  onAdicionarMateria: (nome: string, cor: string) => Promise<boolean>;
  onArquivarMateria: (id: number, arquivada: boolean) => void;
  onExcluirMateria: (id: number) => void;
}

const CORES = ["#7C3AED", "#D97706", "#059669", "#2563EB", "#DC2626", "#DB2777", "#0891B2", "#65A30D", "#9333EA", "#EA580C"];

export default function Materias({ materias, onNavegar, onSelectMateria, onAdicionarMateria, onArquivarMateria, onExcluirMateria }: MateriasProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState(CORES[0]);
  const [confirmarExcluir, setConfirmarExcluir] = useState<number | null>(null);
  const [avisoDispensado, setAvisoDispensado] = useState<number[]>([]);
  const [verArquivadas, setVerArquivadas] = useState(false);

  const ativas = materias.filter(m => !m.arquivada);
  const arquivadas = materias.filter(m => m.arquivada);
  const concluida = (m: Materia) => m.atividades > 0 && m.concluidas === m.atividades;
  const sugerida = ativas.find(m => concluida(m) && !avisoDispensado.includes(m.id));

  const aoAdicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;
    if (!(await onAdicionarMateria(novoNome.trim(), novaCor))) return;
    setNovoNome("");
    setNovaCor(CORES[0]);
    setModalAberto(false);
  };

  return (
    <div className="flex flex-col h-full">
      <Cabecalho titulo="Matérias" rotuloAcao="Nova matéria" onAdicionarAtividade={() => setModalAberto(true)} />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Sugestão de arquivar */}
        {sugerida && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-[#ECFDF5] border border-[#6EE7B7] rounded-xl">
            <div className="min-w-0">
              <p style={{ fontFamily: "'Outfit', sans-serif" }} className="font-semibold text-[#065F46]">Você concluiu {sugerida.nome}!</p>
              <p className="text-sm text-[#047857] mt-0.5">
                Todas as {sugerida.atividades} atividades foram feitas. Quer arquivar a matéria para deixar a lista mais limpa?
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onArquivarMateria(sugerida.id, true)}
                className="px-4 py-2 bg-[#166B50] text-white rounded-lg text-sm font-semibold hover:bg-[#065F46]"
              >
                Arquivar {sugerida.nome}
              </button>
              <button
                onClick={() => setAvisoDispensado(d => [...d, sugerida.id])}
                className="px-4 py-2 bg-white border border-[#DDD6FE] text-[#6D28D9] rounded-lg text-sm font-medium hover:bg-[#F5F3FF]"
              >
                Agora não
              </button>
            </div>
          </div>
        )}

        {ativas.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#DDD6FE] text-center py-12 text-sm text-[#6B7280]">
            Nenhuma matéria por aqui. Use "Nova matéria" para começar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ativas.map(m => {
              const prog = m.atividades > 0 ? Math.round((m.concluidas / m.atividades) * 100) : 0;
              const feita = concluida(m);
              const cor = feita ? "#10B981" : m.cor;
              return (
                <div
                  key={m.id}
                  className={`group relative bg-white rounded-xl border p-5 transition-shadow hover:shadow-md ${
                    feita ? "border-2 border-[#34D399]" : "border-[#DDD6FE]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <button
                      onClick={() => { onSelectMateria(m); onNavegar("resumo-materia"); }}
                      title="Acessar matéria"
                      className="text-left min-w-0 after:absolute after:inset-0 after:content-['']"
                    >
                      <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-semibold text-lg text-[#1E1B2E] truncate">{m.nome}</h3>
                    </button>
                    {feita && (
                      <span className="text-xs font-semibold text-[#065F46] bg-[#ECFDF5] px-2.5 py-1 rounded-md flex-shrink-0">Concluída</span>
                    )}
                  </div>

                  <div className="w-full h-2 bg-[#EDE9FE] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${prog}%`, backgroundColor: cor }} />
                  </div>
                  <p className="text-sm text-[#4B5563] mt-2">
                    {m.concluidas} de {m.atividades} atividades · {prog}%
                  </p>

                  {feita && (
                    <button
                      onClick={() => onArquivarMateria(m.id, true)}
                      className="relative z-10 mt-3 px-4 py-2 bg-white border border-[#DDD6FE] text-[#6D28D9] rounded-lg text-sm font-medium hover:bg-[#F5F3FF]"
                    >
                      Arquivar matéria
                    </button>
                  )}

                  <button
                    onClick={() => setConfirmarExcluir(m.id)}
                    title="Excluir matéria"
                    aria-label={`Excluir ${m.nome}`}
                    className="absolute z-10 bottom-3 right-3 opacity-0 group-hover:opacity-100 focus:opacity-100 w-7 h-7 flex items-center justify-center rounded-md text-[#9CA3AF] hover:bg-red-50 hover:text-red-500"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Arquivadas */}
        <div className="mt-6">
          <button
            onClick={() => setVerArquivadas(v => !v)}
            aria-expanded={verArquivadas}
            className="text-[#6D28D9] underline underline-offset-2 hover:text-[#5B21B6]"
          >
            Ver matérias arquivadas ({arquivadas.length})
          </button>
          <p className="text-sm text-[#4B5563] mt-1">
            As arquivadas saem das listas, mas o histórico fica guardado e dá para desarquivar.
          </p>

          {verArquivadas && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {arquivadas.length === 0 && <p className="text-sm text-[#6B7280]">Nenhuma matéria arquivada.</p>}
              {arquivadas.map(m => (
                <div key={m.id} className="bg-white rounded-xl border border-[#DDD6FE] p-5">
                  <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-semibold text-[#1E1B2E]">{m.nome}</h3>
                  <p className="text-sm text-[#4B5563] mt-1">{m.concluidas} de {m.atividades} atividades</p>
                  <button
                    onClick={() => onArquivarMateria(m.id, false)}
                    className="mt-3 px-4 py-2 bg-white border border-[#DDD6FE] text-[#6D28D9] rounded-lg text-sm font-medium hover:bg-[#F5F3FF]"
                  >
                    Desarquivar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Janela de nova matéria */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-lg text-[#1E1B2E] mb-4">Nova matéria</h3>
            <form onSubmit={aoAdicionar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">Nome da matéria</label>
                <input
                  value={novoNome}
                  onChange={e => setNovoNome(e.target.value)}
                  placeholder="Ex: Filosofia, Arte, Educação Física..."
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DDD6FE] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E1B2E] mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNovaCor(c)}
                      className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                      style={{
                        backgroundColor: c,
                        boxShadow: novaCor === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : "none"
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 py-2.5 bg-[#7C3AED] text-white rounded-lg text-sm font-semibold hover:bg-[#6D28D9]">
                  Adicionar
                </button>
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 py-2.5 border border-[#DDD6FE] text-[#6B7280] rounded-lg text-sm hover:bg-[#F5F3FF]">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmar exclusão */}
      {confirmarExcluir !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M10 6v5M10 15v.5"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-lg text-[#1E1B2E] mb-2">Excluir matéria?</h3>
            <p className="text-sm text-[#6B7280] mb-5">Todos os dados relacionados serão removidos.</p>
            <div className="flex gap-2">
              <button onClick={() => { onExcluirMateria(confirmarExcluir); setConfirmarExcluir(null); }} className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
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
