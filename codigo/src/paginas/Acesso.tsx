import { useState } from "react";
import { api } from "../api";
import type { Estudante } from "../dados";

interface AcessoProps {
  onEntrar: (token: string, estudante: Estudante) => Promise<void>;
}

type Modo = "entrar" | "cadastro" | "recuperar" | "redefinir";

// link que vai no e-mail de recuperação: https://site/?redefinir=TOKEN
const lerTokenDaUrl = () => new URLSearchParams(window.location.search).get("redefinir") || "";

const limparTokenDaUrl = () => window.history.replaceState({}, "", window.location.pathname);

export default function Acesso({ onEntrar }: AcessoProps) {
  const [tokenRedefinicao, setTokenRedefinicao] = useState(lerTokenDaUrl);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [modo, setModo] = useState<Modo>(tokenRedefinicao ? "redefinir" : "entrar");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(false);

  const trocarModo = (m: Modo) => {
    setErro("");
    setAviso("");
    setEmailEnviado(false);
    setModo(m);
  };

  const aoEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      const r = modo === "cadastro"
        ? await api.registrar(nome, email, senha)
        : await api.entrar(email, senha);
      await onEntrar(r.token, r.estudante);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Algo deu errado");
      setCarregando(false);
    }
  };

  const aoEnviarRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await api.esqueciSenha(email);
      setEmailEnviado(true);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Algo deu errado");
    }
    setCarregando(false);
  };

  const aoEnviarRedefinicao = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    try {
      await api.redefinirSenha(tokenRedefinicao, novaSenha);
      limparTokenDaUrl();
      setTokenRedefinicao("");
      setNovaSenha("");
      setSenha("");
      setModo("entrar");
      setAviso("Senha alterada! Entre com a nova senha.");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Algo deu errado");
    }
    setCarregando(false);
  };

  const cancelarRedefinicao = () => {
    limparTokenDaUrl();
    setTokenRedefinicao("");
    setNovaSenha("");
    trocarModo("entrar");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)" }}>
      {/* Painel esquerdo */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#7C3AED] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" opacity="0.4"/>
                <path d="M8 4L12.5 6.5V11L8 13.5L3.5 11V6.5L8 4Z" fill="white"/>
                <circle cx="8" cy="8" r="2" fill="#7C3AED"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-white text-2xl font-bold tracking-tight">OrganizaAI</span>
          </div>
        </div>
        <div className="relative z-10">
          <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-white text-4xl font-bold leading-tight mb-4">
            Organize seus estudos.<br />Atinja seus objetivos.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Gerencie atividades, acompanhe seu progresso e nunca perca um prazo importante.
          </p>
          <div className="mt-10 flex flex-col gap-4">
            {[
              { icone: "📅", text: "Alertas automáticos de prazos" },
              { icone: "📚", text: "Resumos inteligentes de conteúdos" },
              { icone: "📊", text: "Acompanhamento do progresso" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{f.icone}</span>
                <span className="text-white/80 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/40 text-xs">
          © 2026 OrganizaAI. Todos os direitos reservados.
        </div>
      </div>

      {/* Painel direito */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Logo no celular */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-[#7C3AED] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z" fill="white" opacity="0.3"/>
                <path d="M8 4L12.5 6.5V11L8 13.5L3.5 11V6.5L8 4Z" fill="white"/>
                <circle cx="8" cy="8" r="2" fill="#7C3AED"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Outfit', sans-serif" }} className="text-[#1E1B2E] text-2xl font-bold">OrganizaAI</span>
          </div>

          {modo === "entrar" && (
            <>
              <div className="mb-8">
                <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-3xl font-bold text-[#1E1B2E] mb-1">Bem-vindo de volta</h2>
                <p className="text-[#6B7280] text-sm">Entre com sua conta para continuar</p>
              </div>
              <form onSubmit={aoEnviar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">E-mail</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-lg border border-[#DDD6FE] bg-white text-sm text-[#1E1B2E] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={senhaVisivel ? "text" : "password"}
                      required
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 rounded-lg border border-[#DDD6FE] bg-white text-sm text-[#1E1B2E] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setSenhaVisivel(!senhaVisivel)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#7C3AED]"
                    >
                      {senhaVisivel ? (
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <path d="M3 3l14 14M10 4C5 4 2 10 2 10s1.5 2.5 4 4M17 6c.7.9 1 2 1 4s-3 6-8 6"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <ellipse cx="10" cy="10" rx="8" ry="5"/>
                          <circle cx="10" cy="10" r="2.5"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                {aviso && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{aviso}</p>}
                {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
                <div className="flex justify-end">
                  <button type="button" onClick={() => trocarModo("recuperar")} className="text-sm text-[#7C3AED] hover:underline font-medium">
                    Esqueci minha senha
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {carregando ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10"/>
                      </svg>
                      Entrando...
                    </>
                  ) : "Entrar"}
                </button>
              </form>
              <p className="text-center text-sm text-[#6B7280] mt-6">
                Não tem uma conta?{" "}
                <button onClick={() => trocarModo("cadastro")} className="text-[#7C3AED] font-medium hover:underline">
                  Criar conta
                </button>
              </p>
            </>
          )}

          {modo === "cadastro" && (
            <>
              <div className="mb-8">
                <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-3xl font-bold text-[#1E1B2E] mb-1">Criar conta</h2>
                <p className="text-[#6B7280] text-sm">Comece a organizar seus estudos hoje</p>
              </div>
              <form onSubmit={aoEnviar} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">Nome completo</label>
                  <input type="text" required value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" className="w-full px-4 py-3 rounded-lg border border-[#DDD6FE] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">E-mail</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full px-4 py-3 rounded-lg border border-[#DDD6FE] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">Senha</label>
                  <input type="password" required minLength={8} value={senha} onChange={e => setSenha(e.target.value)} placeholder="Mínimo 8 caracteres" className="w-full px-4 py-3 rounded-lg border border-[#DDD6FE] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent"/>
                </div>
                {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
                <button type="submit" disabled={carregando} className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-70">
                  {carregando ? "Criando conta..." : "Criar conta"}
                </button>
              </form>
              <p className="text-center text-sm text-[#6B7280] mt-6">
                Já tem uma conta?{" "}
                <button onClick={() => trocarModo("entrar")} className="text-[#7C3AED] font-medium hover:underline">Entrar</button>
              </p>
            </>
          )}

          {modo === "recuperar" && (
            <>
              <div className="mb-8">
                <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-3xl font-bold text-[#1E1B2E] mb-1">Recuperar senha</h2>
                <p className="text-[#6B7280] text-sm">
                  Informe o e-mail da sua conta e enviamos um link para você criar uma nova senha.
                </p>
              </div>
              {emailEnviado ? (
                <div className="space-y-4">
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-3">
                    Se existir uma conta com esse e-mail, o link já está a caminho. Confira a caixa de entrada (e o spam). O link vale por 1 hora.
                  </p>
                  <button type="button" onClick={() => trocarModo("entrar")} className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-semibold text-sm transition-colors">
                    Voltar ao login
                  </button>
                </div>
              ) : (
                <form onSubmit={aoEnviarRecuperacao} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">E-mail</label>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 rounded-lg border border-[#DDD6FE] bg-white text-sm text-[#1E1B2E] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition"
                    />
                  </div>
                  {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
                  <button type="submit" disabled={carregando} className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-70">
                    {carregando ? "Enviando..." : "Enviar link por e-mail"}
                  </button>
                </form>
              )}
              {!emailEnviado && (
                <p className="text-center text-sm text-[#6B7280] mt-6">
                  <button onClick={() => trocarModo("entrar")} className="text-[#7C3AED] font-medium hover:underline">← Voltar ao login</button>
                </p>
              )}
            </>
          )}

          {modo === "redefinir" && (
            <>
              <div className="mb-8">
                <h2 style={{ fontFamily: "'Outfit', sans-serif" }} className="text-3xl font-bold text-[#1E1B2E] mb-1">Criar nova senha</h2>
                <p className="text-[#6B7280] text-sm">Escolha uma senha nova para a sua conta.</p>
              </div>
              <form onSubmit={aoEnviarRedefinicao} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E1B2E] mb-1.5">Nova senha</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoFocus
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-4 py-3 rounded-lg border border-[#DDD6FE] bg-white text-sm text-[#1E1B2E] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition"
                  />
                </div>
                {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>}
                <button type="submit" disabled={carregando} className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-70">
                  {carregando ? "Salvando..." : "Salvar nova senha"}
                </button>
              </form>
              <p className="text-center text-sm text-[#6B7280] mt-6">
                <button onClick={cancelarRedefinicao} className="text-[#7C3AED] font-medium hover:underline">← Voltar ao login</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
