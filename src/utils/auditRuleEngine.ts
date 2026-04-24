import { AuditRecipe, Divergencia } from '../types/audit';
import { suggestTCodes } from './auditUtils';

/**
 * Motor de regras para processar as receitas personalizadas de auditoria
 */
export const engineRuleExtractor = (item: Divergencia, field: string): any => {
  // @ts-ignore
  return item[field];
};

export const applyAuditRecipes = (items: Divergencia[], recipes: AuditRecipe[]): Divergencia[] => {
  const activeRecipes = recipes.filter(r => r.active);
  
  return items.map(item => {
    const matchedRecipes: string[] = [];
    let newItem = { ...item };

    // Automatic T-Code Suggestion (Suggestion 4)
    const sapRec = suggestTCodes(newItem);
    newItem.suggestedTCodes = sapRec.codes;
    newItem.suggestedTCodeAction = sapRec.action;

    if (activeRecipes.length > 0) {
      for (const recipe of activeRecipes) {
        let isMatch = true;
        
        for (const rule of recipe.rules) {
          const itemValue = engineRuleExtractor(item, rule.field);
          const ruleValue = rule.value;

          let ruleResult = false;
          switch (rule.operator) {
            case '==': ruleResult = String(itemValue) == String(ruleValue); break;
            case '!=': ruleResult = String(itemValue) != String(ruleValue); break;
            case '>': ruleResult = Number(itemValue) > Number(ruleValue); break;
            case '<': ruleResult = Number(itemValue) < Number(ruleValue); break;
            case 'contains': ruleResult = String(itemValue).toLowerCase().includes(String(ruleValue).toLowerCase()); break;
            case 'in': ruleResult = Array.isArray(ruleValue) && ruleValue.includes(itemValue); break;
            case 'matches': 
              try {
                ruleResult = new RegExp(String(ruleValue), 'i').test(String(itemValue));
              } catch (e) {
                ruleResult = false;
              }
              break;
          }

          if (!ruleResult) {
            isMatch = false;
            break;
          }
        }

        if (isMatch) {
          matchedRecipes.push(recipe.id);
          
          switch (recipe.action.type) {
            case 'status':
              newItem.status = recipe.action.payload;
              break;
            case 'comment':
              newItem.comentarios = (newItem.comentarios ? newItem.comentarios + ' | ' : '') + '[REGRA]: ' + recipe.action.payload;
              break;
            case 'sap_tcode':
              if (!newItem.suggestedTCodes) newItem.suggestedTCodes = [];
              if (!newItem.suggestedTCodes.includes(recipe.action.payload)) {
                newItem.suggestedTCodes.push(recipe.action.payload);
              }
              break;
          }
        }
      }
    }

    if (matchedRecipes.length > 0) {
      newItem.appliedRecipes = matchedRecipes;
    }

    return newItem;
  });
};

/**
 * Função para sugerir causa raiz com base em lógica avançada e aprendizado de histórico
 */
export const suggestRootCause = (
  item: Divergencia, 
  decisionHistory?: Record<string, string>, 
  justificationBase?: Record<string, string>
): { cause: string, confidence: number } | null => {
  const material = item.material;
  const variationRange = Math.round(item.variacaoPerc);
  const historyKey = `${material}_${variationRange}`;

  // 1. Prioridade: Aprendizado Ativo (Histórico de Decisões)
  if (justificationBase && justificationBase[historyKey]) {
    return {
      cause: `Sugestão baseada em ocorrências anteriores: ${justificationBase[historyKey]}`,
      confidence: 0.95
    };
  }

  const ratio = item.precoSemFrete / item.custoPadrao;
  
  // 2. Erro de conversão de unidade (Pack Sizes)
  const commonPackSizes = [10, 12, 15, 20, 24, 30, 48, 50, 60, 100, 1000];
  for (const size of commonPackSizes) {
    // Verifica se a variação é múltiplo exato (ex: 12x mais caro ou 1/12 do preço)
    if (Math.abs(ratio - size) < 0.08 || Math.abs(ratio - (1/size)) < 0.08) {
      return { 
        cause: `Erro de conversão de unidade (${size}x). Provável confusão entre Caixa/Pack e Unidade no lançamento da NF ou cadastro SAP.`,
        confidence: 0.9
      };
    }
  }

  // 3. Divergência Tributária (ICMS-ST)
  if (item.taxCompliance && !item.taxCompliance.isCompliant) {
    return {
      cause: `Inconsistência de ICMS-ST: Alíquota destacada (${item.taxCompliance.actualRate.toFixed(1)}%) diverge da malha fiscal (${item.taxCompliance.expectedRate}%).`,
      confidence: 0.92
    };
  }

  // 4. Variação de Centavos (Arredondamento/Frete)
  const diffAbs = Math.abs(item.precoSemFrete - item.custoPadrao);
  if (diffAbs < 0.10 && item.variacaoPerc !== 0) {
    return {
      cause: "Diferença irrelevante de centavos. Provável resíduo de arredondamento ou rateio de despesas acessórias.",
      confidence: 0.88
    };
  }

  // 5. Variação Extrema
  if (Math.abs(item.variacaoPerc) > 50) {
    return {
      cause: "Alerta de Segurança: Variação superior a 50%. Possível erro crítico de digitação ou material incorreto (troca de código).",
      confidence: 0.7
    };
  }

  // 6. Diferença em múltiplos de 10 (Erro de vírgula)
  if (Math.abs(ratio - 10) < 0.05 || Math.abs(ratio - 0.1) < 0.05) {
    return {
      cause: "Erro de digitação: Provável deslocamento de casa decimal (vírgula) no preço da NF.",
      confidence: 0.8
    };
  }

  return null;
};
