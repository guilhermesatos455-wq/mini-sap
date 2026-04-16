export interface Impostos {
  icms: number;
  ipi: number;
  pis: number;
  cofins: number;
  st?: number;
}

export interface TaxCompliance {
  isCompliant: boolean;
  expectedRate: number;
  actualRate: number;
  message?: string;
}

export interface Divergencia {
  id: number;
  material: string;
  descricao: string;
  tipoMaterial?: string;
  categoriaNF?: string;
  origemMaterial?: string;
  cfop: string;
  fornecedor: string;
  empresa: string;
  numeroNF: string;
  dataLancamento: string;
  precoSemFrete: number;
  precoComFrete?: number;
  valorLiqSemFrete?: number;
  valorLiqComFrete?: number;
  valorTotalSemFrete?: number;
  valorTotalComFrete?: number;
  precoEfetivo: number;
  custoPadrao: number;
  variacaoPerc: number;
  impactoFinanceiro: number;
  quantidade: number;
  data?: string;
  status?: string;
  comentarios?: string;
  arquivo?: string;
  linhaNF?: number;
  anexos?: { id: string; name: string; url: string; type: string; date: string }[];
  aprovacaoStatus?: 'Pendente' | 'Aprovado' | 'Rejeitado';
  impostos?: Partial<Impostos>;
  icmsEfetivoPerc?: number;
  ipiEfetivoPerc?: number;
  pisEfetivoPerc?: number;
  cofinsEfetivoPerc?: number;
  stEfetivoPerc?: number;
  totalImpostosPerc?: number;
  tipo?: 'acima do custo padrão' | 'abaixo do custo padrão' | 'Sem Divergência';
  taxCompliance?: TaxCompliance;
  suggestedStatus?: string;
  suggestedComment?: string;
  _search: string;
}

export interface NotaNaoLancada {
  id: string;
  numeroNF: string;
  fornecedor: string;
  data: string;
  valorTotal: number;
  itens: { material: string; descricao: string; quantidade: number; preco: number }[];
  arquivo: string;
}

export interface ResultadoAuditoria {
  qtdDiv: number;
  totalPrejuizo: number;
  totalEconomia: number;
  qtdAusentes: number;
  divergencias: Divergencia[];
  todosOsItens: Divergencia[];
  notasNaoLancadas: NotaNaoLancada[];
  uniqueValues: {
    cfops: string[];
    suppliers: string[];
    tipoMaterial: string[];
    categoriaNF: string[];
    origemMaterial: string[];
    empresa: string[];
  };
  linhasNfProcessadas: number;
  linhasCkm3Processadas: number;
  materiaisNoCkm3: number;
  dataProcessamento: string;
}

export interface ShowColunas {
  empresa: boolean;
  numeroNF: boolean;
  tipoMaterial: boolean;
  categoriaNF: boolean;
  origemMaterial: boolean;
  dataLancamento: boolean;
  precoSemFrete: boolean;
  precoComFrete: boolean;
  valorLiqSemFrete: boolean;
  valorLiqComFrete: boolean;
  valorTotalSemFrete: boolean;
  valorTotalComFrete: boolean;
}

export interface SAPMovementType {
  code: string;
  description: string;
  direction: 'Entrada' | 'Saída' | 'Transferência';
  active: boolean;
}

export interface MaterialMovement {
  id: string;
  material: string;
  description: string;
  movementType: string;
  quantity: number;
  date: string;
  plant: string;
  storageLocation: string;
  batch?: string;
  user: string;
  docNumber: string;
}
