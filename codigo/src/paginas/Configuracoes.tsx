import { useState } from "react";
import { api } from "../api";
import { useSessao } from "../sessao";
import Cabecalho from "../componentes/Cabecalho";

function haQuantoTempo(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return "hoje";
  return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}

export default function Configuracoes() {
  const { estudante, setEstudante } = useSessao();
  const [nome, setNome] = useState(estudante.nome);
  const email = estudante.email;
  const [notifPrazo, setNotifPrazo] = useState(estudante.notifPrazo);
  const [notifEmail, setNotifEmail] = useState(estudante.notifEmail);
  const [notifDiario, setNotifDiario] = useState(estudante.notifDiario);
  const [notifSemanal, setNotifSemanal] = useState(estudante.notifSemanal);
  const [antecedencia, setAntecedencia] = useState(String(estudante.antecedencia));
  const [senhaModal, setSenhaModal] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState("");
  const [erroSenha, setErroSenha] = useState("");
  const [enviandoTeste, setEnviandoTeste] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{ ok: boolean; texto: string } | null>(null);

  const aoSalvar = async () => {
    setErro("");
    try {
      const e = await api.salvarPerfil({
        nome, notifPrazo, notifEmail, notifDiario, notifSemanal, antecedencia: Number(antecedencia),
      });
      setEstudante(e);
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2000);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não deu pra salvar");
    }
  };

  const enviarTeste = async () => {
    setResultadoTeste(null);
    setEnviandoTeste(true);
    try {
      await api.enviarEmailTeste();
      setResultadoTeste({ ok: true, texto: `Pronto! Mandamos um e-mail de teste para ${email}.` });
    } catch (falha) {
      setResultadoTeste({ ok: false, texto: falha instanceof Error ? falha.message : "Não deu pra enviar o e-mail de teste" });
    }
    setEnviandoTeste(false);
  };

  const trocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha("");
    try {
      await api.trocarSenha(senhaAtual, novaSenha);
      setEstudante({ ...estudante, senhaAlteradaEm: new Date().toISOString() });
      setSenhaModal(false);
      setSenhaAtual("");
      setNovaSenha("");
    } catch (falha) {
      setErroSenha(falha instanceof Error ? falha.message : "Não deu pra trocar a senha");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Cabecalho titulo="Configurações" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Perfil */}
          <div className="bg-white rounded-xl border border-[#DDD6FE] p-6">
            <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-[#1E1B2E] mb-4">Informações da conta</h2>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white text-2xl font-bold">
                {nome.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <p style={{ fontFamily: "'Outfit', sans-serif" }} className="font-semibold text-[#1E1B2E]">{nome}</p>
                <p className="text-sm text-[#6B7280]">{email}</p>
                <span className="text-xs bg-[#EDE9FE] text-[#7C3AED] px-2 py-0.5 rounded-full font-medium">Estudante</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">Nome completo</label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DDD6FE] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">E-mail</label>
                <input
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-[#DDD6FE] text-sm text-[#9CA3AF] bg-[#F9FAFB] cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="bg-white rounded-xl border border-[#DDD6FE] p-6">
            <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-[#1E1B2E] mb-4">Segurança</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1E1B2E]">Senha</p>
                <p className="text-xs text-[#6B7280]">Última alteração {haQuantoTempo(estudante.senhaAlteradaEm)}</p>
              </div>
              <button
                onClick={() => { setErroSenha(""); setSenhaModal(true); }}
                className="px-4 py-2 border border-[#DDD6FE] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F5F3FF] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all"
              >
                Alterar senha
              </button>
            </div>
          </div>

          {/* Notificações */}
          <div className="bg-white rounded-xl border border-[#DDD6FE] p-6">
            <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-[#1E1B2E] mb-4">Notificações</h2>
            <div className="space-y-4">
              {[
                { rotulo: "Alertas de prazo próximo", descricao: "Receba avisos no sino quando uma atividade estiver próxima do vencimento", valor: notifPrazo, definir: setNotifPrazo },
                { rotulo: "Alertas por e-mail (Gmail)", descricao: `Enviamos um e-mail para ${email} todo dia, a partir das 8h, quando houver atividades perto do prazo (usa a antecedência abaixo)`, valor: notifEmail, definir: setNotifEmail },
                { rotulo: "Resumo diário", descricao: "Receba um resumo das suas atividades pendentes todo dia às 8h", valor: notifDiario, definir: setNotifDiario },
                { rotulo: "Relatório semanal", descricao: "Receba um relatório do seu progresso toda segunda-feira", valor: notifSemanal, definir: setNotifSemanal },
              ].map((n, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[#1E1B2E]">{n.rotulo}</p>
                    <p className="text-xs text-[#6B7280]">{n.descricao}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={n.valor}
                    aria-label={n.rotulo}
                    onClick={() => n.definir(!n.valor)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${n.valor ? "bg-[#7C3AED]" : "bg-[#D1D5DB]"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${n.valor ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              ))}
            </div>

            {notifEmail && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={enviarTeste}
                  disabled={enviandoTeste}
                  className="px-4 py-2 border border-[#DDD6FE] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F5F3FF] hover:border-[#7C3AED] hover:text-[#7C3AED] transition-all disabled:opacity-70"
                >
                  {enviandoTeste ? "Enviando..." : "Enviar e-mail de teste"}
                </button>
                {resultadoTeste && (
                  <p className={`text-xs ${resultadoTeste.ok ? "text-green-700" : "text-red-600"}`}>{resultadoTeste.texto}</p>
                )}
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-[#F0EDF9]">
              <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">Antecedência para alertas de prazo</label>
              <div className="flex gap-2">
                {["1", "2", "3", "5", "7"].map(d => (
                  <button
                    key={d}
                    onClick={() => setAntecedencia(d)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      antecedencia === d
                        ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                        : "border-[#DDD6FE] text-[#6B7280] hover:border-[#7C3AED] hover:text-[#7C3AED]"
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Salvar */}
          <div className="flex items-center justify-end gap-4">
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <button
              onClick={aoSalvar}
              className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-lg font-semibold text-sm hover:bg-[#6D28D9] transition-colors flex items-center gap-2"
            >
              {salvo ? "✅ Salvo!" : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>

      {/* Janela de alterar senha */}
      {senhaModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 style={{ fontFamily: "'Outfit', sans-serif" }} className="font-bold text-lg text-[#1E1B2E] mb-4">Alterar senha</h3>
            <form onSubmit={trocarSenha} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">Senha atual</label>
                <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 rounded-lg border border-[#DDD6FE] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" required/>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">Nova senha</label>
                <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full px-4 py-2.5 rounded-lg border border-[#DDD6FE] text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]" required minLength={8}/>
              </div>
              {erroSenha && <p className="text-sm text-red-600">{erroSenha}</p>}
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2.5 bg-[#7C3AED] text-white rounded-lg text-sm font-semibold hover:bg-[#6D28D9]">Salvar</button>
                <button type="button" onClick={() => setSenhaModal(false)} className="flex-1 py-2.5 border border-[#DDD6FE] text-[#6B7280] rounded-lg text-sm hover:bg-[#F5F3FF]">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
