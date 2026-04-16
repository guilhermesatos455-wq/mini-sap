import { Divergencia, TaxCompliance } from '../types/audit';

export const validateTaxCompliance = (item: Divergencia, taxMatrix: Record<string, number>): TaxCompliance | undefined => {
  if (!item.impostos?.st || !item.precoEfetivo || !item.quantidade) return undefined;
  
  // Try to find UF in supplier name or address (simplified for this demo)
  // In a real app, UF would be a separate field
  const ufs = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS', 'BA', 'PE', 'CE', 'GO', 'MT', 'MS', 'ES', 'AM', 'PA', 'MA', 'RN', 'PB', 'AL', 'SE', 'PI', 'TO', 'RO', 'AC', 'RR', 'AP', 'DF'];
  const uf = ufs.find(u => item.fornecedor.includes(u)) || 'SP'; // Default to SP if not found
  
  const expectedRate = taxMatrix[uf] || 0;
  if (expectedRate === 0) return undefined;
  
  const totalValor = item.precoEfetivo * item.quantidade;
  const actualRate = (item.impostos.st / totalValor) * 100;
  
  const diff = Math.abs(actualRate - expectedRate);
  const isCompliant = diff < 0.1; // 0.1% tolerance
  
  return {
    isCompliant,
    expectedRate,
    actualRate,
    message: isCompliant ? undefined : `Alíquota de ICMS-ST incorreta para ${uf}. Esperado: ${expectedRate}%, Encontrado: ${actualRate.toFixed(2)}%`
  };
};

export const applyIntelligence = (
  item: Divergencia, 
  decisionHistory: Record<string, string>, 
  justificationBase: Record<string, string>
): Divergencia => {
  const material = item.material;
  const variationRange = Math.round(item.variacaoPerc);
  const key = `${material}_${variationRange}`;
  
  const suggestedStatus = decisionHistory[key];
  const suggestedComment = justificationBase[key];
  
  return {
    ...item,
    suggestedStatus,
    suggestedComment
  };
};

export const calculateItemImpact = (
  item: Divergencia, 
  taxMatrix?: Record<string, number>,
  decisionHistory?: Record<string, string>,
  justificationBase?: Record<string, string>
): Divergencia => {
  const preco = item.precoEfetivo;
  const custo = item.custoPadrao;
  const qtd = item.quantidade;
  
  const impactoFinanceiro = (preco - custo) * qtd;
  const variacaoPerc = custo !== 0 ? ((preco / custo) - 1) * 100 : 0;
  const tipo = impactoFinanceiro > 0 ? 'acima do custo padrão' : (impactoFinanceiro < 0 ? 'abaixo do custo padrão' : 'Sem Divergência');
  
  let icmsEfetivoPerc = 0;
  let ipiEfetivoPerc = 0;
  let pisEfetivoPerc = 0;
  let cofinsEfetivoPerc = 0;
  let stEfetivoPerc = 0;
  let totalImpostosPerc = 0;
  
  const totalValor = preco * qtd;
  
  if (totalValor > 0) {
    if (item.impostos?.icms) icmsEfetivoPerc = (item.impostos.icms / totalValor) * 100;
    if (item.impostos?.ipi) ipiEfetivoPerc = (item.impostos.ipi / totalValor) * 100;
    if (item.impostos?.pis) pisEfetivoPerc = (item.impostos.pis / totalValor) * 100;
    if (item.impostos?.cofins) cofinsEfetivoPerc = (item.impostos.cofins / totalValor) * 100;
    if (item.impostos?.st) stEfetivoPerc = (item.impostos.st / totalValor) * 100;
    
    const totalImpostos = (item.impostos?.icms || 0) + (item.impostos?.ipi || 0) + (item.impostos?.pis || 0) + (item.impostos?.cofins || 0) + (item.impostos?.st || 0);
    totalImpostosPerc = (totalImpostos / totalValor) * 100;
  }
  
  let updatedItem: Divergencia = {
    ...item,
    impactoFinanceiro,
    variacaoPerc,
    icmsEfetivoPerc,
    ipiEfetivoPerc,
    pisEfetivoPerc,
    cofinsEfetivoPerc,
    stEfetivoPerc,
    totalImpostosPerc,
    tipo
  };

  if (taxMatrix) {
    updatedItem.taxCompliance = validateTaxCompliance(updatedItem, taxMatrix);
  }

  if (decisionHistory && justificationBase) {
    updatedItem = applyIntelligence(updatedItem, decisionHistory, justificationBase);
  }
  
  return updatedItem;
};

export const recalculateTotals = (divergencias: Divergencia[]) => {
  let totalPrejuizo = 0;
  let totalEconomia = 0;
  
  divergencias.forEach((d: Divergencia) => {
    if (d.tipo === 'acima do custo padrão') {
      totalPrejuizo += d.impactoFinanceiro;
    } else if (d.tipo === 'abaixo do custo padrão') {
      totalEconomia += Math.abs(d.impactoFinanceiro);
    }
  });
  
  return {
    totalPrejuizo,
    totalEconomia,
    qtdDiv: divergencias.length
  };
};

export const mergeItemData = (
  oldItem: Divergencia, 
  newData: Partial<Divergencia>,
  taxMatrix?: Record<string, number>,
  decisionHistory?: Record<string, string>,
  justificationBase?: Record<string, string>
): Divergencia => {
  let mergedData = { ...newData };
  if (newData.impostos && oldItem.impostos) {
    mergedData.impostos = { ...oldItem.impostos, ...newData.impostos };
  }
  
  let newItem = { ...oldItem, ...mergedData } as Divergencia;
  
  // Recalculate if price, cost, quantity or taxes changed
  if ('precoEfetivo' in newData || 'custoPadrao' in newData || 'quantidade' in newData || 'impostos' in newData) {
    newItem = calculateItemImpact(newItem, taxMatrix, decisionHistory, justificationBase);
  }
  
  return newItem;
};

export const persistComment = (item: Divergencia) => {
  const commentKey = `miniSap_comment_${item.material}_${item.numeroNF}_${item.data}`;
  localStorage.setItem(commentKey, JSON.stringify({
    comentarios: item.comentarios,
    status: item.status,
    updatedAt: new Date().toISOString()
  }));
};
