import type { Atividade, Materia, Pagina } from "../dados";
import { formatarData, diasAte, rotuloStatus } from "../dados";
import Cabecalho from "../componentes/Cabecalho";
import { useSessao } from "../sessao";

interface PainelProps {
  atividades: Atividade[];
  materias: Materia[];
  onNavegar: (pagina: Pagina) => void;
  onConcluir: (id: number) => void;
}

const dataHoje = () => {
  const t = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export default function Painel({ atividades, materias, onNavegar, onConcluir }: PainelProps) {
  const { estudante } = useSessao();
  const pendentes = atividades.filter(a => a.status !== "concluida");
  const concluidas = atividades.filter(a => a.status === "concluida");
  const proximasPrazo = atividades.filter(a => a.status === "prazo-proximo");
  const hoje = atividades.filter(a => {
    const dias = diasAte(a.prazo);
    return dias === 0 && a.status !== "concluida";
  });

  return (
    <div className="flex flex-col h-full">
      <Cabecalho
        titulo="Início"
        subtitulo={dataHoje()}
        onAdicionarAtividade={() => onNavegar("adicionar-atividade")}
      />
      <div className="flex-1 overflow-y-auto p-6">
        {/* Saudação */}
        <div className="mb-6">
          <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-2xl font-bold text-[#1E1B2E]">
            Olá, {estudante.nome.split(" ")[0]}! 👋
          </h2>
          <p className="text-[#6B7280] text-sm mt-0.5">Aqui está um resumo das suas atividades de hoje.</p>
        </div>

        {/* Alerta */}
        {proximasPrazo.length > 0 && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {proximasPrazo.length} atividade{proximasPrazo.length > 1 ? "s" : ""} próxima{proximasPrazo.length > 1 ? "s" : ""} do prazo
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {proximasPrazo.map(a => a.nome).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Linha de números */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { rotulo: "Pendentes", value: pendentes.length, color: "#F59E0B", bg: "#FFFBEB", icone: "⏳" },
            { rotulo: "Concluídas", value: concluidas.length, color: "#10B981", bg: "#F0FDF4", icone: "✅" },
            { rotulo: "Prazo próximo", value: proximasPrazo.length, color: "#EF4444", bg: "#FEF2F2", icone: "🚨" },
            { rotulo: "Para hoje", value: hoje.length, color: "#7C3AED", bg: "#F5F3FF", icone: "📅" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#DDD6FE] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{s.icone}</span>
                <span className="text-2xl font-bold" style={{ fontFamily: "'Outfit', sans-serif", color: s.color }}>{s.value}</span>
              </div>
              <p className="text-xs text-[#6B7280] font-medium">{s.rotulo}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Próximas atividades */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#DDD6FE] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-semibold text-[#1E1B2E]">Próximas do prazo</h3>
              <button onClick={() => onNavegar("atividades")} className="text-xs text-[#7C3AED] hover:underline font-medium">Ver todas</button>
            </div>
            <div className="space-y-3">
              {[...proximasPrazo, ...pendentes.filter(a => a.status !== "prazo-proximo")].slice(0, 5).map(a => {
                const dias = diasAte(a.prazo);
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F5F3FF] cursor-pointer group transition-colors">
                    <button
                      onClick={() => onConcluir(a.id)}
                      className="w-5 h-5 rounded-full border-2 border-[#DDD6FE] group-hover:border-[#7C3AED] flex-shrink-0 flex items-center justify-center hover:bg-[#7C3AED] transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E1B2E] truncate">{a.nome}</p>
                      <p className="text-xs text-[#6B7280]">{a.materia}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium" style={{ color: dias <= 3 ? "#EF4444" : dias <= 7 ? "#F59E0B" : "#6B7280" }}>
                        {dias === 0 ? "Hoje" : dias < 0 ? "Atrasada" : `${dias}d`}
                      </p>
                      <p className="text-xs text-[#6B7280]">{formatarData(a.prazo)}</p>
                    </div>
                  </div>
                );
              })}
              {pendentes.length === 0 && (
                <div className="text-center py-6 text-[#6B7280] text-sm">
                  🎉 Nenhuma atividade pendente!
                </div>
              )}
            </div>
          </div>

          {/* Esta semana */}
          <div className="bg-white rounded-xl border border-[#DDD6FE] p-5">
            <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-semibold text-[#1E1B2E] mb-4">Esta semana</h3>
            <div className="space-y-1.5">
              {Array.from({ length: 7 }, (_, i) => {
                const dataDoDia = new Date(); dataDoDia.setDate(dataDoDia.getDate() + i);
                const n = atividades.filter(a => a.status !== "concluida" && diasAte(a.prazo) === i).length;
                return (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${i === 0 ? "bg-[#F5F3FF] border border-[#DDD6FE]" : ""}`}>
                    <span className={`text-sm ${i === 0 ? "font-semibold text-[#7C3AED]" : "text-[#1E1B2E]"}`}>
                      {i === 0 ? "Hoje" : i === 1 ? "Amanhã" : dataDoDia.toLocaleDateString("pt-BR", { weekday: "long" }).replace(/^./, c => c.toUpperCase())}
                      <span className="text-xs text-[#9CA3AF] ml-2">{dataDoDia.getDate()}/{String(dataDoDia.getMonth() + 1).padStart(2, "0")}</span>
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${n ? "bg-[#EDE9FE] text-[#7C3AED]" : "text-[#C4C4CC]"}`}>
                      {n ? `${n} entrega${n > 1 ? "s" : ""}` : "livre"}
                    </span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => onNavegar("progresso")} className="mt-4 w-full py-2 text-xs font-semibold text-[#7C3AED] border border-[#DDD6FE] rounded-lg hover:bg-[#F5F3FF]">
              Ver meu progresso →
            </button>
          </div>
        </div>

        {/* Acesso rápido */}
        <div className="mt-6 bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] rounded-xl p-5 flex items-center justify-between">
          <div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-semibold text-white text-lg">Adicionar nova atividade</h3>
            <p className="text-white/70 text-sm mt-0.5">Registre manualmente ou importe um arquivo</p>
          </div>
          <button
            onClick={() => onNavegar("adicionar-atividade")}
            className="px-5 py-2.5 bg-white text-[#7C3AED] rounded-lg font-semibold text-sm hover:bg-[#F5F3FF] transition-colors flex-shrink-0"
          >
            + Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
