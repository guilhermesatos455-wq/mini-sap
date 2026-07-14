import * as XLSX from 'xlsx';

// Garantir que XLSX esteja disponível se necessário por algum plugin ou contexto
if (typeof self !== 'undefined') {
  (self as any).XLSX = XLSX;
}

const parseExcelDate = (val: any): Date | null => {
  if (val === undefined || val === null || val === '') return null;
  
  if (typeof val === 'number') {
    try {
      const parsed = (XLSX as any).SSF.parse_date_code(val);
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

const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const s = val.trim();
    if (s === '') return 0;
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

const padronizarMaterial = (mat: any): string => {
  if (mat == null) return '';
  const s = String(mat).trim();
  if (s === '') return '';
  let start = 0;
  while (start < s.length - 1 && s[start] === '0') {
    start++;
  }
  return s.substring(start);
};

const fuzzyDetect = (headers: any[], synonyms: string[], expectedCol: string): number => {
  if (expectedCol && expectedCol.length >= 1) {
    try {
      const idx = XLSX.utils.decode_col(expectedCol.toUpperCase());
      if (idx >= 0 && idx < headers.length) return idx;
    } catch (e) {}
  }
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim().toUpperCase();
    if (!h) continue;
    if (synonyms.some(syn => h.includes(syn.toUpperCase()) || syn.toUpperCase().includes(h))) {
      return i;
    }
  }
  return -1;
};

const colToIdx = (col: string) => col ? XLSX.utils.decode_col(col.toUpperCase()) : -1;

self.onmessage = (e) => {
    const {
    filesNfData,
    filesCkm3Data,
    filesCkm3Names,
    tolerancia,
    cfops,
    dataInicio,
    dataFim,
    colunaData,
    mapColunas,
    ckm3ManualMapping,
    filesNames,
    mesReferencia,
    recipes // Receitas personalizadas
  } = e.data;

  const cfopsSet = new Set(cfops);
  const limiteTol = tolerancia || 0;
  const colDataIdx = colunaData ? XLSX.utils.decode_col(colunaData.toUpperCase()) : -1;
  const dtInicio = dataInicio ? new Date(dataInicio) : null;
  const dtFim = dataFim ? new Date(dataFim) : null;

  try {
    const readOptions: XLSX.ParsingOptions = { 
      type: 'array', 
      dense: true,
      cellFormula: false,
      cellHTML: false,
      cellText: false,
      cellDates: false 
    };
    const dictCKM3 = new Map<string, { custo: number; qtdEstoque: number; centro: string; descricao: string; linha: number }>();
    let totalMateriaisCkm3 = 0;
    let totalRowsCkm3 = 0;

    for (let f = 0; f < filesCkm3Data.length; f++) {
      const fileName = filesCkm3Names[f];
      self.postMessage({ type: 'status', message: `⏳ Lendo arquivo CKM3: ${fileName}...` });

      let wbCKM3;
      try {
        wbCKM3 = XLSX.read(new Uint8Array(filesCkm3Data[f]), { ...readOptions });
      } catch (err: any) {
        throw new Error(`Falha ao ler o arquivo CKM3 "${fileName}". O arquivo pode estar corrompido ou em um formato inválido. Detalhe: ${err.message}`);
      }
      
      const dataCKM3 = XLSX.utils.sheet_to_json<any[]>(wbCKM3.Sheets[wbCKM3.SheetNames[0]], { header: 1 });
      wbCKM3 = null;
      totalRowsCkm3 += dataCKM3.length;

      const headersCKM3 = dataCKM3[0] || [];
      const startRowCkm3 = 1;

      // Scan rows 0-5 to find actual headers if not found immediately
      let actualHeaders = headersCKM3;
      let headerRowIndex = 0;
      
      const findHeaderRow = () => {
          for (let r = 0; r < Math.min(6, dataCKM3.length); r++) {
              const row = dataCKM3[r];
              if (!row) continue;
              // Check if this row contains 'Material' or similar
              if (row.some((cell: any) => String(cell).toLowerCase().includes('material'))) {
                  actualHeaders = row;
                  headerRowIndex = r;
                  return;
              }
          }
      };
      findHeaderRow();

      // Funções auxiliares mantidas aqui (redundante, mas seguro para o escopo)
      const checkHeader = (key: string, synonyms: string[], colConfig: string, requiredName: string) => {
          const allSynonyms = [...synonyms];
          if (ckm3ManualMapping && ckm3ManualMapping[key]) {
              allSynonyms.push(ckm3ManualMapping[key]);
          }
          const idx = fuzzyDetect(actualHeaders, allSynonyms, colConfig);
          if (idx === -1 && f === 0) {
            console.error('All headers detected:', actualHeaders);
            throw new Error(`Arquivo CKM3 "${fileName}" inválido: Não encontrada coluna obrigatória "${requiredName}". Headers detectados: ${JSON.stringify(actualHeaders)}`);
          }
          return idx;
      };

      const idxCkm3Centro = checkHeader('ckm3Centro', ['Centro', 'Planta', 'Plant', 'Local'], mapColunas.ckm3Centro || 'A', 'Centro');
      const idxCkm3CodMat = checkHeader('ckm3CodMat', ['Cód Material', 'Cod. Material'], mapColunas.ckm3CodMat || 'B', 'Cód Material');
      const idxCkm3Mat = checkHeader('ckm3Mat', ['Material', 'Produto'], mapColunas.ckm3Mat || 'C', 'Material');
      const idxCkm3Cat = checkHeader('ckm3Cat', ['Categoria', 'Cat.'], mapColunas.ckm3Cat || 'D', 'Categoria');
      const idxCkm3CodTipoMat = checkHeader('ckm3CodTipoMat', ['Cód Tipo Material', 'Tipo Material'], mapColunas.ckm3CodTipoMat || 'E', 'Cód Tipo Material');
      const idxCkm3QtdTrans = checkHeader('ckm3QtdTrans', ['Qtd. transação', 'Quantidade'], mapColunas.ckm3QtdTrans || 'F', 'Qtd. transação');
      const idxCkm3VlrReal = checkHeader('ckm3VlrReal', ['Valor real', 'Vlr'], mapColunas.ckm3VlrReal || 'G', 'Valor real');
      const idxCkm3PrecoMedio = checkHeader('ckm3PrecoMedio', ['Média de Preço médio móvel', 'Preço Médio'], mapColunas.ckm3PrecoMedio || 'H', 'Média de Preço médio móvel');
      const idxCkm3MatPrima = checkHeader('ckm3MatPrima', ['Matéria Prima'], mapColunas.ckm3MatPrima || 'I', 'Matéria Prima');
      const idxCkm3Embalagem = checkHeader('ckm3Embalagem', ['Embalagem'], mapColunas.ckm3Embalagem || 'J', 'Embalagem');
      const idxCkm3Terceiros = checkHeader('ckm3Terceiros', ['Terceiros'], mapColunas.ckm3Terceiros || 'K', 'Terceiros');
      const idxCkm3Reparo = checkHeader('ckm3Reparo', ['Reparo/reprocesso'], mapColunas.ckm3Reparo || 'L', 'Reparo/reprocesso');
      const idxCkm3MOD = checkHeader('ckm3MOD', ['Mão de obra direta', 'MOD'], mapColunas.ckm3MOD || 'M', 'Mão de obra direta');
      const idxCkm3Maquina = checkHeader('ckm3Maquina', ['Máquina/depreciação'], mapColunas.ckm3Maquina || 'N', 'Máquina/depreciação');
      const idxCkm3MOI = checkHeader('ckm3MOI', ['Mão de obra indireta', 'MOI'], mapColunas.ckm3MOI || 'O', 'Mão de obra indireta');
      const idxCkm3GGF = checkHeader('ckm3GGF', ['Gastos gerais fábrica', 'GGF'], mapColunas.ckm3GGF || 'P', 'Gastos gerais fábrica');
      const idxCkm3Processo = XLSX.utils.decode_col(mapColunas.ckm3Processo || 'H');
      const idxCkm3Custo = XLSX.utils.decode_col('L');
      const idxCkm3Desc = checkHeader('ckm3Desc', ['Descrição', 'Nome', 'Texto', 'Description', 'Material Desc'], mapColunas.ckm3Desc || 'C', 'Descrição');
      const idxCkm3Qtd = checkHeader('ckm3Qtd', ['Quantidade', 'Estoque', 'Qtd', 'Saldo'], mapColunas.ckm3Qtd || 'I', 'Quantidade');
      
      const categoriaFiltroRaw = mapColunas.ckm3CategoriaFiltro || [];
      const categoriaFiltro = Array.isArray(categoriaFiltroRaw) ? categoriaFiltroRaw.map((s: string) => s.trim().toUpperCase()).filter(Boolean) : [];
      const processoFiltroRaw = mapColunas.ckm3ProcessoFiltro || [];
      const processoFiltro = Array.isArray(processoFiltroRaw) ? processoFiltroRaw.map((s: string) => s.trim().toUpperCase()).filter(Boolean) : [];

      for (let r = headerRowIndex + 1; r < dataCKM3.length; r++) {
        const linha = dataCKM3[r];
        if (!linha || linha.length <= idxCkm3Mat) continue;
        
        const codMat = linha[idxCkm3Mat];
        const categoria = idxCkm3Cat >= 0 ? String(linha[idxCkm3Cat] || '').trim().toUpperCase() : '';
        const processo = String(linha[idxCkm3Processo] || '').trim().toUpperCase();

        if (categoriaFiltro.length > 0 && !categoriaFiltro.some(f => categoria.includes(f))) continue;
        if (processoFiltro.length > 0 && !processoFiltro.some(f => processo.includes(f))) continue;
        
        const custo = parseNumber(linha[idxCkm3Custo]);
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
      }
      totalMateriaisCkm3 += (dataCKM3.length - startRowCkm3);
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
      const headersNF = dataNF[startRowNf - 1] || [];
      const rangeNF = { s: {c: 0, r: startRowNf}, e: {c: 30, r: dataNF.length - 1} }; // Approximation since wbNF is null
      
      const idxNfCfop = fuzzyDetect(headersNF, ['CFOP', 'C.F.O.P'], mapColunas.nfCfop || 'H');
      const idxNfMat = fuzzyDetect(headersNF, ['Material', 'Cod. Material'], mapColunas.nfMat || 'K');
      const idxNfPreco = fuzzyDetect(headersNF, ['Preço', 'Efetivo', 'Valor Unit'], mapColunas.nfPreco || 'T');
      const idxNfQtd = fuzzyDetect(headersNF, ['Quantidade', 'Qtd'], mapColunas.nfQtd || 'U');
      const idxNfDesc = fuzzyDetect(headersNF, ['Descrição', 'Texto'], mapColunas.nfDesc || 'L');
      const idxNfFornecedor = fuzzyDetect(headersNF, ['Fornecedor', 'Vendor', 'Emitente'], mapColunas.nfFornecedor || 'E');
      const idxNfCentro = fuzzyDetect(headersNF, ['Centro', 'Plant'], mapColunas.nfCentro || 'C');
      
      const idxNfIcms = fuzzyDetect(headersNF, ['ICMS'], mapColunas.nfIcms);
      const idxNfIpi = fuzzyDetect(headersNF, ['IPI'], mapColunas.nfIpi);
      const idxNfPis = fuzzyDetect(headersNF, ['PIS'], mapColunas.nfPis);
      const idxNfCofins = fuzzyDetect(headersNF, ['COFINS'], mapColunas.nfCofins);
      
      const idxNfEmpresa = fuzzyDetect(headersNF, ['Empresa', 'Company'], mapColunas.nfEmpresa);
      const idxNfNumeroNF = fuzzyDetect(headersNF, ['NF', 'Nota', 'Número'], mapColunas.nfNumeroNF);
      const idxNfTipoMaterial = fuzzyDetect(headersNF, ['Tipo Material'], mapColunas.nfTipoMaterial);
      const idxNfCategoriaNF = fuzzyDetect(headersNF, ['Categoria NF'], mapColunas.nfCategoriaNF);
      const idxNfOrigemMaterial = fuzzyDetect(headersNF, ['Origem'], mapColunas.nfOrigemMaterial);
      const idxNfDataLancamento = fuzzyDetect(headersNF, ['Data Lanc', 'Lançamento'], mapColunas.nfDataLancamento);

      const idxNfPrecoSemFrete = fuzzyDetect(headersNF, ['Sem Frete'], mapColunas.precoSemFrete);
      const idxNfPrecoComFrete = fuzzyDetect(headersNF, ['Com Frete'], mapColunas.precoComFrete);
      const idxNfValorLiqSemFrete = fuzzyDetect(headersNF, ['Liq. Sem Frete'], mapColunas.valorLiqSemFrete);
      const idxNfValorLiqComFrete = fuzzyDetect(headersNF, ['Liq. Com Frete'], mapColunas.valorLiqComFrete);
      const idxNfValorTotalSemFrete = fuzzyDetect(headersNF, ['Total Sem Frete'], mapColunas.valorTotalSemFrete);
      const idxNfValorTotalComFrete = fuzzyDetect(headersNF, ['Total Com Frete'], mapColunas.valorTotalComFrete);

      const indices = { 
        idxNfCfop, idxNfMat, idxNfPreco, idxNfQtd, idxNfDesc, idxNfFornecedor, idxNfCentro,
        idxNfIcms, idxNfIpi, idxNfPis, idxNfCofins,
        idxNfEmpresa, idxNfNumeroNF, idxNfTipoMaterial, idxNfCategoriaNF, idxNfOrigemMaterial,
        idxNfDataLancamento,
        idxNfPrecoSemFrete, idxNfPrecoComFrete, idxNfValorLiqSemFrete, idxNfValorLiqComFrete,
        idxNfValorTotalSemFrete, idxNfValorTotalComFrete
      };
      
      // --- Validação robusta de Cabeçalhos NF ---
      const requiredNf = [{syns: ['CFOP', 'C.F.O.P'], name: 'CFOP', idx: idxNfCfop}];
      for (const req of requiredNf) {
          if (req.idx === -1) throw new Error(`Arquivo de NF "${fileName}" inválido: Não encontrada coluna obrigatória "${req.name}".`);
      }

      nfIndices.push(indices);
      nfStartRows.push(startRowNf);
      
      totalLinhasGlobal += Math.max(0, dataNF.length - startRowNf);
      
      // Pass 1 logic: Pre-scan row-by-row
      for (let r = startRowNf; r < dataNF.length; r++) {
        const linha = dataNF[r];
        const cfopVal = linha[idxNfCfop];
        const cfopRaw = String(cfopVal || '').trim().toUpperCase();
        const cfop = cfopRaw.replace(/\./g, '');
        
        if (cfop !== '') {
          cfopsSetUnique.add(cfopRaw);
          
          if (cfopsSet.has(cfop)) {
            const rawMat = linha[idxNfMat];
            const codMatNF = padronizarMaterial(rawMat);
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
            appliedRecipes: [],
            suggestedCause: null,
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

    const catalogMateriais = Array.from(dictCKM3.entries()).map(([material, data]) => ({
      material,
      descricao: data.descricao,
      custoPadrao: data.custo,
      qtdEstoque: data.qtdEstoque
    }));

    self.postMessage({
      type: 'done',
      resultado: {
        qtdDiv,
        totalPrejuizo,
        totalEconomia,
        qtdAusentes,
        divergencias,
        todosOsItens,
        catalogMateriais,
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
        linhasCkm3Processadas: totalRowsCkm3,
        materiaisNoCkm3: dictCKM3.size,
        dataProcessamento: new Date().toISOString(),
        mesReferencia: mesReferencia ? `${mesReferencia.mes}/20${mesReferencia.ano}` : 'Desconhecido'
      }
    });

  } catch (error: any) {
    self.postMessage({ type: 'error', message: error.message });
  }
};
