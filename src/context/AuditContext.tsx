import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import bcrypt from 'bcryptjs';
import Cookies from 'js-cookie';
import { get as getIDB, set as setIDB, del as delIDB } from 'idb-keyval';
import { OfflineSyncManager } from '../lib/offlineManager';
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
  OAuthProvider,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuditWorker } from '../hooks/useAuditWorker';
import { useMovementsWorker } from '../hooks/useMovementsWorker';
import { mergeItemData, recalculateTotals, persistComment, calculateItemImpact } from '../utils/auditUtils';
import { safeLocalStorageSet, safeLocalStorageGet, setLargeData, getLargeData, persistAuditLog, getAuditLogs } from '../utils/storageUtils';

import { Divergencia, SAPMovementType, MaterialMovement, AuditRecipe, StockPosition, MovementColumnMapping, ShowColunas, AuditHistoryLog } from '../types/audit';

interface AuditContextType {
  ckm3ManualMapping: Record<string, string>;
  setCkm3ManualMapping: (m: Record<string, string>) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  filesNF: File[];
  setFilesNF: (files: File[]) => void;
  filesCKM3: File[];
  setFilesCKM3: (files: File[]) => void;
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
  odataUrl: string;
  setODataUrl: (url: string) => void;
  notificationSettings: {
    emailAlerts: boolean;
    managerEmail: string;
  };
  setNotificationSettings: (s: any) => void;
  showOnboarding: boolean;
  setShowOnboarding: (b: boolean) => void;
  showFinancialImpact: boolean;
  setShowFinancialImpact: (b: boolean) => void;
  showMaterialsPMM: boolean;
  setShowMaterialsPMM: (b: boolean) => void;
  showRpaAutomation: boolean;
  setShowRpaAutomation: (b: boolean) => void;
  showRecipes: boolean;
  setShowRecipes: (b: boolean) => void;
  showMovements: boolean;
  setShowMovements: (b: boolean) => void;
  showBranding: boolean;
  setShowBranding: (b: boolean) => void;
  showTaxMatrix: boolean;
  setShowTaxMatrix: (b: boolean) => void;
  powerBiPushUrl: string;
  setPowerBiPushUrl: (url: string) => void;
  powerBiDatasetId: string;
  setPowerBiDatasetId: (id: string) => void;
  powerBiPushLogs: { timestamp: string; success: boolean; message: string }[];
  addPowerBiPushLog: (log: { timestamp: string; success: boolean; message: string }) => void;
  auditLogs: AuditHistoryLog[];
  addAuditLog: (action: string, details: string) => Promise<void>;
  showColunas: ShowColunas;
  setShowColunas: React.Dispatch<React.SetStateAction<ShowColunas>>;
  filterHideZeroes: boolean;
  setFilterHideZeroes: (b: boolean) => void;
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
  initialStockFiles: File[];
  setInitialStockFiles: (files: File[]) => void;
  finalStockFiles: File[];
  setFinalStockFiles: (files: File[]) => void;
  initialStockPositions: StockPosition[];
  finalStockPositions: StockPosition[];
  initialStockHeaders: any[];
  finalStockHeaders: any[];
  selectedPlant: '1001' | '1005';
  setSelectedPlant: (plant: '1001' | '1005') => void;
  initialStockColumnMapping: MovementColumnMapping;
  setInitialStockColumnMapping: (m: MovementColumnMapping) => void;
  finalStockColumnMapping: MovementColumnMapping;
  setFinalStockColumnMapping: (m: MovementColumnMapping) => void;
  movementColumnMapping: MovementColumnMapping;
  setMovementColumnMapping: (m: MovementColumnMapping) => void;
  movementFiles: File[];
  setMovementFiles: (files: File[]) => void;
  isProcessingMovements: boolean;
  movementProcessingStatus: string;
  movementProgressPercent: number;
  processarMovimentacoes: () => Promise<void>;
  aiMessages: any[];
  setAiMessages: (msgs: any[] | ((prev: any[]) => any[])) => void;
  isAIOpen: boolean;
  setIsAIOpen: (b: boolean) => void;
  askAI: (prompt: string) => void;
  aiUser: { matricula: string; nome: string; email?: string; uid?: string } | null;
  setAiUser: (user: { matricula: string; nome: string; email?: string; uid?: string } | null) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  completeRegistration: (matricula: string) => Promise<boolean>;
  logAIInteraction: (prompt: string, response: string) => Promise<void>;
  isAuthReady: boolean;
  registeredUsers: any[];
  registerUser: (user: any) => Promise<boolean>;
  updateUser: (matricula: string, data: Partial<any>) => Promise<void>;
  getUser: (matricula: string) => Promise<any | null>;
  bannedDevices: string[];
  banDevice: (deviceId: string) => Promise<void>;
  unbanDevice: (deviceId: string) => Promise<void>;
  updateDivergencia: (id: number | string, newData: Partial<Divergencia>) => void;
  bulkUpdateDivergencias: (ids: (number | string)[], newData: Partial<Divergencia>) => void;
  aproveDivergencia: (id: number | string) => void;
  bulkAproveDivergencia: (ids: (number | string)[]) => void;
  rejeitarDivergencia: (id: number | string, motivo: string) => void;
  bulkRejeitarDivergencia: (ids: (number | string)[], motivo: string) => void;
  handleReset: () => Promise<void>;
  iniciarProcessamento: () => Promise<void>;
  recipes: AuditRecipe[];
  setRecipes: (recipes: AuditRecipe[]) => void;
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
  const [darkMode, setDarkMode] = useState(() => safeLocalStorageGet<string>('miniSapDarkMode', 'false') === 'true');
  const [filesNF, setFilesNF] = useState<File[]>([]);
  const [filesCKM3, setFilesCKM3] = useState<File[]>([]);
  const [resultado, setResultado] = useState<any | null>(null);
  const [ckm3ManualMapping, setCkm3ManualMapping] = useState<Record<string, string>>(() => {
    return safeLocalStorageGet('miniSapCkm3ManualMapping', {});
  });

  useEffect(() => {
    safeLocalStorageSet('miniSapCkm3ManualMapping', ckm3ManualMapping);
  }, [ckm3ManualMapping]);

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
    return safeLocalStorageGet('miniSapCustomPresets', {});
  });
  
  const [mapColunas, setMapColunas] = useState(() => {
    const defaultMap = {
      ckm3Centro: 'A',
      ckm3CodMat: 'A',
      ckm3Mat: 'A',
      ckm3Cat: 'A',
      ckm3CodTipoMat: 'A',
      ckm3QtdTrans: 'A',
      ckm3VlrReal: 'A',
      ckm3PrecoMedio: 'A',
      ckm3MatPrima: 'A',
      ckm3Embalagem: 'A',
      ckm3Terceiros: 'A',
      ckm3Reparo: 'A',
      ckm3MOD: 'A',
      ckm3Maquina: 'A',
      ckm3MOI: 'A',
      ckm3GGF: 'A',
      ckm3CategoriaFiltro: ['Entradas'],
      nfId: 'A',
      nfCfop: 'A',
      nfMat: 'A',
      nfPreco: 'A',
      nfQtd: 'A',
      nfFornecedor: 'A',
      nfCentro: 'A',
      nfDesc: 'A',
      nfIcms: 'A',
      nfIpi: 'A',
      nfPis: 'A',
      nfCofins: 'A',
      nfEmpresa: 'A',
      nfNumeroNF: 'A',
      nfTipoMaterial: 'A',
      nfCategoriaNF: 'A',
      nfOrigemMaterial: 'A',
      nfDataLancamento: 'A',
    };
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    if (saved && saved.mapColunas) {
      const filteredMap = Object.keys(defaultMap).reduce((acc, key) => {
        acc[key] = saved.mapColunas[key] !== undefined ? saved.mapColunas[key] : (defaultMap as any)[key];
        return acc;
      }, {} as any);
      return filteredMap;
    }
    return defaultMap;
  });

  const [tolerancia, setTolerancia] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    if (saved) {
      return saved.tolerancia || 0;
    }
    return 0;
  });

  const [cfops, setCfops] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    if (saved) {
      return saved.cfops || '1101AA, 1117AA, 1407AA, 1556AA, 2101AA';
    }
    return '1101AA, 1117AA, 1407AA, 1556AA, 2101AA';
  });

  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [colunaData, setColunaData] = useState('G');

  const [recipes, setRecipes] = useState<AuditRecipe[]>(() => {
    return safeLocalStorageGet('audit_recipes', []);
  });

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
      safeLocalStorageSet('miniSapCustomPresets', updated);
      return updated;
    });
  }, []);

  const deleteCustomPreset = useCallback((name: string) => {
    setCustomPresets(prev => {
      const updated = { ...prev };
      delete updated[name];
      safeLocalStorageSet('miniSapCustomPresets', updated);
      return updated;
    });
  }, []);

  const clearHistorico = useCallback(() => {
    setHistorico([]);
    Cookies.remove('miniSapHistory');
  }, []);

  useEffect(() => {
    safeLocalStorageSet('miniSapDarkMode', darkMode.toString());
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const [filterCfopDefault, setFilterCfopDefault] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.filterCfopDefault || '' : '';
  });
  const [filterSupplierDefault, setFilterSupplierDefault] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.filterSupplierDefault || '' : '';
  });
  const [filterTipoDefault, setFilterTipoDefault] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.filterTipoDefault || 'Todos' : 'Todos';
  });
  const [filterImpactoMinDefault, setFilterImpactoMinDefault] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.filterImpactoMinDefault || 0 : 0;
  });

  const [alertSettings, setAlertSettings] = useState(() => {
    const defaultSettings = {
      impactoMinimoAlerta: 5000,
      variacaoMinimaAlerta: 10,
      fornecedoresCriticos: []
    };
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    if (saved) {
      return { ...defaultSettings, ...(saved.alertSettings || {}) };
    }
    return defaultSettings;
  });

  const [branding, setBranding] = useState(() => {
    const defaultBranding = {
      primaryColor: '#8DC63F',
      logoUrl: '',
      companyName: 'Meu mini sap web'
    };
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    if (saved) {
      return { ...defaultBranding, ...(saved.branding || {}) };
    }
    return defaultBranding;
  });

  const [currency, setCurrency] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.currency || 'BRL' : 'BRL';
  });

  const [odataUrl, setODataUrl] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.odataUrl || '' : '';
  });

  const [notificationSettings, setNotificationSettings] = useState(() => {
    const defaultNotif = {
      emailAlerts: false,
      managerEmail: ''
    };
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    if (saved) {
      return { ...defaultNotif, ...(saved.notificationSettings || {}) };
    }
    return defaultNotif;
  });

  const [showOnboarding, setShowOnboarding] = useState(() => {
    return safeLocalStorageGet<string>('miniSapOnboardingDone', 'false') !== 'true';
  });
  const [showFinancialImpact, setShowFinancialImpact] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.showFinancialImpact || false : false;
  });
  const [showMaterialsPMM, setShowMaterialsPMM] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.showMaterialsPMM || false : false;
  });
  const [showRpaAutomation, setShowRpaAutomation] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.showRpaAutomation || false : false;
  });
  const [showRecipes, setShowRecipes] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.showRecipes ?? false : false;
  });
  const [showMovements, setShowMovements] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.showMovements ?? false : false;
  });
  const [showBranding, setShowBranding] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.showBranding ?? true : true;
  });
  const [showTaxMatrix, setShowTaxMatrix] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.showTaxMatrix ?? true : true;
  });
  const [powerBiPushUrl, setPowerBiPushUrl] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.powerBiPushUrl || '' : '';
  });
  const [powerBiDatasetId, setPowerBiDatasetId] = useState(() => {
    const saved = safeLocalStorageGet<any>('miniSapSettings', null);
    return saved ? saved.powerBiDatasetId || '' : '';
  });
  const [powerBiPushLogs, setPowerBiPushLogs] = useState<{ timestamp: string; success: boolean; message: string }[]>(() => {
    return safeLocalStorageGet('miniSapPowerBiLogs', []);
  });

  const addPowerBiPushLog = useCallback((log: { timestamp: string; success: boolean; message: string }) => {
    setPowerBiPushLogs(prev => {
      const updated = [...prev, log].slice(-50); // Keep last 50 logs
      safeLocalStorageSet('miniSapPowerBiLogs', updated);
      return updated;
    });
  }, []);

  const [auditLogs, setAuditLogs] = useState<AuditHistoryLog[]>([]);

  useEffect(() => {
    const loadLogs = async () => {
      const logs = await getAuditLogs();
      setAuditLogs(logs);
    };
    loadLogs();
  }, []);

  const [showColunas, setShowColunas] = useState<ShowColunas>(() => {
    return safeLocalStorageGet('miniSapShowColunas', {
      empresa: false,
      numeroNF: false,
      tipoMaterial: false,
      categoriaNF: false,
      origemMaterial: false,
      dataLancamento: false,
      precoSemFrete: false,
      precoComFrete: false,
      valorLiqSemFrete: false,
      valorLiqComFrete: false,
      valorTotalSemFrete: false,
      valorTotalComFrete: false,
      tipoMaterialCKM3: false,
      precoMedioCKM3: false,
      matPrimaCKM3: false,
      embalagemCKM3: false,
      terceirosCKM3: false,
      reparoCKM3: false,
      modCKM3: false,
      maquinaCKM3: false,
      moiCKM3: false,
      ggfCKM3: false,
    });
  });

  useEffect(() => {
    safeLocalStorageSet('miniSapShowColunas', showColunas);
  }, [showColunas]);
  const [filterHideZeroes, setFilterHideZeroes] = useState(false);
  
  // Load result from IndexedDB on boot
  useEffect(() => {
    getIDB('miniSap_lastResultado').then(saved => {
      if (saved) {
        setResultado(saved);
        addToast('Última auditoria carregada da memória.', 'info');
      }
    });
  }, [addToast]);

  // Persist result to IndexedDB
  useEffect(() => {
    if (resultado) {
      setIDB('miniSap_lastResultado', resultado).catch(err => {
        console.error('Erro ao persistir auditoria:', err);
      });
    }
  }, [resultado]);

  // Auto-save functionality for Tauri
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      const interval = setInterval(async () => {
        if (resultado) {
          try {
            const content = JSON.stringify(resultado);
            const { writeFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
            await writeFile('audit-recovery.json', new TextEncoder().encode(content), { baseDir: BaseDirectory.AppCache });
            console.log('Auto-save successful');
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }
      }, 600000); // 10 minutes
      return () => clearInterval(interval);
    }
  }, [resultado]);

  const [isPresentationMode, setIsPresentationMode] = useState(false);
  
  const [taxMatrix, setTaxMatrix] = useState<Record<string, number>>(() => {
    const defaultMatrix = {
      'SP': 18, 'RJ': 20, 'MG': 18, 'PR': 19, 'SC': 17, 'RS': 18, 'BA': 19, 'PE': 18, 'CE': 18, 'GO': 17,
      'MT': 17, 'MS': 17, 'ES': 17, 'AM': 18, 'PA': 17, 'MA': 18, 'RN': 18, 'PB': 18, 'AL': 18, 'SE': 18,
      'PI': 18, 'TO': 18, 'RO': 17, 'AC': 17, 'RR': 17, 'AP': 18, 'DF': 18
    };
    return safeLocalStorageGet('miniSapTaxMatrix', defaultMatrix);
  });

  const [decisionHistory, setDecisionHistory] = useState<Record<string, string>>({});
  const [justificationBase, setJustificationBase] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadLargeData = async () => {
      // Load and Migrate Initial Stock
      let initialStock = await getLargeData<StockPosition[] | null>('miniSapInitialStock', null);
      if (initialStock === null) {
        const legacy = safeLocalStorageGet<StockPosition[]>('miniSapInitialStock', []);
        initialStock = legacy;
        if (legacy.length > 0) {
          await setLargeData('miniSapInitialStock', legacy);
        }
      }

      // Load and Migrate Final Stock
      let finalStock = await getLargeData<StockPosition[] | null>('miniSapFinalStock', null);
      if (finalStock === null) {
        const legacy = safeLocalStorageGet<StockPosition[]>('miniSapFinalStock', []);
        finalStock = legacy;
        if (legacy.length > 0) {
          await setLargeData('miniSapFinalStock', legacy);
        }
      }

      // Load and Migrate Movements
      let mvts = await getLargeData<MaterialMovement[] | null>('miniSapMovements', null);
      if (mvts === null) {
        const legacy = safeLocalStorageGet<MaterialMovement[]>('miniSapMovements', []);
        mvts = legacy;
        if (legacy.length > 0) {
          await setLargeData('miniSapMovements', legacy);
        }
      }

      const history = await getLargeData('miniSapDecisionHistory', {});
      const base = await getLargeData('miniSapJustificationBase', {});
      const msgs = await getLargeData('audit_ai_messages', [
        { role: 'assistant', content: 'Olá! Sou o NatuAssist, seu assistente de auditoria inteligente. Como posso ajudar você hoje?' }
      ]);

      const initialHeaders = await getLargeData('miniSapInitialHeaders', []);
      const finalHeaders = await getLargeData('miniSapFinalHeaders', []);

      setDecisionHistory(history);
      setJustificationBase(base);
      setAiMessages(msgs);
      setInitialStockPositions(initialStock || []);
      setFinalStockPositions(finalStock || []);
      setInitialStockHeaders(initialHeaders || []);
      setFinalStockHeaders(finalHeaders || []);
      setMovements(mvts || []);
    };
    loadLargeData();
  }, []);

  useEffect(() => {
    safeLocalStorageSet('miniSapTaxMatrix', taxMatrix);
  }, [taxMatrix]);

  useEffect(() => {
    setLargeData('miniSapDecisionHistory', decisionHistory);
  }, [decisionHistory]);

  useEffect(() => {
    setLargeData('miniSapJustificationBase', justificationBase);
  }, [justificationBase]);

  const workerOptions = useMemo(() => ({
    tolerancia,
    cfops,
    dataInicio,
    dataFim,
    colunaData,
    mapColunas,
    ckm3ManualMapping,
    recipes, // Enviar receitas para o worker
    decisionHistory,
    justificationBase
  }), [tolerancia, cfops, dataInicio, dataFim, colunaData, mapColunas, ckm3ManualMapping, recipes, decisionHistory, justificationBase]);

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

  const [syncSapStatus, setSyncSapStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncSapLastDate, setSyncSapLastDate] = useState<string | null>(() => {
    const val = safeLocalStorageGet<string | null>('miniSapLastSync', null);
    return (val && typeof val === 'string') ? val : null;
  });

  const [movementTypes, setMovementTypes] = useState<SAPMovementType[]>(() => {
    const defaults: SAPMovementType[] = [
      // Produção / Compras
      { code: '101', description: 'Entrada (Produção ou Compras)', direction: 'Entrada', active: true, category: 'PRODUCTION_PURCHASE' },
      { code: '102', description: 'Estorno da entrada (Produção ou Compras)', direction: 'Saída', active: true, category: 'PRODUCTION_PURCHASE' },
      
      // Venda
      { code: '601', description: 'Venda (Produto Acabado)', direction: 'Saída', active: true, category: 'SALE' },
      { code: '602', description: 'Estorno da venda (Produto Acabado)', direction: 'Entrada', active: true, category: 'SALE' },
      
      // Devolução Entrada
      { code: '657', description: 'Devolução de entrada (Venda)', direction: 'Entrada', active: true, category: 'RETURN_ENTRY_SALE' },
      { code: '658', description: 'Estorno da devolução de entrada (Venda)', direction: 'Saída', active: true, category: 'RETURN_ENTRY_SALE' },
      { code: '653', description: 'Devolução de entrada de venda', direction: 'Entrada', active: true, category: 'RETURN_ENTRY_SALE' },
      { code: '654', description: 'Estorno devolução entrada venda', direction: 'Saída', active: true, category: 'RETURN_ENTRY_SALE' },
      
      // Devolução Compras
      { code: '122', description: 'Devolução de saída (Compras)', direction: 'Saída', active: true, category: 'RETURN_EXIT_PURCHASE' },
      { code: '123', description: 'Estorno da devolução de saída (Compras)', direction: 'Entrada', active: true, category: 'RETURN_EXIT_PURCHASE' },
      { code: '502', description: 'Devolução compras', direction: 'Saída', active: true, category: 'RETURN_EXIT_PURCHASE' },
      
      // Bonificação
      { code: '973', description: 'Bonificação (Produto Acabado)', direction: 'Saída', active: true, category: 'BONIFICATION' },
      { code: '974', description: 'Estorno da bonificação (Produto Acabado)', direction: 'Entrada', active: true, category: 'BONIFICATION' },
      { code: '967', description: 'Bonificação de brindes', direction: 'Saída', active: true, category: 'BONIFICATION' },
      { code: '968', description: 'Estorno bonificação de brindes', direction: 'Entrada', active: true, category: 'BONIFICATION' },
      
      // Outras Saídas
      { code: '541', description: 'Saída MP/Emb (Serviço Terceirizado)', direction: 'Saída', active: true, category: 'OTHER_EXIT' },
      { code: '542', description: 'Estorno saída MP/Emb (Terc.)', direction: 'Entrada', active: true, category: 'OTHER_EXIT' },
      { code: '543', description: 'Saída MP/Emb (Serviço Terceirizado)', direction: 'Saída', active: true, category: 'OTHER_EXIT' },
      { code: '544', description: 'Estorno saída MP/Emb (Terc.)', direction: 'Entrada', active: true, category: 'OTHER_EXIT' },
      { code: '975', description: 'Reposição Saque', direction: 'Saída', active: true, category: 'OTHER_EXIT' },
      { code: '976', description: 'Estorno da remessa de saque', direction: 'Entrada', active: true, category: 'OTHER_EXIT' },
      { code: '862', description: 'Saída', direction: 'Saída', active: true, category: 'OTHER_EXIT' },
      { code: '864', description: 'Estorno da saída', direction: 'Entrada', active: true, category: 'OTHER_EXIT' },
      { code: '861', description: 'Entrada', direction: 'Entrada', active: true, category: 'OTHER_EXIT' },
      
      // Perdas
      { code: '971', description: 'Perda (Saída)', direction: 'Saída', active: true, category: 'LOSS' },
      { code: '972', description: 'Estorno da perda (Saída)', direction: 'Entrada', active: true, category: 'LOSS' },
      
      // Ajuste de Saída
      { code: '702', description: 'Ajuste de Saída', direction: 'Saída', active: true, category: 'ADJUSTMENT_EXIT' },
      { code: '711', description: 'Ajuste de Saída', direction: 'Saída', active: true, category: 'ADJUSTMENT_EXIT' },
      
      // Ajuste de Entrada
      { code: '712', description: 'Ajuste de Entrada', direction: 'Entrada', active: true, category: 'ADJUSTMENT_ENTRY' },
      
      // Requisição
      { code: '201', description: 'Consumo Requisição', direction: 'Saída', active: true, category: 'REQUISITION' },
      { code: '202', description: 'Estorno Requisição', direction: 'Entrada', active: true, category: 'REQUISITION' },
      { code: '261', description: 'Consumo Produção', direction: 'Saída', active: true, category: 'REQUISITION' },
      { code: '262', description: 'Estorno Produção', direction: 'Entrada', active: true, category: 'REQUISITION' },
      { code: '333', description: 'Consumo Amostra', direction: 'Saída', active: true, category: 'REQUISITION' },
      { code: '334', description: 'Consumo Estorno Amostra', direction: 'Entrada', active: true, category: 'REQUISITION' },
      { code: 'Z61', description: 'Consumo Requisição (P&D)', direction: 'Saída', active: true, category: 'REQUISITION' },
      
      // Dinâmicos (Categoria decidida por sinal no worker)
      { code: '309', description: 'Transferência de Código', direction: 'Transferência', active: true, category: 'ADJUSTMENT_EXIT' },
      { code: '325', description: 'Transferência (I8/K8)', direction: 'Transferência', active: true, category: 'ADJUSTMENT_ENTRY' },
      { code: '321', description: 'Transferência (I8/K8)', direction: 'Transferência', active: true, category: 'ADJUSTMENT_ENTRY' }
    ];
    
    const saved = safeLocalStorageGet<SAPMovementType[]>('miniSapMovementTypes', []);
    if (!saved || saved.length === 0) return defaults;

    // Consistency check: ensure categories exist
    if (saved.some(t => !t.category)) {
      return saved.map(t => {
        if (!t.category) {
          const matchingDefault = defaults.find(d => d.code === t.code);
          return { ...t, category: matchingDefault?.category };
        }
        return t;
      });
    }
    return saved;
  });

  const [movements, setMovements] = useState<MaterialMovement[]>([]);

  const [initialStockFiles, setInitialStockFiles] = useState<File[]>([]);
  const [finalStockFiles, setFinalStockFiles] = useState<File[]>([]);
  const [initialStockPositions, setInitialStockPositions] = useState<StockPosition[]>([]);
  const [finalStockPositions, setFinalStockPositions] = useState<StockPosition[]>([]);
  const [initialStockHeaders, setInitialStockHeaders] = useState<any[]>([]);
  const [finalStockHeaders, setFinalStockHeaders] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<'1001' | '1005'>('1001');

  const [initialStockColumnMapping, setInitialStockColumnMapping] = useState<MovementColumnMapping>(() => {
    return safeLocalStorageGet('miniSapInitialStockMapping', {
      material: 0,
      description: 1,
      plant: 2,
      quantity: 3
    } as MovementColumnMapping);
  });

  const [finalStockColumnMapping, setFinalStockColumnMapping] = useState<MovementColumnMapping>(() => {
    return safeLocalStorageGet('miniSapFinalStockMapping', {
      material: 0,
      description: 1,
      plant: 2,
      quantity: 3
    } as MovementColumnMapping);
  });

  const [movementColumnMapping, setMovementColumnMapping] = useState<MovementColumnMapping>(() => {
    return safeLocalStorageGet('miniSapMovementMapping', {
      movementType: 0,    // A
      material: 1,        // B
      description: 2,     // C
      batch: 3,           // D
      quantity: 4,        // E
      storageLocation: 5, // F
      date: 6             // G
    });
  });

  useEffect(() => {
    safeLocalStorageSet('miniSapInitialStockMapping', initialStockColumnMapping);
  }, [initialStockColumnMapping]);

  useEffect(() => {
    safeLocalStorageSet('miniSapFinalStockMapping', finalStockColumnMapping);
  }, [finalStockColumnMapping]);

  useEffect(() => {
    safeLocalStorageSet('miniSapMovementMapping', movementColumnMapping);
  }, [movementColumnMapping]);


  const [movementFiles, setMovementFiles] = useState<File[]>([]);
  const { 
    isProcessing: isProcessingMovements, 
    status: movementProcessingStatus, 
    progressPercent: movementProgressPercent, 
    iniciarProcessamento: processarMovimentosWorker 
  } = useMovementsWorker();

  const processarMovimentacoes = useCallback(async () => {
    if (movementFiles.length === 0) {
      addToast('Anexe arquivos MB51 primeiro!', 'error');
      return;
    }

    try {
      // 3. Gestão de Dados: Limpar dados antigos antes de processar novos se necessário
      // (Simplified: we overwrite the specific keys in IDB which handles current data)
      setStatus('⚙️ Processando novos dados e otimizando armazenamento...');

      const result = await processarMovimentosWorker(movementFiles, initialStockFiles, finalStockFiles, selectedPlant, movementColumnMapping);
      
      const savedMovements = await setLargeData('miniSapMovements', result.movements);
      if (!savedMovements) addToast('Erro: Falha ao salvar movimentos no IndexedDB', 'error');

      if (result.initial) {
        setInitialStockPositions(result.initial);
        await setLargeData('miniSapInitialStock', result.initial);
      }
      if (result.final) {
        setFinalStockPositions(result.final);
        await setLargeData('miniSapFinalStock', result.final);
      }
      if (result.initialHeaders) {
        setInitialStockHeaders(result.initialHeaders);
        await setLargeData('miniSapInitialHeaders', result.initialHeaders);
      }
      if (result.finalHeaders) {
        setFinalStockHeaders(result.finalHeaders);
        await setLargeData('miniSapFinalHeaders', result.finalHeaders);
      }
      if (result.movements) {
        setMovements(result.movements);
      }
      addToast(`Processamento concluído com sucesso!`, 'success');
      setMovementFiles([]); // Limpar arquivos após processar
      setInitialStockFiles([]);
      setFinalStockFiles([]);
    } catch (error: any) {
      console.error('Erro no processamento de movimentos:', error);
      addToast(`Erro: ${error.message}`, 'error');
    }
  }, [movementFiles, initialStockFiles, finalStockFiles, selectedPlant, movementColumnMapping, processarMovimentosWorker, addToast, setStatus]);

  const [aiMessages, setAiMessages] = useState<any[]>([]);

  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiUser, setAiUser] = useState<{ matricula: string; nome: string; email?: string; uid?: string } | null>(null);

  const addAuditLog = useCallback(async (action: string, details: string) => {
    const newLog: AuditHistoryLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      user: aiUser?.nome || 'Anônimo',
      action,
      details
    };
    await persistAuditLog(newLog);
    setAuditLogs(prev => [...prev, newLog]);
  }, [aiUser]);
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
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      
      if (email && !email.endsWith('@natulab.com.br')) {
        await signOut(auth);
        addToast('Acesso restrito: Use apenas seu e-mail @natulab.com.br', 'error');
        return;
      }
    } catch (error) {
      console.error('Erro ao fazer login com Google:', error);
      addToast('Erro ao fazer login com Google.', 'error');
    }
  }, [addToast]);

  const loginWithMicrosoft = useCallback(async () => {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
      prompt: 'select_account',
      tenant: 'common'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      
      if (email && !email.endsWith('@natulab.com.br')) {
        await signOut(auth);
        addToast('Acesso restrito: Use apenas seu e-mail @natulab.com.br', 'error');
        return;
      }
    } catch (error) {
      console.error('Erro ao fazer login com Microsoft:', error);
      addToast('Erro ao fazer login com Microsoft.', 'error');
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
    
    if (!auth.currentUser.email?.endsWith('@natulab.com.br')) {
      addToast('Domínio de e-mail não autorizado.', 'error');
      return false;
    }

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

  const logAIInteraction = useCallback(async (prompt: string, response: string) => {
    if (!aiUser) return;
    
    const logData = {
      uid: aiUser.uid,
      userName: aiUser.nome,
      userEmail: aiUser.email,
      matricula: aiUser.matricula,
      prompt,
      response,
      timestamp: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'ai_logs', `${Date.now()}_${aiUser.uid}`), logData);
    } catch (error) {
      console.warn('Erro ao salvar log de IA:', error);
    }
  }, [aiUser]);

  useEffect(() => {
    if (aiMessages.length > 0) {
      setLargeData('audit_ai_messages', aiMessages);

      // Sincronizar com Firestore se o usuário estiver logado
      if (aiUser && aiUser.uid) {
        const chatRef = doc(db, 'users', aiUser.uid, 'chat', 'history');
        setDoc(chatRef, { messages: aiMessages, updatedAt: new Date().toISOString() }, { merge: true })
          .catch(err => console.error('Erro ao sincronizar historico:', err));
      }
    }
  }, [aiMessages, aiUser]);

  useEffect(() => {
    if (aiUser) {
      safeLocalStorageSet('audit_ai_user', aiUser);
    } else {
      localStorage.removeItem('audit_ai_user');
    }
  }, [aiUser]);

  const askAI = useCallback((prompt: string) => {
    setAiMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setIsAIOpen(true);
  }, []);

  useEffect(() => {
    safeLocalStorageSet('miniSapMovementTypes', movementTypes);
  }, [movementTypes]);

  useEffect(() => {
    setLargeData('miniSapMovements', movements);
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
      safeLocalStorageSet('miniSapLastSync', now);
      setSyncSapStatus('success');
      addToast('Sincronização com SAP concluída com sucesso!', 'success');
      setTimeout(() => setSyncSapStatus('idle'), 3000);
    } catch (error) {
      setSyncSapStatus('error');
      addToast('Erro ao sincronizar com SAP. Verifique a conexão.', 'error');
      setTimeout(() => setSyncSapStatus('idle'), 3000);
    }
  }, [addToast]);

  const updateDivergencia = useCallback((id: number | string, newData: Partial<Divergencia>) => {
    setResultado((prev: any) => {
      if (!prev) return prev;
      
      let found = false;
      const updatedDivergencias = [...prev.divergencias];
      const divIdx = updatedDivergencias.findIndex((d: Divergencia) => d.id === id);
      
      let newItem: Divergencia | null = null;

      if (divIdx !== -1) {
        newItem = mergeItemData(updatedDivergencias[divIdx], newData, taxMatrix, decisionHistory, justificationBase, recipes);
        updatedDivergencias[divIdx] = newItem;
        found = true;
      }

      let updatedTodos = prev.todosOsItens;
      if (updatedTodos) {
        updatedTodos = [...updatedTodos];
        const todoIdx = updatedTodos.findIndex((t: Divergencia) => t.id === id);
        if (todoIdx !== -1) {
          if (!newItem) {
            newItem = newItem = mergeItemData(updatedTodos[todoIdx], newData, taxMatrix, decisionHistory, justificationBase, recipes);
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
        persistComment(newItem).catch(err => console.error('Failed to persist comment:', err));
      }
      
      const totals = recalculateTotals(updatedDivergencias);

      return {
        ...prev,
        divergencias: updatedDivergencias,
        todosOsItens: updatedTodos,
        ...totals
      };
    });
  }, [taxMatrix, decisionHistory, justificationBase, recipes]);

  const bulkUpdateDivergencias = useCallback((ids: (number | string)[], newData: Partial<Divergencia>) => {
    setResultado((prev: any) => {
      if (!prev) return prev;
      
      const updatedDivergencias = [...prev.divergencias];
      let updatedTodos = prev.todosOsItens ? [...prev.todosOsItens] : null;
      let changed = false;
      
      ids.forEach(id => {
        let newItem: Divergencia | null = null;
        const divIdx = updatedDivergencias.findIndex((d: Divergencia) => d.id === id);
        
        if (divIdx !== -1) {
          newItem = mergeItemData(updatedDivergencias[divIdx], newData, taxMatrix, decisionHistory, justificationBase, recipes);
          updatedDivergencias[divIdx] = newItem;
          changed = true;
        }
        
        if (updatedTodos) {
          const todoIdx = updatedTodos.findIndex((t: Divergencia) => t.id === id);
          if (todoIdx !== -1) {
            if (!newItem) {
              newItem = mergeItemData(updatedTodos[todoIdx], newData, taxMatrix, decisionHistory, justificationBase, recipes);
            }
            updatedTodos[todoIdx] = newItem;
            changed = true;
          }
        }

        if (newItem && ('comentarios' in newData || 'status' in newData)) {
          persistComment(newItem).catch(err => console.error('Failed to persist comment:', err));
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
  }, [recipes]);

  const aproveDivergencia = useCallback((id: number | string) => {
    const userAudit = aiUser ? { nome: aiUser.nome, email: aiUser.email || '', data: new Date().toISOString() } : { nome: 'Auditor Externo', email: 'auditor@natulab.com.br', data: new Date().toISOString() };
    
    // Obter o item existente para anexar o log
    const existingItem = resultado?.divergencias.find((d: Divergencia) => d.id === id) || 
                         resultado?.todosOsItens.find((d: Divergencia) => d.id === id);

    updateDivergencia(id, {
      status: 'Aprovado',
      aprovacaoStatus: 'Aprovado',
      aprovadoPor: userAudit,
      rejeitadoPor: null,
      auditLogs: [...(existingItem?.auditLogs || []), {
        timestamp: new Date().toISOString(),
        user: userAudit.nome,
        action: 'Aprovação de Auditoria',
        currentStatus: 'Aprovado'
      }]
    } as any);
    addAuditLog('Aprovação', `Divergência ${id} aprovada.`);
  }, [aiUser, updateDivergencia, resultado, addAuditLog]);

  const bulkAproveDivergencia = useCallback((ids: (number | string)[]) => {
    ids.forEach(id => aproveDivergencia(id));
    addToast(`${ids.length} divergências aprovadas com sucesso!`, 'success');
  }, [aproveDivergencia, addToast]);

  const rejeitarDivergencia = useCallback((id: number | string, motivo: string) => {
    const userAudit = aiUser ? { nome: aiUser.nome, email: aiUser.email || '', data: new Date().toISOString() } : { nome: 'Auditor Externo', email: 'auditor@natulab.com.br', data: new Date().toISOString() };
    
    // Obter o item existente
    const existingItem = resultado?.divergencias.find((d: Divergencia) => d.id === id) || 
                         resultado?.todosOsItens.find((d: Divergencia) => d.id === id);

    updateDivergencia(id, {
      status: 'Ajuste Rejeitado',
      aprovacaoStatus: 'Rejeitado',
      rejeitadoPor: { ...userAudit, motivo },
      aprovadoPor: null,
      auditLogs: [...(existingItem?.auditLogs || []), {
        timestamp: new Date().toISOString(),
        user: userAudit.nome,
        action: `Rejeição de Auditoria: ${motivo}`,
        currentStatus: 'Ajuste Rejeitado'
      }]
    } as any);
    addAuditLog('Rejeição', `Divergência ${id} rejeitada: ${motivo}`);
  }, [aiUser, updateDivergencia, resultado, addAuditLog]);

  const bulkRejeitarDivergencia = useCallback((ids: (number | string)[], motivo: string) => {
    ids.forEach(id => rejeitarDivergencia(id, motivo));
    addToast(`${ids.length} divergências rejeitadas com sucesso!`, 'info');
  }, [rejeitarDivergencia, addToast]);

  useEffect(() => {
    const settingsSaved = safeLocalStorageSet('miniSapSettings', {
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
      showFinancialImpact,
      powerBiPushUrl,
      powerBiDatasetId
    });
    
    if (!settingsSaved) {
      // Don't toast constantly, but log it
      console.warn('Could not save settings to localStorage due to quota.');
    }

    // Apply primary color to CSS variable
    document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
    // Also update tailwind primary if possible, but for now we use style property
  }, [mapColunas, tolerancia, cfops, filterCfopDefault, filterSupplierDefault, filterTipoDefault, filterImpactoMinDefault, alertSettings, branding]);

  const iniciarProcessamento = useCallback(async () => {
    try {
      const res = await iniciarProcessamentoWorker(filesNF, filesCKM3);
      
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
  }, [filesNF, filesCKM3, iniciarProcessamentoWorker, taxMatrix, decisionHistory, justificationBase]);

  const handleReset = useCallback(async () => {
    setFilesNF([]);
    setFilesCKM3([]);
    setResultado(null);
    setStatus('');
    setWarnings([]);
    setProgressPercent(0);
    setIsProcessing(false);
    setMovements([]);
    setInitialStockPositions([]);
    setFinalStockPositions([]);
    setInitialStockHeaders([]);
    setFinalStockHeaders([]);
    setInitialStockFiles([]);
    setFinalStockFiles([]);
    setMovementFiles([]);
    
    // Clear IndexedDB
    await Promise.all([
      delIDB('miniSap_lastResultado'),
      delIDB('miniSapInitialStock'),
      delIDB('miniSapFinalStock'),
      delIDB('miniSapMovements'),
      delIDB('miniSapInitialHeaders'),
      delIDB('miniSapFinalHeaders'),
      delIDB('miniSapDecisionHistory'),
      delIDB('miniSapJustificationBase'),
      delIDB('audit_ai_messages')
    ]).catch(() => {});
  }, []);

  const contextValue = React.useMemo(() => ({
    ckm3ManualMapping, setCkm3ManualMapping,
    darkMode, setDarkMode,
    filesNF, setFilesNF,
    filesCKM3, setFilesCKM3,
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
    odataUrl, setODataUrl,
    notificationSettings, setNotificationSettings,
    showOnboarding, setShowOnboarding,
    showFinancialImpact, setShowFinancialImpact,
    showMaterialsPMM, setShowMaterialsPMM,
    showRpaAutomation, setShowRpaAutomation,
    showRecipes, setShowRecipes,
    showMovements, setShowMovements,
    showBranding, setShowBranding,
    showTaxMatrix, setShowTaxMatrix,
    powerBiPushUrl, setPowerBiPushUrl,
    powerBiDatasetId, setPowerBiDatasetId,
    powerBiPushLogs, addPowerBiPushLog,
    auditLogs, addAuditLog,
    showColunas, setShowColunas,
    filterHideZeroes, setFilterHideZeroes,
    isPresentationMode, setIsPresentationMode,
    taxMatrix, setTaxMatrix,
    decisionHistory, justificationBase,
    syncSapStatus, syncSapLastDate, syncSapData,
    movementTypes, setMovementTypes,
    movements, setMovements,
    aiMessages, setAiMessages,
    isAIOpen, setIsAIOpen,
    askAI,
    logAIInteraction,
    aiUser, setAiUser,
    loginWithGoogle, loginWithMicrosoft, logout, completeRegistration, isAuthReady,
    registeredUsers, registerUser, updateUser, getUser,
    bannedDevices, banDevice, unbanDevice,
    updateDivergencia, bulkUpdateDivergencias,
    aproveDivergencia, bulkAproveDivergencia, rejeitarDivergencia, bulkRejeitarDivergencia,
    handleReset,
    iniciarProcessamento,
    movementFiles, setMovementFiles,
    initialStockFiles, setInitialStockFiles,
    finalStockFiles, setFinalStockFiles,
    initialStockPositions, finalStockPositions,
    initialStockHeaders, finalStockHeaders,
    selectedPlant, setSelectedPlant,
    initialStockColumnMapping, setInitialStockColumnMapping,
    finalStockColumnMapping, setFinalStockColumnMapping,
    movementColumnMapping, setMovementColumnMapping,
    isProcessingMovements, movementProcessingStatus, movementProgressPercent,
    processarMovimentacoes,
    recipes: recipes || [],
    setRecipes
  }), [
    ckm3ManualMapping,
    darkMode, filesNF, filesCKM3, resultado, status, warnings, progressPercent, 
    toasts, addToast, isProcessing, historico, clearHistorico, mapColunas, 
    customPresets, saveCustomPreset, deleteCustomPreset, tolerancia, cfops, 
    dataInicio, dataFim, colunaData, filterCfopDefault, filterSupplierDefault, 
    filterTipoDefault, filterImpactoMinDefault, alertSettings, branding, 
    currency, notificationSettings, showOnboarding,
    showFinancialImpact,
    showMaterialsPMM,
    showRpaAutomation,
    showRecipes,
    showMovements,
    showBranding,
    showTaxMatrix,
    powerBiPushUrl,
    powerBiDatasetId,
    powerBiPushLogs,
    showColunas,
    filterHideZeroes,
    isPresentationMode, 
    taxMatrix, decisionHistory, justificationBase,
    syncSapStatus, syncSapLastDate, syncSapData,
    movementTypes, setMovementTypes,
    movements, setMovements,
    aiMessages, setAiMessages,
    isAIOpen, setIsAIOpen,
    askAI,
    aiUser, loginWithGoogle, loginWithMicrosoft, logout, completeRegistration, isAuthReady,
    logAIInteraction,
    registeredUsers, registerUser, updateUser, getUser,
    bannedDevices, banDevice, unbanDevice,
    updateDivergencia, bulkUpdateDivergencias, handleReset, iniciarProcessamento,
    movementFiles, 
    initialStockFiles, 
    finalStockFiles, 
    initialStockPositions, 
    finalStockPositions,
    initialStockHeaders,
    finalStockHeaders,
    selectedPlant,
    movementColumnMapping,
    isProcessingMovements, movementProcessingStatus, movementProgressPercent,
    processarMovimentacoes,
    recipes
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
