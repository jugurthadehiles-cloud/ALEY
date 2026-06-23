import React, { useState } from 'react';
import { Capa, ProcessNode, CapaAction } from '../types';
import { 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Calendar, 
  Tag, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  GitCommit, 
  HelpCircle,
  TrendingUp,
  Workflow,
  CheckCircle2,
  Activity,
  PlusCircle,
  Wrench,
  AlertCircle
} from 'lucide-react';

interface CapaModuleProps {
  capas: Capa[];
  nodes: ProcessNode[];
  onChangeCapas: (newCapas: Capa[]) => void;
  quickAddProcessId?: number | null;
  onClearQuickAddProcess: () => void;
}

export const CapaModule: React.FC<CapaModuleProps> = ({
  capas,
  nodes,
  onChangeCapas,
  quickAddProcessId,
  onClearQuickAddProcess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [processFilter, setProcessFilter] = useState<string>('all');
  const [selectedCapaId, setSelectedCapaId] = useState<string | null>(capas[0]?.id || null);
  const [capaIdToConfirmDelete, setCapaIdToConfirmDelete] = useState<string | null>(null);
  
  // Show creation state
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [newCapaTitle, setNewCapaTitle] = useState('');
  const [newCapaDesc, setNewCapaDesc] = useState('');
  const [newCapaType, setNewCapaType] = useState<'corrective' | 'preventive' | 'improvement'>('corrective');
  const [newCapaSource, setNewCapaSource] = useState<'internal_audit' | 'external_audit' | 'customer_complaint' | 'near_miss' | 'risk_assessment' | 'other'>('internal_audit');
  const [newCapaPriority, setNewCapaPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [newCapaOwner, setNewCapaOwner] = useState('Ingénieur QHSE');
  const [newCapaTargetDate, setNewCapaTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2); // default 2 months out
    return d.toISOString().split('T')[0];
  });
  const [newCapaLinkedProcessId, setNewCapaLinkedProcessId] = useState<number | undefined>(
    quickAddProcessId ? quickAddProcessId : undefined
  );

  // Trigger automated form state when quickAddProcessId is populated from process map
  React.useEffect(() => {
    if (quickAddProcessId !== null && quickAddProcessId !== undefined) {
      setNewCapaLinkedProcessId(quickAddProcessId);
      setIsCreating(true);
      setNewCapaTitle(`Action d'amélioration : Processus #${quickAddProcessId}`);
      onClearQuickAddProcess(); // clear trigger
    }
  }, [quickAddProcessId]);

  // Selected CAPA details
  const selectedCapa = capas.find(c => c.id === selectedCapaId);

  // New action form state for the selected CAPA
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActOwner, setNewActOwner] = useState('');
  const [newActDate, setNewActDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  // Root cause modification states
  const [newWhyValue, setNewWhyValue] = useState('');
  const [newIshikawaType, setNewIshikawaType] = useState<keyof NonNullable<Capa['rootCauseAnalysis']>['ishikawa']>('manpower');
  const [newIshikawaValue, setNewIshikawaValue] = useState('');

  // Handle create CAPA
  const handleCreateCapa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapaTitle.trim()) return;

    const prefix = {
      corrective: 'AC',
      preventive: 'AP',
      improvement: 'AA'
    }[newCapaType];

    const todayStr = new Date().toISOString().split('T')[0];
    const year = todayStr.split('-')[0];
    const serial = String(capas.length + 1).padStart(3, '0');
    const newId = `${prefix}-${year}-${serial}`;

    const newObj: Capa = {
      id: newId,
      title: newCapaTitle,
      description: newCapaDesc,
      type: newCapaType,
      source: newCapaSource,
      status: 'draft',
      priority: newCapaPriority,
      owner: newCapaOwner,
      creationDate: todayStr,
      targetDate: newCapaTargetDate,
      linkedProcessId: newCapaLinkedProcessId ? Number(newCapaLinkedProcessId) : undefined,
      rootCauseAnalysis: {
        fiveWhys: [],
        ishikawa: {
          manpower: [],
          machines: [],
          materials: [],
          methods: [],
          measurement: [],
          environment: []
        }
      },
      actions: []
    };

    const nextCapas = [...capas, newObj];
    onChangeCapas(nextCapas);
    setSelectedCapaId(newId);
    setIsCreating(false);
    
    // reset
    setNewCapaTitle('');
    setNewCapaDesc('');
  };

  // Delete CAPA
  const handleDeleteCapa = (id: string, bypassConfirm = false) => {
    if (bypassConfirm || confirm("Voulez-vous supprimer ce plan d’action CAPA ?")) {
      const nextCapas = capas.filter(c => c.id !== id);
      onChangeCapas(nextCapas);
      setSelectedCapaId(nextCapas[0]?.id || null);
      setCapaIdToConfirmDelete(null);
    }
  };

  // Toggle Action checklist status
  const handleToggleAction = (capaId: string, actId: string) => {
    const nextCapas = capas.map(c => {
      if (c.id === capaId) {
        const nextActions = c.actions.map(act => {
          if (act.id === actId) {
            return { ...act, status: act.status === 'done' ? 'pending' : 'done' as const };
          }
          return act;
        });
        
        // Auto-promote status from 'draft' or 'ongoing' to 'completed' if all are done
        let nextStatus = c.status;
        const allDone = nextActions.length > 0 && nextActions.every(a => a.status === 'done');
        if (allDone && (c.status === 'ongoing' || c.status === 'draft')) {
          nextStatus = 'completed';
        } else if (!allDone && c.status === 'completed') {
          nextStatus = 'ongoing';
        }

        return { 
          ...c, 
          actions: nextActions,
          status: nextStatus,
          completionDate: nextStatus === 'completed' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return c;
    });
    onChangeCapas(nextCapas);
  };

  // Add sub-action
  const handleAddSubAction = (e: React.FormEvent, capaId: string) => {
    e.preventDefault();
    if (!newActTitle.trim()) return;

    const nextCapas = capas.map(c => {
      if (c.id === capaId) {
        const newAct: CapaAction = {
          id: `sub-act-${Date.now()}`,
          title: newActTitle,
          owner: newActOwner || c.owner,
          targetDate: newActDate,
          status: 'pending'
        };
        
        // promote draft to ongoing
        const nextStatus = c.status === 'draft' ? 'ongoing' : c.status;

        return {
          ...c,
          status: nextStatus,
          actions: [...c.actions, newAct]
        };
      }
      return c;
    });

    onChangeCapas(nextCapas);
    setNewActTitle('');
    setNewActOwner('');
    setIsAddingAction(false);
  };

  // Delete sub-action
  const handleDeleteSubAction = (capaId: string, actId: string) => {
    const nextCapas = capas.map(c => {
      if (c.id === capaId) {
        return {
          ...c,
          actions: c.actions.filter(a => a.id !== actId)
        };
      }
      return c;
    });
    onChangeCapas(nextCapas);
  };

  // Root Cause modification: Add Why
  const handleAddWhy = (capaId: string) => {
    if (!newWhyValue.trim()) return;
    const nextCapas = capas.map(c => {
      if (c.id === capaId) {
        const analysis = c.rootCauseAnalysis || { fiveWhys: [], ishikawa: { manpower: [], machines: [], materials: [], methods: [], measurement: [], environment: [] } };
        return {
          ...c,
          rootCauseAnalysis: {
            ...analysis,
            fiveWhys: [...analysis.fiveWhys, newWhyValue.trim()]
          }
        };
      }
      return c;
    });
    onChangeCapas(nextCapas);
    setNewWhyValue('');
  };

  // Remove last Why
  const handleRemoveWhy = (capaId: string, index: number) => {
    const nextCapas = capas.map(c => {
      if (c.id === capaId && c.rootCauseAnalysis) {
        return {
          ...c,
          rootCauseAnalysis: {
            ...c.rootCauseAnalysis,
            fiveWhys: c.rootCauseAnalysis.fiveWhys.filter((_, i) => i !== index)
          }
        };
      }
      return c;
    });
    onChangeCapas(nextCapas);
  };

  // Root Cause modification: Add Ishikawa cause
  const handleAddIshikawa = (capaId: string) => {
    if (!newIshikawaValue.trim()) return;
    const nextCapas = capas.map(c => {
      if (c.id === capaId) {
        const analysis = c.rootCauseAnalysis || { fiveWhys: [], ishikawa: { manpower: [], machines: [], materials: [], methods: [], measurement: [], environment: [] } };
        const currentCategoryList = analysis.ishikawa[newIshikawaType] || [];
        return {
          ...c,
          rootCauseAnalysis: {
            ...analysis,
            ishikawa: {
              ...analysis.ishikawa,
              [newIshikawaType]: [...currentCategoryList, newIshikawaValue.trim()]
            }
          }
        };
      }
      return c;
    });
    onChangeCapas(nextCapas);
    setNewIshikawaValue('');
  };

  // Remove Ishikawa cause
  const handleRemoveIshikawa = (capaId: string, category: string, index: number) => {
    const nextCapas = capas.map(c => {
      if (c.id === capaId && c.rootCauseAnalysis) {
        const valList = c.rootCauseAnalysis.ishikawa[category as any] || [];
        return {
          ...c,
          rootCauseAnalysis: {
            ...c.rootCauseAnalysis,
            ishikawa: {
              ...c.rootCauseAnalysis.ishikawa,
              [category]: valList.filter((_, i) => i !== index)
            }
          }
        };
      }
      return c;
    });
    onChangeCapas(nextCapas);
  };

  // Update status directly from detail panel
  const handleUpdateStatus = (capaId: string, status: Capa['status']) => {
    const nextCapas = capas.map(c => {
      if (c.id === capaId) {
        return {
          ...c,
          status,
          completionDate: status === 'completed' || status === 'verified' ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return c;
    });
    onChangeCapas(nextCapas);
  };

  // Filtering formulas
  const filteredCapas = capas.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    const matchesProcess = processFilter === 'all' || String(c.linkedProcessId) === processFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProcess;
  });

  const statuses: { value: Capa['status']; label: string; color: string }[] = [
    { value: 'draft', label: 'Brouillon', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'ongoing', label: 'En cours', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'completed', label: 'Réalisé', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { value: 'verified', label: 'Efficacité vérifiée', color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' },
    { value: 'cancelled', label: 'Annulé', color: 'bg-slate-100 text-slate-400 border-slate-200' },
  ];

  const sourceLabels = {
    internal_audit: 'Audit Interne',
    external_audit: 'Audit Externe',
    customer_complaint: 'Réclamation Client',
    near_miss: 'Presque-accident',
    risk_assessment: 'Évaluation des Risques',
    other: 'Autre'
  };

  const priorityLabels = {
    critical: 'Critique',
    high: 'Élevé',
    medium: 'Moyen',
    low: 'Faible'
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col lg:flex-row gap-5 lg:h-[calc(100vh-120px)] lg:overflow-hidden overflow-y-auto h-full w-full" id="capas-panel-wrapper">
      
      {/* LEFT: Spacious Data Table of plans & filters */}
      <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col lg:h-full overflow-hidden min-h-[400px] lg:min-h-0 shrink-0">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-150 pb-3">
          <div>
            <h3 className="font-space font-bold text-slate-900 text-md">Registre Général des CAPAs</h3>
            <p className="text-[10px] text-slate-500">Planification globale et actions préventives du SMI</p>
          </div>
          
          <button
            id="add-capa-btn"
            onClick={() => setIsCreating(true)}
            className="self-start sm:self-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-white stroke-[3]" /> Nouveau CAPA
          </button>
        </div>

        {/* Global Toolbar Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4 bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs">
          
          {/* Search bar */}
          <div className="sm:col-span-1 relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Chercher référence, pilote..."
              className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 pl-8 text-xs text-slate-800 focus:outline-none focus:border-slate-400 shadow-2xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2 py-1.5 focus:outline-none focus:border-slate-400 font-medium shadow-2xs"
            >
              <option value="all">Tous les Statuts</option>
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2 py-1.5 focus:outline-none focus:border-slate-400 font-medium shadow-2xs"
            >
              <option value="all">Toutes les Priorités</option>
              <option value="critical">Priorité: Critique</option>
              <option value="high">Priorité: Élevée</option>
              <option value="medium">Priorité: Moyenne</option>
              <option value="low">Priorité: Faible</option>
            </select>
          </div>

          {/* Linked Process filter */}
          <div>
            <select
              value={processFilter}
              onChange={(e) => setProcessFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded px-2 py-1.5 focus:outline-none focus:border-slate-400 font-medium shadow-2xs"
            >
              <option value="all">Tous les Processus</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>#{n.id} - {n.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>

        </div>

        {/* DATA TABLE CONTAINER */}
        <div className="flex-1 overflow-auto border border-slate-150 rounded-lg">
          {filteredCapas.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs italic bg-slate-50/50">
              Aucun plan d'action CAPA correspondant à vos critères de recherche.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-650 border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-550 font-mono text-[10px] uppercase tracking-wider select-none">
                  <th className="p-3 font-bold w-[100px]">Référence</th>
                  <th className="p-3 font-bold">Objet / Amélioration</th>
                  <th className="p-3 font-bold w-[110px]">Type</th>
                  <th className="p-3 font-bold w-[90px]">Priorité</th>
                  <th className="p-3 font-bold w-[120px]">État de l'action</th>
                  <th className="p-3 font-bold w-[120px]">Pilote</th>
                  <th className="p-3 font-bold w-[95px]">Échéance</th>
                  <th className="p-3 font-bold w-[90px] text-right">Livrables</th>
                  <th className="p-3 font-bold w-[50px] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCapas.map(capa => {
                  const isSelected = selectedCapaId === capa.id;
                  const currentStatus = statuses.find(s => s.value === capa.status);
                  
                  const pColors = {
                    critical: 'text-red-700 bg-red-50 border-red-100',
                    high: 'text-amber-700 bg-amber-50 border-amber-100',
                    medium: 'text-blue-750 bg-blue-50 border-blue-100',
                    low: 'text-slate-500 bg-slate-100 border-slate-150'
                  };

                  const typeLabels = {
                    corrective: 'AC Corrective',
                    preventive: 'AP Préventive',
                    improvement: 'AA Progrès'
                  };

                  const typeColors = {
                    corrective: 'text-red-650 bg-red-50/50 border-red-150',
                    preventive: 'text-amber-650 bg-amber-50/50 border-amber-150',
                    improvement: 'text-emerald-650 bg-emerald-50/50 border-emerald-150'
                  };

                  const resolvedCount = capa.actions.filter(a => a.status === 'done').length;
                  const totalCount = capa.actions.length;
                  const allDone = totalCount > 0 && resolvedCount === totalCount;

                  return (
                    <tr
                      key={capa.id}
                      onClick={() => setSelectedCapaId(capa.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-slate-100 font-medium text-slate-900 border-l-4 border-l-slate-900' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 border border-slate-205 px-1.5 py-0.5 rounded text-[10px]/none inline-block">
                          {capa.id}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 max-w-[280px] truncate leading-tight" title={capa.title}>
                          {capa.title}
                        </div>
                        {capa.linkedProcessId && (
                          <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Workflow className="w-2.5 h-2.5" /> #{capa.linkedProcessId} - {nodes.find(n => n.id === capa.linkedProcessId)?.name.split(' ')[0]}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`text-[9px] px-1.5 py-0.5 select-none border rounded-full font-semibold ${typeColors[capa.type]}`}>
                          {typeLabels[capa.type]}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-[9px] px-1.5 py-0.5 select-none border rounded ${pColors[capa.priority]}`}>
                          {priorityLabels[capa.priority]}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`text-[9px] px-1.5 py-0.5 select-none border rounded font-semibold ${currentStatus?.color}`}>
                          {currentStatus?.label}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[90px]">{capa.owner}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500 font-mono">{capa.targetDate}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">
                        {totalCount > 0 ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${allDone ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-100' : 'bg-slate-100 text-slate-650'}`}>
                            {resolvedCount}/{totalCount}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Aucune</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {capaIdToConfirmDelete === capa.id ? (
                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCapa(capa.id, true);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded cursor-pointer transition shadow-xs"
                              title="Confirmer la suppression"
                            >
                              Oui
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCapaIdToConfirmDelete(null);
                              }}
                              className="px-1.5 py-0.5 bg-slate-205 hover:bg-slate-300 text-slate-700 text-[10px] font-medium rounded cursor-pointer transition"
                              title="Annuler"
                            >
                              Non
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCapaIdToConfirmDelete(capa.id);
                            }}
                            className="p-1 px-1.5 border border-slate-100 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-550 rounded transition duration-150 cursor-pointer"
                            title="Supprimer ce CAPA"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* RIGHT: Main Details panel, Create Form, Root cause graphs */}
      <div className="w-full lg:w-[480px] bg-white border border-slate-200 rounded-xl p-5 flex flex-col h-full overflow-y-auto shadow-sm shrink-0">
        
        {/* CREATE NEW FORM */}
        {isCreating ? (
          <form onSubmit={handleCreateCapa} className="space-y-4" id="capa-creation-form">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="font-space font-bold text-slate-900 text-md">Rédiger un nouveau CAPA</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-500 hover:text-slate-800 text-xs bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-pointer transition"
              >
                Annuler
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                  Intitulé de la non-conformité / opportunité
                </label>
                <input 
                  type="text"
                  required
                  value={newCapaTitle}
                  onChange={(e) => setNewCapaTitle(e.target.value)}
                  placeholder="Décrivez brièvement l'écart ou l'axe de progrès..."
                  className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-slate-400 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                  Description détaillée et constats (Qui, Quoi, Où...)
                </label>
                <textarea 
                  rows={3}
                  value={newCapaDesc}
                  onChange={(e) => setNewCapaDesc(e.target.value)}
                  placeholder="Décrivez les observations, l'écart par rapport à la consigne ou les impacts réels..."
                  className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5 text-slate-700 focus:outline-none resize-none leading-relaxed shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                    Type d'action
                  </label>
                  <select
                    value={newCapaType}
                    onChange={(e) => setNewCapaType(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5 text-slate-705 focus:outline-none shadow-2xs"
                  >
                    <option value="corrective">Corrective (Constat)</option>
                    <option value="preventive">Préventive (Potentiel)</option>
                    <option value="improvement">Amélioration continue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                    Origine du constat
                  </label>
                  <select
                    value={newCapaSource}
                    onChange={(e) => setNewCapaSource(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5 text-slate-705 focus:outline-none shadow-2xs"
                  >
                    {Object.entries(sourceLabels).map(([k,v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                    Grave / Priorité
                  </label>
                  <select
                    value={newCapaPriority}
                    onChange={(e) => setNewCapaPriority(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5 text-slate-705 focus:outline-none shadow-2xs"
                  >
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="critical">Critique (Immédiate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                    Processus lié (SMI)
                  </label>
                  <select
                    value={newCapaLinkedProcessId || ''}
                    onChange={(e) => setNewCapaLinkedProcessId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5 text-slate-705 focus:outline-none shadow-2xs"
                  >
                    <option value="">-- Aucun processus --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>#{n.id} - {n.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                    Responsable / Pilote
                  </label>
                  <input 
                    type="text"
                    required
                    value={newCapaOwner}
                    onChange={(e) => setNewCapaOwner(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5 text-slate-800 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                    Échéance requis
                  </label>
                  <input 
                    type="date"
                    required
                    value={newCapaTargetDate}
                    onChange={(e) => setNewCapaTargetDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5 text-slate-800 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-slate-100 hover:bg-slate-205 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition border border-slate-200"
              >
                Fermer
              </button>
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2 rounded-lg cursor-pointer shadow-xs transition"
              >
                Enregistrer le CAPA
              </button>
            </div>
          </form>
        ) : !selectedCapa ? (
          <div className="text-center py-24 text-slate-400 my-auto">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-space font-semibold text-slate-700 text-md mb-1">Aucun plan d'action sélectionné</h4>
            <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-500">
              Cliquez sur un plan d'action dans le tableau du registre à gauche pour afficher, modifier et analyser la conformité correspondante.
            </p>
          </div>
        ) : (
          /* DETAILED CAPA VIEW */
          <div className="space-y-5 shadow-xs" id="capa-detailed-view-container">
            
            {/* Header section with state toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {selectedCapa.id}
                  </span>
                  {(() => {
                    const currentStatus = statuses.find(s => s.value === selectedCapa.status);
                    return (
                      <span className={`text-[10px] px-2 py-0.5 border rounded font-semibold ${currentStatus?.color}`}>
                        {currentStatus?.label}
                      </span>
                    );
                  })()}
                  <span className="text-[10px] text-slate-400 font-mono">
                    Déclaré le {selectedCapa.creationDate}
                  </span>
                </div>
                <h2 className="text-md font-space font-bold text-slate-900 tracking-tight leading-snug">
                  {selectedCapa.title}
                </h2>
              </div>

              {/* Status and Actions combo */}
              <div className="flex items-center gap-2 shrink-0">
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-mono font-bold mb-0.5">Attribuer statut</span>
                  <select
                    value={selectedCapa.status}
                    onChange={(e) => handleUpdateStatus(selectedCapa.id, e.target.value as any)}
                    className="bg-white border border-slate-202 text-xs text-slate-800 rounded px-2 py-1 focus:outline-none shadow-2xs"
                  >
                    {statuses.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div className="self-end">
                  {capaIdToConfirmDelete === selectedCapa.id ? (
                    <div className="flex items-center gap-1 border border-red-200 bg-red-50/70 py-1 px-1.5 rounded-lg shrink-0">
                      <span className="text-[9px] text-red-750 font-bold font-mono">Supprimer?</span>
                      <button
                        onClick={() => handleDeleteCapa(selectedCapa.id, true)}
                        className="p-1 px-1.5 bg-red-600 hover:bg-red-750 text-white text-[9px] font-bold rounded cursor-pointer transition shadow-xs"
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => setCapaIdToConfirmDelete(null)}
                        className="p-1 px-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-medium rounded cursor-pointer transition"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCapaIdToConfirmDelete(selectedCapa.id)}
                      className="p-1.5 border border-slate-200 hover:border-red-400 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold block">Observations & Constats initiaux</span>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {selectedCapa.description || "Aucun constat ou description détaillée formulés. Complétez ce plan pour enrichir l'historique d'audit."}
              </p>
              
              <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-150">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-mono font-medium">Type d’action</span>
                  <span className="text-slate-800 lowercase font-semibold capitalize">{selectedCapa.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-mono font-medium">Source / Écart</span>
                  <span className="text-slate-800 font-semibold">{sourceLabels[selectedCapa.source] || selectedCapa.source}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-mono font-medium">Pilote d’Action</span>
                  <span className="text-slate-800 font-semibold flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> {selectedCapa.owner}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-mono font-medium">Date Échéance</span>
                  <span className="text-red-650 font-mono font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {selectedCapa.targetDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Cause Analysis (5 Whys / Ishikawa) */}
            <div className="space-y-4">
              
              {/* DIAGNOSTIC: 5 Whys */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
                <h3 className="font-space font-semibold text-slate-800 text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <GitCommit className="w-4 h-4 text-slate-700 transform rotate-90" />
                  1. Analyse des Causes (Les 5 Pourquoi)
                </h3>

                <div className="space-y-1.5">
                  {selectedCapa.rootCauseAnalysis?.fiveWhys.map((why, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-2 bg-slate-50 p-2 border border-slate-200 rounded text-xs select-none group/why"
                    >
                      <span className="font-mono text-slate-500 font-medium shrink-0">P{index + 1}:</span>
                      <p className="text-slate-700 flex-1 leading-relaxed">{why}</p>
                      <button
                        type="button"
                        onClick={() => handleRemoveWhy(selectedCapa.id, index)}
                        className="text-[10px] text-slate-400 hover:text-red-500 opacity-0 group-hover/why:opacity-100 transition cursor-pointer p-0 bg-transparent font-medium"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}

                  {(!selectedCapa.rootCauseAnalysis?.fiveWhys || selectedCapa.rootCauseAnalysis.fiveWhys.length === 0) && (
                    <p className="text-[11px] text-slate-400 italic py-1 text-center">
                      Aucun "Pourquoi" formulé. Identifiez la cause racine pour éviter que l'anomalie ne réapparaisse.
                    </p>
                  )}
                </div>

                {/* Add Why input */}
                {selectedCapa.rootCauseAnalysis && selectedCapa.rootCauseAnalysis.fiveWhys.length < 5 && (
                  <div className="flex gap-1.5 pt-1">
                    <input 
                      type="text" 
                      value={newWhyValue}
                      onChange={(e) => setNewWhyValue(e.target.value)}
                      placeholder={`Intitulé du pourquoi #${selectedCapa.rootCauseAnalysis.fiveWhys.length + 1} ...`}
                      className="flex-1 bg-white border border-slate-200 text-[11px] rounded p-1.5 text-slate-800 placeholder-slate-400 focus:outline-none shadow-2xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddWhy(selectedCapa.id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddWhy(selectedCapa.id)}
                      className="bg-slate-900 text-white hover:bg-slate-800 text-[11px] font-semibold px-3 rounded cursor-pointer transition shadow-2xs"
                    >
                      Ajouter
                    </button>
                  </div>
                )}
              </div>

              {/* DIAGNOSTIC: Ishikawa (Les 5M) */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-2xs">
                <h3 className="font-space font-semibold text-slate-800 text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-slate-700" />
                  2. Diagramme d'Ishikawa (Les 5M + 1M)
                </h3>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { key: 'manpower', label: 'Main d’Œuvre', color: 'border-purple-200 bg-purple-50 text-purple-700' },
                    { key: 'machines', label: 'Machines / Outils', color: 'border-blue-200 bg-blue-50 text-blue-700' },
                    { key: 'materials', label: 'Matières / Intrants', color: 'border-emerald-250 bg-emerald-50 text-emerald-700' },
                    { key: 'methods', label: 'Méthodes / Process', color: 'border-amber-200 bg-amber-50 text-amber-700' },
                    { key: 'measurement', label: 'Mesures (Contrôles)', color: 'border-rose-200 bg-rose-50 text-rose-700' },
                    { key: 'environment', label: 'Milieu (Atmosphère)', color: 'border-slate-205 bg-slate-50 text-slate-600' }
                  ].map(cat => {
                    const causesList = selectedCapa.rootCauseAnalysis?.ishikawa?.[cat.key as any] || [];
                    return (
                      <div key={cat.key} className={`p-2 border rounded-lg ${cat.color} min-h-[60px] flex flex-col justify-between`}>
                        <div>
                          <span className="font-bold block mb-1 uppercase tracking-tight text-[9px] opacity-90">{cat.label}</span>
                          <div className="space-y-1">
                            {causesList.map((cause, cidx) => (
                              <div key={cidx} className="flex justify-between items-center gap-1 bg-white p-1 rounded border border-slate-100 leading-tight">
                                <span className="truncate text-[9px] text-slate-800 font-medium">{cause}</span>
                                <button
                                  type="button" 
                                  onClick={() => handleRemoveIshikawa(selectedCapa.id, cat.key, cidx)}
                                  className="text-[10px] text-slate-400 hover:text-red-500 font-bold bg-transparent border-0 cursor-pointer p-0"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        {causesList.length === 0 && (
                          <span className="text-[9px] text-slate-400 italic">Aucune liaison</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add factor form */}
                <div className="flex gap-1.5 p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <select
                    value={newIshikawaType}
                    onChange={(e) => setNewIshikawaType(e.target.value as any)}
                    className="bg-white border border-slate-200 text-[10px] text-slate-800 rounded p-1 focus:outline-none"
                  >
                    <option value="manpower">Main d'Œuvre</option>
                    <option value="machines">Machines</option>
                    <option value="materials">Matières</option>
                    <option value="methods">Méthodes</option>
                    <option value="measurement">Mesures</option>
                    <option value="environment">Milieu</option>
                  </select>

                  <input 
                    type="text"
                    value={newIshikawaValue}
                    onChange={(e) => setNewIshikawaValue(e.target.value)}
                    placeholder="Saisissez un facteur causal..."
                    className="flex-1 bg-white border border-slate-200 text-[11px] rounded p-1 text-slate-800 focus:outline-none shadow-2xs placeholder-slate-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddIshikawa(selectedCapa.id);
                      }
                    }}
                  />

                  <button
                    type="button" 
                    onClick={() => handleAddIshikawa(selectedCapa.id)}
                    className="bg-slate-900 text-white hover:bg-slate-850 text-[10px] font-bold px-2.5 rounded cursor-pointer transition shadow-2xs"
                  >
                    Lier
                  </button>
                </div>
              </div>

              {/* OPERATIONAL TASKS LIST */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                  <h3 className="font-space font-semibold text-slate-800 text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-slate-700" />
                    3. Plan de tâches et actions correctives
                  </h3>

                  <button
                    onClick={() => setIsAddingAction(!isAddingAction)}
                    className="text-[10px] font-bold text-slate-900 hover:text-slate-700 transition flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2]" /> Planifier tâche
                  </button>
                </div>

                {/* Addition action form */}
                {isAddingAction && (
                  <form onSubmit={(e) => handleAddSubAction(e, selectedCapa.id)} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg space-y-2">
                    <input 
                      type="text"
                      required
                      value={newActTitle}
                      onChange={(e) => setNewActTitle(e.target.value)}
                      placeholder="Intitulé de l'action opérationnelle requise..."
                      className="w-full bg-white border border-slate-202 text-xs rounded p-1.5 text-slate-800 placeholder-slate-400 focus:outline-none shadow-2xs"
                    />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px]/none text-slate-500 block mb-1">Pilote</span>
                        <input 
                          type="text"
                          required
                          value={newActOwner}
                          onChange={(e) => setNewActOwner(e.target.value)}
                          placeholder={selectedCapa.owner}
                          className="w-full bg-white border border-slate-202 rounded p-1 text-slate-800 text-xs focus:outline-none shadow-2xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px]/none text-slate-500 block mb-1">Échéance</span>
                        <input 
                          type="date"
                          required
                          value={newActDate}
                          onChange={(e) => setNewActDate(e.target.value)}
                          className="w-full bg-white border border-slate-202 rounded p-1 text-slate-800 text-xs focus:outline-none shadow-2xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setIsAddingAction(false)}
                        className="bg-white border border-slate-200 px-2 py-1 text-[10px] text-slate-500 rounded hover:text-slate-800 cursor-pointer shadow-2xs"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit"
                        className="bg-slate-900 border border-slate-900 text-white px-3 py-1 text-[10px] font-bold rounded hover:bg-slate-850 cursor-pointer shadow-xs transition"
                      >
                        Ajouter
                      </button>
                    </div>
                  </form>
                )}

                {/* Actions checklist */}
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {selectedCapa.actions.map(act => {
                    const isCompleted = act.status === 'done';
                    return (
                      <div 
                        key={act.id} 
                        className={`p-2.5 border rounded-lg transition flex items-start gap-2.5 relative group/item ${
                          isCompleted 
                            ? 'bg-emerald-50 border-emerald-150 text-slate-500' 
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <input 
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => handleToggleAction(selectedCapa.id, act.id)}
                          className="mt-0.5 rounded border-slate-350 bg-white text-slate-900 focus:ring-slate-900/10 cursor-pointer h-3.5 w-3.5 shrink-0"
                        />

                        <div className="flex-1 min-w-0 pr-6">
                          <span className={`block text-xs leading-normal ${isCompleted ? 'line-through text-slate-450' : 'text-slate-800 font-medium'}`}>
                            {act.title}
                          </span>
                          
                          <div className="flex justify-between text-[10px] text-slate-450 mt-1.5 font-mono flex-wrap gap-y-1">
                            <span>Par: <span className="text-slate-700 font-semibold">{act.owner}</span></span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                                isCompleted 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}>
                                {isCompleted ? 'Réalisé' : 'En attente'}
                              </span>
                              <span>Échéance: <span className={isCompleted ? 'text-slate-400' : 'text-slate-600 font-medium'}>{act.targetDate}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Quick delete act item */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSubAction(selectedCapa.id, act.id)}
                          className="absolute right-2 top-2 text-slate-350 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer bg-transparent border-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {selectedCapa.actions.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic py-6 text-center leading-relaxed">
                      Aucun livrable ou tâche désignée dans cette fiche d'amélioration.<br />
                      Cliquez sur <b>"Planifier tâche"</b> ci-dessus pour planifier.
                    </p>
                  )}
                </div>

                {/* Progress / rate summary */}
                {selectedCapa.actions.length > 0 && (
                  <div className="pt-2 border-t border-slate-150 flex items-center justify-between text-xs font-mono font-medium mt-1 bg-slate-50 p-2 rounded border border-slate-200 shadow-2xs">
                    <span className="text-slate-500">Taux de résolution:</span>
                    <span className="text-slate-805 font-bold shrink-0">
                      {Math.round((selectedCapa.actions.filter(a => a.status === 'done').length / selectedCapa.actions.length) * 100)}% Clôturé
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
