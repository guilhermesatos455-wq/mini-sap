import pptxgen from "pptxgenjs";

export const generateAuditPPT = (resultado: any, supplierSummary: any[]) => {
  const pres = new pptxgen();
  const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  // 1. Layout & Theme
  pres.layout = "LAYOUT_16x9";
  const BRAND_GREEN = "8DC63F";
  const TEXT_DARK = "1E293B";

  // 2. Title Slide
  const slideTitle = pres.addSlide();
  slideTitle.background = { color: "F8FAFC" };
  
  slideTitle.addShape(pres.ShapeType.rect, {
    x: 0, y: 0, w: "100%", h: 0.5, fill: { color: BRAND_GREEN }
  });

  slideTitle.addText("Relatório Executivo de Auditoria", {
    x: 0.5, y: 0.2, w: "90%", fontSize: 32, bold: true, color: "FFFFFF"
  });

  slideTitle.addText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, {
    x: 0.5, y: 0.9, w: "90%", fontSize: 12, color: "FFFFFF"
  });

  slideTitle.addText("Análise de Divergências de Preço (CKM3 vs NF)", {
    x: 0.5, y: 2.5, w: 9, fontSize: 44, bold: true, color: TEXT_DARK
  });

  slideTitle.addShape(pres.ShapeType.line, {
    x: 0.5, y: 3.5, w: 4, h: 0, line: { color: BRAND_GREEN, width: 4 }
  });

  // 3. Summary Slide
  const slideResumo = pres.addSlide();
  slideResumo.addText("Resumo de Impacto Financeiro", {
    x: 0.5, y: 0.5, w: 8, fontSize: 24, bold: true, color: BRAND_GREEN
  });

  const cards = [
    { title: "Divergências", value: resultado.qtdDiv.toString(), color: "3B82F6", x: 0.5 },
    { title: "Impacto Crítico", value: formatoMoeda.format(resultado.totalPrejuizo), color: "EF4444", x: 3.2 },
    { title: "Economia", value: formatoMoeda.format(resultado.totalEconomia), color: "10B981", x: 6.0 }
  ];

  cards.forEach(card => {
    slideResumo.addShape(pres.ShapeType.rect, {
      x: card.x, y: 1.2, w: 2.5, h: 1.5, fill: { color: "FFFFFF" }, line: { color: card.color, width: 1 }
    });
    slideResumo.addText(card.title, {
      x: card.x, y: 1.3, w: 2.5, fontSize: 10, bold: true, color: "64748B", align: "center"
    });
    slideResumo.addText(card.value, {
      x: card.x, y: 1.8, w: 2.5, fontSize: 18, bold: true, color: card.color, align: "center"
    });
  });

  // Table on summary slide
  const summaryRows = [
    [
      { text: "Indicador", options: { bold: true, fill: { color: BRAND_GREEN }, color: "FFFFFF" } },
      { text: "Valor", options: { bold: true, fill: { color: BRAND_GREEN }, color: "FFFFFF" } }
    ],
    [{ text: "Volume de Notas Processadas", options: {} }, { text: resultado.linhasNfProcessadas.toString(), options: {} }],
    [{ text: "Materiais em Audit", options: {} }, { text: resultado.materiaisNoCkm3.toString(), options: {} }],
    [{ text: "Não Encontrados SAP", options: {} }, { text: resultado.qtdAusentes.toString(), options: {} }],
    [{ text: "CFOPs Analisados", options: {} }, { text: resultado.uniqueValues.cfops.length.toString(), options: {} }],
  ];

  slideResumo.addTable(summaryRows, { x: 0.5, y: 3.2, w: 9, fontSize: 12, border: { pt: 0.5, color: "E2E8F0" } });

  // 4. Top Suppliers Slide
  const slideSuppliers = pres.addSlide();
  slideSuppliers.addText("Top 10 Fornecedores por Impacto", {
    x: 0.5, y: 0.5, w: 8, fontSize: 24, bold: true, color: BRAND_GREEN
  });

  const topTen = supplierSummary.slice(0, 10);
  const supplierRows: any[][] = [
    [
      { text: "Fornecedor", options: { bold: true, fill: { color: BRAND_GREEN }, color: "FFFFFF" } },
      { text: "Divergências", options: { bold: true, fill: { color: BRAND_GREEN }, color: "FFFFFF", align: "center" } },
      { text: "Impacto Acima", options: { bold: true, fill: { color: BRAND_GREEN }, color: "FFFFFF", align: "right" } },
      { text: "Resgate Potencial", options: { bold: true, fill: { color: BRAND_GREEN }, color: "FFFFFF", align: "right" } }
    ]
  ];

  topTen.forEach(s => {
    supplierRows.push([
      { text: s.name, options: {} },
      { text: s.count.toString(), options: { align: "center" } },
      { text: formatoMoeda.format(s.prejuizo), options: { align: "right" } },
      { text: formatoMoeda.format(s.economia), options: { align: "right" } }
    ]);
  });

  slideSuppliers.addTable(supplierRows, {
    x: 0.5, y: 1.2, w: 9, rowH: 0.4, fontSize: 10, border: { pt: 0.5, color: "E2E8F0" }
  });

  // 5. Audit Recommendations Slide
  const slideRecom = pres.addSlide();
  slideRecom.addText("Insights e Recomendações", {
    x: 0.5, y: 0.5, w: 8, fontSize: 24, bold: true, color: BRAND_GREEN
  });

  const bulletPoints = [
    { text: "Revisar as maiores divergências com o setor de Compras.", options: { bullet: true, fontSize: 16, color: TEXT_DARK } },
    { text: "Avaliar o impacto tributário direto nos créditos de ICMS/IPI.", options: { bullet: true, fontSize: 16, color: TEXT_DARK } },
    { text: "Sincronizar periodicamente o PMM para evitar distorções de estoque.", options: { bullet: true, fontSize: 16, color: TEXT_DARK } },
    { text: "Investigar notas fiscais não lançadas no CKM3.", options: { bullet: true, fontSize: 16, color: TEXT_DARK } },
  ];

  slideRecom.addText(bulletPoints, { x: 0.5, y: 1.5, w: 8, h: 3 });

  // 6. Save
  pres.writeFile({ fileName: `Apresentacao_Auditoria_${new Date().toISOString().split('T')[0]}.pptx` });
};
