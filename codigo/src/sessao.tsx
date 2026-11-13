import { createContext, useContext } from "react";
import type { Estudante } from "./dados";

interface Sessao {
  estudante: Estudante;
  setEstudante: (e: Estudante) => void;
  sair: () => void;
}

export const SessaoContext = createContext<Sessao | null>(null);

export function useSessao() {
  const contexto = useContext(SessaoContext);
  if (!contexto) throw new Error("useSessao precisa ser usado dentro do SessaoContext.Provider");
  return contexto;
}
