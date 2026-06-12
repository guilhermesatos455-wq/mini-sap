export const extrairMesAnoDoArquivo = (fileName: string) => {
  // Padrão esperado: 05.26_... ou 05-26_... ou 05.2026_
  const match = fileName.match(/^(\d{2})[.-](\d{2,4})/);
  if (match) {
    let [_, mes, ano] = match;
    if (ano.length === 2) ano = '20' + ano;
    return { mes, ano: parseInt(ano), date: new Date(parseInt(ano), parseInt(mes) - 1) };
  }
  return null;
};

export const ordenarArquivosPorData = (files: File[]) => {
  return [...files].sort((a, b) => {
    const dataA = extrairMesAnoDoArquivo(a.name);
    const dataB = extrairMesAnoDoArquivo(b.name);
    if (!dataA || !dataB) return 0;
    return dataA.date.getTime() - dataB.date.getTime();
  });
};
