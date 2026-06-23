import React, { useState } from 'react';
import { Risk, ProcessNode, Capa } from '../types';
import { 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  User, 
  Layers, 
  ShieldAlert, 
  Activity, 
  HelpCircle,
  Eye,
  AlertOctagon,
  Wrench,
  Workflow,
  CheckCircle,
  PlusCircle,
  TrendingDown
} from 'lucide-react';

interface RiskModuleProps {
  risks: Risk[];
  nodes: ProcessNode[];
  capas: Capa[];
  onChangeRisks: (newRisks: Risk[]) => void;
  onQuickAddCapaFromRisk: (riskId: string, title: string, processId?: number) => void;
  onSwitchTab: (tab: 'capas') => void;
  quickAddProcessId?: number | null;
  onClearQuickAddProcess: () => void;
}

export const RiskModule: React.FC<RiskModuleProps> = ({
  risks,
  nodes,
  capas,
  onChangeRisks,
  onQuickAddCapaFromRisk,
  onSwitchTab,
  quickAddProcessId,
  onClearQuickAddProcess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [processFilter, setProcessFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(risks[0]?.id || null);
  const [riskIdToConfirmDelete, setRiskIdToConfirmDelete] = useState<string | null>(null);
  
  // Matrix filtering states
  const [matrixFilter, setMatrixFilter] = useState<{ prob: number; imp: number } | null>(null);
  
  // Toggle between Initial (Gross) and Residual Risk matrices
  const [assessmentMode, setAssessmentMode] = useState<'initial' | 'residual'>('initial');

  // Form toggles
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<Risk['category']>('operational');
  const [newLinkedProcessId, setNewLinkedProcessId] = useState<number | undefined>(
    quickAddProcessId ? quickAddProcessId : undefined
  );
  const [newOwner, setNewOwner] = useState('Ingénieur QHSE');
  const [newProbBefore, setNewProbBefore] = useState<number>(3);
  const [newImpBefore, setNewImpBefore] = useState<number>(3);
  const [newMitigation, setNewMitigation] = useState('');

  // Handle prospective quick addition from process map
  React.useEffect(() => {
    if (quickAddProcessId !== null && quickAddProcessId !== undefined) {
      setNewLinkedProcessId(quickAddProcessId);
      setIsCreating(true);
      setNewTitle(`Risque de non-conformité : Processus #${quickAddProcessId}`);
      onClearQuickAddProcess(); // clear trigger
    }
  }, [quickAddProcessId]);

  const selectedRisk = risks.find(r => r.id === selectedRiskId);

  // Creating a new risk handler
  const handleCreateRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const maxIdSerial = risks.reduce((max, r) => {
      const parts = r.id.split('-');
      const s = Number(parts[1]);
      return !isNaN(s) ? Math.max(max, s) : max;
    }, 0);

    const newId = `RISK-${String(maxIdSerial + 1).padStart(2, '0')}`;
    const score = newProbBefore * newImpBefore;

    const newObj: Risk = {
      id: newId,
      title: newTitle,
      description: newDesc,
      category: newCategory,
      owner: newOwner,
      linkedProcessId: newLinkedProcessId ? Number(newLinkedProcessId) : undefined,
      probabilityBefore: newProbBefore,
      impactBefore: newImpBefore,
      scoreBefore: score,
      mitigationPlan: newMitigation,
      status: 'identified'
    };

    const nextRisks = [...risks, newObj];
    onChangeRisks(nextRisks);
    setSelectedRiskId(newId);
    setIsCreating(false);

    // reset
    setNewTitle('');
    setNewDesc('');
    setNewMitigation('');
    setNewProbBefore(3);
    setNewImpBefore(3);
  };

  // Delete risk handler
  const handleDeleteRisk = (id: string, bypassConfirm = false) => {
    if (bypassConfirm || confirm("Voulez-vous supprimer cette entrée de risques ?")) {
      const nextRisks = risks.filter(r => r.id !== id);
      onChangeRisks(nextRisks);
      setSelectedRiskId(nextRisks[0]?.id || null);
      setRiskIdToConfirmDelete(null);
    }
  };

  // Quick edit status or mitigation on selected risk
  const handleUpdateStatus = (riskId: string, status: Risk['status']) => {
    const nextRisks = risks.map(r => r.id === riskId ? { ...r, status } : r);
    onChangeRisks(nextRisks);
  };

  const handleUpdateScores = (riskId: string, field: 'probBefore' | 'impBefore' | 'probAfter' | 'impAfter', val: number) => {
    const nextRisks = risks.map(r => {
      if (r.id === riskId) {
        if (field === 'probBefore') {
          return { ...r, probabilityBefore: val, scoreBefore: val * r.impactBefore };
        }
        if (field === 'impBefore') {
          return { ...r, impactBefore: val, scoreBefore: r.probabilityBefore * val };
        }
        if (field === 'probAfter') {
          const nextProbAfter = val;
          const nextImpAfter = r.impactAfter || r.impactBefore;
          return { ...r, probabilityAfter: nextProbAfter, impactAfter: nextImpAfter, scoreAfter: nextProbAfter * nextImpAfter };
        }
        if (field === 'impAfter') {
          const nextImpAfter = val;
          const nextProbAfter = r.probabilityAfter || r.probabilityBefore;
          return { ...r, probabilityAfter: nextProbAfter, impactAfter: nextImpAfter, scoreAfter: nextProbAfter * nextImpAfter };
        }
      }
      return r;
    });
    onChangeRisks(nextRisks);
  };

  // Filters formula
  const filteredRisks = risks.filter(r => {
    const prob = assessmentMode === 'initial' ? r.probabilityBefore : (r.probabilityAfter || r.probabilityBefore);
    const imp = assessmentMode === 'initial' ? r.impactBefore : (r.impactAfter || r.impactBefore);

    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesProcess = processFilter === 'all' || String(r.linkedProcessId) === processFilter;
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    
    // Matrix matching
    const matchesMatrix = matrixFilter === null || (prob === matrixFilter.prob && imp === matrixFilter.imp);

    return matchesSearch && matchesCategory && matchesProcess && matchesStatus && matchesMatrix;
  });

  // Calculate Matrix weights
  const getMatrixCount = (prob: number, imp: number) => {
    return risks.filter(r => {
      const p = assessmentMode === 'initial' ? r.probabilityBefore : (r.probabilityAfter || r.probabilityBefore);
      const i = assessmentMode === 'initial' ? r.impactBefore : (r.impactAfter || r.impactBefore);
      return p === prob && i === imp;
    }).length;
  };

  // Labels
  const categoryLabels = {
    strategic: '🚩 Stratégique',
    operational: '⚙️ Opérationnel',
    environmental: '🌱 Environnemental',
    health_safety: '🏥 Santé & Sécurité'
  };

  const statusLabels = {
    identified: 'Identifié',
    treated: 'Mitigé / Traité',
    monitored: 'Sous contrôle',
    closed: 'Fermé / Résout'
  };

  const getScoreColor = (score: number) => {
    if (score >= 12) return 'text-red-700 bg-red-50 border-red-150 font-bold';
    if (score >= 5) return 'text-amber-700 bg-amber-50 border-amber-150 font-bold';
    return 'text-emerald-700 bg-emerald-50 border-emerald-150 font-bold';
  };

  // Matrix cell background color based on standard risk scores
  const getCellBg = (prob: number, imp: number) => {
    const score = prob * imp;
    const isSelected = matrixFilter && matrixFilter.prob === prob && matrixFilter.imp === imp;
    
    let baseColor = '';
    if (score >= 12) baseColor = 'bg-red-50 hover:bg-red-100 text-red-750 border-red-200';
    else if (score >= 5) baseColor = 'bg-amber-55/70 hover:bg-amber-100 text-amber-750 border-amber-250';
    else baseColor = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-750 border-emerald-150';

    if (isSelected) {
      return `${baseColor} ring-2 ring-slate-900 font-bold scale-[1.03] shadow-xs`;
    }
    return baseColor;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col xl:flex-row gap-5 xl:h-[calc(100vh-120px)] xl:overflow-hidden overflow-y-auto h-full w-full" id="risks-panel-wrapper">
      
      {/* COLUMN 1: 5x5 Matrix + static controls */}
      <div className="w-full xl:w-[270px] bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col xl:h-full overflow-y-auto shrink-0 space-y-4 min-h-[350px] xl:min-h-0">
        
        <div className="flex items-center justify-between border-b border-slate-150 pb-2">
          <div>
            <h3 className="font-space font-bold text-slate-900 text-sm">Cartographie 5x5</h3>
            <p className="text-[10px] text-slate-500">Distribution par criticité brute/résiduelle</p>
          </div>
        </div>

        {/* Evaluation mode switcher toggle */}
        <div className="grid grid-cols-2 gap-1 bg-slate-50 border border-slate-200 p-1 rounded-lg text-[10px] shrink-0 font-medium">
          <button
            onClick={() => { setAssessmentMode('initial'); setMatrixFilter(null); }}
            className={`py-1 rounded cursor-pointer transition ${
              assessmentMode === 'initial' 
                ? 'bg-white text-slate-900 shadow-3xs border border-slate-200 font-bold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🔥 Risque Brut
          </button>
          <button
            onClick={() => { setAssessmentMode('residual'); setMatrixFilter(null); }}
            className={`py-1 rounded cursor-pointer transition ${
              assessmentMode === 'residual' 
                ? 'bg-white text-slate-900 shadow-3xs border border-slate-200 font-bold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🛡️ Résiduel
          </button>
        </div>

        {/* 5x5 Matrix visualizer widget */}
        <div className="bg-slate-55/40 p-2.5 rounded-xl border border-slate-150 shrink-0 select-none">
          <div className="flex justify-between text-[8px] font-mono font-bold tracking-wider uppercase text-slate-400 mb-1.5">
            <span>Y: Vraisemblance</span>
            {matrixFilter && (
              <button 
                onClick={() => setMatrixFilter(null)}
                className="text-slate-700 hover:underline cursor-pointer bg-transparent border-0 font-bold text-[9px]"
              >
                [Réinitialiser]
              </button>
            )}
          </div>

          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map(prob => (
              <div key={prob} className="flex gap-1 items-center">
                <span className="w-4 text-center font-mono font-medium text-[9px] text-slate-400">
                  {prob}
                </span>

                {[1, 2, 3, 4, 5].map(imp => {
                  const count = getMatrixCount(prob, imp);
                  const isFiltered = matrixFilter?.prob === prob && matrixFilter?.imp === imp;
                  
                  return (
                    <div
                      key={imp}
                      onClick={() => {
                        if (isFiltered) setMatrixFilter(null);
                        else setMatrixFilter({ prob, imp });
                      }}
                      className={`flex-1 h-8 rounded border transition-all duration-150 flex flex-col justify-center items-center cursor-pointer relative group text-xs ${getCellBg(prob, imp)}`}
                      title={`Probabilité ${prob} × Gravité ${imp} = Score ${prob * imp}`}
                    >
                      {count > 0 ? (
                        <span className="text-[10px] font-extrabold font-mono text-slate-900">
                          {count}
                        </span>
                      ) : (
                        <span className="text-[8px] text-slate-400/80 font-mono group-hover:block hidden">
                          {prob * imp}
                        </span>
                      )}
                    </div>
                  );
                })}

              </div>
            ))}

            <div className="flex gap-1 items-center pt-1.5 pl-5 border-t border-slate-200 mt-1">
              {[1, 2, 3, 4, 5].map(imp => (
                <span key={imp} className="flex-1 text-center font-mono text-[8px] text-slate-400">
                  {imp}
                </span>
              ))}
            </div>
            <div className="text-center text-[7px] font-bold text-slate-400 uppercase font-mono tracking-wider mt-1">
              X: Gravité de l'impact
            </div>

          </div>
        </div>

        {/* List filter configurations */}
        <div className="space-y-2.5 pt-2 border-t border-slate-150 text-xs">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher titre, pilote..."
              className="w-full bg-white border border-slate-202 rounded pl-8 pr-2 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-[8px] text-slate-400 font-bold uppercase font-mono block mb-1">Catégorie</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-white border border-slate-202 text-[11px] text-slate-700 rounded px-1.5 py-1 focus:outline-none shadow-2xs font-medium"
            >
              <option value="all">Toutes les menaces</option>
              {Object.entries(categoryLabels).map(([k,v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[8px] text-slate-400 font-bold uppercase font-mono block mb-1">Processus SMI</span>
            <select
              value={processFilter}
              onChange={(e) => setProcessFilter(e.target.value)}
              className="w-full bg-white border border-slate-202 text-[11px] text-slate-705 rounded px-1.5 py-1 focus:outline-none shadow-2xs font-medium"
            >
              <option value="all">Tous les Processus</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>#{n.id} - {n.name}</option>
              ))}
            </select>
          </div>

          <div>
            <span className="text-[8px] text-slate-400 font-bold uppercase font-mono block mb-1">Statut d'évaluation</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-202 text-[11px] text-slate-705 rounded px-1.5 py-1 focus:outline-none shadow-2xs font-medium"
            >
              <option value="all">Tous les Statuts</option>
              {Object.entries(statusLabels).map(([k,v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* COLUMN 2: Beautiful Large Risk registry Table */}
      <div className="flex-grow xl:flex-1 bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-col xl:h-full overflow-hidden min-h-[400px] xl:min-h-0 shrink-0">
        
        <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-3">
          <div>
            <h3 className="font-space font-bold text-slate-900 text-md">Registre Central des Risques (DUER)</h3>
            <p className="text-[10px] text-slate-500">Évaluation analytique des menaces, risques majeurs et impacts</p>
          </div>

          <button
            id="add-risk-btn"
            onClick={() => setIsCreating(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-white stroke-[3]" /> Nouveau Risque
          </button>
        </div>

        {/* Interactive Data Table of risks */}
        <div className="flex-1 overflow-auto border border-slate-150 rounded-lg">
          {filteredRisks.length === 0 ? (
            <p className="text-center py-16 text-slate-450 text-xs italic bg-slate-50/50">
              Aucun incident ou risque identifié ne répond aux filtres actifs.
            </p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase tracking-wider select-none">
                  <th className="p-3 font-bold w-[95px]">Référence</th>
                  <th className="p-3 font-bold">Nature du Danger / Menace</th>
                  <th className="p-3 font-bold w-[130px]">Type / Catégorie</th>
                  <th className="p-3 font-bold w-[100px] text-center">Brut (P×G)</th>
                  <th className="p-3 font-bold w-[120px] text-center">Résiduel (P×G)</th>
                  <th className="p-3 font-bold w-[110px]">Pilote</th>
                  <th className="p-3 font-bold w-[110px]">Statut</th>
                  <th className="p-3 font-bold w-[50px] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRisks.map(risk => {
                  const isSelected = selectedRiskId === risk.id;
                  const probB = risk.probabilityBefore;
                  const impB = risk.impactBefore;
                  const scoreB = probB * impB;

                  const probA = risk.probabilityAfter;
                  const impA = risk.impactAfter;
                  const scoreA = probA && impA ? probA * impA : null;

                  const categoryBadges = {
                    strategic: 'border-blue-200 bg-blue-50 text-blue-750',
                    operational: 'border-purple-200 bg-purple-50 text-purple-750',
                    environmental: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                    health_safety: 'border-red-200 bg-red-50 text-red-750 font-semibold'
                  };

                  const statusBadges = {
                    identified: 'bg-red-50 text-red-700 border-red-150',
                    treated: 'bg-indigo-50 text-indigo-700 border-indigo-150',
                    monitored: 'bg-emerald-50 text-emerald-800 border-emerald-150/80',
                    closed: 'bg-slate-100 text-slate-400 border-slate-200'
                  };

                  return (
                    <tr
                      key={risk.id}
                      onClick={() => setSelectedRiskId(risk.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-slate-100 font-medium text-slate-900 border-l-4 border-l-slate-905' 
                          : 'hover:bg-slate-50/85'
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 border border-slate-205 px-1.5 py-0.5 rounded text-[10px]/none inline-block">
                          {risk.id}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 leading-tight truncate max-w-[240px]" title={risk.title}>
                          {risk.title}
                        </div>
                        {risk.linkedProcessId && (
                          <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                            <Workflow className="w-2.5 h-2.5 text-slate-400" /> #{risk.linkedProcessId} - {nodes.find(n => n.id === risk.linkedProcessId)?.name.split(' ')[0]}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`text-[9.5px]/none px-1.5 py-0.5 select-none border rounded-full font-medium ${categoryBadges[risk.category]}`}>
                          {categoryLabels[risk.category].split(' ')[1] || categoryLabels[risk.category]}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${getScoreColor(scoreB)}`}>
                          {scoreB} (P{probB}×G{impB})
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {scoreA ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${getScoreColor(scoreA)}`}>
                            {scoreA} (P{probA}×G{impA})
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 italic">Non mitigé</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-650 font-medium">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[80px]">{risk.owner}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-[9px] px-1.5 py-0.5 select-none border rounded font-semibold ${statusBadges[risk.status]}`}>
                          {statusLabels[risk.status]}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {riskIdToConfirmDelete === risk.id ? (
                          <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRisk(risk.id, true);
                              }}
                              className="px-1.5 py-0.5 bg-red-600 hover:bg-red-750 text-white text-[10px] font-bold rounded cursor-pointer transition shadow-xs"
                              title="Confirmer la suppression"
                            >
                              Oui
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRiskIdToConfirmDelete(null);
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
                              setRiskIdToConfirmDelete(risk.id);
                            }}
                            className="p-1 px-1.5 border border-slate-100 hover:border-red-300 hover:bg-red-50 text-slate-400 hover:text-red-550 rounded transition duration-150 cursor-pointer"
                            title="Supprimer ce risque"
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

      {/* COLUMN 3: Right selected Risk detailed form sheet */}
      <div className="w-full xl:w-[420px] bg-white border border-slate-200 rounded-xl p-5 flex flex-col xl:h-full overflow-y-auto shadow-sm shrink-0">
        
        {/* CREATE RISK ACCORDION FORM */}
        {isCreating ? (
          <form onSubmit={handleCreateRisk} className="space-y-4 text-xs" id="risk-creation-form">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="font-space font-bold text-slate-900 text-md">Reporter une anomalie de risque</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-500 hover:text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer transition"
              >
                Annuler
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">Intitulé du risque ou danger</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex : Perte d'étanchéité des vannes de sédimentation..."
                  className="w-full bg-white border border-slate-202 text-xs rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-slate-400 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">Description et impacts potentiels</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Décrivez les causes d'occurrence et les impacts QHSE majeurs liés..."
                  className="w-full bg-white border border-slate-202 text-xs rounded-lg p-2.5 text-slate-700 focus:outline-none resize-none shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">Typologie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-202 text-xs p-2 rounded-lg font-medium shadow-2xs focus:outline-none"
                  >
                    {Object.entries(categoryLabels).map(([k,v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">Processus (SMI)</label>
                  <select
                    value={newLinkedProcessId || ''}
                    onChange={(e) => setNewLinkedProcessId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white border border-slate-202 text-xs p-2 rounded-lg font-medium shadow-2xs focus:outline-none"
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
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">Vraisemblance brute</label>
                  <select
                    value={newProbBefore}
                    onChange={(e) => setNewProbBefore(Number(e.target.value))}
                    className="w-full bg-white border border-slate-202 text-xs p-2 rounded-lg font-medium shadow-2xs focus:outline-none"
                  >
                    <option value={1}>1 - Très improbable</option>
                    <option value={2}>2 - Peu probable</option>
                    <option value={3}>3 - Probable</option>
                    <option value={4}>4 - Fortement probable</option>
                    <option value={5}>5 - Quasi-certain/Permanent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">Sévérité / Impact brut</label>
                  <select
                    value={newImpBefore}
                    onChange={(e) => setNewImpBefore(Number(e.target.value))}
                    className="w-full bg-white border border-slate-202 text-xs p-2 rounded-lg font-medium shadow-2xs focus:outline-none"
                  >
                    <option value={1}>1 - Négligeable</option>
                    <option value={2}>2 - Mineur (Interne)</option>
                    <option value={3}>3 - Modéré (Significatif)</option>
                    <option value={4}>4 - Majeur (Pollution/Arrêt)</option>
                    <option value={5}>5 - Critique (Vies/Faillite)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">Barrières de traitement initiales</label>
                <textarea
                  rows={2}
                  value={newMitigation}
                  onChange={(e) => setNewMitigation(e.target.value)}
                  placeholder="Ex : Inspections hebdomadaires, EPI obligatoire..."
                  className="w-full bg-white border border-slate-202 text-xs rounded-lg p-2.5 text-slate-700 focus:outline-none resize-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase font-mono mb-1">Pilote</label>
                <input
                  type="text"
                  required
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full bg-white border border-slate-202 text-xs p-2.5 rounded-lg text-slate-800 shadow-2xs focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="bg-slate-105 hover:bg-slate-200 border border-slate-250 text-slate-700 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition shadow-2xs"
              >
                Fermer
              </button>
              <button
                type="submit"
                className="bg-slate-905 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2 rounded-lg cursor-pointer shadow-xs transition"
              >
                Enregistrer le Risque
              </button>
            </div>
          </form>
        ) : !selectedRisk ? (
          <div className="text-center py-24 text-slate-400 my-auto">
            <AlertOctagon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-space font-semibold text-slate-700 text-md mb-1">Aucune fiche sélectionnée</h4>
            <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-500">
              Sélectionnez un risque d'écart ou d'anomalie dans le tableau central pour afficher son évaluation, son plan de mitigation, et lier des actions CAPAs.
            </p>
          </div>
        ) : (
          /* DETAILED RISK SHEET VIEW */
          <div className="space-y-5" id="risk-detailed-view-container">
            
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-mono text-xs text-slate-700 bg-slate-100 border border-slate-202 px-2 py-0.5 rounded font-bold">
                    {selectedRisk.id}
                  </span>
                  {(() => {
                    const statusColors = {
                      identified: 'bg-red-50 text-red-700 border-red-150',
                      treated: 'bg-indigo-50 text-indigo-700 border-indigo-150',
                      monitored: 'bg-emerald-50 text-emerald-805 border-emerald-150/80',
                      closed: 'bg-slate-100 text-slate-400 border-slate-200'
                    };
                    return (
                      <span className={`text-[10px] px-2 py-0.5 border rounded font-semibold ${statusColors[selectedRisk.status]}`}>
                        {statusLabels[selectedRisk.status]}
                      </span>
                    );
                  })()}
                  {selectedRisk.linkedProcessId && (
                    <span className="text-[10px] text-violet-750 bg-violet-50 border border-violet-150/80 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                      <Workflow className="w-3 h-3" /> Processus #{selectedRisk.linkedProcessId}
                    </span>
                  )}
                </div>
                <h2 className="text-md font-space font-bold text-slate-900 tracking-tight leading-snug">
                  {selectedRisk.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start">
                <div>
                  <span className="block text-[8px] text-slate-400 uppercase font-mono font-bold mb-0.5">Statut menace</span>
                  <select
                    value={selectedRisk.status}
                    onChange={(e) => handleUpdateStatus(selectedRisk.id, e.target.value as any)}
                    className="bg-white border border-slate-202 text-xs text-slate-800 rounded px-2 py-1 focus:outline-none shadow-2xs font-medium"
                  >
                    {Object.entries(statusLabels).map(([k,v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                {riskIdToConfirmDelete === selectedRisk.id ? (
                  <div className="flex items-center gap-1 border border-red-200 bg-red-50/70 p-1.5 rounded-lg shrink-0 mt-3">
                    <span className="text-[9px] text-red-750 font-bold font-mono">Supprimer?</span>
                    <button
                      onClick={() => handleDeleteRisk(selectedRisk.id, true)}
                      className="p-1 px-1.5 bg-red-650 hover:bg-red-700 text-white text-[9px] font-bold rounded cursor-pointer transition shadow-xs"
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => setRiskIdToConfirmDelete(null)}
                      className="p-1 px-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-medium rounded cursor-pointer transition"
                    >
                      Non
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRiskIdToConfirmDelete(selectedRisk.id)}
                    className="p-1.5 mt-3 border border-slate-200 hover:border-red-400 text-slate-400 hover:text-red-505 hover:bg-red-50 rounded-lg cursor-pointer transition"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold block">Description et constats</span>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                {selectedRisk.description || "Aucun constat ou description formulée pour ce risque d'anomalie."}
              </p>

              <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-slate-650 border-t border-slate-150">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-mono font-medium">Structure</span>
                  <span className="text-slate-800 font-semibold">{categoryLabels[selectedRisk.category]}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-mono font-medium">Pilote d'Évaluation</span>
                  <span className="text-slate-800 font-semibold">{selectedRisk.owner}</span>
                </div>
              </div>
            </div>

            {/* Matrix risk score grid selectors */}
            <div className="grid grid-cols-1 gap-3">
              
              {/* Gross (Before mitigation) Scores */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-150 pb-2">
                  <span className="text-slate-700 text-sm">🔥</span>
                  <h3 className="font-space font-semibold text-xs text-slate-700 uppercase tracking-wider font-mono">1. Criticité Brute (Initiale)</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-700">
                  <div>
                    <label className="text-slate-400 block text-[9px] font-mono leading-none mb-1">PROBABILITÉ BRUTE</label>
                    <select
                      value={selectedRisk.probabilityBefore}
                      onChange={(e) => handleUpdateScores(selectedRisk.id, 'probBefore', Number(e.target.value))}
                      className="bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none w-full cursor-pointer shadow-2xs font-semibold"
                    >
                      <option value={1}>1 - Très improbable</option>
                      <option value={2}>2 - Peu probable</option>
                      <option value={3}>3 - Probable</option>
                      <option value={4}>4 - Fortement probable</option>
                      <option value={5}>5 - Permanent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[9px] font-mono leading-none mb-1">GRAVITÉ BRUTE</label>
                    <select
                      value={selectedRisk.impactBefore}
                      onChange={(e) => handleUpdateScores(selectedRisk.id, 'impBefore', Number(e.target.value))}
                      className="bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none w-full cursor-pointer shadow-2xs font-semibold"
                    >
                      <option value={1}>1 - Négligeable</option>
                      <option value={2}>2 - Mineur</option>
                      <option value={3}>3 - Modéré</option>
                      <option value={4}>4 - Majeur</option>
                      <option value={5}>5 - Catastrophique</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-150/50">
                  <span className="text-slate-500 text-xs">Indice de criticité brute:</span>
                  <span className={`px-2.5 py-1 font-mono font-bold rounded text-xs border ${getScoreColor(selectedRisk.scoreBefore)}`}>
                    {selectedRisk.scoreBefore} / 25
                  </span>
                </div>
              </div>

              {/* Residual (After mitigation) Scores */}
              <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-205 space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-150 pb-2">
                  <span className="text-slate-700 text-sm">🛡️</span>
                  <h3 className="font-space font-semibold text-xs text-slate-705 uppercase tracking-wider font-mono">2. Criticité Résiduelle (Après Actions)</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-750">
                  <div>
                    <label className="text-slate-400 block text-[9px] font-mono leading-none mb-1">PROBABILITÉ MITIGÉE</label>
                    <select
                      value={selectedRisk.probabilityAfter || 1}
                      onChange={(e) => handleUpdateScores(selectedRisk.id, 'probAfter', Number(e.target.value))}
                      className="bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none w-full cursor-pointer shadow-2xs font-semibold"
                    >
                      <option value={1}>1 - Très improbable</option>
                      <option value={2}>2 - Peu probable</option>
                      <option value={3}>3 - Probable</option>
                      <option value={4}>4 - Fortement probable</option>
                      <option value={5}>5 - Permanent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block text-[9px] font-mono leading-none mb-1">GRAVITÉ ATTÉNUÉE</label>
                    <select
                      value={selectedRisk.impactAfter || 1}
                      onChange={(e) => handleUpdateScores(selectedRisk.id, 'impAfter', Number(e.target.value))}
                      className="bg-white border border-slate-200 text-xs text-slate-800 rounded p-1.5 focus:outline-none w-full cursor-pointer shadow-2xs font-semibold"
                    >
                      <option value={1}>1 - Négligeable</option>
                      <option value={2}>2 - Mineur</option>
                      <option value={3}>3 - Modéré</option>
                      <option value={4}>4 - Majeur</option>
                      <option value={5}>5 - Catastrophique</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-155">
                  <span className="text-slate-500 text-xs">Indice après traitement:</span>
                  <span className={`px-2.5 py-1 font-mono font-bold rounded text-xs border ${
                    selectedRisk.scoreAfter 
                      ? getScoreColor(selectedRisk.scoreAfter) 
                      : 'text-slate-500 bg-slate-50 border-slate-200'
                  }`}>
                    {selectedRisk.scoreAfter ? `${selectedRisk.scoreAfter} / 25` : 'En attente d\'évaluation'}
                  </span>
                </div>
              </div>

            </div>

            {/* MITIGATION PLAN ACTIONS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                <h3 className="font-space font-semibold text-xs text-slate-750 uppercase tracking-wider font-mono flex items-center gap-1">
                  <Wrench className="w-4 h-4 text-slate-500" /> Plan de barrières & atténuation
                </h3>
              </div>

              <textarea
                value={selectedRisk.mitigationPlan}
                onChange={(e) => {
                  const val = e.target.value;
                  const nextRisks = risks.map(r => r.id === selectedRisk.id ? { ...r, mitigationPlan: val } : r);
                  onChangeRisks(nextRisks);
                }}
                rows={3}
                placeholder="Rédigez les barrières physiques, organisationnelles ou logiques permettant de mitiger ce risque..."
                className="w-full bg-white border border-slate-200 text-xs rounded-lg p-2.5 text-slate-700 focus:outline-none resize-none leading-relaxed shadow-2xs"
              />
            </div>

            {/* BRIDGE: SPAWNING CAPA FROM RISK MITIGATION */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h4 className="text-xs font-semibold text-slate-755 flex items-center gap-1.5 font-space">
                    <Activity className="w-4 h-4 text-slate-500" /> Lien CAPA d'amélioration SMI
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-normal max-w-md">
                    Rattachez ce risque à un plan d'actions CAPA pour piloter l'exécution de chaque tâche de mitigation au sein de l'usine.
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-1 font-sans">
                  {selectedRisk.linkedCapaId ? (
                    <button
                      onClick={() => onSwitchTab('capas')}
                      className="bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded cursor-pointer transition flex items-center gap-1 shadow-2xs"
                    >
                      Aller à la CAPA <Eye className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onQuickAddCapaFromRisk(selectedRisk.id, `Atténuation : ${selectedRisk.title.slice(0, 40)}...`, selectedRisk.linkedProcessId)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded cursor-pointer transition flex items-center gap-1 shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Lancer CAPA
                    </button>
                  )}
                </div>
              </div>

              {selectedRisk.linkedCapaId ? (() => {
                const linkedCapa = capas.find(c => c.id === selectedRisk.linkedCapaId);
                const capaStatusColors: Record<string, string> = {
                  draft: 'bg-slate-100 text-slate-700 border-slate-200',
                  ongoing: 'bg-blue-50 text-blue-700 border-blue-200',
                  completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  verified: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
                  cancelled: 'bg-slate-105 text-slate-400 border-slate-200',
                };
                const capaStatusLabels: Record<string, string> = {
                  draft: 'Brouillon',
                  ongoing: 'En cours',
                  completed: 'Réalisé',
                  verified: 'Vérifié',
                  cancelled: 'Annulé',
                };
                return (
                  <div className="bg-white border border-slate-200 p-3 rounded-lg text-xs leading-normal text-slate-700 flex items-center justify-between shadow-3xs gap-2">
                    <span className="truncate">
                      CAPA coordonné : <span className="text-slate-500 font-mono font-semibold">{selectedRisk.linkedCapaId}</span> - {linkedCapa?.title}
                    </span>
                    {linkedCapa && (
                      <span className={`text-[9px] px-2 py-0.5 border rounded font-semibold whitespace-nowrap shrink-0 ${capaStatusColors[linkedCapa.status]}`}>
                        {capaStatusLabels[linkedCapa.status]}
                      </span>
                    )}
                  </div>
                );
              })() : (
                <div className="text-[10px] text-slate-450 italic p-1.5 border border-dashed border-slate-205 rounded text-center">
                  Aucun plan d'actions correctif/préventif centralisé associé pour le moment.
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
