import { Divergencia, TaxCompliance, AuditRecipe, AuditRule } from '../types/audit';
import { safeLocalStorageSet, setLargeData } from './storageUtils';

export const suggestTCodes = (item: Divergencia): { codes: string[], action: string } => {
  const codes: string[] = [];
  let action = '';

  const isPreco = Math.abs(item.variacaoPerc) > 5;
  const isCustoPadraoZero = item.custoPadrao === 0;
  const isCfopDevolucao = item.cfop.startsWith('120') || item.cfop.startsWith('220') || item.cfop.startsWith('520') || item.cfop.startsWith('620');
  
  if (isCustoPadraoZero) {
    codes.push('MM02', 'MR21');
    action = 'Atualizar Custo Padrão ou Visão de Contabilidade do Material';
  } else if (isPreco) {
    codes.push('ME22N', 'MIRO');
    action = 'Verificar Pedido de Compra ou Estornar/Corrigir Fatura';
  } else if (isCfopDevolucao) {
    codes.push('MIGO', 'J1B1N');
    action = 'Verificar Movimentação de Devolução e Nota Fiscal de Saída';
  } else {
    codes.push('MIR4', 'MB51');
    action = 'Exibir Documento de Faturamento e Listagem de Movimentos';
  }

  return { codes, action };
};

export const executeAuditRecipes = (item: Divergencia, recipes: AuditRecipe[]): Divergencia => {
  let updatedItem = { ...item };
  const appliedRecipes: string[] = [];

  recipes.filter(r => r.active).forEach(recipe => {
    const isTriggered = recipe.rules.every(rule => {
      const fieldValue = (updatedItem as any)[rule.field];
      
      switch (rule.operator) {
        case '>': return Number(fieldValue) > Number(rule.value);
        case '<': return Number(fieldValue) < Number(rule.value);
        case '==': return String(fieldValue) === String(rule.value);
        case '!=': return String(fieldValue) !== String(rule.value);
        case 'contains': return String(fieldValue).toLowerCase().includes(String(rule.value).toLowerCase());
        case 'matches': return new RegExp(String(rule.value)).test(String(fieldValue));
        case 'in': return Array.isArray(rule.value) && rule.value.includes(fieldValue);
        default: return false;
      }
    });

    if (isTriggered) {
      appliedRecipes.push(recipe.id);
      switch (recipe.action.type) {
        case 'status':
          updatedItem.status = recipe.action.payload;
          break;
        case 'comment':
          updatedItem.comentarios = (updatedItem.comentarios ? updatedItem.comentarios + '\n' : '') + '[REGRA]: ' + recipe.action.payload;
          break;
        case 'sap_tcode':
          if (!updatedItem.suggestedTCodes) updatedItem.suggestedTCodes = [];
          updatedItem.suggestedTCodes.push(recipe.action.payload);
          break;
      }
    }
  });

  updatedItem.appliedRecipes = appliedRecipes;
  return updatedItem;
};

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
  justificationBase?: Record<string, string>,
  recipes?: AuditRecipe[]
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
  
  const tCodeRec = suggestTCodes(item);

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
    tipo,
    suggestedTCodes: tCodeRec.codes,
    suggestedTCodeAction: tCodeRec.action
  };

  if (taxMatrix) {
    updatedItem.taxCompliance = validateTaxCompliance(updatedItem, taxMatrix);
  }

  if (decisionHistory && justificationBase) {
    updatedItem = applyIntelligence(updatedItem, decisionHistory, justificationBase);
  }

  if (recipes && recipes.length > 0) {
    updatedItem = executeAuditRecipes(updatedItem, recipes);
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
  justificationBase?: Record<string, string>,
  recipes?: AuditRecipe[]
): Divergencia => {
  let mergedData = { ...newData };
  if (newData.impostos && oldItem.impostos) {
    mergedData.impostos = { ...oldItem.impostos, ...newData.impostos };
  }
  
  let newItem = { ...oldItem, ...mergedData } as Divergencia;
  
  // Recalculate if price, cost, quantity or taxes changed
  if ('precoEfetivo' in newData || 'custoPadrao' in newData || 'quantidade' in newData || 'impostos' in newData) {
    newItem = calculateItemImpact(newItem, taxMatrix, decisionHistory, justificationBase, recipes);
  }
  
  return newItem;
};

export const persistComment = async (item: Divergencia): Promise<void> => {
  const commentKey = `miniSap_comment_${item.material}_${item.numeroNF}_${item.data}`;
  await setLargeData(commentKey, {
    comentarios: item.comentarios,
    status: item.status,
    updatedAt: new Date().toISOString()
  });
};
