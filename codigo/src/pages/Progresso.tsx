import type { Atividade, Materia, Prioridade } from "../data";
import { daysUntil, prioridadeLabel } from "../data";
import Header from "../components/Header";

interface Props {
  atividades: Atividade[];
  materias: Materia[];
}

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Anel({ valor, tamanho = 176 }: { valor: number; tamanho?: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative flex-shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="anelGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#DDD6FE" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" />
        <circle cx="64" cy="64" r={r} fill="none" stroke="url(#anelGrad)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * valor) / 100} style={{ transition: "stroke-dashoffset 600ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-4xl font-bold leading-none">{valor}%</span>
        <span className="text-xs text-white/70 mt-1">concluído</span>
      </div>
    </div>
  );
}

function mensagem(p: number, total: number, atrasadas: number) {
  if (total === 0) return "Cadastre atividades para acompanhar seu progresso.";
  if (atrasadas > 0) return `Você tem ${atrasadas} atividade${atrasadas > 1 ? "s" : ""} atrasada${atrasadas > 1 ? "s" : ""}. Vamos colocar em dia?`;
  if (p === 100) return "Tudo concluído! Excelente trabalho 🎉";
  if (p >= 70) return "Reta final, falta pouco!";
  if (p >= 40) return "Bom ritmo, continue assim!";
  return "Todo grande progresso começa com a primeira entrega.";
}

export default function Progresso({ atividades, materias }: Props) {
  const total = atividades.length;
  const concluidas = atividades.filter(a => a.status === "concluida").length;
  const atrasadas = atividades.filter(a => a.status !== "concluida" && daysUntil(a.prazo) < 0).length;
  const pendentes = total - concluidas - atrasadas;
  const geral = pct(concluidas, total);

  const totalConteudos = materias.reduce((s, m) => s + m.conteudos, 0);
  const estudados = materias.reduce((s, m) => s + m.estudados, 0);

  const porPrioridade = (["alta", "media", "baixa"] as Prioridade[]).map(p => {
    const lista = atividades.filter(a => a.prioridade === p);
    return { p, total: lista.length, ok: lista.filter(a => a.status === "concluida").length };
  });
  const corPrioridade: Record<Prioridade, string> = { alta: "#EF4444", media: "#F59E0B", baixa: "#10B981" };

  const semana = Array.from({ length: 7 }, (_, i) => {
    const n = atividades.filter(a => a.status !== "concluida" && daysUntil(a.prazo) === i).length;
    const dt = new Date(); dt.setDate(dt.getDate() + i);
    return { rotulo: i === 0 ? "Hoje" : DIAS[dt.getDay()], n };
  });
  const maxSemana = Math.max(1, ...semana.map(s => s.n));

  const card = "bg-white rounded-xl border border-[#DDD6FE] p-5";
  const titulo = { fontFamily: "'Outfit', sans-serif" } as const;

  return (
    <div className="flex flex-col h-full">
      <Header title="Progresso" subtitle="Seu desempenho em atividades e conteúdos" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Destaque */}
        <div className="rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] p-6 flex flex-col md:flex-row items-center gap-8 text-white">
          <Anel valor={geral} />
          <div className="flex-1 w-full">
            <h2 style={titulo} className="text-2xl font-bold">Seu progresso geral</h2>
            <p className="text-white/80 text-sm mt-1 mb-5">{mensagem(geral, total, atrasadas)}</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { l: "Atividades", v: total },
                { l: "Concluídas", v: concluidas },
                { l: "Pendentes", v: pendentes },
                { l: "Atrasadas", v: atrasadas },
              ].map(s => (
                <div key={s.l} className="bg-white/15 rounded-xl px-4 py-3">
                  <p style={titulo} className="text-2xl font-bold leading-tight">{s.v}</p>
                  <p className="text-xs text-white/70">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prazos da semana */}
          <div className={`${card} lg:col-span-2`}>
            <h3 style={titulo} className="font-semibold text-[#1E1B2E]">Entregas nos próximos 7 dias</h3>
            <p className="text-xs text-[#6B7280] mb-4">Só atividades ainda não concluídas</p>
            <div className="flex items-end gap-3 h-40">
              {semana.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
                  <span className="text-xs font-semibold text-[#1E1B2E]">{s.n || ""}</span>
                  <div
                    className={`w-full rounded-t-lg ${i === 0 ? "bg-[#7C3AED]" : "bg-[#C4B5FD]"}`}
                    style={{ height: `${s.n ? Math.max(12, (s.n / maxSemana) * 100) : 4}%`, opacity: s.n ? 1 : 0.35 }}
                  />
                  <span className={`text-xs ${i === 0 ? "font-bold text-[#7C3AED]" : "text-[#6B7280]"}`}>{s.rotulo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prioridade + conteúdos */}
          <div className="space-y-6">
            <div className={card}>
              <h3 style={titulo} className="font-semibold text-[#1E1B2E] mb-4">Por prioridade</h3>
              <div className="space-y-3.5">
                {porPrioridade.map(i => (
                  <div key={i.p}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-medium text-[#1E1B2E]">{prioridadeLabel[i.p]}</span>
                      <span className="text-[#6B7280]">{i.ok}/{i.total}</span>
                    </div>
                    <div className="w-full h-2 bg-[#F0EDF9] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct(i.ok, i.total)}%`, backgroundColor: corPrioridade[i.p] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={card}>
              <h3 style={titulo} className="font-semibold text-[#1E1B2E] mb-3">Conteúdos estudados</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span style={titulo} className="text-3xl font-bold text-[#0891B2]">{pct(estudados, totalConteudos)}%</span>
                <span className="text-xs text-[#6B7280]">{estudados} de {totalConteudos}</span>
              </div>
              <div className="w-full h-2 bg-[#E0F2FE] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0891B2] to-[#22D3EE]" style={{ width: `${pct(estudados, totalConteudos)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Por matéria */}
        <div>
          <h3 style={titulo} className="font-semibold text-[#1E1B2E] mb-3">Desempenho por matéria</h3>
          {materias.length === 0 && <p className="text-sm text-[#9CA3AF]">Nenhuma matéria cadastrada.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...materias].sort((a, b) => pct(b.concluidas, b.atividades) - pct(a.concluidas, a.atividades)).map(m => {
              const p = pct(m.concluidas, m.atividades);
              const pc = pct(m.estudados, m.conteudos);
              return (
                <div key={m.id} className={card}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: m.cor }}>{m.nome.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p style={titulo} className="font-bold text-[#1E1B2E] truncate">{m.nome}</p>
                      <p className="text-xs text-[#6B7280]">{m.atividades} atividades · {m.conteudos} conteúdos</p>
                    </div>
                    <span style={{ ...titulo, color: m.cor }} className="text-xl font-bold">{p}%</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-[#6B7280] mb-1"><span>Atividades</span><span>{m.concluidas}/{m.atividades}</span></div>
                      <div className="w-full h-2 bg-[#F0EDF9] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: m.cor }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-[#6B7280] mb-1"><span>Conteúdos estudados</span><span>{m.estudados}/{m.conteudos}</span></div>
                      <div className="w-full h-2 bg-[#F0EDF9] rounded-full overflow-hidden"><div className="h-full rounded-full opacity-60" style={{ width: `${pc}%`, backgroundColor: m.cor }} /></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
