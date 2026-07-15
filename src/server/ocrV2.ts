import Tesseract from 'tesseract.js';

// Função principal que recebe um array com os caminhos (ou buffers) dos arquivos
export async function extrairDadosMultiplasNotas(caminhosImagens: string[]) {
  const resultadosGerais = [];

  console.log(`🚀 Iniciando o processamento de ${caminhosImagens.length} notas fiscais...`);

  // Usamos for...of para processar UMA imagem por vez e evitar crash de memória
  for (const caminho of caminhosImagens) {
    console.log(`⏳ Analisando: ${caminho}`);

    try {
      // Executa o OCR com o idioma Português ('por')
      const { data: { text } } = await Tesseract.recognize(
        caminho,
        'por'
      );

      // --- EXTRAÇÃO DE DADOS (Regex) ---
      const numeroNF = text.match(/Nº\s*(\d+)/i)?.[1] || null;
      const fornecedor = text.match(/FORNECEDOR:\s*(.*)/i)?.[1] || null;
      const data = text.match(/DATA:\s*(\d{2}\/\d{2}\/\d{4})/i)?.[1] || null;
      const valorTotal = parseFloat(text.match(/VALOR TOTAL.*?(\d{1,3}(?:\.\d{3})*,\d{2})/i)?.[1]?.replace('.', '').replace(',', '.') || '0');
      const referencia_po = text.match(/PO:\s*(\d+)/i)?.[1] || null;
      const processo_imp = text.match(/PROCESSO:\s*(\d+)/i)?.[1] || null;
      const frete = parseFloat(text.match(/FRETE.*?(\d{1,3}(?:\.\d{3})*,\d{2})/i)?.[1]?.replace('.', '').replace(',', '.') || '0');

      // Adiciona o resultado de sucesso na nossa lista final
      resultadosGerais.push({
        arquivo: caminho,
        status: 'sucesso',
        dados: { numeroNF, fornecedor, data, valorTotal, referencia_po, processo_imp, frete },
        textoBruto: text
      });

      console.log(`✅ Concluído: ${caminho}`);

    } catch (error) {
      console.error(`❌ Erro ao ler a nota ${caminho}:`, error);
      
      resultadosGerais.push({
        arquivo: caminho,
        status: 'erro',
        mensagemErro: String(error)
      });
    }
  }

  console.log(`🎉 Processamento finalizado!`);
  return resultadosGerais;
}
