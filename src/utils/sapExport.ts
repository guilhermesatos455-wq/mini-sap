/**
 * Utility to export audit data in SAP-compatible formats.
 */

export const exportToMR21 = (divergencias: any[]) => {
  // MR21 usually requires: Material, Plant (Centro), New Price, Currency, Date
  // We only export items that are "acima do custo padrão" or "abaixo do custo padrão"
  // and have a suggested correction (or just the NF price as the new standard)
  
  const headers = ['Material', 'Centro', 'Novo Preco', 'Moeda', 'Data Base'];
  const rows = divergencias
    .filter(d => d.tipo !== 'Sem Divergência')
    .map(d => [
      d.material,
      d.centro,
      d.precoNF.toFixed(2),
      'BRL',
      new Date().toLocaleDateString('pt-BR')
    ]);

  const csvContent = [
    headers.join(';'), // SAP often prefers semicolon
    ...rows.map(row => row.join(';'))
  ].join('\n');

  downloadCSV(csvContent, `SAP_MR21_${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportToNotaComplementar = (divergencias: any[]) => {
  // For items where NF price was LOWER than standard but it was an error in tax/price
  // This is a simplified layout for a complementary tax note
  const headers = ['NF Original', 'Fornecedor', 'Material', 'Valor Diferenca', 'Base ICMS'];
  const rows = divergencias
    .filter(d => d.tipo === 'acima do custo padrão')
    .map(d => [
      d.numeroNF || 'N/A',
      d.fornecedor,
      d.material,
      d.impactoFinanceiro.toFixed(2),
      (d.impactoFinanceiro * 0.18).toFixed(2) // Assuming 18% ICMS for base calculation
    ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  downloadCSV(csvContent, `SAP_Complementar_${new Date().toISOString().split('T')[0]}.csv`);
};

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
