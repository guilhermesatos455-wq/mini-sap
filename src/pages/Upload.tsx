import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  AlertCircle, 
  Play, 
  Calendar,
  Percent,
  Hash,
  Settings,
  Trash2
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { ordenarArquivosPorData } from '../utils/dateUtils';
import { MANDATORY_CKM3_COLUMNS } from '../constants/auditConstants';
import FileUploadZone from '../components/Upload/FileUploadZone';
import ColumnMapping from '../components/Upload/ColumnMapping';
import Logo from '../components/Logo';
import { OCRUpload } from '../components/Upload/OCRUpload';
import { PainelConciliacao } from '../components/Upload/PainelConciliacao';

import { validateHeaders } from '../utils/auditUtils';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    darkMode,
    filesNF, setFilesNF,
    filesCKM3, setFilesCKM3,
    status,
    warnings,
    progressPercent,
    isProcessing,
    tolerancia, setTolerancia,
    cfops, setCfops,
    dataInicio, setDataInicio,
    dataFim, setDataFim,
    mapColunas, setMapColunas,
    ckm3ManualMapping, setCkm3ManualMapping,
    iniciarProcessamento,
    filterHideZeroes, setFilterHideZeroes,
    addToast
  } = useAudit();

  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [ocrResultados, setOcrResultados] = useState<any[]>([]);
  const [isDraggingNF, setIsDraggingNF] = useState(false);
  const [isDraggingCKM3, setIsDraggingCKM3] = useState(false);
  const [parsedCKM3Header, setParsedCKM3Header] = useState<any[] | null>(null);
  const [parsedNFHeader, setParsedNFHeader] = useState<any[] | null>(null);
  const [lastDetectedCKM3Headers, setLastDetectedCKM3Headers] = useState<string[] | null>(null);

  const handleFileNF = React.useCallback((files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      const existingNames = new Set(filesNF.map(f => f.name));
      const filteredNewFiles = newFiles.filter(f => !existingNames.has(f.name));
        
      if (filteredNewFiles.length > 0) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            
            function processarUploadNFBlindado(fileData: Uint8Array) {
              try {
                  if (!fileData) throw new Error("Nenhum dado recebido para leitura.");
                  const workbook = XLSX.read(fileData, { type: 'array' });
                  
                  // A NF está isenta da regra "RELABR", então sempre pegamos a primeira aba
                  const nomePrimeiraAba = workbook.SheetNames[0]; 
                  const planilha = workbook.Sheets[nomePrimeiraAba];
                  
                  // 1. Lê como matriz para escanear onde a tabela realmente começa
                  const matrizDados = XLSX.utils.sheet_to_json<any[]>(planilha, { header: 1, blankrows: false });
                  
                  // 2. Procura a linha que contém o "CFOP" ou "MATERIAL"
                  const indiceCabecalho = matrizDados.findIndex((linha: any[]) => 
                      linha.some(celula => 
                          typeof celula === 'string' && 
                          (celula.toUpperCase().includes('CFOP') || celula.toUpperCase().includes('MATERIAL'))
                      )
                  );
            
                  if (indiceCabecalho === -1) {
                      throw new Error(`Não foi possível localizar o cabeçalho da tabela (falta a coluna CFOP ou Material) na aba '${nomePrimeiraAba}'.`);
                  }
            
                  // 3. Lê os dados brutos ignorando o "lixo" das linhas acima do cabeçalho
                  const dadosJsonBrutos = XLSX.utils.sheet_to_json<any[]>(planilha, { 
                      range: indiceCabecalho, 
                      blankrows: false,
                      defval: null
                  });
            
                  // 4. Limpeza e normalização de colunas
                  const dadosJson = dadosJsonBrutos.map((linha: any) => {
                      const novaLinha: any = {};
                      
                      for (const [chave, valor] of Object.entries(linha)) {
                          const chaveLimpa = chave.trim().toUpperCase();
                          
                          if (chaveLimpa.includes("CFOP")) {
                              novaLinha["CFOP"] = valor;
                          } else if (chaveLimpa.includes("MATERIAL") || chaveLimpa === "CÓD MATERIAL") {
                              novaLinha["Material"] = valor;
                          } else if (chaveLimpa.includes("PREÇO") || chaveLimpa.includes("VALOR")) {
                              novaLinha["Preço"] = valor;
                          } else if (chaveLimpa.includes("QTD") || chaveLimpa.includes("QUANTIDADE")) {
                              novaLinha["Quantidade"] = valor;
                          } else {
                              novaLinha[chave.trim()] = valor;
                          }
                      }
                      return novaLinha;
                  });
            
                  if (dadosJson.length === 0) {
                      throw new Error("O arquivo de Notas Fiscais parece estar vazio.");
                  }
            
                  return dadosJson;
              } catch (erro: any) {
                  console.error("Falha no processamento da NF:", erro.message);
                  addToast(erro.message, "error");
                  return null;
              }
            }

            const jsonData = processarUploadNFBlindado(data);

            // Só adiciona a NF na tela se não houve nenhum erro estrutural
            if (jsonData && jsonData.length > 0) {
              // O Raio-X: Mostra exatamente quais colunas ele conseguiu mapear
              const colunasMapeadas = Object.keys(jsonData[0] as object);
              console.log("🕵️ Colunas Mapeadas na NF:", colunasMapeadas);
              
              setParsedNFHeader(colunasMapeadas);
              
              // Atualiza o estado visual das NFs cadastradas
              setFilesNF(prev => [...prev, ...filteredNewFiles]);
            }
          };
          reader.readAsArrayBuffer(filteredNewFiles[0]);
      }
    }
  // Dica: Adicione o addToast no array de dependências para evitar warnings do React ESLint
  }, [setFilesNF, filesNF, addToast]);

  const handleRemoveFileNF = React.useCallback((fileName: string) => {
    setFilesNF(filesNF.filter(f => f.name !== fileName));
  }, [setFilesNF, filesNF]);

  const handleFileCKM3 = React.useCallback((files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      const existingNames = new Set(filesCKM3.map(f => f.name));
      const filteredNewFiles = newFiles.filter(f => !existingNames.has(f.name));
      
      if (filteredNewFiles.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          
          function processarUploadBlindado(fileData: Uint8Array) {
          try {
              if (!fileData) throw new Error("Nenhum dado recebido para leitura.");
              const workbook = XLSX.read(fileData, { type: 'array' });
              const todasAsAbas = workbook.SheetNames;
      
              // Regra do RELABR (com o seu fallback para a primeira aba)
              const regexAbasValidas = /RELABR(?:2[1-9]|[34]\d|50|JAN|FEV|FEB|MAR|ABR|APR|MAI|MAY|JUN|JUL|AGO|AUG|SET|SEP|OUT|OCT|NOV|DEZ|DEC)/i;
              const abasEncontradas = todasAsAbas.filter(nome => regexAbasValidas.test(nome));
      
              let abaAlvo;
              if (abasEncontradas.length > 0) {
                  abaAlvo = abasEncontradas[0];
              } else {
                  console.warn("AppWarning Nenhuma aba correspondente a 'RELABR' foi encontrada. Utilizando a primeira aba como fallback.");
                  abaAlvo = todasAsAbas[0]; // Fallback
              }
      
              const planilha = workbook.Sheets[abaAlvo];
      
              // 1. Lê a planilha como Matriz (Array de Arrays) ignorando vazios para escanear a estrutura
              const matrizDados = XLSX.utils.sheet_to_json<any[]>(planilha, { header: 1, blankrows: false });

              // COLOQUE ESTA LINHA AQUI PARA INVESTIGARMOS:
              console.log("🕵️ Visão Raio-X do Excel (Primeiras 15 linhas):", matrizDados.slice(0, 15));
      
              // 2. Procura a linha que contém os verdadeiros cabeçalhos da tabela do SAP
              // Ele vai testar linha por linha até achar uma que tenha a palavra "MATERIAL" ou "CENTRO"
              const indiceCabecalho = matrizDados.findIndex((linha: any[]) => 
                  linha.some(celula => 
                      typeof celula === 'string' && 
                      (celula.toUpperCase().includes('MATERIAL') || celula.toUpperCase().includes('CENTRO'))
                  )
              );
      
              // Se não achou nenhuma linha com essas palavras, a planilha está incorreta
              if (indiceCabecalho === -1) {
                  throw new Error(`Colunas obrigatórias faltando: Não foi possível localizar a tabela de dados na aba '${abaAlvo}'. Verifique o arquivo.`);
              }
      
              // 3. O PULO DO GATO: Lê a planilha novamente, mas o "range" faz ele ignorar todas as linhas acima do cabeçalho encontrado!
              const dadosJsonBrutos = XLSX.utils.sheet_to_json<any[]>(planilha, { 
                  range: indiceCabecalho, 
                  blankrows: false 
              });

              // 5. Normalização inteligente de colunas (Remove espaços e traduz colunas do SAP)
              const dadosJson = dadosJsonBrutos.map((linha: any) => {
                  const novaLinha: any = {};
                  
                  // Verifica se a linha atual contém a coluna "Cód Material" de forma bruta
                  const temCodMaterial = Object.keys(linha).some(k => k.trim() === "Cód Material");

                  for (const [chave, valor] of Object.entries(linha)) {
                      const chaveLimpa = chave.trim(); // Remove espaços como " Qtd. transação" -> "Qtd. transação"

                      if (chaveLimpa === "Cód Material") {
                          novaLinha["Material"] = valor; // Traduz código para "Material"
                      } else if (chaveLimpa === "Material") {
                          // Se o arquivo possui "Cód Material", a coluna "Material" do SAP é apenas o texto descritivo.
                          if (temCodMaterial) {
                              novaLinha["Descrição"] = valor; 
                          } else {
                              novaLinha["Material"] = valor;
                          }
                      } else if (chaveLimpa === "Qtd. transação" || chaveLimpa === "Qtd. transacao") {
                          novaLinha["Quantidade"] = valor; // Traduz quantidade
                      } else {
                          novaLinha[chaveLimpa] = valor;
                      }
                  }
                  return novaLinha;
              });
      
              if (dadosJson.length === 0) {
                  throw new Error(`A aba '${abaAlvo}' foi lida, mas os dados estão vazios.`);
              }
              
              // Validação de colunas obrigatórias
              const headers = Object.keys(dadosJson[0] as object);
              console.log("CKM3 Headers Diagnostic:", headers);
              setLastDetectedCKM3Headers(headers);
              const missingColumns = MANDATORY_CKM3_COLUMNS.filter(col => !headers.includes(col));
              if (missingColumns.length > 0) {
                  throw new Error(`Colunas obrigatórias faltando: ${missingColumns.join(', ')}`);
              }
      
              return dadosJson;
          } catch (erro: any) {
              console.error("AppError Falha no processamento da planilha:\n", erro.message);
              addToast(erro.message, "error");
              return null; 
          }
        }

          const jsonData = processarUploadBlindado(data);
          
          // VERIFICAÇÃO CHAVE: Só atualiza os estados se a validação passou
          if (jsonData && jsonData.length > 0) {
            setParsedCKM3Header(Object.keys(jsonData[0] as object));
            
            // Movemos a atualização do estado visual do arquivo para CA:
            const merged = [...filesCKM3, ...filteredNewFiles];
            setFilesCKM3(ordenarArquivosPorData(merged));
          }
          // Se jsonData for null, a função morre aqui e o arquivo não é adicionado à tela.
        };
        reader.readAsArrayBuffer(filteredNewFiles[0]);
      }
    }
  // Dica: Adicione o addToast no array de dependências para evitar warnings do React ESLint
  }, [setFilesCKM3, filesCKM3, addToast]);

  const handleRemoveFileCKM3 = React.useCallback((fileName: string) => {
    const next = filesCKM3.filter(f => f.name !== fileName);
    if (next.length === 0) {
      setParsedCKM3Header(null);
      setLastDetectedCKM3Headers(null);
    }
    setFilesCKM3(next);
  }, [setFilesCKM3, filesCKM3]);

  const handleClearAll = React.useCallback(() => {
    if (confirm("Tem certeza que deseja limpar todos os arquivos e dados carregados?")) {
      setFilesNF([]);
      setFilesCKM3([]);
      setParsedNFHeader(null);
      setParsedCKM3Header(null);
      setLastDetectedCKM3Headers(null);
      setOcrResultados([]);
      addToast('Dados limpos com sucesso!', 'success');
    }
  }, [setFilesNF, setFilesCKM3, setParsedNFHeader, setParsedCKM3Header, setOcrResultados, addToast]);


  const handleProcess = React.useCallback(async () => {
    try {
      // Validation
      if (filesNF.length > 0 && parsedNFHeader) {
        const { isValid, missing } = validateHeaders(parsedNFHeader, ['Material', 'Preço', 'Quantidade']);
        if (!isValid) {
            throw new Error(`Colunas obrigatórias ausentes em Notas Fiscais: ${missing.join(', ')}`);
        }
      }
      
      if (filesCKM3.length > 0 && parsedCKM3Header) {
        const { isValid, missing } = validateHeaders(parsedCKM3Header, ['Material', 'Quantidade', 'Centro', 'Descrição']);
        if (!isValid) {
            throw new Error(`Colunas obrigatórias ausentes em CKM3: ${missing.join(', ')}`);
        }
      }

      await iniciarProcessamento();
      
      // Trigger Power BI refresh
      try {
        await fetch('/api/powerbi/refresh', { method: 'POST' });
      } catch (e) {
        console.error('Falha ao disparar refresh do Power BI:', e);
      }
      
      addToast('Auditoria concluída com sucesso!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.message || 'Ocorreu um erro inesperado durante o processamento.';
      addToast(`Falha na Auditoria: ${errorMessage}`, 'error');
    }
  }, [iniciarProcessamento, addToast, navigate, filesNF, filesCKM3, parsedNFHeader, parsedCKM3Header]);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <Logo className="w-8 h-8" />
        </div>
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-900'}`}>
            Nova Auditoria
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Carregue seus arquivos e configure os parâmetros para iniciar a análise.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]'}`}>
            <FileSpreadsheet className="w-5 h-5" />
            Bases de Dados (Excel)
          </h3>
          
          <div className="space-y-6">
            <FileUploadZone 
              label="Notas Fiscais"
              files={filesNF}
              isDragging={isDraggingNF}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingNF(true); }}
              onDragLeave={() => setIsDraggingNF(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingNF(false); handleFileNF(e.dataTransfer.files); }}
              onFileSelect={handleFileNF}
              onRemoveFile={handleRemoveFileNF}
              multiple
              darkMode={darkMode}
              id="fileNF"
            />

            <FileUploadZone 
              label="Relatório CKM3"
              files={filesCKM3}
              multiple
              isDragging={isDraggingCKM3}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingCKM3(true); }}
              onDragLeave={() => setIsDraggingCKM3(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingCKM3(false); handleFileCKM3(e.dataTransfer.files); }}
              onFileSelect={handleFileCKM3}
              onRemoveFile={handleRemoveFileCKM3}
              darkMode={darkMode}
              id="fileCKM3"
            />
            {lastDetectedCKM3Headers && (
              <div className={`p-4 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                <h4 className={`text-xs font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                  Colunas Detectadas no CKM3:
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {lastDetectedCKM3Headers.map(header => (
                    <span 
                      key={header} 
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        MANDATORY_CKM3_COLUMNS.includes(header)
                          ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                          : (darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600')
                      }`}
                    >
                      {header}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {parsedCKM3Header && (
              <>
              <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-green-50 border-green-100'}`}>
                <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-[#8DC63F]' : 'text-green-800'}`}>Visualização de Cabeçalhos (CKM3)</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {parsedCKM3Header.map((h, i) => (
                    <span key={i} className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-white text-green-700 border border-green-200'}`}>
                      {String(h)}
                    </span>
                  ))}
                </div>
              </div>
              <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
                <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-[#8DC63F]' : 'text-blue-800'}`}>Mapeamento Manual (Sobrescrita)</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['ckm3Mat', 'ckm3Qtd', 'ckm3Centro', 'ckm3Desc'].map(key => (
                    <div key={key}>
                      <label className={`text-[10px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-blue-600'} mb-1 block`}>Coluna para {key.replace('ckm3', '')}</label>
                      <select 
                        value={ckm3ManualMapping[key] || ''} 
                        onChange={(e) => setCkm3ManualMapping({...ckm3ManualMapping, [key]: e.target.value})}
                        className={`w-full p-2 border rounded-lg text-xs ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-blue-200 text-slate-800'}`}
                      >
                         <option value="">Automático</option>
                         {parsedCKM3Header.map((h, i) => <option key={`${h}-${i}`} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              </>
            )}
          </div>
        </section>

        {/* Parameters Section */}
        <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]'}`}>
            <Settings className="w-5 h-5" />
            Filtros e Parâmetros
            <button 
              onClick={handleClearAll}
              className={`ml-auto p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
              title="Limpar todos os dados"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="tolerancia" className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Percent className="w-3 h-3" /> Tolerância de Variação (%)
              </label>
              <input 
                id="tolerancia"
                type="number" 
                value={tolerancia}
                onChange={(e) => setTolerancia(Number(e.target.value))}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div>
              <label htmlFor="cfops" className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Hash className="w-3 h-3" /> CFOPs Permitidos
              </label>
              <input 
                id="cfops"
                type="text" 
                value={cfops}
                onChange={(e) => setCfops(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div>
              <label htmlFor="dataInicio" className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Calendar className="w-3 h-3" /> Data Início
              </label>
              <input 
                id="dataInicio"
                type="date" 
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div>
              <label htmlFor="dataFim" className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Calendar className="w-3 h-3" /> Data Fim
              </label>
              <input 
                id="dataFim"
                type="date" 
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="filterHideZeroes" className={`flex items-center gap-2 text-xs font-bold cursor-pointer ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <input 
                  id="filterHideZeroes"
                  type="checkbox" 
                  checked={filterHideZeroes}
                  onChange={(e) => setFilterHideZeroes(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8DC63F] focus:ring-[#8DC63F]"
                />
                Ocultar Zeros automáticos
              </label>
            </div>
          </div>

          <ColumnMapping 
            isOpen={isMappingOpen}
            onToggle={() => setIsMappingOpen(!isMappingOpen)}
            darkMode={darkMode}
            mapColunas={mapColunas}
            setMapColunas={setMapColunas}
          />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <OCRUpload 
          darkMode={darkMode} 
          primaryColor="#8DC63F" 
          onExtractData={(data) => {
            setOcrResultados(data);
            addToast(`${data.length} arquivos processados!`, 'success');
          }} 
        />
        <PainelConciliacao 
          darkMode={darkMode} 
          primaryColor="#8DC63F" 
          dados={ocrResultados} 
        />
        <div className={`p-6 rounded-[2rem] border flex flex-col justify-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
          <h4 className="text-sm font-black uppercase tracking-widest text-[#8DC63F] mb-2">Dica de Produtividade</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Use o OCR para digitalizar notas fiscais físicas rapidamente. O NatuAssist identifica campos chave como número da NF e fornecedor automaticamente.
          </p>
        </div>
      </div>

      {/* Action Section */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className={`w-full max-w-md flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-bold transition-all shadow-xl disabled:opacity-50 ${darkMode ? 'bg-[#8DC63F] hover:bg-[#78AF32] text-slate-900' : 'bg-[#8DC63F] hover:bg-[#78AF32] text-white'}`}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Play className="w-6 h-6" />
          )}
          {isProcessing ? 'Processando...' : 'Iniciar Auditoria'}
        </button>

        {isProcessing && (
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>{status}</span>
              <span className="text-[#8DC63F]">{progressPercent}%</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
              <div 
                className="bg-[#8DC63F] h-full transition-all duration-300" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className={`w-full max-w-2xl p-4 rounded-xl border ${darkMode ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
            <div className="flex items-center gap-2 font-bold mb-2">
              <AlertCircle className="w-5 h-5" />
              Avisos
            </div>
            <ul className="text-sm space-y-1 list-disc list-inside">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
