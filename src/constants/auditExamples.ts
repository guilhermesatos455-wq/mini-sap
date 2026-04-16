export const QUICK_EXAMPLES = [
  {
    category: 'Impacto',
    examples: [
      { name: 'Alto Impacto (> 1k)', code: 'impactoFinanceiro > 1000' },
      { name: 'Impacto Crítico (> 5k)', code: 'impactoFinanceiro > 5000' },
      { name: 'Impacto Médio', code: 'impactoFinanceiro > 500 && impactoFinanceiro <= 1000' },
      { name: 'Baixo Impacto', code: 'impactoFinanceiro > 0 && impactoFinanceiro <= 100' },
      { name: 'Sem Impacto', code: 'impactoFinanceiro == 0' },
      { name: 'Acima do Custo Padrão > 5k', code: "tipo == 'acima do custo padrão' && impactoFinanceiro > 5000" },
      { name: 'Variação Absoluta > 500', code: 'ABS(impactoFinanceiro) > 500' }
    ]
  },
  {
    category: 'CFOP',
    examples: [
      { name: 'Venda Interna (5102)', code: "cfop == '5102'" },
      { name: 'Venda Interestadual (6102)', code: "cfop == '6102'" },
      { name: 'Bonificação (5910/6910)', code: "cfop == '5910' || cfop == '6910'" },
      { name: 'Devolução (1201/2201)', code: "cfop.includes('1201') || cfop.includes('2201')" },
      { name: 'Uso e Consumo (1556/2556)', code: "cfop == '1556' || cfop == '2556'" },
      { name: 'CFOP Inicia com 5', code: "STARTSWITH(cfop, '5')" }
    ]
  },
  {
    category: 'Impostos',
    examples: [
      { name: 'ICMS > 0', code: 'impostos.icms > 0' },
      { name: 'IPI > 0', code: 'impostos.ipi > 0' },
      { name: 'PIS/COFINS Ativos', code: 'impostos.pis > 0 && impostos.cofins > 0' },
      { name: 'ST Ativo', code: 'impostos.st > 0' },
      { name: 'Sem ICMS', code: 'impostos.icms == 0' },
      { name: 'ICMS > 18%', code: '(impostos.icms / (precoEfetivo * quantidade)) > 0.18' },
      { name: 'IPI Arredondado > 100', code: 'ROUND(impostos.ipi, 0) > 100' }
    ]
  },
  {
    category: 'Data',
    examples: [
      { name: 'Ano Atual', code: 'YEAR(data) == YEAR(TODAY())' },
      { name: 'Mês Atual', code: 'MONTH(data) == MONTH(TODAY()) && YEAR(data) == YEAR(TODAY())' },
      { name: 'Primeiro Trimestre', code: 'YEAR(data) == 2024 && MONTH(data) <= 3' },
      { name: 'Lançamentos Recentes', code: 'data >= "2024-03-01"' },
      { name: 'Dia Específico', code: 'DAY(data) == 15' },
      { name: 'Final de Semana', code: 'WEEKDAY(data) == 1 || WEEKDAY(data) == 7' }
    ]
  },
  {
    category: 'Texto',
    examples: [
      { name: 'Contém NATULAB', code: "CONTAINS(fornecedor, 'NATULAB')" },
      { name: 'Inicia com LAB', code: "STARTSWITH(fornecedor, 'LAB')" },
      { name: 'Termina com LTDA', code: "ENDSWITH(fornecedor, 'LTDA')" },
      { name: 'Tipo Material: Revenda', code: "tipoMaterial == 'Revenda'" },
      { name: 'Categoria NF: Mercadoria', code: "categoriaNF == 'Mercadoria'" },
      { name: 'Descrição Longa (> 50)', code: 'LEN(descricao) > 50' },
      { name: 'Fornecedor em Maiúsculo', code: "UPPER(fornecedor) == 'NATULAB'" }
    ]
  },
  {
    category: 'Quantidade',
    examples: [
      { name: 'Qtd > 100', code: 'quantidade > 100' },
      { name: 'Qtd Unitária', code: 'quantidade == 1' },
      { name: 'Qtd Fracionada', code: 'quantidade < 1' },
      { name: 'Grande Volume (>= 1k)', code: 'quantidade >= 1000' }
    ]
  },
  {
    category: 'Variação',
    examples: [
      { name: 'Variação > 10%', code: 'variacaoPerc > 10' },
      { name: 'Variação < -5%', code: 'variacaoPerc < -5' },
      { name: 'Variação Crítica (> 25%)', code: 'variacaoPerc > 25' },
      { name: 'Sem Variação', code: 'ABS(variacaoPerc) < 0.01' }
    ]
  },
  {
    category: 'Workflow',
    examples: [
      { name: 'Pendentes', code: "status == 'Pendente'" },
      { name: 'Em Análise', code: "status == 'Em Análise'" },
      { name: 'Corrigidos', code: "status == 'Corrigido'" },
      { name: 'Com Comentários', code: 'LEN(comentarios) > 0' },
      { name: 'Sem Comentários', code: 'ISNULL(comentarios) || LEN(comentarios) == 0' },
      { name: 'Aguardando Revisão', code: "ISNOTNULL(comentarios) && status == 'Pendente'" }
    ]
  }
];
