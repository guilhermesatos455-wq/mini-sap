import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import bcrypt from 'bcryptjs';
import Cookies from 'js-cookie';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocFromServer,
  getFirestore,
  getDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuditWorker } from '../hooks/useAuditWorker';
import { mergeItemData, recalculateTotals, persistComment, calculateItemImpact } from '../utils/auditUtils';

import { Divergencia, SAPMovementType, MaterialMovement } from '../types/audit';

interface AuditContextType {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  filesNF: File[];
  setFilesNF: (files: File[]) => void;
  fileCKM3: File | null;
  setFileCKM3: (file: File | null) => void;
  resultado: any | null;
  setResultado: (res: any | null) => void;
  status: string;
  setStatus: (s: string) => void;
  warnings: string[];
  setWarnings: (w: string[] | ((prev: string[]) => string[])) => void;
  progressPercent: number;
  setProgressPercent: (p: number) => void;
  toasts: { id: number, message: string, type: 'success' | 'error' | 'info' }[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isProcessing: boolean;
  setIsProcessing: (b: boolean) => void;
  historico: any[];
  setHistorico: (h: any[] | ((prev: any[]) => any[])) => void;
  clearHistorico: () => void;
  mapColunas: any;
  setMapColunas: (m: any) => void;
  customPresets: Record<string, any>;
  saveCustomPreset: (name: string, map: any) => void;
  deleteCustomPreset: (name: string) => void;
  tolerancia: number;
  setTolerancia: (t: number) => void;
  cfops: string;
  setCfops: (c: string) => void;
  dataInicio: string;
  setDataInicio: (d: string) => void;
  dataFim: string;
  setDataFim: (d: string) => void;
  colunaData: string;
  setColunaData: (c: string) => void;
  filterCfopDefault: string;
  setFilterCfopDefault: (c: string) => void;
  filterSupplierDefault: string;
  setFilterSupplierDefault: (s: string) => void;
  filterTipoDefault: string;
  setFilterTipoDefault: (t: string) => void;
  filterImpactoMinDefault: number;
  setFilterImpactoMinDefault: (i: number) => void;
  alertSettings: {
    impactoMinimoAlerta: number;
    variacaoMinimaAlerta: number;
    fornecedoresCriticos: string[];
  };
  setAlertSettings: (s: any) => void;
  branding: {
    primaryColor: string;
    logoUrl: string;
    companyName: string;
  };
  setBranding: (b: any) => void;
  currency: string;
  setCurrency: (c: string) => void;
  notificationSettings: {
    emailAlerts: boolean;
    managerEmail: string;
  };
  setNotificationSettings: (s: any) => void;
  showOnboarding: boolean;
  setShowOnboarding: (b: boolean) => void;
  showFinancialImpact: boolean;
  setShowFinancialImpact: (b: boolean) => void;
  isPresentationMode: boolean;
  setIsPresentationMode: (b: boolean) => void;
  taxMatrix: Record<string, number>;
  setTaxMatrix: (m: Record<string, number>) => void;
  decisionHistory: Record<string, string>;
  justificationBase: Record<string, string>;
  syncSapStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncSapLastDate: string | null;
  syncSapData: () => Promise<void>;
  movementTypes: SAPMovementType[];
  setMovementTypes: (types: SAPMovementType[]) => void;
  movements: MaterialMovement[];
  setMovements: (movements: MaterialMovement[]) => void;
  aiMessages: any[];
  setAiMessages: (msgs: any[] | ((prev: any[]) => any[])) => void;
  isAIOpen: boolean;
  setIsAIOpen: (b: boolean) => void;
  askAI: (prompt: string) => void;
  aiUser: { matricula: string; nome: string; email?: string; uid?: string } | null;
  setAiUser: (user: { matricula: string; nome: string; email?: string; uid?: string } | null) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  completeRegistration: (matricula: string) => Promise<boolean>;
  isAuthReady: boolean;
  registeredUsers: any[];
  registerUser: (user: any) => Promise<boolean>;
  updateUser: (matricula: string, data: Partial<any>) => Promise<void>;
  getUser: (matricula: string) => Promise<any | null>;
  bannedDevices: string[];
  banDevice: (deviceId: string) => Promise<void>;
  unbanDevice: (deviceId: string) => Promise<void>;
  updateDivergencia: (id: number, newData: Partial<Divergencia>) => void;
  bulkUpdateDivergencias: (ids: number[], newData: Partial<Divergencia>) => void;
  handleReset: () => void;
  iniciarProcessamento: () => Promise<void>;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('miniSapDarkMode') === 'true');
  const [filesNF, setFilesNF] = useState<File[]>([]);
  const [fileCKM3, setFileCKM3] = useState<File | null>(null);
  const [resultado, setResultado] = useState<any | null>(null);
  const [toasts, setToasts] = useState<{ id: number, message: string, type: 'success' | 'error' | 'info' }[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);
  const [historico, setHistorico] = useState<any[]>([]);
  const [customPresets, setCustomPresets] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('miniSapCustomPresets');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [mapColunas, setMapColunas] = useState(() => {
    const defaultMap = {
      ckm3Mat: 'C',
      ckm3Custo: 'L',
      ckm3Qtd: 'I',
      ckm3Centro: 'C',
      ckm3Desc: 'D',
      ckm3Categoria: 'G',
      ckm3CategoriaFiltro: ['Entradas'],
      ckm3Processo: 'H',
      ckm3ProcessoFiltro: [],
      nfId: 'A',
      nfCfop: 'H',
      nfMat: 'K',
      nfPreco: 'T',
      nfQtd: 'U',
      nfFornecedor: 'E',
      nfCentro: 'C',
      nfDesc: 'L',
      nfIcms: '',
      nfIpi: '',
      nfPis: '',
      nfCofins: '',
      nfEmpresa: 'C',
      nfNumeroNF: 'F',
      nfTipoMaterial: 'N',
      nfCategoriaNF: 'O',
      nfOrigemMaterial: 'R',
      nfDataLancamento: 'A',
      precoSemFrete: 'V',
      precoComFrete: 'W',
      valorLiqSemFrete: 'X',
      valorLiqComFrete: 'Y',
      valorTotalSemFrete: 'Z',
      valorTotalComFrete: 'AA'
    };
    const saved = localStorage.getItem('miniSapSettings');
    if (saved) {
      try { return { ...defaultMap, ...(JSON.parse(saved).mapColunas || {}) }; } catch (e) {}
    }
    return defaultMap;
  });

  const [tolerancia, setTolerancia] = useState(() => {
    const saved = localStorage.getItem('miniSapSettings');
    if (saved) {
      try { return JSON.parse(saved).tolerancia || 0; } catch (e) {}
    }
    return 0;
  });

  const [cfops, setCfops] = useState(() => {
    const saved = localStorage.getItem('miniSapSettings');
    if (saved) {
      try { return JSON.parse(saved).cfops || '1101AA, 1117AA, 1407AA, 1556AA'; } catch (e) {}
    }
    return '1101AA, 1117AA, 1407AA, 1556AA';
  });

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [colunaData, setColunaData] = useState('G');

  const workerOptions = useMemo(() => ({
    tolerancia,
    cfops,
    dataInicio,
    dataFim,
    colunaData,
    mapColunas
  }), [tolerancia, cfops, dataInicio, dataFim, colunaData, mapColunas]);

  const {
    isProcessing,
    setIsProcessing,
    status,
    setStatus,
    progressPercent,
    setProgressPercent,
    warnings,
    setWarnings,
    iniciarProcessamento: iniciarProcessamentoWorker
  } = useAuditWorker(workerOptions);

  useEffect(() => {
    const saved = Cookies.get('miniSapHistory');
    if (saved) {
      try {
        setHistorico(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveCustomPreset = useCallback((name: string, map: any) => {
    setCustomPresets(prev => {
      const updated = { ...prev, [name]: map };
      localStorage.setItem('miniSapCustomPresets', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteCustomPreset = useCallback((name: string) => {
    setCustomPresets(prev => {
      const updated = { ...prev };
      delete updated[name];
      localStorage.setItem('miniSapCustomPresets', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistorico = useCallback(() => {
    setHistorico([]);
    Cookies.remove('miniSapHistory');
  }, []);

  useEffect(() => {
    localStorage.setItem('miniSapDarkMode', darkMode.toString());
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const [filterCfopDefault, setFilterCfopDefault] = useState(() => {
    const saved = localStorage.getItem('miniSapSettings');
    return saved ? JSON.parse(saved).filterCfopDefault || '' : '';
  });
  const [filterSupplierDefault, setFilterSupplierDefault] = useState(() => {
    const saved = localStorage.getItem('miniSapSettings');
    return saved ? JSON.parse(saved).filterSupplierDefault || '' : '';
  });
  const [filterTipoDefault, setFilterTipoDefault] = useState(() => {
    const saved = localStorage.getItem('miniSapSettings');
    return saved ? JSON.parse(saved).filterTipoDefault || 'Todos' : 'Todos';
  });
  const [filterImpactoMinDefault, setFilterImpactoMinDefault] = useState(() => {
    const saved = localStorage.getItem('miniSapSettings');
    return saved ? JSON.parse(saved).filterImpactoMinDefault || 0 : 0;
  });

  const [alertSettings, setAlertSettings] = useState(() => {
    const defaultSettings = {
      impactoMinimoAlerta: 5000,
      variacaoMinimaAlerta: 10,
      fornecedoresCriticos: []
    };
    const saved = localStorage.getItem('miniSapSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...(parsed.alertSettings || {}) };
      } catch (e) {}
    }
    return defaultSettings;
  });

  const [branding, setBranding] = useState(() => {
    const defaultBranding = {
      primaryColor: '#8DC63F',
      logoUrl: '',
      companyName: 'Meu mini sap web'
    };
    const saved = localStorage.getItem('miniSapSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultBranding, ...(parsed.branding || {}) };
      } catch (e) {}
    }
    return defaultBranding;
  });

  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('miniSapSettings');
    return saved ? JSON.parse(saved).currency || 'BRL' : 'BRL';
  });

  const [notificationSettings, setNotificationSettings] = useState(() => {
    const defaultNotif = {
      emailAlerts: false,
      managerEmail: ''
    };
    const saved = localStorage.getItem('miniSapSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultNotif, ...(parsed.notificationSettings || {}) };
      } catch (e) {}
    }
    return defaultNotif;
  });

  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('miniSapOnboardingDone') !== 'true';
  });
  const [showFinancialImpact, setShowFinancialImpact] = useState(() => {
    const saved = localStorage.getItem('miniSapSettings');
    return saved ? JSON.parse(saved).showFinancialImpact || false : false;
  });
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  
  const [taxMatrix, setTaxMatrix] = useState<Record<string, number>>(() => {
    const defaultMatrix = {
      'SP': 18, 'RJ': 20, 'MG': 18, 'PR': 19, 'SC': 17, 'RS': 18, 'BA': 19, 'PE': 18, 'CE': 18, 'GO': 17,
      'MT': 17, 'MS': 17, 'ES': 17, 'AM': 18, 'PA': 17, 'MA': 18, 'RN': 18, 'PB': 18, 'AL': 18, 'SE': 18,
      'PI': 18, 'TO': 18, 'RO': 17, 'AC': 17, 'RR': 17, 'AP': 18, 'DF': 18
    };
    const saved = localStorage.getItem('miniSapTaxMatrix');
    return saved ? JSON.parse(saved) : defaultMatrix;
  });

  const [decisionHistory, setDecisionHistory] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('miniSapDecisionHistory');
    return saved ? JSON.parse(saved) : {};
  });

  const [justificationBase, setJustificationBase] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('miniSapJustificationBase');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('miniSapTaxMatrix', JSON.stringify(taxMatrix));
  }, [taxMatrix]);

  useEffect(() => {
    localStorage.setItem('miniSapDecisionHistory', JSON.stringify(decisionHistory));
  }, [decisionHistory]);

  useEffect(() => {
    localStorage.setItem('miniSapJustificationBase', JSON.stringify(justificationBase));
  }, [justificationBase]);

  const [syncSapStatus, setSyncSapStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncSapLastDate, setSyncSapLastDate] = useState<string | null>(() => localStorage.getItem('miniSapLastSync'));

  const [movementTypes, setMovementTypes] = useState<SAPMovementType[]>(() => {
    const saved = localStorage.getItem('miniSapMovementTypes');
    if (saved) return JSON.parse(saved);
    return [
      { code: '101', description: 'Entrada de mercadorias para pedido', direction: 'Entrada', active: true },
      { code: '102', description: 'Estorno de entrada de mercadorias', direction: 'Saída', active: true },
      { code: '122', description: 'Devolução ao fornecedor', direction: 'Saída', active: true },
      { code: '201', description: 'Saída de mercadorias para centro de custo', direction: 'Saída', active: true },
      { code: '261', description: 'Saída de mercadorias para ordem', direction: 'Saída', active: true },
      { code: '301', description: 'Transferência de centro para centro', direction: 'Transferência', active: true },
      { code: '311', description: 'Transferência de depósito para depósito', direction: 'Transferência', active: true },
      { code: '501', description: 'Entrada sem pedido - utilização livre', direction: 'Entrada', active: true },
      { code: '561', description: 'Entrada inicial de estoque', direction: 'Entrada', active: true },
      { code: '601', description: 'Saída para entrega (Vendas)', direction: 'Saída', active: true },
      { code: '701', description: 'Diferença de inventário - utilização livre', direction: 'Transferência', active: true },
    ];
  });

  const [movements, setMovements] = useState<MaterialMovement[]>(() => {
    const saved = localStorage.getItem('miniSapMovements');
    if (saved) return JSON.parse(saved);
    
    // Mock data for initial view
    const mockMovements: MaterialMovement[] = [];
    const materials = [
      { code: 'MAT-0001', desc: 'Rolamento de Esferas 6205' },
      { code: 'MAT-0002', desc: 'Vedações de Borracha Nitrílica' },
      { code: 'MAT-0003', desc: 'Graxa Industrial de Alta Temperatura' }
    ];
    
    for (let i = 0; i < 20; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - Math.floor(i / 5));
      date.setDate(Math.floor(Math.random() * 28) + 1);
      
      const mat = materials[i % 3];
      const isEntrada = Math.random() > 0.4;
      
      mockMovements.push({
        id: `mov-${i}`,
        material: mat.code,
        description: mat.desc,
        movementType: isEntrada ? '101' : '201',
        quantity: Math.floor(Math.random() * 500) + 50,
        date: date.toISOString(),
        plant: '1000',
        storageLocation: '0001',
        user: 'SAP_USER',
        docNumber: `500000${1000 + i}`
      });
    }
    return mockMovements;
  });

  const [aiMessages, setAiMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem('audit_ai_messages');
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'Olá! Sou o NatuAssist, seu assistente de auditoria inteligente. Como posso ajudar você hoje?' }
    ];
  });
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiUser, setAiUser] = useState<{ matricula: string; nome: string; email?: string; uid?: string } | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [bannedDevices, setBannedDevices] = useState<string[]>([]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAiUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            nome: firebaseUser.displayName || '',
            matricula: userData.matricula
          });
        } else {
          // User is logged in but not registered with a matricula
          setAiUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            nome: firebaseUser.displayName || '',
            matricula: '' // Needs registration
          });
        }
      } else {
        setAiUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      addToast('Erro ao fazer login com Google.', 'error');
    }
  }, [addToast]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setAiUser(null);
      setAiMessages([{ role: 'assistant', content: 'Sessão encerrada. Faça login para continuar.' }]);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }, []);

  const completeRegistration = useCallback(async (matricula: string) => {
    if (!auth.currentUser) return false;
    
    const userData = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      nome: auth.currentUser.displayName,
      matricula: matricula,
      dataRegistro: new Date().toISOString(),
      role: 'user'
    };

    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), userData);
      setAiUser(prev => prev ? { ...prev, matricula } : null);
      addToast('Cadastro concluído com sucesso!', 'success');
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}`);
      return false;
    }
  }, [addToast]);

  useEffect(() => {
    localStorage.setItem('audit_ai_messages', JSON.stringify(aiMessages));
  }, [aiMessages]);

  useEffect(() => {
    if (aiUser) {
      localStorage.setItem('audit_ai_user', JSON.stringify(aiUser));
    } else {
      localStorage.removeItem('audit_ai_user');
    }
  }, [aiUser]);

  const askAI = useCallback((prompt: string) => {
    setAiMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setIsAIOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('miniSapMovementTypes', JSON.stringify(movementTypes));
  }, [movementTypes]);

  useEffect(() => {
    localStorage.setItem('miniSapMovements', JSON.stringify(movements));
  }, [movements]);

  const banDevice = useCallback(async (deviceId: string) => {
    try {
      await setDoc(doc(db, 'bannedDevices', deviceId), {
        deviceId,
        dataBanimento: new Date().toISOString(),
        motivo: 'Banimento manual via console DEV'
      });
      addToast('Dispositivo banido com sucesso.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `bannedDevices/${deviceId}`);
    }
  }, [addToast]);

  const unbanDevice = useCallback(async (deviceId: string) => {
    try {
      await deleteDoc(doc(db, 'bannedDevices', deviceId));
      addToast('Dispositivo desbloqueado com sucesso.', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bannedDevices/${deviceId}`);
    }
  }, [addToast]);

  const registerUser = useCallback(async (user: any) => {
    try {
      await setDoc(doc(db, 'users', user.matricula), {
        ...user,
        dataRegistro: new Date().toISOString(),
        role: 'user'
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.matricula}`);
      return false;
    }
  }, []);

  const updateUser = useCallback(async (matricula: string, data: Partial<any>) => {
    try {
      await setDoc(doc(db, 'users', matricula), data, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${matricula}`);
    }
  }, []);

  const getUser = useCallback(async (matricula: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', matricula));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.warn('Erro ao buscar usuário:', error);
      return null;
    }
  }, []);
  const syncSapData = useCallback(async () => {
    setSyncSapStatus('syncing');
    // Simulating API call to SAP
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const now = new Date().toISOString();
      setSyncSapLastDate(now);
      localStorage.setItem('miniSapLastSync', now);
      setSyncSapStatus('success');
      addToast('Sincronização com SAP concluída com sucesso!', 'success');
      setTimeout(() => setSyncSapStatus('idle'), 3000);
    } catch (error) {
      setSyncSapStatus('error');
      addToast('Erro ao sincronizar com SAP. Verifique a conexão.', 'error');
      setTimeout(() => setSyncSapStatus('idle'), 3000);
    }
  }, [addToast]);

  const updateDivergencia = useCallback((id: number, newData: Partial<Divergencia>) => {
    setResultado((prev: any) => {
      if (!prev) return prev;
      
      let found = false;
      const updatedDivergencias = [...prev.divergencias];
      const divIdx = updatedDivergencias.findIndex((d: Divergencia) => d.id === id);
      
      let newItem: Divergencia | null = null;

      if (divIdx !== -1) {
        newItem = mergeItemData(updatedDivergencias[divIdx], newData, taxMatrix, decisionHistory, justificationBase);
        updatedDivergencias[divIdx] = newItem;
        found = true;
      }

      let updatedTodos = prev.todosOsItens;
      if (updatedTodos) {
        updatedTodos = [...updatedTodos];
        const todoIdx = updatedTodos.findIndex((t: Divergencia) => t.id === id);
        if (todoIdx !== -1) {
          if (!newItem) {
            newItem = mergeItemData(updatedTodos[todoIdx], newData, taxMatrix, decisionHistory, justificationBase);
          }
          updatedTodos[todoIdx] = newItem;
          found = true;
        }
      }
      
      if (!found || !newItem) return prev;

      // Intelligence: Record decision and justification
      if ('status' in newData || 'comentarios' in newData) {
        const material = newItem.material;
        const variationRange = Math.round(newItem.variacaoPerc);
        const key = `${material}_${variationRange}`;
        
        if ('status' in newData && newData.status) {
          setDecisionHistory(prev => ({ ...prev, [key]: newData.status! }));
        }
        if ('comentarios' in newData && newData.comentarios) {
          setJustificationBase(prev => ({ ...prev, [key]: newData.comentarios! }));
        }
      }

      if ('comentarios' in newData || 'status' in newData) {
        persistComment(newItem);
      }
      
      const totals = recalculateTotals(updatedDivergencias);

      return {
        ...prev,
        divergencias: updatedDivergencias,
        todosOsItens: updatedTodos,
        ...totals
      };
    });
  }, []);

  const bulkUpdateDivergencias = useCallback((ids: number[], newData: Partial<Divergencia>) => {
    setResultado((prev: any) => {
      if (!prev) return prev;
      
      const updatedDivergencias = [...prev.divergencias];
      let updatedTodos = prev.todosOsItens ? [...prev.todosOsItens] : null;
      let changed = false;
      
      ids.forEach(id => {
        let newItem: Divergencia | null = null;
        const divIdx = updatedDivergencias.findIndex((d: Divergencia) => d.id === id);
        
        if (divIdx !== -1) {
          newItem = mergeItemData(updatedDivergencias[divIdx], newData, taxMatrix, decisionHistory, justificationBase);
          updatedDivergencias[divIdx] = newItem;
          changed = true;
        }
        
        if (updatedTodos) {
          const todoIdx = updatedTodos.findIndex((t: Divergencia) => t.id === id);
          if (todoIdx !== -1) {
            if (!newItem) {
              newItem = mergeItemData(updatedTodos[todoIdx], newData, taxMatrix, decisionHistory, justificationBase);
            }
            updatedTodos[todoIdx] = newItem;
            changed = true;
          }
        }

        if (newItem && ('comentarios' in newData || 'status' in newData)) {
          persistComment(newItem);
        }
      });
      
      if (!changed) return prev;
      
      const totals = recalculateTotals(updatedDivergencias);

      return {
        ...prev,
        divergencias: updatedDivergencias,
        todosOsItens: updatedTodos,
        ...totals
      };
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('miniSapSettings', JSON.stringify({
      mapColunas,
      tolerancia,
      cfops,
      filterCfopDefault,
      filterSupplierDefault,
      filterTipoDefault,
      filterImpactoMinDefault,
      alertSettings,
      branding,
      currency,
      notificationSettings,
      showFinancialImpact
    }));

    // Apply primary color to CSS variable
    document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
    // Also update tailwind primary if possible, but for now we use style property
  }, [mapColunas, tolerancia, cfops, filterCfopDefault, filterSupplierDefault, filterTipoDefault, filterImpactoMinDefault, alertSettings, branding]);

  const iniciarProcessamento = useCallback(async () => {
    try {
      const res = await iniciarProcessamentoWorker(filesNF, fileCKM3);
      
      // Apply intelligence and tax validation to results
      const enrichedDivergencias = res.divergencias.map((d: Divergencia) => 
        calculateItemImpact(d, taxMatrix, decisionHistory, justificationBase)
      );
      
      const enrichedRes = {
        ...res,
        divergencias: enrichedDivergencias
      };

      setResultado(enrichedRes);
      setHistorico(prev => {
        const novoHistorico = {
          id: Date.now(),
          data: new Date().toLocaleString('pt-BR'),
          qtdDiv: enrichedRes.qtdDiv,
          totalPrejuizo: enrichedRes.totalPrejuizo,
          totalEconomia: enrichedRes.totalEconomia,
          linhasNfProcessadas: enrichedRes.linhasNfProcessadas,
          linhasCkm3Processadas: enrichedRes.linhasCkm3Processadas,
          qtdAusentes: enrichedRes.qtdAusentes,
          materiaisNoCkm3: enrichedRes.materiaisNoCkm3
        };
        const updated = [novoHistorico, ...prev].slice(0, 20);
        Cookies.set('miniSapHistory', JSON.stringify(updated), { expires: 365, sameSite: 'none', secure: true });
        return updated;
      });
    } catch (error) {
      throw error;
    }
  }, [filesNF, fileCKM3, iniciarProcessamentoWorker, taxMatrix, decisionHistory, justificationBase]);

  const handleReset = useCallback(() => {
    setFilesNF([]);
    setFileCKM3(null);
    setResultado(null);
    setStatus('');
    setWarnings([]);
    setProgressPercent(0);
    setIsProcessing(false);
  }, []);

  const contextValue = React.useMemo(() => ({
    darkMode, setDarkMode,
    filesNF, setFilesNF,
    fileCKM3, setFileCKM3,
    resultado, setResultado,
    status, setStatus,
    warnings, setWarnings,
    progressPercent, setProgressPercent,
    toasts, addToast,
    isProcessing, setIsProcessing,
    historico, setHistorico,
    clearHistorico,
    mapColunas, setMapColunas,
    customPresets, saveCustomPreset, deleteCustomPreset,
    tolerancia, setTolerancia,
    cfops, setCfops,
    dataInicio, setDataInicio,
    dataFim, setDataFim,
    colunaData, setColunaData,
    filterCfopDefault, setFilterCfopDefault,
    filterSupplierDefault, setFilterSupplierDefault,
    filterTipoDefault, setFilterTipoDefault,
    filterImpactoMinDefault, setFilterImpactoMinDefault,
    alertSettings, setAlertSettings,
    branding, setBranding,
    currency, setCurrency,
    notificationSettings, setNotificationSettings,
    showOnboarding, setShowOnboarding,
    showFinancialImpact, setShowFinancialImpact,
    isPresentationMode, setIsPresentationMode,
    taxMatrix, setTaxMatrix,
    decisionHistory, justificationBase,
    syncSapStatus, syncSapLastDate, syncSapData,
    movementTypes, setMovementTypes,
    movements, setMovements,
    aiMessages, setAiMessages,
    isAIOpen, setIsAIOpen,
    askAI,
    aiUser, setAiUser,
    loginWithGoogle, logout, completeRegistration, isAuthReady,
    registeredUsers, registerUser, updateUser, getUser,
    bannedDevices, banDevice, unbanDevice,
    updateDivergencia, bulkUpdateDivergencias,
    handleReset,
    iniciarProcessamento
  }), [
    darkMode, filesNF, fileCKM3, resultado, status, warnings, progressPercent, 
    toasts, addToast, isProcessing, historico, clearHistorico, mapColunas, 
    customPresets, saveCustomPreset, deleteCustomPreset, tolerancia, cfops, 
    dataInicio, dataFim, colunaData, filterCfopDefault, filterSupplierDefault, 
    filterTipoDefault, filterImpactoMinDefault, alertSettings, branding, 
    currency, notificationSettings, showOnboarding,
    showFinancialImpact,
    isPresentationMode, 
    taxMatrix, decisionHistory, justificationBase,
    syncSapStatus, syncSapLastDate, syncSapData,
    movementTypes, setMovementTypes,
    movements, setMovements,
    aiMessages, setAiMessages,
    isAIOpen, setIsAIOpen,
    askAI,
    aiUser, registeredUsers, registerUser, updateUser, getUser,
    bannedDevices, banDevice, unbanDevice,
    updateDivergencia, bulkUpdateDivergencias, handleReset, iniciarProcessamento
  ]);

  return (
    <AuditContext.Provider value={contextValue}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) throw new Error('useAudit must be used within an AuditProvider');
  return context;
};
