import React, { useState, useEffect } from 'react';
import { QHSEState, ProcessNode, ProcessEdge, Capa, Risk, OKR, QhseEvent, RegulatoryRequirement, Equipment, DocumentedInfo, Audit } from './types';
import { INITIAL_STATE, DEMO_STATE } from './initialData';
import { DashboardOverview } from './components/DashboardOverview';
import { ProcessMap } from './components/ProcessMap';
import { CapaModule } from './components/CapaModule';
import { RiskModule } from './components/RiskModule';
import { OkrModule } from './components/OkrModule';
import { QhseEventsModule } from './components/QhseEventsModule';
import { RegulatoryRequirementsModule } from './components/RegulatoryRequirementsModule';
import { EquipmentInventoryModule } from './components/EquipmentInventoryModule';
import { DocumentedInformationModule } from './components/DocumentedInformationModule';
import { AuditsModule } from './components/AuditsModule';

import { 
  ShieldCheck, 
  Map, 
  CheckSquare, 
  AlertTriangle, 
  Target, 
  LayoutDashboard, 
  Download, 
  Upload, 
  Save, 
  RotateCcw,
  RefreshCw,
  Copy,
  Check,
  Printer,
  Trash2,
  ShieldAlert,
  Scale,
  Wrench,
  FileText,
  Menu,
  X,
  ClipboardCheck
} from 'lucide-react';
import { exportToPdf } from './utils/pdfExport';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY = 'qhse-ims-state-blank-v3';

export default function App() {
  const [state, setState] = useState<QHSEState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'capas' | 'risks' | 'okrs' | 'events' | 'requirements' | 'equipments' | 'documents' | 'audits'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);
  
  // Interlocking quick add triggers
  const [quickCapaProcessId, setQuickCapaProcessId] = useState<number | null>(null);
  const [quickRiskProcessId, setQuickRiskProcessId] = useState<number | null>(null);
  const [quickOkrProcessId, setQuickOkrProcessId] = useState<number | null>(null);
  const [quickEventProcessId, setQuickEventProcessId] = useState<number | null>(null);
  const [quickEventProcessType, setQuickEventProcessType] = useState<QhseEvent['type'] | null>(null);
  const [quickRequirementProcessId, setQuickRequirementProcessId] = useState<number | null>(null);
  const [quickEquipmentProcessId, setQuickEquipmentProcessId] = useState<number | null>(null);
  const [quickDocumentProcessId, setQuickDocumentProcessId] = useState<number | null>(null);
  const [quickAuditProcessId, setQuickAuditProcessId] = useState<number | null>(null);
  
  // Utility states
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupJsonText, setBackupJsonText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // 1. Load data on mount from Platform storage fallback to LocalStorage
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        setSaveStatus('saving');
        let dataStr: string | null = null;
        
        // Try platform storage if available
        if (typeof window !== 'undefined' && (window as any).storage) {
          const res = await (window as any).storage.get(STORAGE_KEY, false);
          if (res && res.value) {
            dataStr = res.value;
          }
        }
        
        // Fallback to localStorage
        if (!dataStr) {
          dataStr = localStorage.getItem(STORAGE_KEY);
        }

        if (dataStr) {
          const parsed = JSON.parse(dataStr);
          if (parsed && Array.isArray(parsed.nodes)) {
            // Merge with default model structures for safety in case of schematic mutations
            setState({
              nodes: parsed.nodes || [],
              edges: parsed.edges || [],
              capas: parsed.capas || [],
              risks: parsed.risks || [],
              okrs: parsed.okrs || [],
              qhseEvents: parsed.qhseEvents || [],
              regulatoryRequirements: parsed.regulatoryRequirements || [],
              equipments: parsed.equipments || DEMO_STATE.equipments || [],
              documents: parsed.documents || DEMO_STATE.documents || [],
              audits: parsed.audits || DEMO_STATE.audits || [],
              nextId: parsed.nextId || 20
            });
          }
        } else {
          // No saved state, use initial pre-populated reference data
          setState(DEMO_STATE);
        }
        setSaveStatus('saved');
      } catch (err) {
        console.error("Error loading saved state", err);
        setState(DEMO_STATE);
        setSaveStatus('error');
      }
    };
    
    loadSavedState();
  }, []);

  // 2. Automate auto-saving state upon alterations with debounce
  useEffect(() => {
    // Avoid saving default state immediately on empty loading window
    if (state === INITIAL_STATE) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const payload = JSON.stringify(state);
        
        // Save to platform storage if possible
        if (typeof window !== 'undefined' && (window as any).storage) {
          await (window as any).storage.set(STORAGE_KEY, payload, false);
        }
        
        // Fallback or double backup to localStorage
        localStorage.setItem(STORAGE_KEY, payload);
        
        setSaveStatus('saved');
      } catch (err) {
        console.error("Error saving state", err);
        setSaveStatus('error');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [state]);

  // Set modified sub-state handlers
  const handleMapChange = (mapData: { nodes: ProcessNode[]; edges: ProcessEdge[] }) => {
    setState(prev => ({
      ...prev,
      nodes: mapData.nodes,
      edges: mapData.edges
    }));
  };

  const handleCapasChange = (newCapas: Capa[]) => {
    setState(prev => ({
      ...prev,
      capas: newCapas
    }));
  };

  const handleRisksChange = (newRisks: Risk[]) => {
    setState(prev => ({
      ...prev,
      risks: newRisks
    }));
  };

  const handleOkrsChange = (newOkrs: OKR[]) => {
    setState(prev => ({
      ...prev,
      okrs: newOkrs
    }));
  };

  const handleEventsChange = (newEvents: any) => {
    setState(prev => ({
      ...prev,
      qhseEvents: newEvents
    }));
  };

  const handleRequirementsChange = (newReqs: RegulatoryRequirement[]) => {
    setState(prev => ({
      ...prev,
      regulatoryRequirements: newReqs
    }));
  };

  const handleRaiseEventFromRequirement = (title: string, description: string, processId?: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newId = `EVT-2026-${String((state.qhseEvents?.length || 0) + 101)}`;
    const newEvent: QhseEvent = {
      id: newId,
      type: 'non_conformity',
      title: title,
      description: description,
      date: todayStr,
      time: "09:00",
      linkedProcessId: processId,
      severity: 'high',
      status: 'reported',
      immediateActions: 'Saisie de l\'écart règlementaire et information immédiate aux pilotes de processus.',
      reportedBy: 'Dossier Veille Réglementaire',
      location: 'Atelier de Production',
      linkedCapaId: undefined
    };
    
    setState(prev => ({
      ...prev,
      qhseEvents: [...(prev.qhseEvents || []), newEvent]
    }));
    setActiveTab('events');
  };

  const handleEquipmentsChange = (newEquips: Equipment[]) => {
    setState(prev => ({
      ...prev,
      equipments: newEquips
    }));
  };

  const handleRaiseEventFromEquipment = (title: string, description: string, processId?: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newId = `EVT-2026-${String((state.qhseEvents?.length || 0) + 101)}`;
    const newEvent: QhseEvent = {
      id: newId,
      type: 'accident',
      title: title,
      description: description,
      date: todayStr,
      time: new Date().toTimeString().slice(0, 5),
      linkedProcessId: processId,
      severity: 'critical',
      status: 'reported',
      immediateActions: 'Saisie d\'alerte panne critique machine. Diagnostic urgent planifié.',
      reportedBy: 'Supervision de l\'Inventaire',
      location: 'Division d\'Implantation',
      linkedCapaId: undefined
    };
    
    setState(prev => ({
      ...prev,
      qhseEvents: [...(prev.qhseEvents || []), newEvent]
    }));
    setActiveTab('events');
  };

  // Coupling utilities: Generation of CAPA directly from Risk Mitigation Strategy
  const handleQuickAddCapaFromRisk = (riskId: string, capaTitle: string, processId?: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const serial = String(state.capas.length + 1).padStart(3, '0');
    const capaId = `AC-R-${serial}`;

    const newCapa: Capa = {
      id: capaId,
      title: capaTitle,
      description: `Plan d'actions de mitigation centralisé associé au risque critique ${riskId}.`,
      type: 'corrective',
      source: 'risk_assessment',
      status: 'ongoing',
      priority: 'high',
      owner: 'Ingénieur QHSE',
      creationDate: todayStr,
      targetDate: (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().split('T')[0];
      })(),
      linkedProcessId: processId,
      rootCauseAnalysis: {
        fiveWhys: [`Le risque consolidé ${riskId} exige une barrière de protection.`],
        ishikawa: {
          manpower: [],
          machines: [],
          materials: [],
          methods: ["Manque d'automatisation ou de verrouillage physique"],
          measurement: [],
          environment: []
        }
      },
      actions: [
        {
          id: `sub-act-init-${Date.now()}`,
          title: "Auditer l'efficacité des barrières de mitigation physiques installées",
          owner: "Ingénieur QHSE",
          targetDate: todayStr,
          status: 'pending'
        }
      ]
    };

    // Update risk to bind it to this spawned CAPA
    const nextRisks = state.risks.map(r => r.id === riskId ? { ...r, linkedCapaId: capaId } : r);

    setState(prev => ({
      ...prev,
      capas: [...prev.capas, newCapa],
      risks: nextRisks
    }));

    // Switch tab to let them edit it!
    setActiveTab('capas');
  };

  // Interlocking quick triggers (map to tab shifts)
  const handleQuickAddCapaForProcess = (processId: number) => {
    setQuickCapaProcessId(processId);
    setActiveTab('capas');
  };

  const handleQuickAddRiskForProcess = (processId: number) => {
    setQuickRiskProcessId(processId);
    setActiveTab('risks');
  };

  const handleQuickAddOkrForProcess = (processId: number) => {
    setQuickOkrProcessId(processId);
    setActiveTab('okrs');
  };

  const handleQuickAddEventForProcess = (processId: number, type: QhseEvent['type']) => {
    setQuickEventProcessId(processId);
    setQuickEventProcessType(type);
    setActiveTab('events');
  };

  const handleQuickAddRequirementForProcess = (processId: number) => {
    setQuickRequirementProcessId(processId);
    setActiveTab('requirements');
  };

  const handleQuickAddEquipmentForProcess = (processId: number) => {
    setQuickEquipmentProcessId(processId);
    setActiveTab('equipments');
  };

  const handleDocumentsChange = (newDocs: DocumentedInfo[]) => {
    setState(prev => ({
      ...prev,
      documents: newDocs
    }));
  };

  const handleQuickAddDocumentForProcess = (processId: number) => {
    setQuickDocumentProcessId(processId);
    setActiveTab('documents');
  };

  const handleAuditsChange = (newAudits: Audit[]) => {
    setState(prev => ({
      ...prev,
      audits: newAudits
    }));
  };

  const handleQuickAddAuditForProcess = (processId: number) => {
    setQuickAuditProcessId(processId);
    setActiveTab('audits');
  };

  // Backup handlers
  const handleOpenBackupModal = () => {
    setBackupJsonText(JSON.stringify(state, null, 2));
    setShowBackupModal(true);
    setCopySuccess(false);
  };

  const handleCopyBackupText = () => {
    navigator.clipboard.writeText(backupJsonText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleImportBackup = () => {
    try {
      const parsed = JSON.parse(backupJsonText);
      if (parsed && Array.isArray(parsed.nodes)) {
        setState({
          nodes: parsed.nodes || [],
          edges: parsed.edges || [],
          capas: parsed.capas || [],
          risks: parsed.risks || [],
          okrs: parsed.okrs || [],
          qhseEvents: parsed.qhseEvents || [],
          regulatoryRequirements: parsed.regulatoryRequirements || [],
          equipments: parsed.equipments || [],
          documents: parsed.documents || [],
          audits: parsed.audits || [],
          nextId: parsed.nextId || 20
        });
        setShowBackupModal(false);
        alert("Importation réussie du SMI ! Le cockpit a été mis à jour.");
      } else {
        alert("Erreur: Le format JSON fourni n'est pas une sauvegarde QHSE IMS valide.");
      }
    } catch (e) {
      alert("Erreur de parsing JSON. Veuillez vérifier le texte copié.");
    }
  };

  const handleResetToDefaults = () => {
    if (confirm("Voulez-vous réinitialiser le SMI QHSE avec les données de démonstration d'usine ? Toutes vos modifications actuelles seront écrasées !")) {
      setState(DEMO_STATE);
      setShowBackupModal(false);
    }
  };

  const handleClearAllData = () => {
    if (confirm("Voulez-vous vraiment supprimer définitivement TOUS les processus, risques, fiches CAPA et objectifs OKR ? Cette action videra complètement votre SMI.")) {
      setState({
        nodes: [],
        edges: [],
        capas: [],
        risks: [],
        okrs: [],
        qhseEvents: [],
        regulatoryRequirements: [],
        equipments: [],
        documents: [],
        audits: [],
        nextId: 1
      });
      setShowBackupModal(false);
    }
  };

  const navTabs = [
    { id: 'dashboard' as const, label: 'Cockpit Général', shortLabel: 'Cockpit', icon: LayoutDashboard, count: null, hasPulse: true, colorTheme: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { id: 'map' as const, label: 'Cartographie Processus', shortLabel: 'Cartographie', icon: Map, count: state.nodes?.length || 0, colorTheme: 'text-sky-700 bg-sky-50 border-sky-100' },
    { id: 'capas' as const, label: 'Plans d’Actions', shortLabel: 'CAPAs', icon: CheckSquare, count: state.capas?.filter(c => c.status !== 'closed' && c.status !== 'completed').length || 0, colorTheme: 'text-amber-700 bg-amber-50 border-amber-100' },
    { id: 'risks' as const, label: 'Matrice des Risques 5x5', shortLabel: 'Risques', icon: AlertTriangle, count: state.risks?.length || 0, colorTheme: 'text-rose-700 bg-rose-50 border-rose-100' },
    { id: 'okrs' as const, label: 'Indicateurs (OKRs)', shortLabel: 'OKRs', icon: Target, count: state.okrs?.length || 0, colorTheme: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
    { id: 'events' as const, label: 'Incidents & NC', shortLabel: 'Incidents', icon: ShieldAlert, count: state.qhseEvents?.length || 0, colorTheme: 'text-red-700 bg-red-50 border-red-100' },
    { id: 'requirements' as const, label: 'Veille & Exigences', shortLabel: 'Exigences', icon: Scale, count: state.regulatoryRequirements?.length || 0, colorTheme: 'text-violet-700 bg-violet-50 border-violet-100' },
    { id: 'equipments' as const, label: 'Moyens & Parc', shortLabel: 'Parc', icon: Wrench, count: state.equipments?.length || 0, colorTheme: 'text-teal-700 bg-teal-50 border-teal-100' },
    { id: 'documents' as const, label: 'Documents & ALCOA+', shortLabel: 'Documents', icon: FileText, count: state.documents?.length || 0, colorTheme: 'text-slate-700 bg-slate-50 border-slate-150' },
    { id: 'audits' as const, label: 'Audits & ISO 19011', shortLabel: 'Audits', icon: ClipboardCheck, count: state.audits?.filter(a => a.status === 'in_progress' || a.status === 'scheduled').length || 0, colorTheme: 'text-emerald-800 bg-emerald-50 border-emerald-150' }
  ];

  return (
    <div className="flex flex-row h-screen w-screen bg-slate-50 font-sans antialiased text-slate-800 overflow-hidden" id="qhse-ims-app">
      
      {/* SIDEBAR NAVIGATION PANEL (Slides on/off from the left side) */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <>
            {/* Overlay backdrop on mobile */}
            <motion.div
              initial={{ bgOpacity: 0, opacity: 0 }}
              animate={{ bgOpacity: 0.5, opacity: 0.5 }}
              exit={{ bgOpacity: 0, opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-950/70 z-40"
            />

            <motion.aside
              initial={{ x: '-100%', width: 0 }}
              animate={{ x: 0, width: 288 }} 
              exit={{ x: '-100%', width: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed inset-y-0 left-0 z-50 md:relative md:inset-auto md:z-30 flex flex-col bg-slate-900 border-r border-slate-950 text-slate-100 shrink-0 select-none h-full shadow-2xl md:shadow-md overflow-hidden"
            >
              
              {/* Brand System Head Header */}
              <div className="p-5 border-b border-slate-850 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/20">
                    <ShieldCheck className="w-5.5 h-5.5 shrink-0" />
                  </div>
                  <div>
                    <h1 className="font-sans font-bold text-slate-100 text-sm tracking-tight leading-none uppercase">
                      SMI QHSE
                    </h1>
                    <div className="flex items-center gap-1.5 bg-slate-850 text-emerald-450 font-mono border border-slate-750 px-1.5 py-0.5 rounded-lg mt-1.5 text-[9px] font-bold w-fit">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ISO CONNECT v3.2
                    </div>
                  </div>
                </div>

                {/* Mobile Close Button */}
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  title="Fermer le menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[10px] text-slate-400 px-5 py-2.5 font-mono leading-relaxed border-b border-slate-800/40 bg-slate-950/10 shrink-0">
                Centrale Réglementaire QHSE <br />
                • Audit Trail & ALCOA+ Actif
              </p>

              {/* Fading Vertical Navbar links - Fades and slides from left container */}
              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.04,
                      delayChildren: 0.1
                    }
                  }
                }}
                initial="hidden"
                animate="show"
                className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
              >
                {navTabs.map(tab => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      id={`nav-${tab.id}`}
                      variants={{
                        hidden: { opacity: 0, x: -30 },
                        show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 350, damping: 26 } }
                      }}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (window.innerWidth < 768) {
                          setIsSidebarOpen(false);
                        }
                      }}
                      className={`w-full relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 select-none text-left group ${
                        active 
                          ? 'bg-slate-800 text-white border border-slate-700/60 shadow-inner' 
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850/60 border border-transparent'
                      }`}
                    >
                      {/* Active indicator bar */}
                      {active && (
                        <motion.div
                          layoutId="activeVerticalIndicator"
                          className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-emerald-500 rounded-r-md"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      
                      <Icon className={`w-4 h-4 shrink-0 transition ${active ? 'text-emerald-400 scale-110' : 'text-slate-500 group-hover:text-slate-350'}`} />
                      <span className="truncate">{tab.label}</span>

                      {/* Counter badges */}
                      {tab.count !== null && tab.count > 0 && (
                        <span className={`ml-auto text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md border flex items-center justify-center min-w-[17px] h-4 leading-none transition-all duration-300 ${
                          active ? 'bg-emerald-500 text-white border-transparent' : 'bg-slate-800 text-slate-400 border-slate-750'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                      
                      {/* Pulse badge */}
                      {tab.hasPulse && (
                        <span className="flex h-1.5 w-1.5 relative ml-auto shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Sidebar Corporate Footer */}
              <div className="p-4 border-t border-slate-800/65 space-y-3 bg-slate-950/20 shrink-0">
                <div className="rounded-xl bg-slate-950/35 p-3 border border-slate-850">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span>Système Conforme</span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-450 mt-1 leading-snug">
                    ISO 9001, 14001, 45501 <br />directives CFR 11 & GAMP 5
                  </p>
                </div>

                <div className="flex items-center justify-between px-1">
                  <div className="text-[10px] font-mono">
                    {saveStatus === 'saved' && (
                      <span className="text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded-md text-[9px]">
                        Système Sync
                      </span>
                    )}
                    {saveStatus === 'saving' && (
                      <span className="text-amber-400 flex items-center gap-1.5 font-medium bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded-md text-[9px]">
                        Sauvegarde...
                      </span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-rose-450 flex items-center gap-1 font-bold bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded-md text-[9px]">
                        ⚠️ Erreur sync
                      </span>
                    )}
                  </div>

                  <button
                    id="backup-menu-btn-sidebar"
                    onClick={handleOpenBackupModal}
                    className="p-1 rounded-md border border-slate-700/60 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition duration-150 cursor-pointer shadow-sm"
                    title="Import/Export JSON de sauvegarde"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* RIGHT WORKSPACE SCENARIO */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-slate-50">
        
        {/* MOBILE PRIMARY HEADER */}
        <header className="flex md:hidden items-center justify-between px-4 h-14 bg-white border-b border-slate-200 shrink-0 select-none z-15 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-50 transition cursor-pointer"
              title="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="w-7.5 h-7.5 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
            </div>
            <h1 className="font-sans font-bold text-slate-900 text-xs tracking-tight">
              SMI integrated
            </h1>
          </div>
          <div className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
            ISO CONNECT
          </div>
        </header>

        {/* MOBILE SLIDING pill navigation */}
        <nav className="flex md:hidden items-center bg-slate-900 py-2.5 px-3 shrink-0 select-none text-[10px] shadow-sm border-b border-slate-950 overflow-x-auto scrollbar-none gap-2 z-10">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full cursor-pointer transition-all duration-150 whitespace-nowrap font-medium text-[11px] ${
                  active 
                    ? 'bg-emerald-600 text-white shadow-xs font-bold scale-102' 
                    : 'text-slate-400 bg-slate-800/60 hover:bg-slate-800/90'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-inherit" />
                <span>{tab.shortLabel}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className={`text-[8px] font-mono px-1 rounded-md ${
                    active ? 'bg-white text-emerald-950 font-black' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* DESKTOP BODY TOP STATUS RIBBON */}
        <div className="hidden md:flex items-center justify-between h-15 bg-white border-b border-slate-200/80 px-6 shrink-0 select-none z-10 shadow-3xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all cursor-pointer shadow-3xs mr-1 shrink-0"
              title={isSidebarOpen ? "Masquer le menu" : "Afficher le menu"}
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            {(() => {
              const activeTabObj = navTabs.find(t => t.id === activeTab);
              if (!activeTabObj) return null;
              const ActiveIcon = activeTabObj.icon;
              return (
                <>
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-750 border border-slate-200">
                    <ActiveIcon className="w-4.5 h-4.5 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-slate-900 font-bold text-sm tracking-tight leading-none">
                      {activeTabObj.label}
                    </h2>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {activeTab === 'dashboard' && "Synthèse opérationnelle QHSE d'assurance d'intégrité globale"}
                      {activeTab === 'map' && "Cartographie des processus métiers, flux d'information & liaisons"}
                      {activeTab === 'capas' && "Traitement des actions correctives et préventives (CAPAs)"}
                      {activeTab === 'risks' && "Évaluation de la criticité des risques opérationnels sur matrice 5x5"}
                      {activeTab === 'okrs' && "Tableau de bord des indicateurs de performance & objectifs clés"}
                      {activeTab === 'events' && "Registre des fiches de déviations, incidents QHSE & réclamations"}
                      {activeTab === 'requirements' && "Suivi de conformité réglementaire & légale"}
                      {activeTab === 'equipments' && "Maintenance, étalonnage & métrologie du parc machines"}
                      {activeTab === 'documents' && "Gestion de la documentation réglementaire, CFR Part 11 & signatures"}
                      {activeTab === 'audits' && "Registre des audits d'intégrité déontologique rattachés aux processus (ISO 19011)"}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="flex items-center gap-3">
            {/* EXPORT PDF BUTTON */}
            <button
              id="export-pdf-btn-top"
              onClick={() => exportToPdf(activeTab, state)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-755 hover:text-slate-900 rounded-xl text-xs font-semibold cursor-pointer shadow-3xs transition duration-150 active:scale-95"
              title="Exporter l'onglet actif en rapport PDF haute qualité"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500 animate-pulse-slow" />
              <span>Exporter Rapport PDF</span>
            </button>
          </div>
        </div>

        {/* Primary Application Modules Render Router */}
        <main className="flex-1 overflow-hidden relative">
        
        {activeTab === 'dashboard' && (
          <DashboardOverview
            nodes={state.nodes}
            capas={state.capas}
            risks={state.risks}
            okrs={state.okrs}
            qhseEvents={state.qhseEvents || []}
            regulatoryRequirements={state.regulatoryRequirements || []}
            equipments={state.equipments || []}
            documents={state.documents || []}
            audits={state.audits || []}
            onNavigate={(tab) => {
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === 'map' && (
          <ProcessMap
            nodes={state.nodes}
            edges={state.edges}
            capas={state.capas}
            risks={state.risks}
            okrs={state.okrs}
            qhseEvents={state.qhseEvents || []}
            regulatoryRequirements={state.regulatoryRequirements || []}
            equipments={state.equipments || []}
            documents={state.documents || []}
            audits={state.audits || []}
            onChangeData={handleMapChange}
            onQuickAddCapaForProcess={handleQuickAddCapaForProcess}
            onQuickAddRiskForProcess={handleQuickAddRiskForProcess}
            onQuickAddOkrForProcess={handleQuickAddOkrForProcess}
            onQuickAddEventForProcess={handleQuickAddEventForProcess}
            onQuickAddRequirementForProcess={handleQuickAddRequirementForProcess}
            onQuickAddEquipmentForProcess={handleQuickAddEquipmentForProcess}
            onQuickAddDocumentForProcess={handleQuickAddDocumentForProcess}
            onQuickAddAuditForProcess={handleQuickAddAuditForProcess}
            onSwitchTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'capas' && (
          <CapaModule
            capas={state.capas}
            nodes={state.nodes}
            onChangeCapas={handleCapasChange}
            quickAddProcessId={quickCapaProcessId}
            onClearQuickAddProcess={() => setQuickCapaProcessId(null)}
          />
        )}

        {activeTab === 'risks' && (
          <RiskModule
            risks={state.risks}
            nodes={state.nodes}
            capas={state.capas}
            onChangeRisks={handleRisksChange}
            onQuickAddCapaFromRisk={handleQuickAddCapaFromRisk}
            onSwitchTab={(tab) => setActiveTab(tab)}
            quickAddProcessId={quickRiskProcessId}
            onClearQuickAddProcess={() => setQuickRiskProcessId(null)}
          />
        )}

        {activeTab === 'okrs' && (
          <OkrModule
            okrs={state.okrs}
            nodes={state.nodes}
            onChangeOkrs={handleOkrsChange}
            quickAddProcessId={quickOkrProcessId}
            onClearQuickAddProcess={() => setQuickOkrProcessId(null)}
          />
        )}

        {activeTab === 'events' && (
          <QhseEventsModule
            qhseEvents={state.qhseEvents || []}
            nodes={state.nodes}
            capas={state.capas}
            quickAddProcessId={quickEventProcessId}
            quickAddEventType={quickEventProcessType}
            onClearQuickAddProcess={() => {
              setQuickEventProcessId(null);
              setQuickEventProcessType(null);
            }}
            onChangeEvents={handleEventsChange}
            onChangeCapas={handleCapasChange}
            onSwitchTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'requirements' && (
          <RegulatoryRequirementsModule
            requirements={state.regulatoryRequirements || []}
            nodes={state.nodes}
            quickAddProcessId={quickRequirementProcessId}
            onClearQuickAddProcess={() => setQuickRequirementProcessId(null)}
            onChangeRequirements={handleRequirementsChange}
            onRaiseEvent={handleRaiseEventFromRequirement}
          />
        )}

        {activeTab === 'equipments' && (
          <EquipmentInventoryModule
            equipments={state.equipments || []}
            nodes={state.nodes}
            quickAddProcessId={quickEquipmentProcessId}
            onClearQuickAddProcess={() => setQuickEquipmentProcessId(null)}
            onChangeEquipments={handleEquipmentsChange}
            onRaiseEvent={handleRaiseEventFromEquipment}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentedInformationModule
            documents={state.documents || []}
            nodes={state.nodes}
            quickAddProcessId={quickDocumentProcessId}
            onClearQuickAddProcess={() => setQuickDocumentProcessId(null)}
            onChangeDocuments={handleDocumentsChange}
          />
        )}

        {activeTab === 'audits' && (
          <AuditsModule
            audits={state.audits || []}
            nodes={state.nodes}
            capas={state.capas}
            quickAddProcessId={quickAuditProcessId}
            onClearQuickAddProcess={() => setQuickAuditProcessId(null)}
            onChangeAudits={handleAuditsChange}
            onChangeCapas={handleCapasChange}
          />
        )}

      </main>

      </div>

      {/* INTEGRATED UTILITY AND BACKUP MODAL CONTAINER */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative space-y-4">
            
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-space font-bold text-slate-900 text-md">Console d'Import / Export SMI</h3>
                <p className="text-[10px] text-slate-500 mt-1 pb-1">Échangez et sauvegardez l'environnement complet de votre système</p>
              </div>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded px-2.5 py-1 text-xs font-medium cursor-pointer transition"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Données brutes QHSE (JSON)</label>
              <textarea
                value={backupJsonText}
                onChange={(e) => setBackupJsonText(e.target.value)}
                rows={10}
                className="w-full bg-slate-50 border border-slate-200 font-mono text-[9px] text-slate-850 leading-relaxed p-3 rounded-xl focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between items-stretch sm:items-center gap-3">
              
              <div className="flex flex-col gap-1.5 align-start items-start">
                {/* Reset to defaults trigger */}
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="text-start text-xs text-slate-650 hover:text-slate-900 font-semibold transition cursor-pointer flex items-center gap-1 bg-transparent border-0"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 hover:text-slate-900" /> Réinitialiser données tests
                </button>

                {/* Completely delete everything */}
                <button
                  type="button"
                  onClick={handleClearAllData}
                  className="text-start text-xs text-red-650 hover:text-red-700 font-bold transition cursor-pointer flex items-center gap-1 bg-transparent border-0"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" /> Supprimer absolument TOUT
                </button>
              </div>

              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={handleCopyBackupText}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3.5 py-2 rounded-xl font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copier le code
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleImportBackup}
                  className="bg-slate-900 hover:bg-slate-800 text-xs text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" /> Importer
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
