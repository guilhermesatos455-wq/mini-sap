import { useMemo } from 'react';

export const useMAPCalculator = (
  currentQty: number,
  basePrice: number,
  newQty: number,
  newPrice: number,
  taxes: any,
  activeTaxes: any,
  selectedData: any
) => {
  const simulation = useMemo(() => {
    // 1. Definição segura dos inputs
    const qAt = Math.max(0, currentQty || 0);
    const pAt = Math.max(0, basePrice || 0);
    const qNo = Math.max(0, newQty || 0);
    const pIn = Math.max(0, newPrice || 0);

    if (!selectedData || qNo === 0 || pIn === 0) return null;

    const currentTotal = qAt * pAt;
    
    // 2. Cálculo seguro de impostos e frete
    const ipiBase = activeTaxes.ipi ? (1 + (taxes.ipi || 0) / 100) : 1;
    const priceWithIPI = pIn * ipiBase;
    
    const unitFreight = activeTaxes.freight ? ((taxes.freight || 0) / qNo) : 0;
    const totalUnitCost = priceWithIPI + unitFreight;
    
    const deductiblePct = (
      (activeTaxes.icms ? (taxes.icms || 0) : 0) + 
      (activeTaxes.pis ? (taxes.pis || 0) : 0) + 
      (activeTaxes.cofins ? (taxes.cofins || 0) : 0)
    ) / 100;
    
    const netPurchasePrice = totalUnitCost * (1 - deductiblePct);

    // 3. Cálculo de PMM com proteção contra divisão por zero
    const newTotal = qNo * netPurchasePrice;
    const totalQty = qAt + qNo;
    
    const newPMM = totalQty > 0 ? (currentTotal + newTotal) / totalQty : netPurchasePrice;
    const variation = pAt > 0 ? ((newPMM / pAt) - 1) * 100 : 0;

    return {
      newPMM,
      variation,
      totalQty,
      netPurchasePrice,
      totalUnitCost,
      impact: newPMM - pAt
    };
  }, [selectedData, currentQty, basePrice, newQty, newPrice, taxes, activeTaxes]);

  const sensitivityAnalysis = useMemo(() => {
    const qAt = Math.max(0, currentQty || 0);
    const pAt = Math.max(0, basePrice || 0);
    const qNo = Math.max(0, newQty || 0);
    const pIn = Math.max(0, newPrice || 0);
    
    if (!selectedData || qNo === 0) return [];
    
    const variations = [-0.1, -0.05, 0, 0.05, 0.1];
    
    // Preparação comum para otimização
    const uFRef = activeTaxes.freight ? ((taxes.freight || 0) / qNo) : 0;
    const dP = ((activeTaxes.icms ? (taxes.icms || 0) : 0) + (activeTaxes.pis ? (taxes.pis || 0) : 0) + (activeTaxes.cofins ? (taxes.cofins || 0) : 0)) / 100;
    const ipiBase = activeTaxes.ipi ? (1 + (taxes.ipi || 0) / 100) : 1;

    return variations.map(v => {
      const priceAtV = pIn * (1 + v);
      
      const pIPI = priceAtV * ipiBase;
      const tUC = pIPI + uFRef;
      const nPP = tUC * (1 - dP);

      const newPMM = (qAt + qNo) > 0 ? ((qAt * pAt) + (qNo * nPP)) / (qAt + qNo) : nPP;
      return { change: v * 100, pmm: newPMM };
    });
  }, [selectedData, currentQty, basePrice, newQty, newPrice, taxes, activeTaxes]);

  return { simulation, sensitivityAnalysis };
};
