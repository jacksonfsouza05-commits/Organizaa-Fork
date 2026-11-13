import { useCallback, useEffect, useState } from "react";
import type { Pagina, Atividade, Materia, Estudante } from "./dados";
import { api, obterToken, limparToken, salvarToken, type DadosAtividade } from "./api";
import { SessaoContext } from "./sessao";
import BarraLateral from "./componentes/BarraLateral";
import Acesso from "./paginas/Acesso";
import Painel from "./paginas/Painel";
import Atividades from "./paginas/Atividades";
import AdicionarAtividade from "./paginas/AdicionarAtividade";
import Materias from "./paginas/Materias";
import ResumoMateria from "./paginas/ResumoMateria";
import Calendario from "./paginas/Calendario";
import Progresso from "./paginas/Progresso";
import Configuracoes from "./paginas/Configuracoes";

export default function App() {
  const [estudante, setEstudante] = useState<Estudante | null>(null);
  const [iniciando, setIniciando] = useState(!!obterToken());
  const [paginaAtual, setPaginaAtual] = useState<Pagina>("inicio");
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiaAtiva, setMateriaAtiva] = useState<Materia | null>(null);
  const [editandoAtividade, setEditandoAtividade] = useState<Atividade | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const falhou = (e: unknown) => {
    setAviso(e instanceof Error ? e.message : "Algo deu errado");
    setTimeout(() => setAviso(null), 4000);
  };

  const carregar = useCallback(async () => {
    const [a, m] = await Promise.all([api.atividades(), api.materias()]);
    setAtividades(a);
    setMaterias(m);
  }, []);

  const sair = useCallback(() => {
    limparToken();
    setEstudante(null);
    setAtividades([]);
    setMaterias([]);
    setMateriaAtiva(null);
    setPaginaAtual("inicio");
  }, []);

  useEffect(() => {
    if (!obterToken()) return;
    api.eu()
      .then(async (e) => {
        setEstudante(e);
        await carregar();
      })
      .catch(() => limparToken())
      .finally(() => setIniciando(false));
  }, [carregar]);

  const aoEntrar = async (token: string, e: Estudante) => {
    salvarToken(token);
    setEstudante(e);
    await carregar();
  };

  if (iniciando) return <div className="min-h-screen flex items-center justify-center text-[#6B7280] text-sm">Carregando...</div>;
  if (!estudante) return <Acesso onEntrar={aoEntrar} />;

  const aoConcluir = async (id: number) => {
    try {
      await api.concluirAtividade(id);
      await carregar();
    } catch (e) { falhou(e); }
  };

  const aoReabrir = async (id: number) => {
    try {
      await api.reabrirAtividade(id);
      await carregar();
    } catch (e) { falhou(e); }
  };

  const aoExcluir = async (id: number) => {
    try {
      await api.excluirAtividade(id);
      await carregar();
    } catch (e) { falhou(e); }
  };

  const aoSalvarAtividade = async (dados: DadosAtividade, id?: number) => {
    try {
      if (id) await api.editarAtividade(id, dados);
      else await api.criarAtividade(dados);
      await carregar();
      return true;
    } catch (e) {
      falhou(e);
      return false;
    }
  };

  const aoAdicionarMateria = async (nome: string, cor: string) => {
    try {
      await api.criarMateria(nome, cor);
      await carregar();
      return true;
    } catch (e) {
      falhou(e);
      return false;
    }
  };

  const aoExcluirMateria = async (id: number) => {
    try {
      await api.excluirMateria(id);
      await carregar();
    } catch (e) { falhou(e); }
  };

  const navegar = (pagina: Pagina) => {
    setPaginaAtual(pagina);
    if (pagina !== "adicionar-atividade") setEditandoAtividade(null);
    if (pagina === "materias" || pagina === "inicio" || pagina === "progresso") carregar().catch(falhou);
  };

  const renderizarPagina = () => {
    switch (paginaAtual) {
      case "inicio":
        return (
          <Painel
            atividades={atividades}
            materias={materias}
            onNavegar={navegar}
            onConcluir={aoConcluir}
          />
        );
      case "atividades":
        return (
          <Atividades
            atividades={atividades}
            onNavegar={navegar}
            onConcluir={aoConcluir}
            onReabrir={aoReabrir}
            onExcluir={aoExcluir}
            onEditar={(a) => { setEditandoAtividade(a); navegar("adicionar-atividade"); }}
          />
        );
      case "adicionar-atividade":
        return (
          <AdicionarAtividade
            materias={materias}
            onSalvar={aoSalvarAtividade}
            onNavegar={navegar}
            editando={editandoAtividade}
          />
        );
      case "materias":
        return (
          <Materias
            materias={materias}
            onNavegar={navegar}
            onSelectMateria={setMateriaAtiva}
            onAdicionarMateria={aoAdicionarMateria}
            onExcluirMateria={aoExcluirMateria}
          />
        );
      case "resumo-materia":
        return <ResumoMateria materia={materiaAtiva} onNavegar={navegar} onMudou={() => carregar().catch(falhou)} />;
      case "calendario":
        return <Calendario atividades={atividades} onConcluir={aoConcluir} />;
      case "progresso":
        return <Progresso atividades={atividades} materias={materias} />;
      case "configuracoes":
        return <Configuracoes />;
      default:
        return null;
    }
  };

  return (
    <SessaoContext.Provider value={{ estudante, setEstudante, sair }}>
      <div className="flex min-h-screen bg-[#F5F3FF]">
        <BarraLateral paginaAtual={paginaAtual} onNavegar={navegar} />
        <main className="flex-1 ml-60 flex flex-col min-h-screen">
          {renderizarPagina()}
        </main>
        {aviso && (
          <div className="fixed bottom-6 right-6 z-50 bg-red-600 text-white text-sm px-4 py-3 rounded-lg shadow-lg">
            {aviso}
          </div>
        )}
      </div>
    </SessaoContext.Provider>
  );
}
