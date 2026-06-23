import React, { useState } from 'react';
import { OKR, KeyResult, ProcessNode } from '../types';
import { 
  Plus, 
  Trash2, 
  Target, 
  Award, 
  Workflow, 
  User, 
  TrendingUp, 
  Percent, 
  PlusCircle, 
  HelpCircle,
  Clock,
  Filter,
  CheckCircle2,
  Calendar,
  Eye
} from 'lucide-react';

interface OkrModuleProps {
  okrs: OKR[];
  nodes: ProcessNode[];
  onChangeOkrs: (newOkrs: OKR[]) => void;
  quickAddProcessId?: number | null;
  onClearQuickAddProcess?: () => void;
}

export const OkrModule: React.FC<OkrModuleProps> = ({
  okrs,
  nodes,
  onChangeOkrs,
  quickAddProcessId,
  onClearQuickAddProcess
}) => {
  const [periodFilter, setPeriodFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [processFilter, setProcessFilter] = useState('all');
  
  // Creation States
  const [isCreatingObjective, setIsCreatingObjective] = useState(false);
  const [newObjectiveText, setNewObjectiveText] = useState('');
  const [newOkrPeriod, setNewOkrPeriod] = useState('Q2 2026');
  const [newOkrCategory, setNewOkrCategory] = useState<OKR['category']>('quality');
  const [newOkrLinkedProcessId, setNewOkrLinkedProcessId] = useState<number | undefined>(undefined);
  const [newOkrOwner, setNewOkrOwner] = useState('Comité de Direction');

  React.useEffect(() => {
    if (quickAddProcessId) {
      setNewOkrLinkedProcessId(quickAddProcessId);
      setIsCreatingObjective(true);
      if (onClearQuickAddProcess) {
        onClearQuickAddProcess();
      }
    }
  }, [quickAddProcessId, onClearQuickAddProcess]);

  // Key Result inline states
  const [selectedOkrId, setSelectedOkrId] = useState<string | null>(okrs[0]?.id || null);
  const [okrIdToConfirmDelete, setOkrIdToConfirmDelete] = useState<string | null>(null);
  const [isAddingKr, setIsAddingKr] = useState(false);
  const [newKrDesc, setNewKrDesc] = useState('');
  const [newKrStart, setNewKrStart] = useState<number>(0);
  const [newKrTarget, setNewKrTarget] = useState<number>(100);
  const [newKrCurrent, setNewKrCurrent] = useState<number>(0);
  const [newKrUnit, setNewKrUnit] = useState('%');
  const [newKrWeight, setNewKrWeight] = useState<number>(1);

  const selectedOkr = okrs.find(o => o.id === selectedOkrId);

  // Helper: compute individual KR progress
  const getKrProgress = (kr: KeyResult) => {
    const range = kr.targetValue - kr.startValue;
    if (range === 0) return 100;
    
    let progress = 0;
    if (kr.targetValue < kr.startValue) {
      // Descending target (e.g. accidents starting at 5 reducing to 0)
      progress = ((kr.startValue - kr.currentValue) / (kr.startValue - kr.targetValue)) * 100;
    } else {
      // Ascending target (e.g. sales starting at 0 growing to 100)
      progress = ((kr.currentValue - kr.startValue) / range) * 100;
    }
    
    return Math.max(0, Math.min(100, Math.round(progress)));
  };

  // Helper: compute overall Objective progress of an OKR (weighted mean)
  const getObjectiveProgress = (okr: OKR) => {
    const krs = okr.keyResults;
    if (krs.length === 0) return 0;
    
    let totalWeight = 0;
    let weightedProgressSum = 0;
    
    krs.forEach(k => {
      const prog = getKrProgress(k);
      const w = k.weight || 1;
      weightedProgressSum += (prog * w);
      totalWeight += w;
    });

    return totalWeight > 0 ? Math.round(weightedProgressSum / totalWeight) : 0;
  };

  // Actions: Create parent OKR Objective
  const handleCreateObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjectiveText.trim()) return;

    const maxSerial = okrs.reduce((max, o) => {
      const serial = Number(o.id.split('-')[2]);
      return !isNaN(serial) ? Math.max(max, serial) : max;
    }, 0);

    const newId = `OKR-2026-${String(maxSerial + 1).padStart(2, '0')}`;
    
    // Create pre-baked key result so objective is never empty
    const defaultKr: KeyResult = {
      id: `kr-${Date.now()}-1`,
      description: "Identifier et collecter les données d'étape intermédiaires",
      startValue: 0,
      targetValue: 100,
      currentValue: 0,
      unit: '%',
      weight: 1
    };

    const newOkr: OKR = {
      id: newId,
      objective: newObjectiveText,
      period: newOkrPeriod,
      category: newOkrCategory,
      linkedProcessId: newOkrLinkedProcessId ? Number(newOkrLinkedProcessId) : undefined,
      owner: newOkrOwner,
      status: 'on_track',
      keyResults: [defaultKr]
    };

    const nextOkrs = [...okrs, newOkr];
    onChangeOkrs(nextOkrs);
    setSelectedOkrId(newId);
    setIsCreatingObjective(false);
    setNewObjectiveText('');
  };

  // Actions: Delete OKR Objective
  const handleDeleteObjective = (id: string, bypassConfirm = false) => {
    if (bypassConfirm || confirm("Voulez-vous supprimer cet Objectif de performance ainsi que ses résultats clés ?")) {
      const nextOkrs = okrs.filter(o => o.id !== id);
      onChangeOkrs(nextOkrs);
      setSelectedOkrId(nextOkrs[0]?.id || null);
      setOkrIdToConfirmDelete(null);
    }
  };

  // Actions: Add Key Result to existing OKR
  const handleAddKeyResult = (e: React.FormEvent, okrId: string) => {
    e.preventDefault();
    if (!newKrDesc.trim()) return;

    const nextOkrs = okrs.map(o => {
      if (o.id === okrId) {
        const newKr: KeyResult = {
          id: `kr-${Date.now()}`,
          description: newKrDesc,
          startValue: newKrStart,
          targetValue: newKrTarget,
          currentValue: newKrCurrent,
          unit: newKrUnit,
          weight: newKrWeight
        };
        return {
          ...o,
          keyResults: [...o.keyResults, newKr]
        };
      }
      return o;
    });

    onChangeOkrs(nextOkrs);
    setNewKrDesc('');
    setNewKrStart(0);
    setNewKrTarget(100);
    setNewKrCurrent(0);
    setNewKrUnit('%');
    setNewKrWeight(1);
    setIsAddingKr(false);
  };

  // Delete individual Key Result
  const handleDeleteKeyResult = (okrId: string, krId: string) => {
    const nextOkrs = okrs.map(o => {
      if (o.id === okrId) {
        return {
          ...o,
          keyResults: o.keyResults.filter(k => k.id !== krId)
        };
      }
      return o;
    });
    onChangeOkrs(nextOkrs);
  };

  // Update real-time progress value for a Key Result
  const handleUpdateKrValue = (okrId: string, krId: string, val: number) => {
    const nextOkrs = okrs.map(o => {
      if (o.id === okrId) {
        const nextKrs = o.keyResults.map(k => {
          if (k.id === krId) {
            // clamp value appropriately or let it expand
            const clamped = Number(val.toFixed(1));
            return { ...k, currentValue: clamped };
          }
          return k;
        });
        
        // Auto check performance status
        let nextStatus = o.status;
        const avg = krsProgressPercentage(nextKrs);
        if (avg >= 100) nextStatus = 'completed';
        else if (avg < 40) nextStatus = 'lagging';
        else nextStatus = 'on_track';

        return { 
          ...o, 
          keyResults: nextKrs,
          status: nextStatus
        };
      }
      return o;
    });
    onChangeOkrs(nextOkrs);
  };

  const krsProgressPercentage = (krs: KeyResult[]) => {
    if (krs.length === 0) return 0;
    let totalWeight = 0;
    let weightedProgressSum = 0;
    
    krs.forEach(k => {
      const range = k.targetValue - k.startValue;
      let prog = 0;
      if (range !== 0) {
        if (k.targetValue < k.startValue) {
          prog = ((k.startValue - k.currentValue) / (k.startValue - k.targetValue)) * 100;
        } else {
          prog = ((k.currentValue - k.startValue) / range) * 100;
        }
      } else {
        prog = 100;
      }
      prog = Math.max(0, Math.min(100, prog));
      const w = k.weight || 1;
      weightedProgressSum += (prog * w);
      totalWeight += w;
    });

    return totalWeight > 0 ? Math.round(weightedProgressSum / totalWeight) : 0;
  };

  // Update status dropdown
  const handleUpdateOkrStatus = (okrId: string, status: OKR['status']) => {
    const nextOkrs = okrs.map(o => o.id === okrId ? { ...o, status } : o);
    onChangeOkrs(nextOkrs);
  };

  // Filtering formulas
  const filteredOkrs = okrs.filter(o => {
    const matchesPeriod = periodFilter === 'all' || o.period === periodFilter;
    const matchesCategory = categoryFilter === 'all' || o.category === categoryFilter;
    const matchesProcess = processFilter === 'all' || String(o.linkedProcessId) === processFilter;
    return matchesPeriod && matchesCategory && matchesProcess;
  });

  const categoryLabels = {
    corporate: 'Gouvernance Globale',
    quality: 'Qualité & Processus',
    environment: 'Environnement & Déchets',
    safety: 'Santé & Sécurité (DUER)',
    process: 'Efficacité Opérationnelle'
  };

  const statusColors = {
    on_track: 'text-emerald-700 bg-emerald-50 border-emerald-150 font-bold',
    at_risk: 'text-amber-700 bg-amber-50 border-amber-150 font-bold',
    lagging: 'text-red-700 bg-red-50 border-red-150 font-bold',
    completed: 'text-blue-700 bg-blue-50 border-blue-150 font-bold'
  };

  const statusLabels = {
    on_track: 'En bonne voie',
    at_risk: 'À risque',
    lagging: 'En retard',
    completed: 'Atteint ✔'
  };

  // Calculate unique periods for filtering selection
  const periods = Array.from(new Set(okrs.map(o => o.period)));

  return (
    <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col xl:flex-row gap-5 xl:h-[calc(100vh-120px)] xl:overflow-hidden overflow-y-auto h-full w-full" id="okr-panel-wrapper">
      
      {/* COLUMN 1: Simple Filter and properties Panel */}
      <div className="w-full xl:w-[250px] bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col xl:h-full overflow-y-auto shrink-0 space-y-4 min-h-[300px] xl:min-h-0">
        
        <div className="flex items-center justify-between border-b border-slate-150 pb-2">
          <div>
            <h3 className="font-space font-bold text-slate-900 text-sm">Filtres OKRs</h3>
            <p className="text-[10px] text-slate-500">Planification des résultats clés par pilier</p>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-slate-700">
          <div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">Période d'Exercice</span>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full bg-white border border-slate-202 text-slate-800 rounded px-2.5 py-1.5 focus:outline-none shadow-2xs font-medium"
            >
              <option value="all">Toutes les Périodes</option>
              {periods.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">Division / Pilier</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-white border border-slate-202 text-slate-800 rounded px-2.5 py-1.5 focus:outline-none shadow-2xs font-medium"
            >
              <option value="all">Toutes les Catégories</option>
              {Object.entries(categoryLabels).map(([k,v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">Processus Lié (SMI)</span>
            <select
              value={processFilter}
              onChange={(e) => setProcessFilter(e.target.value)}
              className="w-full bg-white border border-slate-202 text-slate-800 rounded px-2.5 py-1.5 focus:outline-none shadow-2xs font-medium"
            >
              <option value="all">Tous les Processus</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>#{n.id} - {n.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-150 text-[11px] text-slate-400 flex flex-col gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="font-bold flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Cadre de Gestion SMI
            </span>
            <p className="leading-relaxed">
              Les OKRs lient la vision stratégique à l'excellence opérationnelle. Chaque objectif comporte des indicateurs mesurables.
            </p>
          </div>
        </div>

      </div>

      {/* COLUMN 2: OKRs Registry Large Table */}
      <div className="flex-grow xl:flex-1 bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col xl:h-full overflow-hidden min-h-[400px] xl:min-h-0 shrink-0">
        
        <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-3">
          <div>
            <h3 className="font-space font-bold text-slate-900 text-md">Registre Général des OKRs QHSE</h3>
            <p className="text-[10px] text-slate-500">Indicateurs de Performance et Résultats Majeurs (Key Results)</p>
          </div>

          <button
            id="add-okr-btn"
            onClick={() => setIsCreatingObjective(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-white stroke-[3]" /> Nouvel Objectif
          </button>
        </div>

        {/* Data Table of objectives */}
        <div className="flex-1 overflow-auto border border-slate-150 rounded-lg">
          {filteredOkrs.length === 0 ? (
            <p className="text-center py-16 text-slate-450 text-xs italic bg-slate-50/50">
              Aucun indicateur de performance OKR ne répond à vos filtres.
            </p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase tracking-wider select-none">
                  <th className="p-3 font-bold w-[120px]">Référence OKR</th>
                  <th className="p-3 font-bold">Objectif Stratégique</th>
                  <th className="p-3 font-bold w-[150px]">Pilier / Division</th>
                  <th className="p-3 font-bold w-[95px]">Exercice</th>
                  <th className="p-3 font-bold w-[160px]">Avancement Global</th>
                  <th className="p-3 font-bold w-[110px]">Pilote</th>
                  <th className="p-3 font-bold w-[110px]">Statut</th>
                  <th className="p-3 font-bold w-[80px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOkrs.map(okr => {
                  const isSelected = selectedOkrId === okr.id;
                  const progress = getObjectiveProgress(okr);

                  const catBadges = {
                    corporate: 'border-blue-200 bg-blue-50 text-blue-750',
                    quality: 'border-purple-200 bg-purple-50 text-purple-750',
                    environment: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                    safety: 'border-rose-250 bg-rose-50 text-rose-750 font-semibold',
                    process: 'border-slate-200 bg-slate-105 text-slate-700'
                  };

                  return (
                    <tr
                      key={okr.id}
                      onClick={() => setSelectedOkrId(okr.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-slate-105 font-medium text-slate-900 border-l-4 border-l-slate-900' 
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 border border-slate-205 px-2 py-0.5 rounded text-[10px]/none inline-block">
                          {okr.id}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 leading-tight truncate max-w-[260px]" title={okr.objective}>
                          {okr.objective}
                        </div>
                        {okr.linkedProcessId && (
                          <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                            <Workflow className="w-2.5 h-2.5 text-slate-450" /> #{okr.linkedProcessId} - {nodes.find(n => n.id === okr.linkedProcessId)?.name.split(' ')[0]}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`text-[9.5px]/none px-1.5 py-0.5 select-none border rounded-full font-medium ${catBadges[okr.category]}`}>
                          {categoryLabels[okr.category].slice(0, 20)}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-600">{okr.period}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-slate-105 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                            <div className="bg-slate-905 h-1.5 rounded transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-800 shrink-0">{progress}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-650 font-medium">
                        <div className="flex items-center gap-1">
                          <User className="w-3" />
                          <span className="truncate max-w-[90px]">{okr.owner}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[9.5px] px-1.5 py-0.5 select-none border rounded ${statusColors[okr.status]}`}>
                          {statusLabels[okr.status]}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {okrIdToConfirmDelete === okr.id ? (
                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteObjective(okr.id, true);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-705 text-white text-[10px] font-bold rounded cursor-pointer transition shadow-xs"
                              title="Confirmer la suppression"
                            >
                              Oui
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOkrIdToConfirmDelete(null);
                              }}
                              className="px-1.5 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-medium rounded cursor-pointer transition"
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
                              setOkrIdToConfirmDelete(okr.id);
                            }}
                            className="p-1 px-1.5 border border-slate-100 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-550 rounded transition duration-150 cursor-pointer"
                            title="Supprimer cet OKR"
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

      {/* COLUMN 3: Real active OKR detailed Form Editor */}
      <div className="w-full xl:w-[450px] bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex flex-col xl:h-full overflow-y-auto shrink-0">
        
        {/* CREATE OBJECTIVE FORM */}
        {isCreatingObjective ? (
          <form onSubmit={handleCreateObjective} className="space-y-4 text-xs" id="okr-creation-form">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="font-space font-bold text-slate-900 text-md">Définir un indicateur OKR</h3>
              <button
                type="button"
                onClick={() => setIsCreatingObjective(false)}
                className="text-slate-500 hover:text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer transition"
              >
                Annuler
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                  ÉNONCÉ DE L'OBJECTIF STRATÉGIQUE (OKR)
                </label>
                <input 
                  type="text"
                  required
                  value={newObjectiveText}
                  onChange={(e) => setNewObjectiveText(e.target.value)}
                  placeholder="e.g. Dépasser les seuils de valorisation des rebuts de l'usine..."
                  className="w-full bg-white border border-slate-202 text-xs rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-slate-400 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                    Trimestre / Exercice
                  </label>
                  <input 
                    type="text"
                    required
                    value={newOkrPeriod}
                    onChange={(e) => setNewOkrPeriod(e.target.value)}
                    placeholder="Q2 2026, Q3 2026..."
                    className="w-full bg-white border border-slate-202 text-xs rounded-lg p-2.5 text-slate-800 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">
                    Pilier de Management
                  </label>
                  <select
                    value={newOkrCategory}
                    onChange={(e) => setNewOkrCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-202 text-xs p-2 rounded-lg font-medium shadow-2xs focus:outline-none"
                  >
                    {Object.entries(categoryLabels).map(([k,v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-550 uppercase font-mono mb-1">
                    Rattachement au Processus
                  </label>
                  <select
                    value={newOkrLinkedProcessId || ''}
                    onChange={(e) => setNewOkrLinkedProcessId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white border border-slate-202 text-xs p-2 rounded-lg font-medium shadow-2xs focus:outline-none"
                  >
                    <option value="">-- Aucun processus lié --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>#{n.id} - {n.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-550 uppercase font-mono mb-1">
                    Responsable / Pilote
                  </label>
                  <input 
                    type="text"
                    required
                    value={newOkrOwner}
                    onChange={(e) => setNewOkrOwner(e.target.value)}
                    className="w-full bg-white border border-slate-202 text-xs rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-slate-400 shadow-2xs"
                  />
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreatingObjective(false)}
                className="bg-slate-105 hover:bg-slate-200 border border-slate-250 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition shadow-2xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="bg-slate-905 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2 rounded-lg cursor-pointer shadow-xs transition"
              >
                Déployer l'Objectif
              </button>
            </div>
          </form>
        ) : !selectedOkr ? (
          <div className="text-center py-24 text-slate-400 my-auto">
            <Target className="w-12 h-12 text-slate-305 mx-auto mb-3" />
            <h4 className="font-space font-semibold text-slate-700 text-md mb-1">Aucun objectif sélectionné</h4>
            <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-500">
              Sélectionnez une ligne dans le registre des OKRs à gauche pour afficher le taux d'avancement des résultats clés et piloter les objectifs.
            </p>
          </div>
        ) : (
          /* DETAILED OBJECTIVE / KEY RESULTS SCORECARD SHEET */
          <div className="space-y-5" id="okr-card-details">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1 font-mono text-xs text-slate-500 flex-wrap">
                  <span className="font-bold bg-slate-100 border border-slate-202 px-2 py-0.5 rounded text-[10px] text-slate-705 shadow-3xs">
                    {selectedOkr.id}
                  </span>
                  <span className="font-semibold text-slate-700">{selectedOkr.period}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-medium text-slate-500">{categoryLabels[selectedOkr.category]}</span>
                </div>
                <h2 className="text-md font-space font-bold text-slate-900 tracking-tight leading-snug">
                  {selectedOkr.objective}
                </h2>
              </div>

              {/* Status and Actions combo */}
              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                <div>
                  <span className="block text-[8px] text-slate-500 uppercase font-mono font-bold mb-0.5">Statut d'étape</span>
                  <select
                    value={selectedOkr.status}
                    onChange={(e) => handleUpdateOkrStatus(selectedOkr.id, e.target.value as any)}
                    className="bg-white border border-slate-202 text-xs text-slate-800 rounded px-2 py-1.5 focus:outline-none shadow-2xs font-medium"
                  >
                    {Object.entries(statusLabels).map(([k,v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {okrIdToConfirmDelete === selectedOkr.id ? (
                  <div className="flex items-center gap-1 border border-red-200 bg-red-50/70 p-1.5 rounded-lg shrink-0 mt-3 shadow-2xs">
                    <span className="text-[9px] text-red-700 font-bold font-mono">Supprimer?</span>
                    <button
                      onClick={() => handleDeleteObjective(selectedOkr.id, true)}
                      className="p-1 px-1.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold rounded cursor-pointer transition shadow-xs animate-none"
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => setOkrIdToConfirmDelete(null)}
                      className="p-1 px-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-medium rounded cursor-pointer transition"
                    >
                      Non
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setOkrIdToConfirmDelete(selectedOkr.id)}
                    className="p-1.5 mt-3 border border-slate-200 hover:border-red-400 text-slate-400 hover:text-red-550 hover:bg-red-50 rounded-lg cursor-pointer transition shadow-2xs"
                    title="Supprimer la fiche"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Overall progress indicator card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-slate-450 uppercase font-bold block mb-1">Niveau d'Avancement Global</span>
                <p className="text-[10.5px] text-slate-500 leading-normal max-w-[240px]">
                  Calculé automatiquement à partir de la moyenne pondérée de chacun des indicateurs.
                </p>
                <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-650 font-medium">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" /> {selectedOkr.owner}
                  </span>
                  {selectedOkr.linkedProcessId && (
                    <span className="flex items-center gap-1">
                      <Workflow className="w-3.5 h-3.5 text-violet-500" /> Processus #{selectedOkr.linkedProcessId}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-center shrink-0 pr-1.5">
                <span className="text-3xl font-space font-extrabold text-slate-900 block font-mono">
                  {getObjectiveProgress(selectedOkr)}%
                </span>
                <span className="text-[8.5px] font-mono uppercase tracking-wider text-slate-400 font-bold block mt-0.5">
                  KPI Cible
                </span>
              </div>
            </div>

            {/* KEY RESULTS ACCORDION CONTAINER */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                <h3 className="font-space font-semibold text-xs text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600 animate-pulse" /> Indicateurs Opérationnels Clés (Key Results)
                </h3>

                <button
                  onClick={() => setIsAddingKr(!isAddingKr)}
                  className="text-[10px] font-bold text-slate-900 hover:text-slate-700 transition flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2]" /> Nouvel indicateur
                </button>
              </div>

              {/* Inline addition form */}
              {isAddingKr && (
                <form onSubmit={(e) => handleAddKeyResult(e, selectedOkr.id)} className="bg-slate-50 border border-slate-202 p-3.5 rounded-xl space-y-3 shadow-2xs">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold uppercase font-mono mb-1">Définition de l’Indicateur d’impact</label>
                    <input 
                      type="text"
                      required
                      value={newKrDesc}
                      onChange={(e) => setNewKrDesc(e.target.value)}
                      placeholder="e.g. Réduire la consommation électrique moyenne sous 12 MWh..."
                      className="w-full bg-white border border-slate-202 text-xs rounded-lg p-2 text-slate-850 placeholder-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px]/none text-slate-500 block mb-1 font-mono">Point Initial</span>
                      <input 
                        type="number"
                        required
                        value={newKrStart}
                        onChange={(e) => setNewKrStart(Number(e.target.value))}
                        className="w-full bg-white border border-slate-202 rounded p-1 text-slate-800 text-xs text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px]/none text-slate-500 block mb-1 font-mono">Valeur Cible</span>
                      <input 
                        type="number"
                        required
                        value={newKrTarget}
                        onChange={(e) => setNewKrTarget(Number(e.target.value))}
                        className="w-full bg-white border border-slate-202 rounded p-1 text-slate-800 text-xs text-center focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px]/none text-slate-500 block mb-1 font-mono">Unité</span>
                      <input 
                        type="text"
                        required
                        value={newKrUnit}
                        onChange={(e) => setNewKrUnit(e.target.value)}
                        placeholder="%, ppm, Accidents..."
                        className="w-full bg-white border border-slate-202 rounded p-1 text-slate-800 text-xs text-center focus:outline-none font-medium"
                      />
                    </div>
                    <div>
                      <span className="text-[10px]/none text-slate-505 block mb-1 font-mono">Poids (1 à 5)</span>
                      <input 
                        type="number"
                        required
                        min={1}
                        max={5}
                        value={newKrWeight}
                        onChange={(e) => setNewKrWeight(Number(e.target.value))}
                        className="w-full bg-white border border-slate-202 rounded p-1 text-slate-800 text-xs text-center focus:outline-none font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingKr(false)}
                      className="bg-white border border-slate-200 px-3 py-1.5 text-[10px] text-slate-650 rounded hover:bg-slate-105 cursor-pointer transition shadow-2xs"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit"
                      className="bg-slate-900 border border-slate-900 text-white px-4 py-1.5 text-[10px] font-bold rounded hover:bg-slate-850 cursor-pointer shadow-xs transition"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              )}

              {/* List of active Key Results with interactive sliders */}
              <div className="space-y-3">
                {selectedOkr.keyResults.map(kr => {
                  const progressPct = getKrProgress(kr);
                  
                  return (
                    <div key={kr.id} className="bg-white p-3.5 border border-slate-200 shadow-2xs rounded-xl space-y-3.5 relative group/item">
                      
                      {/* Delete KR inline */}
                      {selectedOkr.keyResults.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteKeyResult(selectedOkr.id, kr.id)}
                          className="absolute right-3 top-3 text-slate-350 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer bg-transparent border-0"
                          title="Supprimer cet indicateur"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Header title */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="pr-6 max-w-xl">
                          <h4 className="text-xs text-slate-800 font-bold leading-normal">
                            {kr.description}
                          </h4>
                          <span className="text-[9.5px] font-mono text-slate-450 block mt-1 uppercase font-semibold">
                            Coeff de Pondération : poids {kr.weight || 1}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-emerald-805 font-mono font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">
                            {progressPct}%
                          </span>
                        </div>
                      </div>

                      {/* Real Progress indicator slider controls */}
                      <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1.5">
                          <span>Initial: <span className="text-slate-850 font-semibold">{kr.startValue} {kr.unit}</span></span>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-bold">Actuel :</span>
                            <input 
                              type="number"
                              step="0.1"
                              value={kr.currentValue}
                              onChange={(e) => handleUpdateKrValue(selectedOkr.id, kr.id, Number(e.target.value))}
                              className="bg-white border border-slate-202 rounded px-1 w-14 text-center text-xs font-bold text-slate-900 focus:outline-none"
                            />
                            <span className="text-slate-650 font-bold">{kr.unit}</span>
                          </div>

                          <span>Cible: <span className="text-emerald-750 font-bold">{kr.targetValue} {kr.unit}</span></span>
                        </div>

                        {/* Slider bar */}
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            min={Math.min(kr.startValue, kr.targetValue)}
                            max={Math.max(kr.startValue, kr.targetValue)}
                            step={Math.abs(kr.targetValue - kr.startValue) > 10 ? 1 : 0.1}
                            value={kr.currentValue}
                            onChange={(e) => handleUpdateKrValue(selectedOkr.id, kr.id, Number(e.target.value))}
                            className="flex-1 accent-slate-900 bg-slate-200 cursor-ew-resize h-1 rounded-full"
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
