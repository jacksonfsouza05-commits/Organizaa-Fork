import type { Atividade, Materia, Conteudo, Estudante, Notificacao, Prioridade } from "./dados";

const URL_BASE = import.meta.env.VITE_API_URL || "http://localhost:3333/api";
const CHAVE_TOKEN = "organizaai_token";

export const obterToken = () => localStorage.getItem(CHAVE_TOKEN);
export const salvarToken = (t: string) => localStorage.setItem(CHAVE_TOKEN, t);
export const limparToken = () => localStorage.removeItem(CHAVE_TOKEN);

export class ErroApi extends Error {
  status: number;
  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.status = status;
  }
}

async function requisicao<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
  const token = obterToken();
  let resposta: Response;
  try {
    resposta = await fetch(URL_BASE + caminho, {
      method: metodo,
      headers: {
        ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi("Não consegui falar com o servidor", 0);
  }
  if (resposta.status === 204) return undefined as T;
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new ErroApi(dados.erro || "Algo deu errado", resposta.status);
  return dados as T;
}

export interface DadosAtividade {
  nome: string;
  materiaId: number;
  descricao: string;
  prazo: string;
  prioridade: Prioridade;
}

export interface DadosConteudo {
  titulo: string;
  resumo: string;
  topicos: string[];
  explicacaoSimples: string;
}

export const api = {
  entrar: (email: string, senha: string) =>
    requisicao<{ token: string; estudante: Estudante }>("POST", "/auth/entrar", { email, senha }),
  registrar: (nome: string, email: string, senha: string) =>
    requisicao<{ token: string; estudante: Estudante }>("POST", "/auth/registrar", { nome, email, senha }),
  eu: () => requisicao<Estudante>("GET", "/auth/eu"),
  salvarPerfil: (d: Pick<Estudante, "nome" | "notifPrazo" | "notifEmail" | "notifDiario" | "notifSemanal" | "antecedencia">) =>
    requisicao<Estudante>("PUT", "/auth/eu", d),
  trocarSenha: (senhaAtual: string, novaSenha: string) =>
    requisicao<{ ok: boolean }>("PUT", "/auth/senha", { senhaAtual, novaSenha }),
  esqueciSenha: (email: string) =>
    requisicao<{ ok: boolean }>("POST", "/auth/esqueci-senha", { email }),
  redefinirSenha: (token: string, novaSenha: string) =>
    requisicao<{ ok: boolean }>("POST", "/auth/redefinir-senha", { token, novaSenha }),

  atividades: () => requisicao<Atividade[]>("GET", "/atividades"),
  criarAtividade: (d: DadosAtividade) => requisicao<Atividade>("POST", "/atividades", d),
  editarAtividade: (id: number, d: DadosAtividade) => requisicao<Atividade>("PUT", `/atividades/${id}`, d),
  concluirAtividade: (id: number) => requisicao<Atividade>("PATCH", `/atividades/${id}/concluir`, {}),
  excluirAtividade: (id: number) => requisicao<void>("DELETE", `/atividades/${id}`),

  materias: () => requisicao<Materia[]>("GET", "/materias"),
  criarMateria: (nome: string, cor: string) => requisicao<Materia>("POST", "/materias", { nome, cor }),
  excluirMateria: (id: number) => requisicao<void>("DELETE", `/materias/${id}`),

  conteudos: (materiaId: number) => requisicao<Conteudo[]>("GET", `/materias/${materiaId}/conteudos`),
  criarConteudo: (materiaId: number, d: DadosConteudo) =>
    requisicao<Conteudo>("POST", `/materias/${materiaId}/conteudos`, d),
  marcarEstudado: (id: number, estudado: boolean) =>
    requisicao<{ id: number; estudado: boolean }>("PATCH", `/conteudos/${id}/estudado`, { estudado }),

  notificacoes: () => requisicao<Notificacao[]>("GET", "/notificacoes"),
  enviarEmailTeste: () => requisicao<{ ok: boolean }>("POST", "/notificacoes/email-teste", {}),
};
