// --- Enumerações de Domínio ---
export type EstresseEstado = "livre" | "gasto" | "corrompido";
export type RanqueNome = "Humano" | "Desperto" | "Ascendido" | "Transcendente";
export type SheetTipo = "completa" | "simplificada" | "npc";
export type TipoEfeito = "Passivo" | "Ativável" | "Reativo";
export type OrigemTraco = "Base" | "Divino" | "Alienação";
export type SaturacaoEstagio =
  | "Centelha"
  | "Crescente"
  | "Consolidado"
  | "Completo";
export type IntegracaoEstagio = "Adaptação" | "Ressonância" | "Assimilação";

// --- Modelos de Entidade ---
export interface Efeito {
  tipo: TipoEfeito;
  descricao: string;
}

export interface Traco {
  id?: string;
  nome: string;
  conceito: string;
  gatilho: string;
  efeitos: Efeito[];
  limiteCusto: string;
  origem: OrigemTraco;
}

export interface LesaoDescricao {
  descricao: string;
}

export interface Lesao {
  leves: number;
  graves: LesaoDescricao[];
  criticas: LesaoDescricao[];
}

export interface Lesoes {
  fisicas: Lesao;
  mentais: Lesao;
  espirituais: Lesao;
}

export interface Ancora {
  nome: string;
  descricao: string;
  erosao: number;
}

export interface Divino {
  ativo: boolean;
  caminho: string;
  pesoDivino: number;
  saturacao: SaturacaoEstagio;
  integracao: IntegracaoEstagio;
  persona: string;
  ancoras: Ancora[];
  habilidadesNucleo?: string[];
}

export interface Equipamento {
  nome: string;
  descricao: string;
}

export interface Character {
  id?: string;
  nome: string;
  idade: string;
  alinhamento: string;
  ranque: RanqueNome;
  estresse: EstresseEstado[];
  lesoes: Lesoes;
  proficiencias: string[];
  aspectos: string[];
  tracos: Traco[];
  divino: Divino;
  equipamentos: Equipamento[];
  objetivos: string[];
  descricao: string;
  historia: string;
  frasesExperiencia: string[];
  notas: string;
  taticas: string;
  tipo: SheetTipo;
  criadoEm: string;
  atualizadoEm: string;
}

export interface SheetRegistryEntry {
  id: string;
  nome: string;
  tipo: SheetTipo;
  criadoEm: string;
  atualizadoEm: string;
}

// --- Modelos do Códice (Ameaças e Traços Divinos) ---
export interface Threat {
  id?: string;
  nome: string;
  descricao: string;
  ranque: RanqueNome;
  estresseMax: number;
  lesoes: { leves: number; graves: number; criticas: number };
  proficiencias: string[];
  tracos: Traco[];
  equipamentos: string[];
  taticas: string[];
}

export interface DivineTrait extends Traco {
  caminho?: string;
  ranqueRequisito?: RanqueNome;
  saturacaoRequisito?: SaturacaoEstagio;
}

// --- Tipos do Sistema de Ranques ---
export interface RankData {
  label: string;
  estresseMaximo: number;
  lesoesLeves: number;
  lesoesGraves: number;
  lesoesCriticas: number;
}
