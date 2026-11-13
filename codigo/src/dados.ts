export type Pagina =
  | "acesso"
  | "inicio"
  | "atividades"
  | "adicionar-atividade"
  | "materias"
  | "resumo-materia"
  | "calendario"
  | "progresso"
  | "configuracoes";

export type Status = "pendente" | "concluida" | "prazo-proximo";
export type Prioridade = "alta" | "media" | "baixa";

export interface Atividade {
  id: number;
  nome: string;
  materiaId: number;
  materia: string;
  materiaCor: string;
  descricao: string;
  prazo: string;
  prioridade: Prioridade;
  status: Status;
}

export interface Materia {
  id: number;
  nome: string;
  cor: string;
  atividades: number;
  concluidas: number;
  conteudos: number;
  estudados: number;
}

export interface Conteudo {
  id: number;
  titulo: string;
  resumo: string;
  topicos: string[];
  explicacaoSimples: string | null;
  estudado: boolean;
}

export interface Estudante {
  id: number;
  nome: string;
  email: string;
  notifPrazo: boolean;
  notifEmail: boolean;
  notifDiario: boolean;
  notifSemanal: boolean;
  antecedencia: number;
  senhaAlteradaEm: string;
}

export interface Notificacao {
  id: number;
  texto: string;
  urgente: boolean;
}

export function formatarData(dataTexto: string): string {
  const [y, m, d] = dataTexto.split("-");
  return `${d}/${m}/${y}`;
}

export function diasAte(dataTexto: string): number {
  const [y, m, d] = dataTexto.split("-").map(Number);
  const agora = new Date();
  const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((Date.UTC(y, m - 1, d) - hoje) / 86400000);
}

export const rotuloStatus: Record<Status, string> = {
  pendente: "Pendente",
  concluida: "Concluída",
  "prazo-proximo": "Prazo próximo",
};

export const rotuloPrioridade: Record<Prioridade, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};
