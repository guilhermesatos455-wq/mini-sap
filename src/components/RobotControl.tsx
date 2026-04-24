import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Play, 
  CheckCircle, 
  AlertCircle,
  FileJson,
  MousePointer2,
  RefreshCw,
  MousePointer,
  ArrowRightCircle,
  Clock,
  Settings,
  Keyboard,
  Type,
  FastForward,
  Terminal,
  ShieldAlert,
  Info,
  Cpu,
  Zap,
  Eye
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { motion, AnimatePresence } from 'framer-motion';

interface RobotAction {
  id: string;
  type: 'click_left' | 'click_right' | 'move_mouse' | 'wait' | 'type_text' | 'press_key' | 'hotkey' | 'terminal_command' | 'wait_pixel';
  x?: number;
  y?: number;
  duration?: number; // seconds
  text?: string;
  key?: string;
  color?: string; // For pixel monitoring (HEX or RGB)
}

interface RobotItem {
  id: string;
  material: string;
  target?: string; // Which SAP transaction or field
  status: 'pending' | 'completed' | 'error';
}

const MAX_BOT_ITEMS = 25;

const RobotControl: React.FC = () => {
  const { darkMode } = useAudit();
  const [items, setItems] = useState<RobotItem[]>(() => {
    const saved = localStorage.getItem('robot_items');
    return saved ? JSON.parse(saved) : [
      { id: '1', material: 'MAT-0001', status: 'pending' },
      { id: '2', material: 'MAT-0002', status: 'pending' }
    ];
  });
  
  const [actions, setActions] = useState<RobotAction[]>(() => {
    const saved = localStorage.getItem('robot_actions');
    return saved ? JSON.parse(saved) : [
      { id: '1', type: 'move_mouse', x: 100, y: 100 },
      { id: '2', type: 'click_left' }
    ];
  });

  const [globalInterval, setGlobalInterval] = useState<number>(0.5);
  const [newMaterial, setNewMaterial] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number | null>(null);
  const [simPos, setSimPos] = useState({ x: 0, y: 0 });

  const runSimulation = () => {
    if (isSimulating || actions.length === 0) return;
    
    setIsSimulating(true);
    let step = 0;
    
    const nextStep = () => {
      if (step >= actions.length) {
        setIsSimulating(false);
        setSimStep(null);
        return;
      }
      
      const currentAction = actions[step];
      setSimStep(step);
      
      if (currentAction.x !== undefined && currentAction.y !== undefined) {
        setSimPos({ x: currentAction.x, y: currentAction.y });
      } else {
        // Random slight movement for abstract actions like "Enter" or "Click" if no pos
        // But better is to just maintain current pos
      }
      
      step++;
      setTimeout(nextStep, 1000); // 1s per step for visibility
    };
    
    nextStep();
  };
  
  useEffect(() => {
    localStorage.setItem('robot_items', JSON.stringify(items));
    localStorage.setItem('robot_actions', JSON.stringify(actions));
  }, [items, actions]);

  const addItem = () => {
    if (!newMaterial.trim()) return;
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      material: newMaterial.toUpperCase(),
      status: 'pending'
    }]);
    setNewMaterial('');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const addAction = (type: RobotAction['type']) => {
    const newAction: RobotAction = {
      id: crypto.randomUUID(),
      type,
      ...(type === 'move_mouse' ? { x: 0, y: 0 } : {}),
      ...(type === 'wait' ? { duration: 1 } : {}),
      ...(type === 'type_text' ? { text: '' } : {}),
      ...(type === 'terminal_command' ? { text: '' } : {}),
      ...(type === 'press_key' ? { key: 'enter' } : {}),
      ...(type === 'hotkey' ? { text: 'ctrl,c' } : {}),
      ...(type === 'wait_pixel' ? { x: 0, y: 0, color: '#00FF00' } : {})
    };
    setActions(prev => [...prev, newAction]);
  };

  const removeAction = (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id));
  };

  const updateAction = (id: string, updates: Partial<RobotAction>) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const exportScript = () => {
    const script = {
      name: `RPA_Script_${new Date().toISOString().split('T')[0]}`,
      interval: globalInterval,
      actions: actions.map(({ id, ...rest }) => rest) // Remove IDs for generic export
    };
    const blob = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot_script_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importScript = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.actions && Array.isArray(json.actions)) {
          const newActions = json.actions.map((a: any) => ({
            ...a,
            id: crypto.randomUUID()
          }));
          setActions(newActions);
          if (json.interval) setGlobalInterval(json.interval);
          setImportStatus({ type: 'success', message: "Script carregado com sucesso!" });
        } else {
          throw new Error("Formato de script inválido.");
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: "Erro ao carregar script. Verifique o arquivo." });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const downloadManifest = () => {
    // Security Lock: Prevent mass posting
    if (items.length > MAX_BOT_ITEMS) {
      setImportStatus({ 
        type: 'error', 
        message: `TRAVA DE SEGURANÇA: Limite de ${MAX_BOT_ITEMS} itens por execução excedido para evitar lançamentos em massa e bloqueios no SAP.` 
      });
      return;
    }

    const manifest = {
      timestamp: new Date().toISOString(),
      materials: items.map(i => i.material),
      config: {
        failsafe: true,
        pause: globalInterval,
        actions: actions.map(a => ({
          type: a.type,
          x: a.x,
          y: a.y,
          duration: a.duration,
          text: a.text,
          key: a.key
        }))
      }
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bot_manifest_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        console.log("Dados do bot importados:", json);
        setImportStatus({ type: 'success', message: `Importados ${json.length || 0} registros com sucesso!` });
        
        // Mock update status of items
        setItems(prev => prev.map(item => {
          const found = json.find((j: any) => j.material === item.material);
          return found ? { ...item, status: 'completed' } : item;
        }));
      } catch (err) {
        setImportStatus({ type: 'error', message: "Arquivo JSON inválido." });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Manifest Builder */}
        <div className="lg:col-span-2 space-y-6">
          <section className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 mb-6">
                <Settings className="w-4 h-4 text-brand-green" />
                1. Script Personalizado (Passos do Bot)
            </h3>

            <div className="flex gap-2 mb-6">
                <button 
                  onClick={exportScript}
                  className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:text-brand-green' : 'bg-gray-50 border-gray-100 hover:text-brand-green'}`}
                  title="Exportar apenas a sequência de ações"
                >
                  <Download className="w-3 h-3" /> Exportar Script
                </button>
                <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 hover:text-brand-green' : 'bg-gray-50 border-gray-100 hover:text-brand-green'}`}>
                  <Upload className="w-3 h-3" /> Importar Script
                  <input type="file" accept=".json" onChange={importScript} className="hidden" />
                </label>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
                <button 
                  onClick={() => addAction('move_mouse')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-brand-green' : 'bg-gray-50 border-gray-100 hover:border-brand-green'}`}
                >
                  <MousePointer className="w-4 h-4" /> Mouse (X,Y)
                </button>
                <button 
                  onClick={() => addAction('click_left')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-brand-green' : 'bg-gray-50 border-gray-100 hover:border-brand-green'}`}
                >
                  <ArrowRightCircle className="w-4 h-4" /> Click Esq.
                </button>
                <button 
                  onClick={() => addAction('click_right')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-brand-green' : 'bg-gray-50 border-gray-100 hover:border-brand-green'}`}
                >
                  <ArrowRightCircle className="w-4 h-4 rotate-180" /> Click Dir.
                </button>
                <button 
                  onClick={() => addAction('wait')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-brand-green' : 'bg-gray-50 border-gray-100 hover:border-brand-green'}`}
                >
                  <Clock className="w-4 h-4" /> Pausa (s)
                </button>
                <button 
                  onClick={() => addAction('type_text')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-brand-green' : 'bg-gray-50 border-gray-100 hover:border-brand-green'}`}
                >
                  <Type className="w-4 h-4" /> Digitar Texto
                </button>
                <button 
                  onClick={() => addAction('press_key')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-brand-green' : 'bg-gray-50 border-gray-100 hover:border-brand-green'}`}
                >
                  <Keyboard className="w-4 h-4" /> Tecla (ENTER...)
                </button>
                <button 
                  onClick={() => addAction('hotkey')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-brand-green' : 'bg-gray-50 border-gray-100 hover:border-brand-green'}`}
                >
                  <FastForward className="w-4 h-4" /> Atalho (Ctrl+C)
                </button>
                <button 
                  onClick={() => addAction('terminal_command')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-brand-green' : 'bg-gray-50 border-gray-100 hover:border-brand-green'}`}
                >
                  <Terminal className="w-4 h-4" /> CMD (Executar App)
                </button>
                <button 
                  onClick={() => addAction('wait_pixel')}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:border-brand-green' : 'bg-gray-50 border-gray-100 hover:border-brand-green'}`}
                >
                  <Eye className="w-4 h-4" /> Pixel (Aguardar Cor)
                </button>
            </div>

            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase text-slate-500">Lista de Ações RPA</h4>
                  <button 
                    onClick={runSimulation}
                    disabled={isSimulating || actions.length === 0}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                      isSimulating 
                        ? 'bg-indigo-500/20 text-indigo-400 opacity-50' 
                        : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
                    }`}
                  >
                    {isSimulating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    Simular Caminho
                  </button>
                </div>

                {/* Simulation Screen */}
                <div className={`relative aspect-video rounded-2xl border overflow-hidden bg-slate-950/40 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  {/* Mock SAP Elements */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
                    <div className="h-4 bg-slate-700 w-full mb-1" />
                    <div className="p-2 space-y-1">
                      <div className="flex gap-1"><div className="w-8 h-2 bg-slate-700" /><div className="w-16 h-2 bg-slate-700" /></div>
                      <div className="w-full h-1 bg-slate-800" />
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1"><div className="h-2 bg-slate-700 w-1/2" /><div className="h-4 bg-slate-800" /></div>
                        <div className="space-y-1"><div className="h-2 bg-slate-700 w-1/3" /><div className="h-4 bg-slate-800" /></div>
                      </div>
                    </div>
                  </div>

                  {/* Step Markers / Path */}
                  {actions.map((a, i) => (
                    a.x !== undefined && a.y !== undefined && (
                      <div 
                        key={i}
                        className={`absolute w-1 h-1 rounded-full transition-all duration-300 ${
                          simStep === i ? 'bg-[#8DC63F] scale-[3] ring-4 ring-[#8DC63F]/20' : 'bg-slate-700 opacity-30'
                        }`}
                        style={{ 
                          left: `${(a.x / 1920) * 100}%`, 
                          top: `${(a.y / 1080) * 100}%` 
                        }}
                      />
                    )
                  ))}

                  {/* The Cursor */}
                  <motion.div 
                    animate={{ 
                      x: `${(simPos.x / 1920) * 100}%`,
                      y: `${(simPos.y / 1080) * 100}%`
                    }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className={`absolute w-5 h-5 z-10 pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2 ${isSimulating ? 'opacity-100' : 'opacity-0'}`}
                    style={{ top: 0, left: 0 }}
                  >
                    <MousePointer2 className="w-4 h-4 text-brand-green fill-brand-green drop-shadow-md" />
                    {simStep !== null && (
                      <div className="absolute left-full ml-1 whitespace-nowrap bg-brand-green text-white text-[7px] font-black px-1 py-0.5 rounded uppercase">
                        {actions[simStep].type.replace('_', ' ')}
                      </div>
                    )}
                  </motion.div>

                  {!isSimulating && actions.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-[10px] text-slate-500 italic">Defina as coordenadas X/Y para visualizar o caminho do bot em HD.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {actions.length === 0 ? (
                <div className="text-center py-8 opacity-40 italic text-xs">Nenhum passo configurado.</div>
              ) : (
                actions.map((action, index) => (
                  <div key={action.id} className={`flex items-center gap-3 p-3 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="w-6 h-6 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center text-[10px] font-black">{index + 1}</div>
                    
                    <div className="flex-1 flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-black uppercase w-20">{action.type.replace('_', ' ')}</span>
                      
                      {action.type === 'move_mouse' && (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            placeholder="X" 
                            value={action.x} 
                            onChange={(e) => updateAction(action.id, { x: Number(e.target.value) })}
                            className={`w-16 p-1 rounded border text-[10px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                          />
                          <input 
                            type="number" 
                            placeholder="Y" 
                            value={action.y} 
                            onChange={(e) => updateAction(action.id, { y: Number(e.target.value) })}
                            className={`w-16 p-1 rounded border text-[10px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                          />
                        </div>
                      )}

                      {action.type === 'wait' && (
                        <input 
                          type="number" 
                          placeholder="Segundos" 
                          value={action.duration} 
                          onChange={(e) => updateAction(action.id, { duration: Number(e.target.value) })}
                          className={`w-20 p-1 rounded border text-[10px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                        />
                      )}

                      {action.type === 'type_text' && (
                        <input 
                          type="text" 
                          placeholder="Texto a digitar..." 
                          value={action.text} 
                          onChange={(e) => updateAction(action.id, { text: e.target.value })}
                          className={`flex-1 min-w-[120px] p-1 rounded border text-[10px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                        />
                      )}

                      {action.type === 'press_key' && (
                        <select 
                          value={action.key} 
                          onChange={(e) => updateAction(action.id, { key: e.target.value })}
                          className={`w-32 p-1 rounded border text-[10px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                        >
                          <option value="enter">ENTER</option>
                          <option value="tab">TAB</option>
                          <option value="esc">ESC</option>
                          <option value="f1">F1</option>
                          <option value="f3">F3 (Voltar)</option>
                          <option value="f8">F8 (Executar)</option>
                          <option value="up">Cima</option>
                          <option value="down">Baixo</option>
                        </select>
                      )}

                      {action.type === 'hotkey' && (
                        <input 
                          type="text" 
                          placeholder="Ex: ctrl,c" 
                          value={action.text} 
                          onChange={(e) => updateAction(action.id, { text: e.target.value })}
                          className={`w-32 p-1 rounded border text-[10px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                        />
                      )}

                      {action.type === 'terminal_command' && (
                        <div className="flex-1 flex items-center gap-2">
                          <Terminal className="w-3 h-3 opacity-50" />
                          <input 
                            type="text" 
                            placeholder="Comando (ex: start notepad)..." 
                            value={action.text} 
                            onChange={(e) => updateAction(action.id, { text: e.target.value })}
                            className={`flex-1 min-w-[150px] p-1 rounded border text-[10px] font-mono ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                          />
                        </div>
                      )}

                      {action.type === 'wait_pixel' && (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            placeholder="X" 
                            value={action.x} 
                            onChange={(e) => updateAction(action.id, { x: Number(e.target.value) })}
                            className={`w-14 p-1 rounded border text-[10px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                          />
                          <input 
                            type="number" 
                            placeholder="Y" 
                            value={action.y} 
                            onChange={(e) => updateAction(action.id, { y: Number(e.target.value) })}
                            className={`w-14 p-1 rounded border text-[10px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                          />
                          <input 
                            type="text" 
                            placeholder="#HEX" 
                            value={action.color} 
                            onChange={(e) => updateAction(action.id, { color: e.target.value })}
                            className={`w-20 p-1 rounded border text-[10px] font-mono ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                          />
                          <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: action.color }} />
                        </div>
                      )}
                    </div>

                    <button onClick={() => removeAction(action.id)} className="text-red-500 opacity-50 hover:opacity-100 transition-all">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

            <div className="pt-4 border-t border-dashed border-slate-700/30">
              <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Intervalo entre Cliques (Global)</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="0.1" 
                  max="5" 
                  step="0.1" 
                  value={globalInterval} 
                  onChange={(e) => setGlobalInterval(Number(e.target.value))}
                  className="flex-1 accent-brand-green"
                />
                <span className="text-xs font-bold w-12 text-right">{globalInterval}s</span>
              </div>
            </div>
          </section>

          <section className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <Download className="w-4 h-4 text-brand-green" />
                    2. Lista de Materiais
                    <span className="text-[9px] font-black bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                      🔒 Max: {MAX_BOT_ITEMS}
                    </span>
                </h3>
                <button 
                    onClick={downloadManifest}
                    className="flex items-center gap-2 bg-brand-green text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20"
                >
                    <FileJson className="w-4 h-4" />
                    Gerar Script RPA (.json)
                </button>
            </div>

            <div className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    placeholder="Ex: MAT-1234..."
                    className={`flex-1 px-4 py-2 rounded-xl border text-sm outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-brand-green/50' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-brand-green/50'}`}
                />
                <button onClick={addItem} className="p-2 bg-brand-green text-white rounded-xl hover:bg-brand-green/90 transition-all">
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            <div className="space-y-2">
                {items.length === 0 ? (
                    <div className="text-center py-12 opacity-40 italic text-sm">Nenhum material na lista.</div>
                ) : (
                    items.map((item) => (
                        <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                                <span className="font-bold font-mono">{item.material}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${item.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {item.status}
                                </span>
                                <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </section>

          <section className={`p-6 rounded-3xl border border-dashed ${darkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50/50 border-indigo-200'}`}>
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <MousePointer2 className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-500 mb-1 leading-none">Guia de Uso (AFK)</h4>
                        <p className="text-xs opacity-70 leading-relaxed">
                            1. Baixe o arquivo JSON acima. <br />
                            2. Aponte seu script Python para ler esse novo arquivo. <br />
                            3. Use <code className="bg-indigo-500/10 px-1 rounded">pyautogui.FAILSAFE = True</code> para abortar movendo o mouse para o canto da tela.
                        </p>
                    </div>
                </div>
          </section>

          <section className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-4 text-amber-500">
                    <ShieldAlert className="w-4 h-4" />
                    Boas Práticas RPA (Segurança SAP)
                </h3>

                <div className={`mb-6 p-4 rounded-2xl border-2 border-red-500/20 bg-red-500/5 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-xs font-black uppercase tracking-tight">Restrição de Escopo e Segurança</p>
                    </div>
                    <p className="text-[11px] leading-relaxed font-medium mb-3">
                        Está <strong>totalmente fora de questão</strong> utilizar o Bot para preenchimento de campos em massa ou lançamentos de documentos ("plantinhas") no SAP. 
                        Esta ferramenta possui uma trava rígida de <strong>{MAX_BOT_ITEMS} materiais</strong> por execução para proteger sua conta TI.
                    </p>
                    <div className="p-3 bg-red-500/10 rounded-xl mb-3 border border-red-500/20">
                        <p className="text-[10px] leading-relaxed">
                            <strong>Monitoramento Técnico SAP:</strong> O servidor monitora pacotes via <code>SM20</code> (Audit Log) e detecta sequências de <code>COMMIT WORK</code> em milissegundos. Automações acima do limite disparam alertas automáticos no <strong>GRC (Governance, Risk, and Compliance)</strong>, resultando no bloqueio imediato do ID por comportamento anômalo.
                        </p>
                    </div>
                    <div className="flex items-start gap-2 pt-2 border-t border-red-500/10">
                        <ShieldAlert className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] italic leading-tight opacity-90">
                            <strong>Atenção:</strong> O Bot possui travas de segurança internas para estes casos. O servidor SAP também monitora o tráfego; caso o usuário consiga burlar a trava do programa, o SAP identificará o comportamento anômalo e poderá efetuar o <strong>bloqueio imediato do usuário</strong> por suspeita de ataque ou uso indevido.
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="flex gap-3">
                            <div className="w-1 h-auto bg-amber-500/30 rounded-full" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-amber-500/80 mb-1">1. Ritmo Humano</p>
                                <p className="text-[11px] leading-relaxed opacity-70">
                                    Evite processar 10 itens por segundo. Use <strong>pausas dinâmicas</strong> (Ex: `random.uniform(1.5, 3.0)`) e `pyautogui.PAUSE` para simular o tempo de resposta do servidor e evitar bloqueios da TI.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <div className="w-1 h-auto bg-amber-500/30 rounded-full" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-amber-500/80 mb-1">2. Navegação Inteligente</p>
                                <p className="text-[11px] leading-relaxed opacity-70">
                                    Prefira atalhos: Use <code className="bg-amber-500/10 px-1 rounded">/nCKM3</code> para limpar a sessão anterior. Utilize <strong>F8</strong> e <strong>TAB</strong> em vez de cliques absolutos para maior estabilidade se janelas de dicas aparecerem.
                                </p>
                            </div>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                            <div className="flex items-center gap-2">
                                <Info className="w-3 h-3 text-amber-500" />
                                <p className="text-[10px] font-bold text-amber-500">Dica de Especialista</p>
                            </div>
                            <p className="text-[10px] opacity-60 italic leading-tight mb-2">
                                Use <code className="bg-amber-500/10 px-1 rounded">pyautogui.screenshot().getpixel()</code> para cores exatas. Evite rodar scripts simultâneos para não saturar a rede do SAP.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-1 h-auto bg-amber-500/30 rounded-full" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-amber-500/80 mb-1 flex items-center gap-1">
                                    <Eye className="w-2 h-2" /> 5. Sincronia Visual
                                </p>
                                <p className="text-[11px] leading-relaxed opacity-70">
                                    A forma mais segura de evitar que o bot "atropele" o SAP é o <strong>Pixel Monitoring</strong>. O bot só deve continuar se um pixel específico (Ex: barra de status) mudar para a cor esperada.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-3">
                            <div className="w-1 h-auto bg-amber-500/30 rounded-full" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-amber-500/80 mb-1">3. Gestão de Sessão</p>
                                <p className="text-[11px] leading-relaxed opacity-70">
                                    Cada janela aberta consome recursos do servidor. Garanta que o bot volte para a <strong>tela inicial</strong> antes de iniciar o próximo item da lista.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-1 h-auto bg-amber-500/30 rounded-full" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-amber-500/80 mb-1 flex items-center gap-1">
                                        <Cpu className="w-2 h-2" /> 4. Sensor de Performance
                                    </p>
                                    <p className="text-[11px] leading-relaxed opacity-70">
                                        Se a CPU superaquece (Thermal Throttling), o SAP fica lento. Monitore o <strong>Clock</strong> e o <strong>Uso</strong> para evitar cliques em telas travadas.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <div className="w-1 h-auto bg-amber-500/30 rounded-full" />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-amber-500/80 mb-1 flex items-center gap-1">
                                        <MousePointer2 className="w-2 h-2" /> 6. Movimentos Humanizados
                                    </p>
                                    <p className="text-[11px] leading-relaxed opacity-70">
                                        Evite o <code className="bg-amber-500/10 px-1 rounded">moveTo</code> linear. Use a <strong>Curva de Bézier Cúbica</strong> para gerar trajetórias orgânicas com aceleração e frenagem (Ease In/Out).
                                    </p>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 text-indigo-500" />
                                    <p className="text-[10px] font-bold text-indigo-500">Curiosidade: O SAP "Sente" você?</p>
                                </div>
                                <p className="text-[9px] opacity-70 leading-tight">
                                    Ergonomia de cliques no SAP moderno registra telemetria. Se você clica sempre no <strong>centro exato</strong> do botão com tempo fixo, o sistema marca o ID. Use <code className="bg-indigo-500/10 px-0.5">random.randint(-3, 3)</code> no alvo final para ser "invisível".
                                </p>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-amber-500/10 bg-amber-500/5">
                                <table className="w-full text-[9px] text-left">
                                    <thead className="bg-amber-500/10 text-amber-600 font-black uppercase">
                                        <tr>
                                            <th className="p-2">Indicador</th>
                                            <th className="p-2">Gatilho SLEEP</th>
                                            <th className="p-2">Gatilho VOLTAR</th>
                                        </tr>
                                    </thead>
                                    <tbody className="opacity-70">
                                        <tr className="border-t border-amber-500/5">
                                            <td className="p-2 font-bold">Uso CPU</td>
                                            <td className="p-2 text-red-500 font-bold">&gt; 85%</td>
                                            <td className="p-2 text-green-600 font-bold">&lt; 45%</td>
                                        </tr>
                                        <tr className="border-t border-amber-500/5">
                                            <td className="p-2 font-bold">Clock CPU</td>
                                            <td className="p-2 text-red-500 font-bold">&lt; 1.3 GHz</td>
                                            <td className="p-2 text-green-600 font-bold">&gt; 2.0 GHz</td>
                                        </tr>
                                        <tr className="border-t border-amber-500/5">
                                            <td className="p-2 font-bold">Temp.</td>
                                            <td className="p-2 text-red-500 font-bold">&gt; 90°C</td>
                                            <td className="p-2 text-green-600 font-bold">&lt; 75°C</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-2 rounded bg-black/5 dark:bg-black/20 font-mono text-[9px] opacity-70 border border-amber-500/5">
                                <div className="flex items-center gap-1 text-amber-500/80 mb-1">
                                    <Zap className="w-2 h-2" /> snippet psutil (Inteligência)
                                </div>
                                <code className="block text-blue-400">def sistema_esta_saudavel():</code>
                                <code className="block ml-2">cpu = psutil.cpu_percent(0.5)</code>
                                <code className="block ml-2">freq = psutil.cpu_freq().current</code>
                                <code className="block ml-2 text-amber-500">if cpu &gt; 85 or freq &lt; 1300:</code>
                                <code className="block ml-4 text-gray-500">return False # Modo Sleep</code>
                                <code className="block ml-2 text-green-500">return True # Segue Bot</code>
                            </div>
                        </div>
                    </div>
                </div>
          </section>
        </div>

        {/* Sync Panel */}
        <div className="space-y-6">
            <section className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-xl shadow-gray-200/50'}`}>
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 mb-6">
                    <RefreshCw className="w-4 h-4 text-brand-green" />
                    3. Sincronizar Resultados
                </h3>

                <div className="p-8 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-3xl bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all text-center">
                    <label className="cursor-pointer block">
                        <Upload className="w-10 h-10 text-brand-green mx-auto mb-3 opacity-50" />
                        <span className="text-sm font-bold text-gray-500 block mb-2">Importar JSON do Bot</span>
                        <span className="text-[10px] text-gray-400">Arraste ou clique para selecionar</span>
                        <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                </div>

                {importStatus && (
                    <div className={`mt-6 p-4 rounded-2xl flex items-start gap-3 ${importStatus.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {importStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <div className="text-sm font-bold">{importStatus.message}</div>
                    </div>
                )}
            </section>

            <div className={`p-6 rounded-3xl border border-amber-500/20 bg-amber-500/5 text-amber-500`}>
                <h4 className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Play className="w-3 h-3" /> Status do Bot
                </h4>
                <p className="text-[10px] leading-relaxed opacity-80">
                    O bot deve estar rodando localmente. Este painel apenas gerencia os dados de entrada/saída para garantir que sua sessão SAP permaneça segura.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RobotControl;
