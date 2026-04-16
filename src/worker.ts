import * as XLSX from 'xlsx';

// Garantir que XLSX esteja disponível se necessário por algum plugin ou contexto
if (typeof self !== 'undefined') {
  (self as any).XLSX = XLSX;
}

const parseExcelDate = (val: any): Date | null => {
  if (val === undefined || val === null || val === '') return null;
  
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    } catch (e) {
      return null;
    }
  }
  
  if (typeof val === 'string') {
    const partsBR = val.split('/');
    if (partsBR.length === 3) {
      const day = parseInt(partsBR[0], 10);
      const month = parseInt(partsBR[1], 10) - 1;
      const year = parseInt(partsBR[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    
    const partsUS = val.split('-');
    if (partsUS.length === 3) {
      const year = parseInt(partsUS[0], 10);
      const month = parseInt(partsUS[1], 10) - 1;
      const day = parseInt(partsUS[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
    
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  
  return null;
};

self.onmessage = (e) => {
  const {
    filesNfData,
    fileCkm3Data,
    fileCkm3Name,
    tolerancia,
    cfops,
    dataInicio,
    dataFim,
    colunaData,
    mapColunas,
    filesNames
  } = e.data;

  try {
    self.postMessage({ type: 'status', message: '⏳ Lendo arquivo CKM3...' });
    
    // Optimized read options for speed and memory
    const readOptions: XLSX.ParsingOptions = { 
      type: 'array', 
      dense: true,
      cellFormula: false,
      cellHTML: false,
      cellText: false,
      cellDates: false // Keep as numbers for parseExcelDate to handle
    };

    let wbCKM3;
    try {
      wbCKM3 = XLSX.read(new Uint8Array(fileCkm3Data), { ...readOptions });
    } catch (err: any) {
      throw new Error(`Falha ao ler o arquivo CKM3 "${fileCkm3Name || 'CKM3'}". O arquivo pode estar corrompido ou em um formato inválido (XLSX/XLS esperado). Detalhe: ${err.message}`);
    }
    
    const dataCKM3 = XLSX.utils.sheet_to_json<any[]>(wbCKM3.Sheets[wbCKM3.SheetNames[0]], { header: 1 });
    // Clear workbook reference to save memory
    wbCKM3 = null;

    self.postMessage({ type: 'status', message: `⏳ Lendo arquivos de Notas Fiscais... (CKM3 lido: ${dataCKM3.length} linhas)` });
    
    const limiteTol = (tolerancia || 0) / 100;
    const cfopsSet = new Set(cfops.toUpperCase().split(',').map((s: string) => s.trim()).filter(Boolean));
    
    // Decodifica colunas
    const colDataIdx = colunaData ? XLSX.utils.decode_col(colunaData.toUpperCase()) : -1;
    const dtInicio = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
    const dtFim = dataFim ? new Date(dataFim + 'T23:59:59') : null;

    const parseNumber = (val: any): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const s = val.trim();
        if (s === '') return 0;
        
        // Optimized parsing: remove non-numeric except , . and -
        // Most common case: "1.234,56" or "1234.56"
        let clean = '';
        for (let i = 0; i < s.length; i++) {
          const char = s[i];
          if ((char >= '0' && char <= '9') || char === ',' || char === '.' || char === '-') {
            clean += char;
          }
        }

        if (clean.includes(',') && clean.includes('.')) {
          clean = clean.replace(/\./g, '').replace(',', '.');
        } else if (clean.includes(',')) {
          clean = clean.replace(',', '.');
        }
        
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    const colToIdx = (col: string) => col ? XLSX.utils.decode_col(col.toUpperCase()) : -1;

    const padronizarMaterial = (mat: any): string => {
      if (mat == null) return '';
      const s = String(mat).trim();
      if (s === '') return '';
      
      // Fast zero-strip
      let start = 0;
      while (start < s.length - 1 && s[start] === '0') {
        start++;
      }
      return s.substring(start);
    };

    // 2. Indexação do CKM3 (Lógica Sênior: Inicia na Linha 2 / Índice 1)
    const startRowCkm3 = 1;
    const idxCkm3Mat = XLSX.utils.decode_col(mapColunas.ckm3Mat || 'C');
    const idxCkm3Custo = XLSX.utils.decode_col(mapColunas.ckm3Custo || 'L');
    const idxCkm3Qtd = XLSX.utils.decode_col(mapColunas.ckm3Qtd || 'I');
    const idxCkm3Centro = XLSX.utils.decode_col(mapColunas.ckm3Centro || 'C');
    const idxCkm3Desc = XLSX.utils.decode_col(mapColunas.ckm3Desc || 'D');
    const idxCkm3Categoria = XLSX.utils.decode_col(mapColunas.ckm3Categoria || 'G');
    const categoriaFiltroRaw = mapColunas.ckm3CategoriaFiltro || [];
    const categoriaFiltro = Array.isArray(categoriaFiltroRaw) 
      ? categoriaFiltroRaw.map((s: string) => s.trim().toUpperCase()).filter(Boolean)
      : (typeof categoriaFiltroRaw === 'string' && categoriaFiltroRaw.trim() !== '' ? [categoriaFiltroRaw.trim().toUpperCase()] : []);

    const idxCkm3Processo = XLSX.utils.decode_col(mapColunas.ckm3Processo || 'H');
    const processoFiltroRaw = mapColunas.ckm3ProcessoFiltro || [];
    const processoFiltro = Array.isArray(processoFiltroRaw)
      ? processoFiltroRaw.map((s: string) => s.trim().toUpperCase()).filter(Boolean)
      : (typeof processoFiltroRaw === 'string' && processoFiltroRaw.trim() !== '' ? [processoFiltroRaw.trim().toUpperCase()] : []);

    const dictCKM3 = new Map<string, { custo: number; qtdEstoque: number; centro: string; descricao: string; linha: number }>();
    
    const totalCkm3 = dataCKM3.length - startRowCkm3;
    for (let r = startRowCkm3; r < dataCKM3.length; r++) {
      const linha = dataCKM3[r];
      if (!linha || linha.length <= idxCkm3Mat) continue;
      
      const codMat = linha[idxCkm3Mat];
      const custo = parseNumber(linha[idxCkm3Custo]);
      const categoria = String(linha[idxCkm3Categoria] || '').trim().toUpperCase();
      const processo = String(linha[idxCkm3Processo] || '').trim().toUpperCase();

      // Lógica de Filtro por Categoria (Coluna G)
      if (categoriaFiltro.length > 0) {
        const match = categoriaFiltro.some(f => categoria.includes(f));
        if (!match) continue;
      }

      // Lógica de Filtro por Categoria de Processo (Coluna H)
      if (processoFiltro.length > 0) {
        const match = processoFiltro.some(f => processo.includes(f));
        if (!match) continue;
      }
      
      if (codMat != null && custo !== 0) {
        const qtdEstoque = parseNumber(linha[idxCkm3Qtd]);
        dictCKM3.set(padronizarMaterial(codMat), { 
          custo, 
          qtdEstoque,
          centro: String(linha[idxCkm3Centro] || '').trim(), 
          descricao: String(linha[idxCkm3Desc] || '').trim(),
          linha: r + 1
        });
      }

      if (r % 15000 === 0) {
        self.postMessage({ 
          type: 'progress', 
          percent: Math.round(((r - startRowCkm3) / totalCkm3) * 100), 
          current: r - startRowCkm3, 
          total: totalCkm3, 
          fileName: 'CKM3' 
        });
      }
    }

    let qtdDiv = 0;
    let qtdAusentes = 0;
    let totalPrejuizo = 0;
    let totalEconomia = 0;
    const divergencias: any[] = [];
    const todosOsItens: any[] = [];
    const nfGroups = new Map<string, { 
      numeroNF: string; 
      fornecedor: string; 
      data: string; 
      arquivo: string; 
      itens: any[];
      foundInCkm3: boolean;
    }>();
    
    // Sets to collect unique values during processing
    const cfopsSetUnique = new Set<string>();
    const suppliersSetUnique = new Set<string>();
    const tipoMaterialSetUnique = new Set<string>();
    const categoriaNFSetUnique = new Set<string>();
    const origemMaterialSetUnique = new Set<string>();
    const empresaSetUnique = new Set<string>();
    
    // Calcular total de linhas em todos os arquivos NF para progresso global
    let totalLinhasGlobal = 0;
    const nfIndices: any[] = [];
    const nfStartRows: number[] = [];

    self.postMessage({ type: 'status', message: '⏳ Analisando arquivos de Notas Fiscais...' });

    // Pass 1: Pre-scan and calculate average cost (Memory efficient: process one by one)
    const dictNfMedia = new Map<string, { totalValue: number, totalQty: number }>();

    for (let f = 0; f < filesNfData.length; f++) {
      const fileName = filesNames[f];
      const fileBuffer = filesNfData[f];
      
      let wbNF;
      try {
        wbNF = XLSX.read(new Uint8Array(fileBuffer), { ...readOptions });
      } catch (err: any) {
        throw new Error(`Falha ao ler o arquivo de NF "${fileName}". O arquivo pode estar corrompido ou em um formato inválido (XLSX/XLS esperado). Detalhe: ${err.message}`);
      }
      
      const dataNF = XLSX.utils.sheet_to_json<any[]>(wbNF.Sheets[wbNF.SheetNames[0]], { header: 1 });
      wbNF = null; // Clear workbook reference

      // 3. Processamento das NFs (Lógica Sênior: Inicia na Linha 8 / Índice 7)
      const startRowNf = 7;
      const idxNfCfop = XLSX.utils.decode_col(mapColunas.nfCfop || 'H');
      const idxNfMat = XLSX.utils.decode_col(mapColunas.nfMat || 'K');
      const idxNfPreco = XLSX.utils.decode_col(mapColunas.nfPreco || 'T');
      const idxNfQtd = XLSX.utils.decode_col(mapColunas.nfQtd || 'U');
      const idxNfDesc = XLSX.utils.decode_col(mapColunas.nfDesc || 'L');
      const idxNfFornecedor = XLSX.utils.decode_col(mapColunas.nfFornecedor || 'E');
      const idxNfCentro = XLSX.utils.decode_col(mapColunas.nfCentro || 'C');
      const idxNfIcms = mapColunas.nfIcms ? XLSX.utils.decode_col(mapColunas.nfIcms) : -1;
      const idxNfIpi = mapColunas.nfIpi ? XLSX.utils.decode_col(mapColunas.nfIpi) : -1;
      const idxNfPis = mapColunas.nfPis ? XLSX.utils.decode_col(mapColunas.nfPis) : -1;
      const idxNfCofins = mapColunas.nfCofins ? XLSX.utils.decode_col(mapColunas.nfCofins) : -1;
      const idxNfEmpresa = mapColunas.nfEmpresa ? XLSX.utils.decode_col(mapColunas.nfEmpresa) : -1;
      const idxNfNumeroNF = mapColunas.nfNumeroNF ? XLSX.utils.decode_col(mapColunas.nfNumeroNF) : -1;
      const idxNfTipoMaterial = mapColunas.nfTipoMaterial ? XLSX.utils.decode_col(mapColunas.nfTipoMaterial) : -1;
      const idxNfCategoriaNF = mapColunas.nfCategoriaNF ? XLSX.utils.decode_col(mapColunas.nfCategoriaNF) : -1;
      const idxNfOrigemMaterial = mapColunas.nfOrigemMaterial ? XLSX.utils.decode_col(mapColunas.nfOrigemMaterial) : -1;
      const idxNfDataLancamento = mapColunas.nfDataLancamento ? XLSX.utils.decode_col(mapColunas.nfDataLancamento) : -1;

      // Novas colunas solicitadas (V a AA)
      const idxNfPrecoSemFrete = mapColunas.precoSemFrete ? XLSX.utils.decode_col(mapColunas.precoSemFrete) : -1;
      const idxNfPrecoComFrete = mapColunas.precoComFrete ? XLSX.utils.decode_col(mapColunas.precoComFrete) : -1;
      const idxNfValorLiqSemFrete = mapColunas.valorLiqSemFrete ? XLSX.utils.decode_col(mapColunas.valorLiqSemFrete) : -1;
      const idxNfValorLiqComFrete = mapColunas.valorLiqComFrete ? XLSX.utils.decode_col(mapColunas.valorLiqComFrete) : -1;
      const idxNfValorTotalSemFrete = mapColunas.valorTotalSemFrete ? XLSX.utils.decode_col(mapColunas.valorTotalSemFrete) : -1;
      const idxNfValorTotalComFrete = mapColunas.valorTotalComFrete ? XLSX.utils.decode_col(mapColunas.valorTotalComFrete) : -1;

      const indices = { 
        idxNfCfop, idxNfMat, idxNfPreco, idxNfQtd, idxNfDesc, idxNfFornecedor, idxNfCentro,
        idxNfIcms, idxNfIpi, idxNfPis, idxNfCofins,
        idxNfEmpresa, idxNfNumeroNF, idxNfTipoMaterial, idxNfCategoriaNF, idxNfOrigemMaterial,
        idxNfDataLancamento,
        idxNfPrecoSemFrete, idxNfPrecoComFrete, idxNfValorLiqSemFrete, idxNfValorLiqComFrete,
        idxNfValorTotalSemFrete, idxNfValorTotalComFrete
      };
      nfIndices.push(indices);
      nfStartRows.push(startRowNf);
      
      totalLinhasGlobal += Math.max(0, dataNF.length - startRowNf);

      // Pass 1 logic: update dictNfMedia and collect unique values
      for (let i = startRowNf; i < dataNF.length; i++) {
        const linha = dataNF[i];
        if (!linha) continue;
        
        const cfopVal = linha[idxNfCfop];
        // Normalizar CFOP: remove pontos e espaços para garantir match (ex: 1.101AA -> 1101AA)
        const cfopRaw = String(cfopVal || '').trim().toUpperCase();
        const cfop = cfopRaw.replace(/\./g, '');
        
        if (cfop !== '') {
          cfopsSetUnique.add(cfopRaw); // Coleta o original para mostrar ao usuário
          
          if (cfopsSet.has(cfop)) {
            const codMatNF = padronizarMaterial(linha[idxNfMat]);
            const precoEfetivo = parseNumber(linha[idxNfPreco]);
            const qtd = parseNumber(linha[idxNfQtd]);
            
            // Coleta valores únicos apenas para itens que passaram no filtro inicial
            const fornecedor = String(linha[idxNfFornecedor] || '').trim();
            if (fornecedor) suppliersSetUnique.add(fornecedor);
            const empresa = idxNfEmpresa >= 0 ? String(linha[idxNfEmpresa] || '').trim() : '';
            if (empresa) empresaSetUnique.add(empresa);
            const tipoMaterial = idxNfTipoMaterial >= 0 ? String(linha[idxNfTipoMaterial] || '').trim() : '';
            if (tipoMaterial) tipoMaterialSetUnique.add(tipoMaterial);
            const categoriaNF = idxNfCategoriaNF >= 0 ? String(linha[idxNfCategoriaNF] || '').trim() : '';
            if (categoriaNF) categoriaNFSetUnique.add(categoriaNF);
            const origemMaterial = idxNfOrigemMaterial >= 0 ? String(linha[idxNfOrigemMaterial] || '').trim() : '';
            if (origemMaterial) origemMaterialSetUnique.add(origemMaterial);

            if (codMatNF !== '' && precoEfetivo > 0 && qtd > 0) {
              let entry = dictNfMedia.get(codMatNF);
              if (!entry) {
                entry = { totalValue: 0, totalQty: 0 };
                dictNfMedia.set(codMatNF, entry);
              }
              entry.totalValue += (precoEfetivo * qtd);
              entry.totalQty += qtd;
            }
          }
        }
      }
    }

    const custoMedioPorMaterial = new Map<string, number>();
    dictNfMedia.forEach((val, key) => {
      custoMedioPorMaterial.set(key, val.totalValue / val.totalQty);
    });
    dictNfMedia.clear(); // Free memory

    // Pass 2: Final Audit (Process one by one again)
    let linhasProcessadasGlobal = 0;
    let totalLinhasProcessadas = 0;
    let globalItemId = 0;
    for (let f = 0; f < filesNfData.length; f++) {
      const fileName = filesNames[f];
      const fileBuffer = filesNfData[f];
      
      let wbNF;
      try {
        wbNF = XLSX.read(new Uint8Array(fileBuffer), { ...readOptions });
      } catch (err: any) {
        throw new Error(`Falha ao ler o arquivo de NF "${fileName}" no segundo passo. O arquivo pode estar corrompido ou em um formato inválido. Detalhe: ${err.message}`);
      }
      const dataNF = XLSX.utils.sheet_to_json<any[]>(wbNF.Sheets[wbNF.SheetNames[0]], { header: 1 });
      wbNF = null;

      const startRowNf = nfStartRows[f];
      const { 
        idxNfCfop, idxNfMat, idxNfPreco, idxNfQtd, idxNfDesc, idxNfFornecedor, idxNfCentro,
        idxNfIcms, idxNfIpi, idxNfPis, idxNfCofins,
        idxNfEmpresa, idxNfNumeroNF, idxNfTipoMaterial, idxNfCategoriaNF, idxNfOrigemMaterial,
        idxNfDataLancamento,
        idxNfPrecoSemFrete, idxNfPrecoComFrete, idxNfValorLiqSemFrete, idxNfValorLiqComFrete,
        idxNfValorTotalSemFrete, idxNfValorTotalComFrete
      } = nfIndices[f];
      
      self.postMessage({ type: 'status', message: `⚙️ Processando arquivo ${f + 1} de ${filesNfData.length}: ${fileName}` });

      let lastPostTime = Date.now();

      for (let i = startRowNf; i < dataNF.length; i++) {
        const linha = dataNF[i];
        linhasProcessadasGlobal++;
        totalLinhasProcessadas++;

        if (!linha) continue;

        if (colDataIdx >= 0 && (dtInicio || dtFim)) {
          const valData = linha[colDataIdx];
          const dataLinha = parseExcelDate(valData);
          
          if (dataLinha) {
            if (dtInicio && dataLinha < dtInicio) continue;
            if (dtFim && dataLinha > dtFim) continue;
          } else {
            continue;
          }
        }

        const cfopVal = linha[idxNfCfop];
        const cfop = typeof cfopVal === 'string' ? cfopVal.trim().toUpperCase() : String(cfopVal || '').trim().toUpperCase();
        
        if (cfop !== '' && cfopsSet.has(cfop)) {
          const codMatNF = padronizarMaterial(linha[idxNfMat]);
          const precoEfetivo = parseNumber(linha[idxNfPreco]);
          const qtd = parseNumber(linha[idxNfQtd]);

          const fornecedor = String(linha[idxNfFornecedor] || '').trim();
          const centro = String(linha[idxNfCentro] || '').trim();
          const descricao = String(linha[idxNfDesc] || '').trim();
          const dataLinha = colDataIdx >= 0 ? parseExcelDate(linha[colDataIdx]) : null;

          const icms = idxNfIcms >= 0 ? parseNumber(linha[idxNfIcms]) : 0;
          const ipi = idxNfIpi >= 0 ? parseNumber(linha[idxNfIpi]) : 0;
          const pis = idxNfPis >= 0 ? parseNumber(linha[idxNfPis]) : 0;
          const cofins = idxNfCofins >= 0 ? parseNumber(linha[idxNfCofins]) : 0;
          const st = (mapColunas as any).nfSt ? parseNumber(linha[colToIdx((mapColunas as any).nfSt)]) : 0;

          const totalValor = precoEfetivo * qtd;
          const totalImpostos = icms + ipi + pis + cofins + st;

          // Extração das novas colunas
          const empresa = idxNfEmpresa >= 0 ? String(linha[idxNfEmpresa] || '').trim() : '';
          const numeroNF = idxNfNumeroNF >= 0 ? String(linha[idxNfNumeroNF] || '').trim() : '';
          const tipoMaterial = idxNfTipoMaterial >= 0 ? String(linha[idxNfTipoMaterial] || '').trim() : '';
          const categoriaNF = idxNfCategoriaNF >= 0 ? String(linha[idxNfCategoriaNF] || '').trim() : '';
          const origemMaterial = idxNfOrigemMaterial >= 0 ? String(linha[idxNfOrigemMaterial] || '').trim() : '';
          const dataLancamentoRaw = idxNfDataLancamento >= 0 ? linha[idxNfDataLancamento] : null;
          const dataLancamento = dataLancamentoRaw ? parseExcelDate(dataLancamentoRaw) : null;

          const precoSemFrete = idxNfPrecoSemFrete >= 0 ? parseNumber(linha[idxNfPrecoSemFrete]) : 0;
          const precoComFrete = idxNfPrecoComFrete >= 0 ? parseNumber(linha[idxNfPrecoComFrete]) : 0;
          const valorLiqSemFrete = idxNfValorLiqSemFrete >= 0 ? parseNumber(linha[idxNfValorLiqSemFrete]) : 0;
          const valorLiqComFrete = idxNfValorLiqComFrete >= 0 ? parseNumber(linha[idxNfValorLiqComFrete]) : 0;
          const valorTotalSemFrete = idxNfValorTotalSemFrete >= 0 ? parseNumber(linha[idxNfValorTotalSemFrete]) : 0;
          const valorTotalComFrete = idxNfValorTotalComFrete >= 0 ? parseNumber(linha[idxNfValorTotalComFrete]) : 0;

          let itemBase: any = {
            id: globalItemId++,
            arquivo: fileName,
            data: dataLinha ? dataLinha.toISOString() : null,
            linhaNF: i + 1,
            material: codMatNF,
            descricao: descricao,
            centro: centro,
            cfop: cfop,
            fornecedor: fornecedor || 'N/A',
            empresa,
            numeroNF,
            tipoMaterial,
            categoriaNF,
            origemMaterial,
            dataLancamento: dataLancamento ? dataLancamento.toISOString() : null,
            quantidade: qtd,
            precoEfetivo: precoEfetivo,
            impostos: { icms, ipi, pis, cofins, st },
            icmsEfetivoPerc: totalValor > 0 ? (icms / totalValor) * 100 : 0,
            ipiEfetivoPerc: totalValor > 0 ? (ipi / totalValor) * 100 : 0,
            pisEfetivoPerc: totalValor > 0 ? (pis / totalValor) * 100 : 0,
            cofinsEfetivoPerc: totalValor > 0 ? (cofins / totalValor) * 100 : 0,
            stEfetivoPerc: totalValor > 0 ? (st / totalValor) * 100 : 0,
            totalImpostosPerc: totalValor > 0 ? (totalImpostos / totalValor) * 100 : 0,
            precoSemFrete,
            precoComFrete,
            valorLiqSemFrete,
            valorLiqComFrete,
            valorTotalSemFrete,
            valorTotalComFrete,
            impactoFinanceiro: 0,
            tipo: 'Sem Divergência',
            status: 'Pendente',
            comentarios: '',
            custoPadrao: 0,
            variacaoPerc: 0,
            _search: `${codMatNF} ${descricao} ${fornecedor || 'N/A'}`.toLowerCase()
          };

          if (codMatNF !== '' && precoEfetivo > 0 && qtd > 0) {
            const ckm3Entry = dictCKM3.get(codMatNF);
            const custoPadrao = ckm3Entry ? ckm3Entry.custo : undefined;

            if (custoPadrao && custoPadrao > 0) {
              const variacaoReal = (precoEfetivo - custoPadrao) / custoPadrao;
              const impactoItem = (precoEfetivo - custoPadrao) * qtd;
              const custoMedio = custoMedioPorMaterial.get(codMatNF) || 0;

              itemBase.custoPadrao = custoPadrao;
              itemBase.qtdEstoque = ckm3Entry.qtdEstoque;
              itemBase.variacaoPerc = variacaoReal * 100;
              itemBase.impactoFinanceiro = impactoItem;
              itemBase.tipo = Math.abs(variacaoReal) > limiteTol ? (impactoItem > 0 ? 'acima do custo padrão' : 'abaixo do custo padrão') : 'Sem Divergência';
              itemBase.linhaCKM3 = ckm3Entry.linha;
              itemBase.custoMedioNf = custoMedio;
              itemBase.variacaoMedioPadrao = custoPadrao > 0 ? ((custoMedio - custoPadrao) / custoPadrao) * 100 : 0;

              if (Math.abs(variacaoReal) > limiteTol) {
                qtdDiv++;
                if (impactoItem > 0) totalPrejuizo += impactoItem;
                else totalEconomia += Math.abs(impactoItem);
                divergencias.push({ ...itemBase });
              }
            } else {
              qtdAusentes++;
              const custoMedio = custoMedioPorMaterial.get(codMatNF) || 0;
              itemBase.tipo = 'Não Encontrado no CKM3';
              itemBase.custoMedioNf = custoMedio;
              divergencias.push({ ...itemBase });
            }
          }

          todosOsItens.push(itemBase);

          // Reverse Audit Logic: Group by Invoice
          const groupKey = `${numeroNF}_${fornecedor}_${fileName}`;
          if (!nfGroups.has(groupKey)) {
            nfGroups.set(groupKey, {
              numeroNF,
              fornecedor,
              data: dataLinha ? dataLinha.toISOString() : (dataLancamento ? dataLancamento.toISOString() : ''),
              arquivo: fileName,
              itens: [],
              foundInCkm3: false
            });
          }
          const group = nfGroups.get(groupKey)!;
          group.itens.push({
            material: codMatNF,
            descricao,
            quantidade: qtd,
            preco: precoEfetivo
          });

          if (codMatNF !== '' && precoEfetivo > 0 && qtd > 0) {
            const ckm3Entry = dictCKM3.get(codMatNF);
            if (ckm3Entry && ckm3Entry.custo > 0) {
              group.foundInCkm3 = true;
            }
          }
        }

        // Throttled progress updates (every 500 lines or 100ms)
        if (linhasProcessadasGlobal % 500 === 0) {
          const now = Date.now();
          if (now - lastPostTime > 100) {
            const percent = totalLinhasGlobal > 0 
              ? Math.round((linhasProcessadasGlobal / totalLinhasGlobal) * 100)
              : 100;
            self.postMessage({ 
              type: 'progress', 
              percent, 
              current: linhasProcessadasGlobal, 
              total: totalLinhasGlobal, 
              fileName 
            });
            lastPostTime = now;
          }
        }
      }
    }

    // Finalize Reverse Audit: Identify missing invoices
    const notasNaoLancadas: any[] = [];
    nfGroups.forEach((group, key) => {
      if (!group.foundInCkm3) {
        const valorTotal = group.itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
        notasNaoLancadas.push({
          id: key,
          numeroNF: group.numeroNF,
          fornecedor: group.fornecedor,
          data: group.data,
          valorTotal,
          itens: group.itens,
          arquivo: group.arquivo
        });
      }
    });

    // Ordena divergências pelo maior impacto financeiro (absoluto)
    divergencias.sort((a, b) => Math.abs(b.impactoFinanceiro) - Math.abs(a.impactoFinanceiro));

    self.postMessage({
      type: 'done',
      resultado: {
        qtdDiv,
        totalPrejuizo,
        totalEconomia,
        qtdAusentes,
        divergencias,
        todosOsItens,
        notasNaoLancadas,
        uniqueValues: {
          cfops: Array.from(cfopsSetUnique).sort(),
          suppliers: Array.from(suppliersSetUnique).sort(),
          tipoMaterial: Array.from(tipoMaterialSetUnique).sort(),
          categoriaNF: Array.from(categoriaNFSetUnique).sort(),
          origemMaterial: Array.from(origemMaterialSetUnique).sort(),
          empresa: Array.from(empresaSetUnique).sort()
        },
        linhasNfProcessadas: totalLinhasProcessadas,
        linhasCkm3Processadas: dataCKM3.length,
        materiaisNoCkm3: dictCKM3.size,
        dataProcessamento: new Date().toISOString()
      }
    });

  } catch (error: any) {
    self.postMessage({ type: 'error', message: error.message });
  }
};
