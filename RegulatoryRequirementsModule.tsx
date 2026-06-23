import React, { useState } from 'react';
import { 
  RegulatoryRequirement, 
  ProcessNode 
} from '../types';
import { 
  Scale, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertOctagon, 
  HelpCircle, 
  Clock, 
  User, 
  Layers, 
  Calendar, 
  BookOpen, 
  AlertTriangle,
  ArrowRight,
  Filter,
  Check,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';

interface RegulatoryRequirementsModuleProps {
  requirements: RegulatoryRequirement[];
  nodes: ProcessNode[];
  quickAddProcessId?: number | null;
  onClearQuickAddProcess?: () => void;
  onChangeRequirements: (newReqs: RegulatoryRequirement[]) => void;
  onRaiseEvent?: (title: string, description: string, pId?: number) => void;
}

export const RegulatoryRequirementsModule: React.FC<RegulatoryRequirementsModuleProps> = ({
  requirements,
  nodes,
  quickAddProcessId,
  onClearQuickAddProcess,
  onChangeRequirements,
  onRaiseEvent
}) => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conformityFilter, setConformityFilter] = useState<string>('all');
  const [processFilter, setProcessFilter] = useState<string>('all');

  // Editing and creation states
  const [selectedReqId, setSelectedReqId] = useState<string | null>(requirements[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);
  const [reqIdToConfirmDelete, setReqIdToConfirmDelete] = useState<string | null>(null);

  // Form states for new requirement
  const [newTitle, setNewTitle] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newCategory, setNewCategory] = useState<RegulatoryRequirement['category']>('regulatory');
  const [newDescription, setNewDescription] = useState('');
  const [newLinkedProcessId, setNewLinkedProcessId] = useState<number | undefined>(undefined);
  const [newConforms, setNewConforms] = useState<RegulatoryRequirement['conforms']>('under_review');
  const [newFrequency, setNewFrequency] = useState<RegulatoryRequirement['frequency']>('annual');
  const [newLastAudit, setNewLastAudit] = useState(new Date().toISOString().split('T')[0]);
  const [newNextAudit, setNewNextAudit] = useState('');
  const [newResponsible, setNewResponsible] = useState('Service Conformité QHSE');
  const [newNotes, setNewNotes] = useState('');

  // Handle Quick Add trigger from Process Map
  React.useEffect(() => {
    if (quickAddProcessId) {
      setNewLinkedProcessId(quickAddProcessId);
      setIsCreating(true);
      if (onClearQuickAddProcess) {
        onClearQuickAddProcess();
      }
    }
  }, [quickAddProcessId, onClearQuickAddProcess]);

  const selectedRequirement = requirements.find(r => r.id === selectedReqId);

  // Compute stats
  const totalCount = requirements.length;
  const compliantCount = requirements.filter(r => r.conforms === 'compliant').length;
  const nonCompliantCount = requirements.filter(r => r.conforms === 'non_compliant').length;
  const underReviewCount = requirements.filter(r => r.conforms === 'under_review').length;
  const ignoredCount = requirements.filter(r => r.conforms === 'not_applicable').length;
  
  const applicableCount = totalCount - ignoredCount;
  const complianceRate = applicableCount > 0 ? Math.round((compliantCount / applicableCount) * 100) : 100;

  // Filter requirements list
  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.description && req.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || req.category === categoryFilter;
    const matchesConformity = conformityFilter === 'all' || req.conforms === conformityFilter;
    const matchesProcess = processFilter === 'all' || String(req.linkedProcessId) === processFilter;

    return matchesSearch && matchesCategory && matchesConformity && matchesProcess;
  });

  // Handle Save (Create) Requirement
  const handleCreateRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSource) return;

    const generatedId = `REQ-2026-${String(requirements.length + 101)}`;
    const newReq: RegulatoryRequirement = {
      id: generatedId,
      title: newTitle,
      source: newSource,
      category: newCategory,
      description: newDescription,
      linkedProcessId: newLinkedProcessId,
      conforms: newConforms,
      frequency: newFrequency,
      lastAuditDate: newLastAudit || undefined,
      nextAuditDate: newNextAudit || undefined,
      responsible: newResponsible,
      evaluationNotes: newNotes
    };

    const updated = [...requirements, newReq];
    onChangeRequirements(updated);
    setSelectedReqId(newReq.id);
    setIsCreating(false);

    // Reset Form
    setNewTitle('');
    setNewSource('');
    setNewCategory('regulatory');
    setNewDescription('');
    setNewLinkedProcessId(undefined);
    setNewConforms('under_review');
    setNewFrequency('annual');
    setNewLastAudit(new Date().toISOString().split('T')[0]);
    setNewNextAudit('');
    setNewResponsible('Service Conformité QHSE');
    setNewNotes('');
  };

  const handleDeleteRequirement = (id: string) => {
    const updated = requirements.filter(r => r.id !== id);
    onChangeRequirements(updated);
    setReqIdToConfirmDelete(null);
    if (selectedReqId === id) {
      setSelectedReqId(updated[0]?.id || null);
    }
  };

  const handleUpdateField = (id: string, field: keyof RegulatoryRequirement, value: any) => {
    const updated = requirements.map(r => {
      if (r.id === id) {
        return { ...r, [field]: value };
      }
      return r;
    });
    onChangeRequirements(updated);
  };

  // Helper styles for badges
  const getConformityBadge = (status: RegulatoryRequirement['conforms']) => {
    switch (status) {
      case 'compliant':
        return {
          label: 'Conforme',
          icon: CheckCircle,
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          text: 'text-emerald-700'
        };
      case 'non_compliant':
        return {
          label: 'Non conforme',
          icon: AlertOctagon,
          bg: 'bg-red-500/10 text-red-600 border-red-500/20',
          text: 'text-red-700'
        };
      case 'under_review':
        return {
          label: 'En évaluation',
          icon: Clock,
          bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          text: 'text-amber-700'
        };
      case 'not_applicable':
        return {
          label: 'Non applicable',
          icon: HelpCircle,
          bg: 'bg-slate-100 text-slate-500 border-slate-200',
          text: 'text-slate-600'
        };
    }
  };

  const getCategoryLabel = (category: RegulatoryRequirement['category']) => {
    switch (category) {
      case 'legal': return 'Légal (Loi & Code)';
      case 'regulatory': return 'Règlementaire (Décret)';
      case 'normative': return 'Normatif (SMI)';
    }
  };

  const getFrequencyLabel = (frequency: RegulatoryRequirement['frequency']) => {
    switch (frequency) {
      case 'monthly': return 'Mensuel';
      case 'quarterly': return 'Trimestriel';
      case 'annual': return 'Annuel';
      case 'continuous': return 'Continu';
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto px-6 py-6 pb-20 max-w-7xl mx-auto flex flex-col gap-6" id="regulatory-module-container">
      
      {/* Title Header with Compliance Rate Scorecard */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6" id="regulatory-dashboard-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Registre des Exigences Légales & Réglementaires</h1>
          </div>
          <p className="text-xs text-slate-500">
            Veille réglementaire et suivi de conformité des processus administratifs, techniques et opérationnels de l'usine.
          </p>
        </div>

        {/* Scorecard Widget */}
        <div className="flex items-center gap-6 divide-x divide-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              {/* Simple Circular progress outline in CSS */}
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
                <span className="text-lg font-extrabold text-slate-900 font-mono">{complianceRate}%</span>
                {/* Visual half circle color effect */}
                <div className={`absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent border-r-transparent ${complianceRate < 80 ? 'border-amber-400' : 'border-indigo-500'}`} style={{ transform: 'rotate(-45deg)' }} />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider font-semibold">Taux de Conformité Global</p>
              <h2 className="text-xl font-extrabold text-slate-900">{compliantCount} / {applicableCount} <span className="text-xs font-normal text-slate-500">Exigences actives</span></h2>
            </div>
          </div>

          <div className="pl-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center px-2">
              <span className="text-xs font-bold text-emerald-600 block">{compliantCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">Conformes</span>
            </div>
            <div className="text-center px-2">
              <span className="text-xs font-bold text-red-650 block">{nonCompliantCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">Non conf.</span>
            </div>
            <div className="text-center px-2">
              <span className="text-xs font-bold text-amber-600 block">{underReviewCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">Auto-éval</span>
            </div>
            <div className="text-center px-2">
              <span className="text-xs font-bold text-slate-600 block">{ignoredCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">N/A</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="regulatory-workspace">
        
        {/* Left Column: Requirements Directory list */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[650px]" id="requirements-sidebar">
          {/* Top Search bar & Actions */}
          <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-450" />
                <input
                  type="text"
                  placeholder="Rechercher titre, source, id..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Saisir
              </button>
            </div>

            {/* Quick dropdown filters */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">Catégorie</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded p-1"
                >
                  <option value="all">Toutes</option>
                  <option value="legal">Légales</option>
                  <option value="regulatory">Règlem.</option>
                  <option value="normative">Normatives</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">Conformité</label>
                <select
                  value={conformityFilter}
                  onChange={(e) => setConformityFilter(e.target.value)}
                  className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded p-1"
                >
                  <option value="all">Toutes</option>
                  <option value="compliant">Conforme</option>
                  <option value="non_compliant">Non Conf.</option>
                  <option value="under_review">Évaluation</option>
                  <option value="not_applicable">N/A</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">Processus</label>
                <select
                  value={processFilter}
                  onChange={(e) => setProcessFilter(e.target.value)}
                  className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded p-1 text-ellipsis overflow-hidden whitespace-nowrap"
                >
                  <option value="all">Tous</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>P{n.id} - {n.name.substring(0, 15)}...</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Directory list of requirements */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredRequirements.length > 0 ? (
              filteredRequirements.map(req => {
                const badge = getConformityBadge(req.conforms);
                const Icon = badge.icon;
                const isSelected = req.id === selectedReqId;
                const linkedProcess = nodes.find(n => n.id === req.linkedProcessId);

                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedReqId(req.id);
                      setIsCreating(false);
                    }}
                    className={`p-4 cursor-pointer transition ${
                      isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-650' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1 py-0.2 rounded shrink-0">{req.id}</span>
                        <span className="text-[9px] uppercase font-bold text-slate-400 shrink-0">{req.category}</span>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.2 rounded-full border flex items-center gap-0.5 whitespace-nowrap ${badge.bg}`}>
                        <Icon className="w-2.5 h-2.5" />
                        {badge.label}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 mb-2">
                      {req.title}
                    </h4>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-dashed border-slate-100 pt-2">
                      <span className="truncate max-w-[130px] font-mono text-[9.5px]">⚖ {req.source}</span>
                      {linkedProcess && (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono text-[9px]">
                          P{linkedProcess.id}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-450 italic">Aucune exigence ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detail Worksheet Panel or insertion form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden min-h-[650px] flex flex-col" id="requirements-detail-pane">
          {isCreating ? (
            /* Requirement creation form */
            <form onSubmit={handleCreateRequirement} className="p-6 space-y-5 flex-1 flex flex-col" id="create-requirement-form">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono">+</span>
                  <h3 className="text-sm font-bold text-slate-800">Saisir une nouvelle exigence réglementaire</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs px-2 py-1 rounded-sm cursor-pointer transition border border-slate-200"
                >
                  Annuler
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Titre de l'exigence *</label>
                  <input
                    type="text"
                    required
                    placeholder="Saisir l'obligation réglementaire"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Source réglementaire ou Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex. Code de l'environnement, ISO 9001 Section 8..."
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  >
                    <option value="legal">Légale (Lois, Règlements d'application)</option>
                    <option value="regulatory">Réglementaire (Normes sectorielles, Décrets)</option>
                    <option value="normative">Normatif (Référentiels ISO, SMI)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Processus rattaché *</label>
                  <select
                    value={newLinkedProcessId || ''}
                    onChange={(e) => setNewLinkedProcessId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  >
                    <option value="">-- Sélectionner un processus --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>P{n.id} - {n.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description détaillée de l'obligation</label>
                <textarea
                  rows={3}
                  placeholder="Détails, articles précis, seuils d'applicabilité..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white font-sans"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-150 p-4 rounded-xl">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Statut Initial</label>
                  <select
                    value={newConforms}
                    onChange={(e) => setNewConforms(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="compliant">Conforme</option>
                    <option value="non_compliant">Non conforme</option>
                    <option value="under_review">En évaluation</option>
                    <option value="not_applicable">N/A</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Fréquence audit</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="monthly">Mensuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="annual">Annuelle</option>
                    <option value="continuous">Continue</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Dernier contrôle</label>
                  <input
                    type="date"
                    value={newLastAudit}
                    onChange={(e) => setNewLastAudit(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Prochain contrôle</label>
                  <input
                    type="date"
                    value={newNextAudit}
                    onChange={(e) => setNewNextAudit(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Pilote / Responsable conformité</label>
                  <input
                    type="text"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Commentaires d'audit & notes d'évaluation</label>
                  <input
                    type="text"
                    placeholder="Saisir les observations recueillies sur le terrain..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex-1" />

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Enregistrer l'Exigence
                </button>
              </div>
            </form>
          ) : selectedRequirement ? (
            /* Requirement detailed worksheet */
            <div className="flex flex-col flex-1 p-6 space-y-6" id="requirement-detail-worksheet">
              
              {/* Header with quick metadata */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-sm shrink-0">
                        {selectedRequirement.id}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono tracking-wider">
                        {getCategoryLabel(selectedRequirement.category)}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {selectedRequirement.title}
                    </h2>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-1.5 self-start shrink-0">
                    {reqIdToConfirmDelete === selectedRequirement.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 border border-red-200 rounded-lg">
                        <span className="text-[9px] text-red-700 px-1 font-semibold">Sûr ?</span>
                        <button
                          onClick={() => handleDeleteRequirement(selectedRequirement.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-[9px] px-2 py-1 rounded font-bold cursor-pointer transition"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setReqIdToConfirmDelete(null)}
                          className="text-slate-400 hover:text-slate-650 text-[9px] px-1.5 py-1 font-semibold"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReqIdToConfirmDelete(selectedRequirement.id)}
                        className="text-red-500 hover:text-red-650 hover:bg-red-50 p-2 rounded-lg cursor-pointer transition"
                        title="Supprimer cette exigence"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 bg-slate-50 border border-slate-205 px-2.5 py-1 rounded-sm font-mono flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    Source réglementaire : <strong className="text-slate-750">{selectedRequirement.source}</strong>
                  </span>
                </div>
              </div>

              {/* Grid with process mapping information & quick transition buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Process Link Box */}
                <div className="border border-slate-150 p-4 rounded-xl bg-slate-50/50 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-450" />
                      Processus QHSE Associé
                    </span>
                    {selectedRequirement.linkedProcessId ? (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          P{selectedRequirement.linkedProcessId} - {nodes.find(n => n.id === selectedRequirement.linkedProcessId)?.name || "Processus inconnu"}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {nodes.find(n => n.id === selectedRequirement.linkedProcessId)?.description}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-450 italic">Aucun processus rattaché.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedRequirement.linkedProcessId || ''}
                      onChange={(e) => handleUpdateField(selectedRequirement.id, 'linkedProcessId', e.target.value ? Number(e.target.value) : undefined)}
                      className="text-[10px] border border-slate-200 bg-white p-1 rounded-md text-slate-600 flex-1 cursor-pointer"
                    >
                      <option value="">Rattacher à...</option>
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>P{n.id} - {n.name.substring(0, 20)}...</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Responsible Box */}
                <div className="border border-slate-150 p-4 rounded-xl bg-slate-50/50 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-455" />
                      Responsable du dossier
                    </span>
                    <input
                      type="text"
                      value={selectedRequirement.responsible}
                      onChange={(e) => handleUpdateField(selectedRequirement.id, 'responsible', e.target.value)}
                      className="w-full text-xs font-semibold bg-transparent border-0 border-b border-transparent hover:border-slate-350 focus:border-indigo-600 focus:ring-0 p-0 py-1"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-450">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Fréquence requise : 
                    <select
                      value={selectedRequirement.frequency}
                      onChange={(e) => handleUpdateField(selectedRequirement.id, 'frequency', e.target.value)}
                      className="text-[10px] text-zinc-600 bg-transparent border-0 p-0 font-bold ml-1 cursor-pointer underline hover:text-indigo-600 focus:ring-0"
                    >
                      <option value="monthly">Mensuel</option>
                      <option value="quarterly">Trimestriel</option>
                      <option value="annual">Annuel</option>
                      <option value="continuous">Continu</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Requirement Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Contenu de la Prescription Légale</h4>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 relative">
                  <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedRequirement.description || "Aucune fiche d'analyse descriptive saisie pour cette exigence."}
                  </p>
                  <textarea
                    placeholder="Saisir la description textuelle légale..."
                    value={selectedRequirement.description}
                    onChange={(e) => handleUpdateField(selectedRequirement.id, 'description', e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 focus:opacity-100 bg-white p-4 border border-indigo-600 rounded-xl text-xs resize-none transition"
                  />
                  <div className="text-[9px] text-slate-400 mt-1 block italic hover:underline">
                    💡 Cliquez à l'intérieur de la boîte pour modifier la description de la réglementation.
                  </div>
                </div>
              </div>

              {/* Audit evaluation panel and conformity slider */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-705 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-indigo-500" />
                    Évaluation et Status de Conformité Actuel
                  </span>

                  {/* Radio Switcher/Selector for Conformity */}
                  <div className="flex bg-slate-200/50 p-0.5 rounded-lg border border-slate-200">
                    {(['compliant', 'non_compliant', 'under_review', 'not_applicable'] as const).map(status => {
                      const badgeConfig = getConformityBadge(status);
                      const isSelected = selectedRequirement.conforms === status;
                      
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleUpdateField(selectedRequirement.id, 'conforms', status)}
                          className={`px-2 py-1 rounded-md text-[9px] font-bold cursor-pointer transition font-mono ${
                            isSelected 
                              ? 'bg-white text-indigo-750 shadow-2xs border border-white' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {badgeConfig.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Conformity alert message if non-compliant */}
                  {selectedRequirement.conforms === 'non_compliant' && (
                    <div className="bg-red-50/70 border border-red-200 p-4 rounded-xl space-y-3">
                      <div className="flex items-start gap-2 text-red-750">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0 animate-bounce" />
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold">Alerte de Non-Conformité active !</h5>
                          <p className="text-[11px] text-red-650 leading-relaxed">
                            Cette exigence réglementaire obligatoire n'est pas respectée. Un plan d'action immédiat doit être validé.
                          </p>
                        </div>
                      </div>

                      {onRaiseEvent && (
                        <div className="pt-1.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onRaiseEvent(
                              `Non-Conformité réglementaire : ${selectedRequirement.source}`,
                              `Il a été identifié un défaut de conformité vis-à-vis de l'exigence "${selectedRequirement.title}" règlementée par '${selectedRequirement.source}'. Notes d'audit : ${selectedRequirement.evaluationNotes || 'Aucune observation renseignée'}`,
                              selectedRequirement.linkedProcessId
                            )}
                            className="text-[10px] bg-red-650 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md transition cursor-pointer font-mono flex items-center gap-1"
                          >
                            Lever un Incident / NC d'Urgence <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audit date and Notes fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dernière inspection d'audit</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          value={selectedRequirement.lastAuditDate || ''}
                          onChange={(e) => handleUpdateField(selectedRequirement.id, 'lastAuditDate', e.target.value)}
                          className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Date limite de Prochain Évaluation</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          value={selectedRequirement.nextAuditDate || ''}
                          onChange={(e) => handleUpdateField(selectedRequirement.id, 'nextAuditDate', e.target.value)}
                          className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-405 block mb-1">Observations terrain & Preuves d'évaluation documentaire</label>
                    <textarea
                      rows={2}
                      placeholder="Indiquez les rapports d'inspection, les certificats obtenus ou les non-conformités partielles constatées..."
                      value={selectedRequirement.evaluationNotes || ''}
                      onChange={(e) => handleUpdateField(selectedRequirement.id, 'evaluationNotes', e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white font-sans text-slate-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center">
              <Scale className="w-12 h-12 text-slate-300 animate-pulse" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Aucune exigence de conformité</h3>
                <p className="text-xs text-slate-450 max-w-sm">
                  Ajoutez votre première règle en veille en cliquant sur le bouton de saisie rapide ci-dessus.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
