import * as XLSX from 'xlsx';

// Garantir que XLSX esteja disponível
if (typeof self !== 'undefined') {
  (self as any).XLSX = XLSX;
}

const parseExcelDate = (val: any): Date | null => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') {
    try {
      const parsed = XLSX.SSF.parse_date_code(val);
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    } catch (e) { return null; }
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    // Tentar formato brasileiro DD/MM/YYYY
    const parts = val.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  return null;
};

const parseNumber = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    let s = val.trim().replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(s);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const fuzzyDetect = (headers: any[], synonyms: string[]): number => {
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim().toUpperCase();
    if (!h) continue;
    if (synonyms.some(syn => h.includes(syn.toUpperCase()) || syn.toUpperCase().includes(h))) {
      return i;
    }
  }
  return -1;
};

self.onmessage = async (e) => {
  const { filesData, filesNames, fileTypes, plant, mapping, stockMapping } = e.data;

  try {
    const allMovements: any[] = [];
    const allInitial: any[] = [];
    const allFinal: any[] = [];
    
    const readOptions: XLSX.ParsingOptions = { type: 'array', dense: true };

    for (let f = 0; f < filesData.length; f++) {
      const fileName = filesNames[f];
      const fileType = fileTypes ? fileTypes[f] : 'movements';
      
      self.postMessage({ type: 'status', message: `⏳ Lendo arquivo: ${fileName}...` });
      
      const wb = XLSX.read(new Uint8Array(filesData[f]), readOptions);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

      if (fileType === 'movements') {
        let headerIdx = -1;
        let idxDoc, idxDate, idxType, idxMat, idxDesc, idxQtd, idxPlant, idxLoc, idxUser;

        if (mapping) {
          // Layout customizado ou padrão "Guilherme Souza"
          headerIdx = 0; 
          // Verificar se a primeira linha parece ser cabeçalho
          if (data[0] && data[0].some(cell => typeof cell === 'string' && (cell.toUpperCase().includes('MATERIAL') || cell.toUpperCase().includes('MOVIMENTO')))) {
            headerIdx = 1;
          }
          idxType = mapping.movementType;
          idxMat = mapping.material;
          idxDesc = mapping.description;
          idxQtd = mapping.quantity;
          idxLoc = mapping.storageLocation;
          idxDate = mapping.date;
          idxDoc = mapping.docNumber ?? -1;
          idxPlant = mapping.plant ?? -1;
          idxUser = mapping.user ?? -1;
          
          // Se não houver idxDoc ou idxMat explicitamente no mapeamento como essencial, tentamos fuzzy para os faltantes
          const headers = data[headerIdx - 1] || [];
          if (idxDoc === -1) idxDoc = fuzzyDetect(headers, ['Documento', 'Doc. Mat', 'Doc.Material', 'Número doc.']);
          if (idxPlant === -1) idxPlant = fuzzyDetect(headers, ['Centro', 'Plnt', 'Plant']);
          if (idxUser === -1) idxUser = fuzzyDetect(headers, ['Usuário', 'User', 'User Name']);
        } else {
          // Lógica MB51 original (Fuzzy)
          for (let i = 0; i < Math.min(data.length, 20); i++) {
            const row = data[i];
            if (row && row.some(cell => String(cell).toUpperCase().includes('MATERIAL') || String(cell).toUpperCase().includes('DOCUMENTO'))) {
              headerIdx = i;
              break;
            }
          }

          if (headerIdx === -1) continue;

          const headers = data[headerIdx];
          idxDoc = fuzzyDetect(headers, ['Documento', 'Doc. Mat', 'Doc.Material', 'Número doc.']);
          idxDate = fuzzyDetect(headers, ['Data', 'Data Lançamento', 'Dt. Lançamento', 'Pstng Date']);
          idxType = fuzzyDetect(headers, ['Tipo Movimento', 'Tp. Mov', 'MvT', 'Movement Type']);
          idxMat = fuzzyDetect(headers, ['Material', 'Cod. Material', 'Produto']);
          idxDesc = fuzzyDetect(headers, ['Descrição', 'Texto Breve', 'Material Description']);
          idxQtd = fuzzyDetect(headers, ['Quantidade', 'Qtd', 'Quantity']);
          idxPlant = fuzzyDetect(headers, ['Centro', 'Plnt', 'Plant']);
          idxLoc = fuzzyDetect(headers, ['Depósito', 'SLoc', 'Storage Location']);
          idxUser = fuzzyDetect(headers, ['Usuário', 'User', 'User Name']);
          headerIdx = headerIdx + 1; // Dados começam após cabeçalho
        }

        for (let i = headerIdx; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          const material = idxMat >= 0 ? String(row[idxMat] || '').trim().replace(/^0+/, '') : '';
          if (!material) continue;

          // 1. Materiais que começam com 10 ou 49 não geram estoque
          if (material.startsWith('10') || material.startsWith('49')) continue;

          const movementType = idxType >= 0 ? String(row[idxType] || '').trim() : '';
          
          // 2. Para o 101, retira os depósitos em branco na coluna "L" (idxLoc ou column 11)
          // Usamos idxLoc se detectado, caso contrário tentamos a coluna 11 (L)
          const locVal = idxLoc >= 0 ? String(row[idxLoc] || '').trim() : String(row[11] || '').trim();
          if (movementType === '101' && !locVal) continue;

          // Filtrar por Centro se especificado
          const currentPlant = idxPlant >= 0 ? String(row[idxPlant] || '').trim() : '';
          if (plant && currentPlant && !currentPlant.startsWith(plant)) continue;

          const docNumber = idxDoc >= 0 ? String(row[idxDoc] || '').trim() : '';
          const date = idxDate >= 0 ? parseExcelDate(row[idxDate]) : null;
          
          allMovements.push({
            id: `${docNumber || 'NODOC'}_${i}_${f}`,
            docNumber: docNumber || 'N/A',
            date: date ? date.toISOString() : new Date().toISOString(),
            movementType,
            material,
            description: idxDesc >= 0 ? String(row[idxDesc] || '').trim() : '',
            quantity: idxQtd >= 0 ? parseNumber(row[idxQtd]) : 0,
            plant: currentPlant,
            storageLocation: locVal,
            user: idxUser >= 0 ? String(row[idxUser] || '').trim() : ''
          });
        }
      } else {
        // Lógica de Posição de Estoque (LAYOUT A-O)
        // A8: Cód Material (0)
        // B: Descrição (1)
        // E: Centro (4)
        // L: Estoque Final (11)
        
        // Detectar início dos dados e identificar colunas
        let dataStartIdx = 0;
        let idxMat = stockMapping?.material ?? 0;
        let idxDesc = stockMapping?.description ?? 1;
        let idxPlant = stockMapping?.plant ?? 4;
        let idxQtd = stockMapping?.quantity ?? 11;

        if (!stockMapping) {
          for (let i = 0; i < Math.min(data.length, 25); i++) {
            const row = data[i];
            if (row && row.some(cell => typeof cell === 'string' && cell.toUpperCase().includes('MATERIAL'))) {
              dataStartIdx = i + 1;
              const headers = row;
              const fMat = fuzzyDetect(headers, ['Material', 'Cód.']);
              const fDesc = fuzzyDetect(headers, ['Descrição', 'Texto Breve']);
              const fPlant = fuzzyDetect(headers, ['Centro', 'Plant', 'Plnt']);
              const fQtd = fuzzyDetect(headers, ['Estoque', 'Quantidade', 'Livre', 'Final']);
              if (fMat >= 0) idxMat = fMat;
              if (fDesc >= 0) idxDesc = fDesc;
              if (fPlant >= 0) idxPlant = fPlant;
              if (fQtd >= 0) idxQtd = fQtd;
              break;
            }
          }
        } else {
           // Se mapeamento está definido, usamos startRow configurado (ou 1 se não definido)
           dataStartIdx = stockMapping.startRow ?? 1;
        }

        for (let i = dataStartIdx; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[idxMat]) continue;

          const currentPlant = String(row[idxPlant] || '').trim();
          if (plant && currentPlant && !currentPlant.startsWith(plant)) continue;

          const item = {
            material: String(row[idxMat] || '').trim().replace(/^0+/, ''),
            description: String(row[idxDesc] || '').trim(),
            plant: currentPlant,
            quantity: parseNumber(row[idxQtd])
          };

          if (fileType === 'initial') allInitial.push(item);
          else allFinal.push(item);
        }
      }

      self.postMessage({ 
        type: 'progress', 
        percent: Math.round(((f + 1) / filesData.length) * 100),
        message: `Arquivo ${f + 1}/${filesData.length} processado.`
      });
    }

    self.postMessage({ 
      type: 'done', 
      movements: allMovements,
      initial: allInitial,
      final: allFinal
    });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
