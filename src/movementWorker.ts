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

const classifyMovement = (type: string, quantity: number, material: string): string => {
  if (material.startsWith('70')) return 'Bonificação';
  
  if (['101', '102'].includes(type)) return 'Produção/Compras';
  if (['601', '602'].includes(type)) return 'Venda';
  if (['653', '654', '657', '658'].includes(type)) return 'Devolução Entrada';
  if (['122', '123', '502'].includes(type)) return 'Devolução Compras';
  if (['973', '974', '967', '968'].includes(type)) return 'Bonificação';
  if (['541', '542', '543', '544', '975', '976', '862', '864', '861'].includes(type)) return 'Outras Saídas';
  if (['971', '972'].includes(type)) return 'Perdas';
  if (['309', '702', '711'].includes(type)) return 'Ajuste de Saída';
  if (['701', '712'].includes(type)) return 'Ajuste de Entrada';
  if (['201', '202', '261', '262', '333', '334', 'Z61'].includes(type)) return 'Requisição';
  if (['325', '321'].includes(type)) {
     return quantity < 0 ? 'Ajuste de Saída' : 'Ajuste de Entrada';
  }
  return 'Outros'; 
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
  const { filesData, filesNames, fileTypes, plant, mapping } = e.data;

  try {
    const allMovements: any[] = [];
    const allInitial: any[] = [];
    const allFinal: any[] = [];
    const initialHeaders: any[] = [];
    const finalHeaders: any[] = [];
    
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
        let idxDoc, idxDate, idxType, idxMat, idxDesc, idxQtd, idxUnit, idxPlant, idxLoc, idxUser;

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
          idxUnit = mapping.unit ?? -1; // Mapeamento customizado para Unidade
          idxDoc = mapping.docNumber ?? -1;
          idxPlant = mapping.plant ?? -1;
          idxUser = mapping.user ?? -1;
          
          // Se não houver idxDoc ou idxMat explicitamente no mapeamento como essencial, tentamos fuzzy para os faltantes
          const headers = data[headerIdx - 1] || [];
          if (idxDoc === -1) idxDoc = fuzzyDetect(headers, ['Documento', 'Doc. Mat', 'Doc.Material', 'Número doc.']);
          if (idxUnit === -1) idxUnit = fuzzyDetect(headers, ['Unidade', 'UM', 'Unit']);
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
          idxUnit = fuzzyDetect(headers, ['Unidade', 'UM', 'Unit']);
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
          if (plant && currentPlant && currentPlant !== plant) continue;

          const docNumber = idxDoc >= 0 ? String(row[idxDoc] || '').trim() : '';
          const date = idxDate >= 0 ? parseExcelDate(row[idxDate]) : null;
          const quantity = idxQtd >= 0 ? parseNumber(row[idxQtd]) : 0;
          
          allMovements.push({
            id: `${docNumber || 'NODOC'}_${i}_${f}`,
            docNumber: docNumber || 'N/A',
            date: date ? date.toISOString() : new Date().toISOString(),
            movementType,
            material,
            category: classifyMovement(movementType, quantity, material),
            description: idxDesc >= 0 ? String(row[idxDesc] || '').trim() : '',
            quantity,
            unit: idxUnit >= 0 ? String(row[idxUnit] || '').trim() : '',
            plant: currentPlant,
            storageLocation: locVal,
            user: idxUser >= 0 ? String(row[idxUser] || '').trim() : ''
          });
        }
      } else {
        // Lógica de Posição de Estoque (LAYOUT A-O)
        let dataStartIdx = 0;
        let idxMat = 3;       // D
        let idxMaterial = 1;  // B
        let idxTpMat = 2;     // C
        let idxTpMaterial = 3;// D
        let idxPlantCode = 4; // E
        let idxPlant = 5;     // F
        let idxLote = 6;      // G
        let idxValidade = 7;  // H
        let idxDeposito = 8;  // I
        let idxDescDeposito = 9;// J
        let idxUnit = 10;     // K
        let idxQtd = 11;      // L
        let idxValorReal = 12;// M
        let idxPrecoUnit = 13;// N
        let idxConta = 14;    // O

        // A linha de cabeçalho é a 7 (índice 6)
        dataStartIdx = 7; 
        // Em seguida, processamos os dados a partir da linha 8 (índice 7)


        for (let i = dataStartIdx; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[idxMat]) continue;

          // Centro é agora a coluna F (índice 5)
          const currentPlant = String(row[idxPlant] || '').trim();
          if (plant && currentPlant && currentPlant !== plant) continue;

          const item = {
            material: String(row[idxMat] || '').trim().replace(/^0+/, ''),
            materialDescription: String(row[idxMaterial] || '').trim(), // B
            codTpMaterial: String(row[idxTpMat] || '').trim(), // C
            tipoMaterial: String(row[idxTpMaterial] || '').trim(), // D
            codCentro: String(row[idxPlantCode] || '').trim(), // E
            plant: String(row[idxPlant] || '').trim(), // F
            lote: String(row[idxLote] || '').trim(), // G
            dataVencimento: String(row[idxValidade] || '').trim(), // H
            deposito: String(row[idxDeposito] || '').trim(), // I
            descDeposito: String(row[idxDescDeposito] || '').trim(), // J
            unit: String(row[idxUnit] || '').trim(), // K
            quantity: parseNumber(row[idxQtd]), // L
            valorRealCalculado: parseNumber(row[idxValorReal]), // M
            precoUnitarioCalculado: parseNumber(row[idxPrecoUnit]), // N
            contaContabil: String(row[idxConta] || '').trim(), // O
            rawData: row
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
      final: allFinal,
      initialHeaders,
      finalHeaders
    });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
