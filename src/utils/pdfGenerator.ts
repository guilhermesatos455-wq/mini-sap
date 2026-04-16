import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generateAuditPDF = (resultado: any, supplierSummary: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  // Header
  doc.setFillColor(141, 198, 63); // Mini-SAP Green
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Auditoria Mini-SAP', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString()}`, 15, 33);

  // Summary Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo Executivo', 15, 55);

  const summaryData = [
    ['Total de Divergências', resultado.qtdDiv.toString()],
    ['Total Acima do Custo Padrão', formatoMoeda.format(resultado.totalPrejuizo)],
    ['Total Abaixo do Custo Padrão', formatoMoeda.format(resultado.totalEconomia)],
    ['Impacto Líquido', formatoMoeda.format(resultado.totalPrejuizo - resultado.totalEconomia)],
    ['Materiais sem Custo no CKM3', resultado.qtdAusentes.toString()]
  ];

  autoTable(doc, {
    startY: 60,
    head: [['Indicador', 'Valor']],
    body: summaryData,
    theme: 'striped',
    headStyles: { fillColor: [141, 198, 63] },
    styles: { fontSize: 10 }
  });

  // Top Suppliers Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Top Fornecedores por Impacto (Acima do Custo)', 15, (doc as any).lastAutoTable.finalY + 15);

  const supplierData = supplierSummary.slice(0, 10).map(s => [
    s.name,
    s.count.toString(),
    formatoMoeda.format(s.prejuizo),
    formatoMoeda.format(s.economia)
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 20,
    head: [['Fornecedor', 'Divergências', 'Acima do Custo Padrão', 'Abaixo do Custo Padrão']],
    body: supplierData,
    theme: 'grid',
    headStyles: { fillColor: [141, 198, 63] },
    styles: { fontSize: 9 }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
    doc.text('Mini-SAP Auditoria - Confidencial', 15, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`Relatorio_Auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
};
