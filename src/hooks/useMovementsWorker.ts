import { useState, useRef, useCallback } from 'react';

export const useMovementsWorker = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
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

  const iniciarProcessamento = useCallback(async (files: File[], initialFiles: File[] = [], finalFiles: File[] = [], plant: string = '1001', mapping?: any, stockMapping?: any) => {
    if (files.length === 0 && initialFiles.length === 0 && finalFiles.length === 0) {
      return Promise.reject(new Error('Nenhum arquivo selecionado'));
    }

    setIsProcessing(true);
    setStatus('⏳ Preparando arquivos...');
    setProgressPercent(0);

    const filesData: ArrayBuffer[] = [];
    const filesNames: string[] = [];
    const fileTypes: string[] = [];

    // MB51 Movements
    for (const file of files) {
      filesData.push(await lerExcelBuffer(file));
      filesNames.push(file.name);
      fileTypes.push('movements');
    }

    // Initial Stock Positions
    for (const file of initialFiles) {
      filesData.push(await lerExcelBuffer(file));
      filesNames.push(file.name);
      fileTypes.push('initial');
    }

    // Final Stock Positions
    for (const file of finalFiles) {
      filesData.push(await lerExcelBuffer(file));
      filesNames.push(file.name);
      fileTypes.push('final');
    }

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    workerRef.current = new Worker(new URL('../movementWorker.ts', import.meta.url), { 
      type: 'module',
      name: 'MovementWorker'
    });

    return new Promise<any>((resolve, reject) => {
      workerRef.current!.onmessage = (e) => {
        const { type, message, percent, movements, initial, final, error } = e.data;
        if (type === 'status') {
          setStatus(message);
        } else if (type === 'progress') {
          setProgressPercent(percent);
          setStatus(message);
        } else if (type === 'error') {
          setIsProcessing(false);
          reject(new Error(error || message));
        } else if (type === 'done') {
          setIsProcessing(false);
          setProgressPercent(100);
          resolve({ movements, initial, final });
        }
      };

      workerRef.current!.onerror = (err) => {
        setIsProcessing(false);
        reject(err);
      };

      workerRef.current!.postMessage({
        filesData,
        filesNames,
        fileTypes,
        plant,
        mapping,
        stockMapping
      }, filesData);
    });
  }, [lerExcelBuffer]);

  return {
    isProcessing,
    status,
    progressPercent,
    iniciarProcessamento
  };
};
