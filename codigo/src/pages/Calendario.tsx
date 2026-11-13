import { useState } from "react";
import type { Atividade } from "../data";
import { daysUntil, formatDate, prioridadeLabel } from "../data";
import Header from "../components/Header";

interface CalendarioProps {
  atividades: Atividade[];
  onConcluir?: (id: number) => void;
}

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const iso = (a: number, m: number, d: number) => `${a}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const atrasada = (a: Atividade) => a.status !== "concluida" && daysUntil(a.prazo) < 0;

function rotuloDia(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function Calendario({ atividades, onConcluir }: CalendarioProps) {
  const agora = new Date();
  const hojeIso = iso(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const [ano, setAno] = useState(agora.getFullYear());
  const [mes, setMes] = useState(agora.getMonth());
  const [selecionado, setSelecionado] = useState<string>(hojeIso);

  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const prefixo = `${ano}-${String(mes + 1).padStart(2, "0")}-`;

  const doDia = (d: string) => atividades.filter(a => a.prazo === d);
  const doMes = atividades.filter(a => a.prazo.startsWith(prefixo)).sort((a, b) => a.prazo.localeCompare(b.prazo));
  const mesConcluidas = doMes.filter(a => a.status === "concluida").length;
  const mesAtrasadas = doMes.filter(atrasada).length;
  const mesPendentes = doMes.length - mesConcluidas - mesAtrasadas;
  const mesPct = doMes.length ? Math.round((mesConcluidas / doMes.length) * 100) : 0;

  const irMes = (delta: number) => {
    const d = new Date(ano, mes + delta, 1);
    setAno(d.getFullYear());
    setMes(d.getMonth());
  };
  const irHoje = () => {
    setAno(agora.getFullYear());
    setMes(agora.getMonth());
    setSelecionado(hojeIso);
  };

  const selecionadas = doDia(selecionado);
  const proximas = atividades
    .filter(a => a.status !== "concluida" && daysUntil(a.prazo) >= 0)
    .sort((a, b) => a.prazo.localeCompare(b.prazo))
    .slice(0, 4);

  const chip = (a: Atividade) =>
    a.status === "concluida"
      ? "bg-green-50 text-green-700 line-through opacity-70"
      : atrasada(a)
      ? "bg-red-50 text-red-700"
      : "bg-[#F5F3FF] text-[#1E1B2E]";

  const statusTexto = (a: Atividade) =>
    a.status === "concluida" ? { t: "Concluída", c: "bg-green-100 text-green-700" }
    : atrasada(a) ? { t: "Atrasada", c: "bg-red-100 text-red-700" }
    : a.status === "prazo-proximo" ? { t: "Prazo próximo", c: "bg-amber-100 text-amber-700" }
    : { t: "Pendente", c: "bg-[#EDE9FE] text-[#7C3AED]" };

  const navBtn = "w-9 h-9 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#EDE9FE] hover:text-[#7C3AED]";

  return (
    <div className="flex flex-col h-full">
      <Header title="Calendário" subtitle="Seus prazos mês a mês" />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Resumo do mês */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { l: "No mês", v: doMes.length, c: "#7C3AED", i: "📅" },
            { l: "Pendentes", v: mesPendentes, c: "#F59E0B", i: "⏳" },
            { l: "Atrasadas", v: mesAtrasadas, c: "#EF4444", i: "🚨" },
            { l: "Concluídas", v: mesConcluidas, c: "#10B981", i: "✅" },
          ].map(s => (
            <div key={s.l} className="bg-white rounded-xl border border-[#DDD6FE] px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6B7280] font-medium">{s.l}</p>
                <p style={{ fontFamily: "'Outfit', sans-serif", color: s.c }} className="text-2xl font-bold leading-tight">{s.v}</p>
              </div>
              <span className="text-xl">{s.i}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-5">
          {/* Calendário */}
          <div className="flex-1 bg-white rounded-xl border border-[#DDD6FE] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                <button onClick={() => irMes(-1)} className={navBtn} aria-label="Mês anterior">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3L5 8l5 5"/></svg>
                </button>
                <button onClick={() => irMes(1)} className={navBtn} aria-label="Próximo mês">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3l5 5-5 5"/></svg>
                </button>
                <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-[#1E1B2E] text-xl ml-2">{MESES[mes]} {ano}</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 text-xs text-[#6B7280]">
                  <div className="w-28 h-1.5 bg-[#EDE9FE] rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${mesPct}%` }} />
                  </div>
                  {mesPct}% do mês
                </div>
                <button onClick={irHoje} className="px-3 py-1.5 text-xs font-semibold text-[#7C3AED] border border-[#DDD6FE] rounded-lg hover:bg-[#F5F3FF]">
                  Hoje
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {DIAS_SEMANA.map((d, i) => (
                <div key={d} className={`text-center text-xs font-semibold py-1.5 ${i === 0 || i === 6 ? "text-[#C4B5FD]" : "text-[#9CA3AF]"}`}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: diasNoMes }, (_, i) => i + 1).map(dia => {
                const data = iso(ano, mes, dia);
                const ats = doDia(data);
                const ehHoje = data === hojeIso;
                const ativo = data === selecionado;
                const temAtraso = ats.some(atrasada);
                return (
                  <button
                    key={dia}
                    onClick={() => setSelecionado(data)}
                    className={`min-h-[88px] rounded-xl p-1.5 border text-left flex flex-col transition-all ${
                      ativo ? "border-[#7C3AED] bg-[#F5F3FF] ring-2 ring-[#7C3AED]/20"
                      : ats.length ? "border-[#DDD6FE] bg-white hover:border-[#A78BFA] hover:shadow-sm"
                      : "border-[#F0EDF9] bg-white hover:bg-[#FAFAFF]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        ehHoje ? "bg-[#7C3AED] text-white" : "text-[#374151]"
                      }`}>{dia}</span>
                      {temAtraso && <span className="w-2 h-2 rounded-full bg-red-500" title="Atividade atrasada" />}
                    </div>
                    <div className="space-y-0.5 w-full">
                      {ats.slice(0, 2).map(a => (
                        <div
                          key={a.id}
                          className={`text-[11px] px-1.5 py-0.5 rounded truncate font-medium border-l-[3px] ${chip(a)}`}
                          style={{ borderLeftColor: a.materiaCor }}
                        >
                          {a.nome.split("—")[0].trim()}
                        </div>
                      ))}
                      {ats.length > 2 && <div className="text-[11px] text-[#7C3AED] font-medium px-1">+{ats.length - 2} mais</div>}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 pt-4 border-t border-[#F0EDF9] text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#F5F3FF] border-l-[3px] border-[#7C3AED]" />Pendente</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-50 border-l-[3px] border-red-500" />Atrasada</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-50 border-l-[3px] border-green-500" />Concluída</span>
              <span className="text-[#9CA3AF]">A cor da barrinha é a cor da matéria</span>
            </div>
          </div>

          {/* Painel lateral */}
          <div className="xl:w-80 space-y-4">
            <div className="bg-white rounded-xl border border-[#DDD6FE] p-4">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">Dia selecionado</p>
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-[#1E1B2E] mb-3">{rotuloDia(selecionado)}</h3>
              {selecionadas.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] py-4 text-center">Nada com prazo neste dia 🎈</p>
              ) : (
                <div className="space-y-3">
                  {selecionadas.map(a => {
                    const st = statusTexto(a);
                    return (
                      <div key={a.id} className="rounded-lg border border-[#F0EDF9] p-3 border-l-4" style={{ borderLeftColor: a.materiaCor }}>
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold text-[#1E1B2E] ${a.status === "concluida" ? "line-through opacity-60" : ""}`}>{a.nome}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${st.c}`}>{st.t}</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: a.materiaCor }}>{a.materia} · Prioridade {prioridadeLabel[a.prioridade].toLowerCase()}</p>
                        {a.descricao && <p className="text-xs text-[#6B7280] mt-1.5">{a.descricao}</p>}
                        {a.status !== "concluida" && onConcluir && (
                          <button onClick={() => onConcluir(a.id)} className="mt-2.5 w-full py-1.5 text-xs font-semibold text-white bg-[#7C3AED] rounded-lg hover:bg-[#6D28D9]">
                            ✓ Marcar como concluída
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-[#DDD6FE] p-4">
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-semibold text-[#1E1B2E] mb-3 text-sm">Próximos prazos</h3>
              {proximas.length === 0 ? (
                <p className="text-xs text-[#9CA3AF]">Sem prazos à vista 🎉</p>
              ) : (
                <div className="space-y-1">
                  {proximas.map(a => {
                    const d = daysUntil(a.prazo);
                    return (
                      <button
                        key={a.id}
                        onClick={() => { const [y, m] = a.prazo.split("-").map(Number); setAno(y); setMes(m - 1); setSelecionado(a.prazo); }}
                        className="w-full text-left flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#F5F3FF]"
                      >
                        <span className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: a.materiaCor }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#1E1B2E] truncate">{a.nome}</p>
                          <p className="text-[11px] text-[#9CA3AF]">{a.materia} · {formatDate(a.prazo)}</p>
                        </div>
                        <span className="text-[11px] font-semibold" style={{ color: d <= 3 ? "#EF4444" : d <= 7 ? "#F59E0B" : "#6B7280" }}>
                          {d === 0 ? "Hoje" : d === 1 ? "Amanhã" : `${d}d`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
