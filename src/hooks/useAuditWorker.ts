import { useState, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';

interface WorkerOptions {
  tolerancia: number;
  cfops: string;
  dataInicio: string;
  dataFim: string;
  colunaData: string;
  mapColunas: any;
}

export const useAuditWorker = (options: WorkerOptions) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const workerRef = useRef<Worker | null>(null);

  const lerExcelBuffer = useCallback(async (file: File): Promise<ArrayBuffer> => {
    if (file.arrayBuffer) {
      return await file.arrayBuffer();
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const executarWorker = useCallback((
    fileCkm3Data: ArrayBuffer, 
    fileCkm3Name: string,
    filesNfData: ArrayBuffer[], 
    filesNames: string[],
    onDone: (res: any) => void,
    onError: (err: Error) => void
  ) => {
    setIsProcessing(true);
    setStatus('⏳ Preparando arquivos para processamento...');
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    workerRef.current = new Worker(new URL('../worker.ts', import.meta.url), { 
      type: 'module',
      name: 'AuditWorker'
    });

    workerRef.current.onerror = (err) => {
      console.error('Worker Error Event:', err);
      const errorMsg = `Erro crítico no Worker: ${err.message || 'Falha ao carregar o script do worker'}`;
      setStatus(`❌ ${errorMsg}`);
      setWarnings(prev => [...prev, errorMsg]);
      setIsProcessing(false);
      onError(new Error(errorMsg));
    };

    workerRef.current.onmessage = (e) => {
      const { type, message, percent, current, total, resultado: res, fileName } = e.data;

      if (type === 'status') {
        setStatus(message);
      } else if (type === 'progress') {
        setProgressPercent(percent);
        if (fileName === 'CKM3') {
          setStatus(`⏳ Indexando CKM3: ${percent}% (${current} de ${total} materiais)`);
        } else {
          setStatus(`⚙️ Processando NFs (${fileName}): ${percent}% (${current} de ${total} linhas totais)`);
        }
      } else if (type === 'warning') {
        setWarnings(prev => [...prev, message]);
      } else if (type === 'error') {
        console.error('Worker reported error:', message);
        setStatus(`❌ Erro no processamento: ${message}`);
        setWarnings(prev => [...prev, `Erro no Worker: ${message}`]);
        setIsProcessing(false);
        onError(new Error(message));
      } else if (type === 'done') {
        setProgressPercent(100);
        
        // Merge comments from localStorage
        const mergedDivergencias = res.divergencias.map((d: any) => {
          const commentKey = `miniSap_comment_${d.material}_${d.numeroNF}_${d.data}`;
          const saved = localStorage.getItem(commentKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            return { ...d, comentarios: parsed.comentarios, status: parsed.status || d.status };
          }
          return d;
        });
        
        const mergedTodos = res.todosOsItens?.map((d: any) => {
          const commentKey = `miniSap_comment_${d.material}_${d.numeroNF}_${d.data}`;
          const saved = localStorage.getItem(commentKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            return { ...d, comentarios: parsed.comentarios, status: parsed.status || d.status };
          }
          return d;
        });

        const finalRes = { 
          ...res, 
          divergencias: mergedDivergencias, 
          todosOsItens: mergedTodos 
        };

        setStatus(`✅ Auditoria Finalizada! (Processadas ${res.linhasNfProcessadas} linhas de NF e ${res.linhasCkm3Processadas} linhas de CKM3)`);
        setIsProcessing(false);
        onDone(finalRes);
      }
    };

    workerRef.current.postMessage({
      filesNfData,
      filesNames,
      fileCkm3Data,
      fileCkm3Name,
      ...options
    }, [fileCkm3Data, ...filesNfData]);
  }, [options]);

  const iniciarProcessamento = useCallback(async (filesNF: File[], fileCKM3: File | null) => {
    if (filesNF.length === 0 || !fileCKM3) {
      setWarnings(['Por favor, anexe pelo menos um arquivo de NF e o arquivo CKM3 primeiro!']);
      return Promise.reject(new Error('Arquivos ausentes'));
    }

    setIsProcessing(true);
    setProgressPercent(0);
    setWarnings([]);
    setStatus('⏳ Validando arquivos e mapeamentos...');

    try {
      const fileCkm3Data = await lerExcelBuffer(fileCKM3);
      const filesNfData = [];
      const filesNames = [];
      for (const file of filesNF) {
        filesNfData.push(await lerExcelBuffer(file));
        filesNames.push(file.name);
      }

      return new Promise<any>((resolve, reject) => {
        executarWorker(fileCkm3Data, fileCKM3.name, filesNfData, filesNames, resolve, reject);
      });
    } catch (error: any) {
      const errorMsg = `❌ Erro ao ler arquivos: ${error.message || 'Falha desconhecida'}`;
      setStatus(errorMsg);
      setWarnings(prev => [...prev, errorMsg]);
      setIsProcessing(false);
      throw new Error(errorMsg);
    }
  }, [lerExcelBuffer, executarWorker]);

  return {
    isProcessing,
    setIsProcessing,
    status,
    setStatus,
    progressPercent,
    setProgressPercent,
    warnings,
    setWarnings,
    iniciarProcessamento
  };
};
