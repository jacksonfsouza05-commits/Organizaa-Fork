import { useState } from "react";
import type { Atividade, Materia, Pagina } from "../dados";
import { formatarData, diasAte } from "../dados";
import Cabecalho from "../componentes/Cabecalho";
import { useSessao } from "../sessao";

interface PainelProps {
  atividades: Atividade[];
  materias: Materia[];
  onNavegar: (pagina: Pagina) => void;
  onConcluir: (id: number) => void;
}

const titulo = { fontFamily: "'Outfit', sans-serif" };

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const dataHoje = () =>
  capitalizar(new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));

const DICAS = [
  "Estude 1 hora por dia, todos os dias. Pouco tempo com constância rende mais do que uma maratona na véspera da prova.",
  "Comece pela matéria mais difícil, quando a cabeça ainda está descansada.",
  "Faça pausas curtas de 5 minutos a cada 25 minutos de estudo.",
  "Explique o conteúdo em voz alta, como se ensinasse alguém. Se travar, é ali que falta estudar.",
  "Resolver exercícios fixa mais do que reler o resumo. Misture teoria e prática.",
  "Durma bem antes da prova: o cérebro organiza o que você estudou enquanto descansa.",
];

const CHAVE_DICA = "avisai:dica-propria";

const lerDicaPropria = () => {
  try { return localStorage.getItem(CHAVE_DICA) ?? ""; } catch { return ""; }
};
const salvarDicaPropria = (texto: string) => {
  try {
    if (texto) localStorage.setItem(CHAVE_DICA, texto);
    else localStorage.removeItem(CHAVE_DICA);
  } catch { /* sem armazenamento: a dica vale só nesta sessão */ }
};

const rotuloPrazo = (dias: number) => {
  if (dias < 0) return "Atrasada";
  if (dias === 0) return "Hoje";
  if (dias === 1) return "Amanhã";
  return `Em ${dias} dias`;
};

const corPrazo = (dias: number) => (dias <= 1 ? "#B91C1C" : dias <= 7 ? "#B45309" : "#6B7280");

export default function Painel({ atividades, materias, onNavegar, onConcluir }: PainelProps) {
  const { estudante } = useSessao();
  const [diaSelecionado, setDiaSelecionado] = useState(0);
  const [indiceDica, setIndiceDica] = useState(0);
  const [dicaPropria, setDicaPropria] = useState(lerDicaPropria);
  const [escrevendo, setEscrevendo] = useState(false);
  const [rascunho, setRascunho] = useState("");

  const pendentes = atividades
    .filter(a => a.status !== "concluida")
    .sort((a, b) => a.prazo.localeCompare(b.prazo));
  const concluidas = atividades.filter(a => a.status === "concluida");
  const proximasPrazo = atividades.filter(a => a.status === "prazo-proximo");
  const hoje = pendentes.filter(a => diasAte(a.prazo) === 0);

  const visiveis = pendentes.slice(0, 5);
  const totalAtividades = atividades.length;
  const percentual = totalAtividades ? Math.round((concluidas.length / totalAtividades) * 100) : 0;

  const materiasEmAndamento = materias.filter(m => m.atividades > 0 && m.concluidas < m.atividades);
  const materiasConcluidas = materias.filter(m => m.atividades > 0 && m.concluidas === m.atividades);

  const dias = Array.from({ length: 7 }, (_, i) => {
    const data = new Date();
    data.setDate(data.getDate() + i);
    return {
      i,
      data,
      lista: pendentes.filter(a => diasAte(a.prazo) === i),
    };
  });
  const dia = dias[diaSelecionado];

  const dicaAtual = dicaPropria || DICAS[indiceDica % DICAS.length];

  const salvarDica = () => {
    const texto = rascunho.trim();
    setDicaPropria(texto);
    salvarDicaPropria(texto);
    setEscrevendo(false);
  };

  const outraDica = () => {
    if (dicaPropria) {
      setDicaPropria("");
      salvarDicaPropria("");
    } else {
      setIndiceDica(i => i + 1);
    }
  };

  const numeros = [
    { rotulo: "Pendentes", valor: pendentes.length, cor: "#B45309" },
    { rotulo: "Concluídas", valor: concluidas.length, cor: "#047857" },
    { rotulo: "Prazo próximo", valor: proximasPrazo.length, cor: "#9D174D" },
    { rotulo: "Para hoje", valor: hoje.length, cor: "#7C3AED" },
  ];

  return (
    <div className="flex flex-col h-full">
      <Cabecalho
        titulo="Início"
        subtitulo={dataHoje()}
        onAdicionarAtividade={() => onNavegar("adicionar-atividade")}
      />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Saudação */}
        <div className="mb-4">
          <h2 style={titulo} className="text-2xl font-bold text-[#1E1B2E]">
            Olá, {estudante.nome.split(" ")[0]}
          </h2>
          <p className="text-[#6B7280] text-sm mt-0.5">Aqui está um resumo das suas atividades de hoje.</p>
        </div>

        {/* Alerta */}
        {proximasPrazo.length > 0 && (
          <div className="mb-4 px-4 py-3 bg-[#FEFCE8] border border-[#FDE68A] rounded-xl">
            <p className="text-sm font-semibold text-[#78350F]">
              {proximasPrazo.length} atividade{proximasPrazo.length > 1 ? "s" : ""} próxima{proximasPrazo.length > 1 ? "s" : ""} do prazo
            </p>
            <p className="text-xs text-[#92400E] mt-0.5">{proximasPrazo.map(a => a.nome).join(", ")}</p>
          </div>
        )}

        {/* Linha de números */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {numeros.map(n => (
            <div key={n.rotulo} className="bg-white rounded-xl border border-[#DDD6FE] px-4 py-3">
              <p className="text-3xl font-bold leading-tight" style={{ ...titulo, color: n.cor }}>{n.valor}</p>
              <p className="text-sm text-[#4B5563]">{n.rotulo}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] gap-4 items-start">
          {/* Coluna da esquerda */}
          <div className="space-y-4 min-w-0">
            {/* Próximas do prazo */}
            <section className="bg-white rounded-xl border border-[#DDD6FE] p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 style={titulo} className="font-semibold text-[#1E1B2E]">Próximas do prazo</h3>
                <button onClick={() => onNavegar("atividades")} className="text-sm text-[#6D28D9] underline underline-offset-2 hover:text-[#5B21B6]">
                  Ver todas
                </button>
              </div>
              <p className="text-xs text-[#6B7280] mb-3">Marque o círculo para concluir a atividade.</p>

              {visiveis.length === 0 ? (
                <p className="text-center py-6 text-[#6B7280] text-sm">Nenhuma atividade pendente.</p>
              ) : (
                <ul>
                  {visiveis.map(a => {
                    const d = diasAte(a.prazo);
                    return (
                      <li key={a.id} className="flex items-center gap-3 py-2.5">
                        <button
                          onClick={() => onConcluir(a.id)}
                          aria-label={`Concluir ${a.nome}`}
                          title="Marcar como concluída"
                          className="w-6 h-6 rounded-full border-2 border-[#7C3AED] flex-shrink-0 hover:bg-[#EDE9FE] transition-colors"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1E1B2E] truncate">{a.nome}</p>
                          <p className="text-xs text-[#6B7280]">{a.materia}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold" style={{ color: corPrazo(d) }}>{rotuloPrazo(d)}</p>
                          <p className="text-xs text-[#6B7280]">{formatarData(a.prazo)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-2 pt-3 border-t border-[#EDE9FE] flex items-center justify-between gap-3">
                <span className="text-xs text-[#6B7280]">
                  Mostrando {visiveis.length} de {pendentes.length} pendentes
                </span>
                <button onClick={() => onNavegar("atividades")} className="text-xs text-[#6D28D9] underline underline-offset-2 hover:text-[#5B21B6]">
                  Ver todas as {pendentes.length} atividades
                </button>
              </div>
            </section>

            {/* Próximos 7 dias */}
            <section className="bg-white rounded-xl border border-[#DDD6FE] p-5">
              <h3 style={titulo} className="font-semibold text-[#1E1B2E] mb-3">Próximos 7 dias</h3>
              <div className="grid grid-cols-7 gap-2">
                {dias.map(d => {
                  const ativo = d.i === diaSelecionado;
                  const nomeDia = d.i === 0 ? "Hoje" : capitalizar(d.data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""));
                  return (
                    <button
                      key={d.i}
                      onClick={() => setDiaSelecionado(d.i)}
                      aria-pressed={ativo}
                      className={`rounded-lg border px-1 py-2 text-center transition-colors ${
                        ativo ? "border-[#7C3AED] border-2 bg-white" : "border-[#DDD6FE] hover:bg-[#F5F3FF]"
                      }`}
                    >
                      <span className="block text-xs font-semibold text-[#1E1B2E]">{nomeDia}</span>
                      <span className="block text-xs text-[#4B5563]">
                        {d.lista.length ? `${d.lista.length} ativ.` : "Livre"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-[#EDE9FE]">
                <p className="text-xs font-semibold text-[#1E1B2E] mb-2">
                  {capitalizar(dia.data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }))}
                  {": "}
                  {dia.lista.length
                    ? `${dia.lista.length} atividade${dia.lista.length > 1 ? "s" : ""}`
                    : "dia livre"}
                </p>
                {dia.lista.length === 0 ? (
                  <p className="text-sm text-[#6B7280]">Nenhuma entrega neste dia.</p>
                ) : (
                  <ul className="space-y-2">
                    {dia.lista.map(a => (
                      <li key={a.id} className="flex items-center gap-3">
                        <span className="w-1 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: a.materiaCor }} />
                        <span className="flex-1 min-w-0 text-sm text-[#1E1B2E] truncate">{a.nome}</span>
                        <span className="text-xs text-[#6B7280] flex-shrink-0">{a.materia}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* Coluna da direita */}
          <div className="space-y-4 min-w-0">
            {/* Progresso geral */}
            <section className="bg-white rounded-xl border border-[#DDD6FE] p-5">
              <h3 style={titulo} className="font-semibold text-[#1E1B2E] mb-3">Progresso geral</h3>
              <div className="flex items-center justify-between text-xs text-[#4B5563] mb-1.5">
                <span>Atividades concluídas</span>
                <span className="text-sm font-bold text-[#7C3AED]">{percentual}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#EDE9FE] overflow-hidden">
                <div className="h-full rounded-full bg-[#7C3AED]" style={{ width: `${percentual}%` }} />
              </div>
              <p className="text-xs text-[#6B7280] mt-1.5">
                {concluidas.length} de {totalAtividades} atividades
              </p>

              {materiasEmAndamento.length > 0 && (
                <div className="mt-4 space-y-3">
                  {materiasEmAndamento.map(m => {
                    const p = Math.round((m.concluidas / m.atividades) * 100);
                    return (
                      <div key={m.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-[#1E1B2E]">{m.nome}</span>
                          <span className="text-[#4B5563]">{p}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#EDE9FE] overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: m.cor }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {materiasConcluidas.length > 0 && (
                <div className="mt-4 space-y-2">
                  {materiasConcluidas.map(m => (
                    <p key={m.id} className="px-3 py-2.5 rounded-lg bg-[#ECFDF5] text-xs font-semibold text-[#065F46]">
                      {m.nome} concluída.{" "}
                      <button onClick={() => onNavegar("atividades")} className="font-normal underline underline-offset-2 hover:text-[#064E3B]">
                        Ver histórico
                      </button>
                    </p>
                  ))}
                </div>
              )}
            </section>

            {/* Atalhos */}
            <section className="bg-white rounded-xl border border-[#DDD6FE] p-5">
              <h3 style={titulo} className="font-semibold text-[#1E1B2E] mb-3">Atalhos</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onNavegar("adicionar-atividade")}
                  className="w-full text-left px-3 py-2 text-sm text-[#6D28D9] font-medium border border-[#DDD6FE] rounded-lg hover:bg-[#F5F3FF]"
                >
                  Nova atividade
                </button>
                <button
                  onClick={() => onNavegar("materias")}
                  className="w-full text-left px-3 py-2 text-sm text-[#6D28D9] font-medium border border-[#DDD6FE] rounded-lg hover:bg-[#F5F3FF]"
                >
                  Adicionar matéria
                </button>
              </div>
            </section>

            {/* Dica de estudo */}
            <section className="bg-[#EDE9FE] rounded-xl p-5">
              <h3 style={titulo} className="font-semibold text-[#1E1B2E] mb-2">Dica de estudo</h3>
              {escrevendo ? (
                <>
                  <textarea
                    value={rascunho}
                    onChange={e => setRascunho(e.target.value)}
                    maxLength={200}
                    rows={3}
                    autoFocus
                    placeholder="Escreva a sua dica de estudo"
                    className="w-full text-sm p-2 rounded-lg border border-[#C4B5FD] bg-white text-[#1E1B2E] focus:outline-none focus:border-[#7C3AED] resize-none"
                  />
                  <div className="flex gap-2 mt-3">
                    <button onClick={salvarDica} className="px-3 py-1.5 text-xs font-medium text-white bg-[#7C3AED] rounded-lg hover:bg-[#6D28D9]">
                      Salvar
                    </button>
                    <button onClick={() => setEscrevendo(false)} className="px-3 py-1.5 text-xs font-medium text-[#1E1B2E] bg-white border border-[#DDD6FE] rounded-lg hover:bg-[#F5F3FF]">
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-[#374151] leading-relaxed">{dicaAtual}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button onClick={outraDica} className="px-3 py-1.5 text-xs font-medium text-[#1E1B2E] bg-white border border-[#DDD6FE] rounded-lg hover:bg-[#F5F3FF]">
                      Outra dica
                    </button>
                    <button
                      onClick={() => { setRascunho(dicaPropria); setEscrevendo(true); }}
                      className="px-3 py-1.5 text-xs font-medium text-[#1E1B2E] bg-white border border-[#DDD6FE] rounded-lg hover:bg-[#F5F3FF]"
                    >
                      Escrever a minha
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
