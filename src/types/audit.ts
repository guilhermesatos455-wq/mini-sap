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
  id: number | string;
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
  suggestedCause?: string;
  suggestedTCodes?: string[];
  suggestedTCodeAction?: string;
  suggestedAction?: string;
  appliedRecipes?: string[]; // IDs das receitas que foram disparadas para este item
  aprovadoPor?: { nome: string; email: string; data: string } | null;
  rejeitadoPor?: { nome: string; email: string; data: string; motivo: string } | null;
  auditLogs?: { timestamp: string; user: string; action: string; prevStatus?: string; currentStatus?: string }[];
  _search: string;
}

export interface AuditRule {
  id: string;
  field: keyof Divergencia | string;
  operator: '>' | '<' | '==' | '!=' | 'contains' | 'in' | 'matches';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AuditRecipe {
  id: string;
  name: string;
  description: string;
  rules: AuditRule[];
  action: {
    type: 'highlight' | 'status' | 'comment' | 'sap_tcode';
    payload: string; // Cor hex, status name, texto do comentário ou T-Code
  };
  active: boolean;
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

export type MovementCategory = 
  | 'PRODUCTION_PURCHASE' 
  | 'RETURN_ENTRY' 
  | 'ADJUSTMENT_ENTRY' 
  | 'ADJUSTMENT_EXIT' 
  | 'OTHER_EXIT' 
  | 'BONIFICATION' 
  | 'SALE' 
  | 'LOSS' 
  | 'REQUISITION'
  | 'INITIAL_STOCK'
  | 'FINAL_STOCK';

export interface SAPMovementType {
  code: string;
  description: string;
  direction: 'Entrada' | 'Saída' | 'Transferência';
  category?: MovementCategory;
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

export interface StockPosition {
  material: string;
  description: string;
  plant: string;
  quantity: number;
}

export interface MovementColumnMapping {
  movementType: number;
  material: number;
  description: number;
  batch: number;
  quantity: number;
  storageLocation: number;
  date: number;
  docNumber?: number;
  plant?: number;
  user?: number;
}

export interface StockColumnMapping {
  material: number;
  description: number;
  plant: number;
  quantity: number;
  startRow: number;
}
