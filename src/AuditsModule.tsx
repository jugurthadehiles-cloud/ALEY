import React, { useState } from 'react';
import { QHSEState, ProcessNode, Audit, AuditFinding, Capa } from '../types';
import { 
  ClipboardCheck, 
  Calendar, 
  User, 
  Plus, 
  Trash2, 
  Check, 
  CheckSquare, 
  Shield, 
  Info, 
  Search, 
  FileText, 
  AlertTriangle, 
  Activity, 
  SlidersHorizontal,
  BookmarkCheck,
  CheckCircle2,
  FileCheck2,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditsModuleProps {
  audits: Audit[];
  nodes: ProcessNode[];
  capas: Capa[];
  quickAddProcessId: number | null;
  onClearQuickAddProcess: () => void;
  onChangeAudits: (newAudits: Audit[]) => void;
  onChangeCapas: (newCapas: Capa[]) => void;
}

export function AuditsModule({
  audits = [],
  nodes = [],
  capas = [],
  quickAddProcessId,
  onClearQuickAddProcess,
  onChangeAudits,
  onChangeCapas
}: AuditsModuleProps) {
  // Navigation inside Audits tab: 'list' or 'create'
  const [activeSubView, setActiveSubView] = useState<'all' | 'create'>('all');
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(
    audits.length > 0 ? audits[0].id : null
  );
  
  // Custom confirmation state to bypass native confirm blocker in iframe
  const [auditIdToDelete, setAuditIdToDelete] = useState<string | null>(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [standardFilter, setStandardFilter] = useState<string>('all');

  // Form states for creating a new Audit
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<Audit['type']>('internal');
  const [newStandards, setNewStandards] = useState<string[]>(['ISO 9001']);
  const [newProcessId, setNewProcessId] = useState<number>(nodes[0]?.id || 1);
  const [newAuditor, setNewAuditor] = useState('');
  const [newAuditee, setNewAuditee] = useState('');
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [newObjectives, setNewObjectives] = useState('');
  const [newScope, setNewScope] = useState('');
  
  // Principles checked for new audit
  const [newPrinciples, setNewPrinciples] = useState({
    integrity: true,
    fairPresentation: true,
    professionalCare: true,
    confidentiality: true,
    independence: true,
    evidenceBased: true,
    riskBased: true
  });

  // State for adding a finding to the selected audit
  const [findingType, setFindingType] = useState<AuditFinding['type']>('minor_nc');
  const [findingClause, setFindingClause] = useState('');
  const [findingDescription, setFindingDescription] = useState('');
  const [findingEvidence, setFindingEvidence] = useState('');

  // Handle Quick Add from process map
  React.useEffect(() => {
    if (quickAddProcessId !== null) {
      setNewProcessId(quickAddProcessId);
      const processName = nodes.find(n => n.id === quickAddProcessId)?.name || 'Processus';
      setNewTitle(`Audit ciblée: ${processName}`);
      setActiveSubView('create');
      onClearQuickAddProcess();
    }
  }, [quickAddProcessId, nodes, onClearQuickAddProcess]);

  const selectedAudit = audits.find(a => a.id === selectedAuditId);

  // Stats calculation
  const totalAudits = audits.length;
  const completedAudits = audits.filter(a => a.status === 'completed').length;
  const inProgressAudits = audits.filter(a => a.status === 'in_progress').length;
  const scheduledAudits = audits.filter(a => a.status === 'scheduled').length;
  const totalFindingsCount = audits.reduce((sum, a) => sum + (a.findings?.length || 0), 0);
  const totalNonConformities = audits.reduce(
    (sum, a) => sum + (a.findings?.filter(f => f.type === 'minor_nc' || f.type === 'major_nc').length || 0),
    0
  );

  // Handle generating a new Audit
  const handleSaveAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAuditor || !newAuditee || !newScheduledDate) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const newAuditId = `AUD-2026-${String(audits.length + 1).padStart(3, '0')}`;
    const createdAudit: Audit = {
      id: newAuditId,
      title: newTitle,
      type: newType,
      standards: newStandards,
      linkedProcessId: newProcessId,
      auditor: newAuditor,
      auditee: newAuditee,
      scheduledDate: newScheduledDate,
      status: 'scheduled',
      objectives: newObjectives || 'Évaluer la conformité et la robustesse du flux.',
      scope: newScope || 'Périmètre du processus.',
      findings: [],
      iso19011PrinciplesChecked: newPrinciples
    };

    onChangeAudits([...audits, createdAudit]);
    setSelectedAuditId(newAuditId);
    setActiveSubView('all');

    // Reset fields
    setNewTitle('');
    setNewType('internal');
    setNewStandards(['ISO 9001']);
    setNewAuditor('');
    setNewAuditee('');
    setNewScheduledDate('');
    setNewObjectives('');
    setNewScope('');
    setNewPrinciples({
      integrity: true,
      fairPresentation: true,
      professionalCare: true,
      confidentiality: true,
      independence: true,
      evidenceBased: true,
      riskBased: true
    });
  };

  // Toggle Standard selection
  const handleToggleStandard = (std: string) => {
    if (newStandards.includes(std)) {
      if (newStandards.length > 1) {
        setNewStandards(newStandards.filter(s => s !== std));
      }
    } else {
      setNewStandards([...newStandards, std]);
    }
  };

  // Add findings to selected audit
  const handleAddFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuditId || !selectedAudit) return;
    if (!findingDescription || !findingClause) {
      alert('La clause normative et la description sont obligatoires.');
      return;
    }

    const findingId = `FND-${String(selectedAudit.findings.length + 1).padStart(3, '0')}`;
    const newFinding: AuditFinding = {
      id: findingId,
      type: findingType,
      clause: findingClause,
      description: findingDescription,
      evidence: findingEvidence || 'Constatations visuelles directes.'
    };

    const updatedAudits = audits.map(a => {
      if (a.id === selectedAudit.id) {
        return {
          ...a,
          findings: [...a.findings, newFinding]
        };
      }
      return a;
    });

    onChangeAudits(updatedAudits);
    
    // Clear fields
    setFindingClause('');
    setFindingDescription('');
    setFindingEvidence('');
  };

  // Auto-generate CAPA from non-conformity finding
  const handleSpawnCapaFromFinding = (audit: Audit, finding: AuditFinding) => {
    // Generate fresh CAPA
    const capaId = `CAPA-2026-${String(capas.length + 1).padStart(3, '0')}`;
    const newCapaTitle = `CAPA ${finding.type === 'major_nc' ? 'Majeure' : 'Mineure'} — ${audit.id}`;
    
    const newCapaObj: Capa = {
      id: capaId,
      title: newCapaTitle,
      description: `Ecart identifié lors de l'audit ${audit.id} (${audit.title}) concernant la clause ${finding.clause}.\n\nDESCRIPTION DE L'ECART :\n${finding.description}\n\nPREUVES CONSTATÉES :\n${finding.evidence}`,
      type: 'corrective',
      source: 'internal_audit',
      status: 'ongoing',
      priority: finding.type === 'major_nc' ? 'critical' : 'high',
      owner: audit.auditee, // Default owner to the audited process manager
      creationDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days later
      linkedProcessId: audit.linkedProcessId,
      rootCauseAnalysis: {
        fiveWhys: [
          `Pourquoi l'écart ${finding.clause} s'est produit ?`,
          "", "", "", ""
        ],
        ishikawa: {
          manpower: [],
          machines: [],
          materials: [],
          methods: [],
          measurement: [],
          environment: []
        }
      },
      actions: [
        {
          id: `ACT-${capaId}-1`,
          title: "Investigation immédiate et endiguement de l'écart",
          owner: audit.auditee,
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending'
        }
      ]
    };

    // Update CAPAs
    const nextCapas = [...capas, newCapaObj];
    onChangeCapas(nextCapas);

    // Update audit finding to link to the new CAPA
    const updatedAudits = audits.map(a => {
      if (a.id === audit.id) {
        return {
          ...a,
          findings: a.findings.map(f => {
            if (f.id === finding.id) {
              return { ...f, linkedCapaId: capaId };
            }
            return f;
          })
        };
      }
      return a;
    });
    onChangeAudits(updatedAudits);
    
    alert(`Un plan d'actions correctives (CAPA) a été généré avec succès avec l'ID ${capaId} et assigné à ${audit.auditee}.`);
  };

  // Delete an audit finding
  const handleDeleteFinding = (findingId: string) => {
    if (!selectedAudit) return;
    const updatedAudits = audits.map(a => {
      if (a.id === selectedAudit.id) {
        return {
          ...a,
          findings: a.findings.filter(f => f.id !== findingId)
        };
      }
      return a;
    });
    onChangeAudits(updatedAudits);
  };

  // Change status of Audit
  const handleChangeStatus = (status: Audit['status']) => {
    if (!selectedAudit) return;
    const updatedAudits = audits.map(a => {
      if (a.id === selectedAudit.id) {
        const complDate = status === 'completed' ? new Date().toISOString().split('T')[0] : undefined;
        return {
          ...a,
          status,
          completedDate: complDate
        };
      }
      return a;
    });
    onChangeAudits(updatedAudits);
  };

  // Delete Audit completely
  const handleDeleteAudit = (auditId: string) => {
    setAuditIdToDelete(auditId);
  };

  const confirmDeleteAudit = () => {
    if (!auditIdToDelete) return;
    const nextAudits = audits.filter(a => a.id !== auditIdToDelete);
    onChangeAudits(nextAudits);
    if (selectedAuditId === auditIdToDelete) {
      setSelectedAuditId(nextAudits.length > 0 ? nextAudits[0].id : null);
    }
    setAuditIdToDelete(null);
  };

  // Toggle Check of ISO 19011 Principles
  const handleTogglePrinciple = (principleKey: keyof Audit['iso19011PrinciplesChecked']) => {
    if (!selectedAudit) return;
    const updatedAudits = audits.map(a => {
      if (a.id === selectedAudit.id) {
        return {
          ...a,
          iso19011PrinciplesChecked: {
            ...a.iso19011PrinciplesChecked,
            [principleKey]: !a.iso19011PrinciplesChecked[principleKey]
          }
        };
      }
      return a;
    });
    onChangeAudits(updatedAudits);
  };

  // Save audit summary text report
  const handleSaveSummaryReport = (reportText: string) => {
    if (!selectedAudit) return;
    const updatedAudits = audits.map(a => {
      if (a.id === selectedAudit.id) {
        return {
          ...a,
          summaryReport: reportText
        };
      }
      return a;
    });
    onChangeAudits(updatedAudits);
  };

  // Filters application
  const filteredAudits = audits.filter(audit => {
    const processName = nodes.find(n => n.id === audit.linkedProcessId)?.name || '';
    const matchSearch = 
      audit.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.auditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      processName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || audit.status === statusFilter;
    const matchType = typeFilter === 'all' || audit.type === typeFilter;
    const matchStandard = standardFilter === 'all' || audit.standards.includes(standardFilter);

    return matchSearch && matchStatus && matchType && matchStandard;
  });

  const MAP_AUDIT_TYPES: Record<Audit['type'], { label: string, color: string }> = {
    internal: { label: 'Audit Interne', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    external: { label: 'Audit Externe', color: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
    certification: { label: 'Surveillance / Cert.', color: 'text-violet-700 bg-violet-50 border-violet-100' },
    process: { label: 'Etiage Processus', color: 'text-sky-700 bg-sky-50 border-sky-100' },
    site_safety: { label: 'Inspection HS / SST', color: 'text-rose-700 bg-rose-50 border-rose-100' }
  };

  const MAP_AUDIT_STATUS: Record<Audit['status'], { label: string, color: string }> = {
    scheduled: { label: 'Planifié', color: 'text-slate-600 bg-slate-150 border-slate-200' },
    in_progress: { label: 'En Cours', color: 'text-amber-700 bg-amber-50 border-amber-200 animate-pulse' },
    completed: { label: 'Clôturé', color: 'text-emerald-750 bg-emerald-50 border-emerald-200' },
    cancelled: { label: 'Annulé', color: 'text-rose-600 bg-rose-50 border-rose-100 line-through' }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none" id="audits-framework-panel">
      
      {/* MODULE MAIN STATS HEADER */}
      <div className="bg-white border-b border-slate-200 p-4 md:p-6 shrink-0 z-10 shadow-3xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 px-2.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold">
                ISO 19011:2018
              </span>
              <h2 className="text-xl font-sans font-bold text-slate-900 tracking-tight">
                Registre d'Audits & Inspections Qualité
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Pilotez les programmes de vérification, examinez les écarts et suivez les sorties en liaison avec la cartographie processus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubView(activeSubView === 'all' ? 'create' : 'all')}
              className={`flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-xl cursor-pointer shadow-3xs transition-all active:scale-95 border ${
                activeSubView === 'create'
                  ? 'bg-slate-800 border-slate-900 text-white'
                  : 'bg-emerald-600 border-emerald-700 hover:bg-emerald-700 text-white'
              }`}
            >
              {activeSubView === 'create' ? (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Consulter le Registre</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Programmer un Audit (ISO 19011)</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
            <span className="block text-[9px] font-mono uppercase font-semibold text-slate-500">Audits Programmés</span>
            <span className="text-lg font-bold text-slate-900 font-mono mt-1 block flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-slate-400" />
              {totalAudits}
            </span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl">
            <span className="block text-[9px] font-mono uppercase font-semibold text-emerald-700">Clôturés d’Efficacité</span>
            <span className="text-lg font-bold text-emerald-700 font-mono mt-1 block flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-500" />
              {completedAudits}
            </span>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
            <span className="block text-[9px] font-mono uppercase font-semibold text-amber-700">Audits en Cours</span>
            <span className="text-lg font-bold text-amber-700 font-mono mt-1 block flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
              {inProgressAudits}
            </span>
          </div>

          <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl">
            <span className="block text-[9px] font-mono uppercase font-semibold text-rose-700">Ecarts & Non-Conformités</span>
            <span className="text-lg font-bold text-rose-700 font-mono mt-1 block flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              {totalNonConformities}
            </span>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl col-span-2 md:col-span-1">
            <span className="block text-[9px] font-mono uppercase font-semibold text-indigo-700">Constatations Totales</span>
            <span className="text-lg font-bold text-indigo-700 font-mono mt-1 block flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              {totalFindingsCount}
            </span>
          </div>
        </div>

      </div>

      {activeSubView === 'create' ? (
        // -------------------------
        // CREATE COMPLIANT AUDIT VIEW
        // -------------------------
        <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-slate-50/50">
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-sans font-bold text-slate-900 text-sm">Nouveau Programme d'Audit ISO 19011</h3>
                <p className="text-[10px] text-slate-500">Planifiez et formalisez un audit avec les critères d'intégrité déontologique d'inspection</p>
              </div>
            </div>

            <form onSubmit={handleSaveAudit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Intitulé de l'Audit</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="ex: Audit Trimestriel SST et REACH Ligne 3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Type d'Audit</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as Audit['type'])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none"
                  >
                    <option value="internal">Audit Interne (Clause 9.2)</option>
                    <option value="external">Audit Externe (Fournisseur/Sous-traitance)</option>
                    <option value="certification">Audit de Certification (Afaq / Veritas)</option>
                    <option value="process">Audit Processus Ciblé</option>
                    <option value="site_safety">Vérification terrain / HSE Tour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Processus Métier Rattaché</label>
                  <select
                    value={newProcessId}
                    onChange={(e) => setNewProcessId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none font-medium"
                  >
                    {nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        P-{String(node.id).padStart(2, '0')} : {node.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Auditeur Responsable</label>
                  <input
                    type="text"
                    value={newAuditor}
                    onChange={(e) => setNewAuditor(e.target.value)}
                    placeholder="ex: Emma Laurent (Certification IRCA)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Représentant Audité (Pilote)</label>
                  <input
                    type="text"
                    value={newAuditee}
                    onChange={(e) => setNewAuditee(e.target.value)}
                    placeholder="ex: Marc Dubois"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Normes Référentielles</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {['ISO 9001', 'ISO 14001', 'ISO 45001'].map(std => {
                      const has = newStandards.includes(std);
                      return (
                        <button
                          type="button"
                          key={std}
                          onClick={() => handleToggleStandard(std)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border transition ${
                            has
                              ? 'bg-emerald-50 border-emerald-450 text-emerald-700 font-extrabold'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          {std}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date d'inspection prévue</label>
                  <input
                    type="date"
                    value={newScheduledDate}
                    onChange={(e) => setNewScheduledDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Objectifs d'audit spécifiques</label>
                  <textarea
                    value={newObjectives}
                    onChange={(e) => setNewObjectives(e.target.value)}
                    rows={2}
                    placeholder="ex: Auditer les registres de mesures réglementaires et les fiches incidentaires rattachées"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-950 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Champ/Scope de l'inspection</label>
                  <textarea
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                    rows={2}
                    placeholder="ex: Atelier de stockage intermédiaire, quai ferroviaire déchargement, balances étalonnées"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-950 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

              </div>

              {/* ISO 19011 code of ethics prompt */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <span className="font-bold text-[10px] uppercase font-mono tracking-wider text-slate-700 flex items-center gap-1 bg-white border border-slate-150 px-2 py-0.5 rounded-md w-fit shadow-3xs">
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-500" /> Éléments de Déontologie ISO 19011 assurés d'office
                </span>
                <p className="text-[10px] text-slate-500 mt-1 pb-1">
                  En validant ce formulaire de planification, l'auditeur certifie de s'aligner sur les principes directeurs de l'évaluation : déontologie, impartialité, conscience professionnelle, confidentialité, indépendance et approche par les risques.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveSubView('all')}
                  className="px-4 py-2 border border-slate-250 text-slate-605 bg-white hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition shadow-2xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer transition shadow-2xs"
                >
                  Valider et Planifier
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        // -------------------------
        // PRIMARY REGISTRY WORKSPACE
        // -------------------------
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-slate-55">
          
          {/* SEARCH, FILTER AND DIRECTORY LIST OF AUDITS */}
          <div className="w-full md:w-[350px] border-r border-slate-200 bg-white flex flex-col shrink-0">
            
            {/* SEARCH AND FILTERING PANEL */}
            <div className="p-4 border-b border-slate-150 bg-slate-50/40 space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Chercher audit, auditeur, id..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs w-full bg-white border border-slate-200 pl-8.5 pr-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 font-mono">
                  <span>Critères de filtres</span>
                  {(statusFilter !== 'all' || typeFilter !== 'all' || standardFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setTypeFilter('all');
                        setStandardFilter('all');
                      }}
                      className="text-emerald-600 font-extrabold lowercase cursor-pointer bg-transparent border-0"
                    >
                      effacer
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-[10px] bg-white border border-slate-200 py-1 px-1 rounded-md focus:outline-none text-slate-705"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="scheduled">Planifié</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Clôturé</option>
                    <option value="cancelled">Annulé</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="text-[10px] bg-white border border-slate-200 py-1 px-1 rounded-md focus:outline-none text-slate-705"
                  >
                    <option value="all">Tous types</option>
                    <option value="internal">Interne</option>
                    <option value="external">Externe</option>
                    <option value="certification">surveillance</option>
                    <option value="process">processus</option>
                    <option value="site_safety">vocal / sst</option>
                  </select>

                  <select
                    value={standardFilter}
                    onChange={(e) => setStandardFilter(e.target.value)}
                    className="text-[10px] bg-white border border-slate-200 py-1 px-1 rounded-md focus:outline-none text-slate-705"
                  >
                    <option value="all">Toutes specs</option>
                    <option value="ISO 9001">ISO 9001</option>
                    <option value="ISO 14001">ISO 14001</option>
                    <option value="ISO 45001">ISO 45001</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AUDIT ITEM LISTS */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {filteredAudits.length > 0 ? (
                filteredAudits.map(audit => {
                  const isSel = audit.id === selectedAuditId;
                  const processName = nodes.find(n => n.id === audit.linkedProcessId)?.name || 'Processus';
                  const typeObj = MAP_AUDIT_TYPES[audit.type] || { label: audit.type, color: 'text-slate-700 bg-slate-50' };
                  const statusObj = MAP_AUDIT_STATUS[audit.status] || { label: audit.status, color: 'text-slate-700 bg-slate-55' };
                  
                  return (
                    <div
                      key={audit.id}
                      onClick={() => setSelectedAuditId(audit.id)}
                      className={`p-3 rounded-xl cursor-pointer transition border text-left flex flex-col justify-between relative group ${
                        isSel
                          ? 'bg-slate-900 border-slate-950 text-white shadow shadow-slate-950/20'
                          : 'bg-white border-slate-200/60 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5 mb-1.5">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-inherit">
                          {audit.id}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <span className={`text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded uppercase border shrink-0 ${statusObj.color}`}>
                            {statusObj.label}
                          </span>
                        </div>
                      </div>

                      <h4 className={`text-xs font-bold leading-snug tracking-tight mb-1 line-clamp-1 truncate ${isSel ? 'text-white' : 'text-slate-900'}`}>
                        {audit.title}
                      </h4>

                      <p className={`text-[10px] mt-0.5 line-clamp-1 ${isSel ? 'text-slate-400' : 'text-slate-450'}`}>
                        Prise : {processName}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200/10 flex items-center justify-between text-[9px] font-mono text-slate-450">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {audit.scheduledDate}
                        </span>

                        <span className="font-bold flex items-center gap-1 bg-slate-200/5 px-2 py-0.2 rounded border border-transparent">
                          Findings : {audit.findings?.length || 0}
                        </span>
                      </div>

                      {/* Hover action button to remove audit */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAudit(audit.id);
                        }}
                        className="p-1 rounded bg-rose-950 text-rose-400 border border-rose-900 absolute right-1.5 top-7 cursor-pointer transition opacity-0 group-hover:opacity-100 hover:scale-105"
                        title="Supprimer cet audit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <HelpCircle className="w-8 h-8 text-slate-305 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-800">Aucun audit ne correspond</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">Veuillez ajuster les sélections de filtres ou créer un nouvel audit.</p>
                </div>
              )}
            </div>
          </div>

          {/* AUDIT DETAIL ANALYSIS VIEWPORTS */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-6">
            <AnimatePresence mode="wait">
              {selectedAudit ? (
                <motion.div
                  key={selectedAudit.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  
                  {/* DETAIL MAIN CARD DETAILS AND ATTRIBUTES */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-100 pb-3 gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-mono font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                            {selectedAudit.id}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${MAP_AUDIT_TYPES[selectedAudit.type].color}`}>
                            {MAP_AUDIT_TYPES[selectedAudit.type].label}
                          </span>
                        </div>
                        <h3 className="text-md font-sans font-bold text-slate-900 tracking-tight">
                          {selectedAudit.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status switcher */}
                        {['scheduled', 'in_progress', 'completed'].map(st => {
                          const active = selectedAudit.status === st;
                          const mappedSt = MAP_AUDIT_STATUS[st as Audit['status']];
                          return (
                            <button
                              key={st}
                              onClick={() => handleChangeStatus(st as Audit['status'])}
                              className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer select-none ${
                                active
                                  ? `${mappedSt.color} border-slate-300 font-extrabold scale-102`
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {mappedSt.label}
                            </button>
                          );
                        })}

                        <div className="w-[1px] h-5 bg-slate-200 mx-1 hidden sm:block"></div>

                        <button
                          onClick={() => handleDeleteAudit(selectedAudit.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg cursor-pointer transition select-none hover:scale-102"
                          title="Supprimer définitivement cet audit d'intégrité"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata block */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50/50 border border-slate-150 p-4 rounded-xl">
                      <div>
                        <span className="block text-[9px] font-mono uppercase font-bold text-slate-450 mb-1">Processus Audité</span>
                        <span className="font-semibold text-slate-900 leading-tight">
                          P-{String(selectedAudit.linkedProcessId).padStart(2, '0')} : {nodes.find(n => n.id === selectedAudit.linkedProcessId)?.name || 'Anonyme'}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[9px] font-mono uppercase font-bold text-slate-450 mb-1">Auditeur IRCA / Inspecteur</span>
                        <span className="font-semibold text-slate-900 block flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {selectedAudit.auditor}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[9px] font-mono uppercase font-bold text-slate-450 mb-1">Pilote d'atelier / Audité</span>
                        <span className="font-semibold text-slate-900 block flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {selectedAudit.auditee}
                        </span>
                      </div>

                      <div className="border-t border-slate-150 pt-2 pb-1 col-span-1 sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <span className="block text-[9px] font-mono uppercase font-bold text-slate-450 mb-1">Dates d'Audit</span>
                          <span className="font-mono text-slate-700 leading-none">
                            Prévu : {selectedAudit.scheduledDate} 
                            {selectedAudit.completedDate && ` / Réalisé : ${selectedAudit.completedDate}`}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[9px] font-mono uppercase font-bold text-slate-450 mb-1">Spécifications Référentielles</span>
                          <div className="flex gap-1 mt-1">
                            {selectedAudit.standards.map(std => (
                              <span key={std} className="px-1.5 py-0.2 font-mono font-bold text-[8.5px] bg-slate-950 text-slate-300 rounded border border-transparent">
                                {std}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="block text-[9px] font-mono uppercase font-bold text-slate-450 mb-1">Criticité Ecart Majeure</span>
                          <span className="font-semibold text-slate-750">
                            Approche basée risques • ISO 19011 Chap. 6.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Scope and objectives */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="border border-slate-150 p-3.5 rounded-xl">
                        <span className="block font-bold text-slate-800 mb-1 font-space">Objectifs définis de la revue</span>
                        <p className="text-slate-500 leading-relaxed text-[11px] font-medium font-sans">
                          {selectedAudit.objectives}
                        </p>
                      </div>

                      <div className="border border-slate-150 p-3.5 rounded-xl">
                        <span className="block font-bold text-slate-800 mb-1 font-space">Périmètre / Scope physique</span>
                        <p className="text-slate-500 leading-relaxed text-[11px] font-medium font-sans">
                          {selectedAudit.scope}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* ISO 19011 ETHICS & METHODOLOGICAL PRINCIPLES VERIFICATION */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">
                    <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4.5 h-4.5 text-indigo-600" />
                        <h4 className="font-space font-bold text-slate-900 text-xs">Avenants Déontologiques d'Audit — ISO 19011 Clause 4</h4>
                      </div>
                      
                      {(() => {
                        const checkedCount = Object.values(selectedAudit.iso19011PrinciplesChecked || {}).filter(Boolean).length;
                        return (
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                            checkedCount === 7 ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-amber-50 text-amber-705 border-amber-200'
                          }`}>
                            Score d'intégrité : {checkedCount}/7 piliers
                          </span>
                        );
                      })()}
                    </div>

                    <p className="text-[10px] text-slate-500 leading-normal">
                      Conformément à la directive ISO 19011, la vérification s'appuie sur la ratification de 7 principes fondamentaux de conduite d'évaluation d'usine. Cochez les cases pour acter les engagements du comité lors de cet audit :
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[10px]">
                      
                      <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-150 hover:bg-slate-50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedAudit.iso19011PrinciplesChecked?.integrity ?? false}
                          onChange={() => handleTogglePrinciple('integrity')}
                          className="mt-0.5 bg-slate-50 text-emerald-600 border-slate-200 focus:outline-none rounded w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold block text-slate-900">Principle 1 : Intégrité</span>
                          <span className="text-slate-450 block text-[9px]">Honnêteté, diligence et conduite responsable.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-150 hover:bg-slate-50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedAudit.iso19011PrinciplesChecked?.fairPresentation ?? false}
                          onChange={() => handleTogglePrinciple('fairPresentation')}
                          className="mt-0.5 bg-slate-50 text-emerald-600 border-slate-200 focus:outline-none rounded w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold block text-slate-900">2 : Présentation Impartiale</span>
                          <span className="text-slate-450 block text-[9px]">Obligation de rapporter sincèrement et fidèlement.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-150 hover:bg-slate-50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedAudit.iso19011PrinciplesChecked?.professionalCare ?? false}
                          onChange={() => handleTogglePrinciple('professionalCare')}
                          className="mt-0.5 bg-slate-50 text-emerald-600 border-slate-200 focus:outline-none rounded w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold block text-slate-900">3 : Conscience Professionnelle</span>
                          <span className="text-slate-450 block text-[9px]">Soin et diligence appropriés lors de la fouille.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-150 hover:bg-slate-50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedAudit.iso19011PrinciplesChecked?.confidentiality ?? false}
                          onChange={() => handleTogglePrinciple('confidentiality')}
                          className="mt-0.5 bg-slate-50 text-emerald-600 border-slate-200 focus:outline-none rounded w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold block text-slate-900">4 : Confidentialité</span>
                          <span className="text-slate-450 block text-[9px]">Protection renforcée des informations recueillies.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-150 hover:bg-slate-50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedAudit.iso19011PrinciplesChecked?.independence ?? false}
                          onChange={() => handleTogglePrinciple('independence')}
                          className="mt-0.5 bg-slate-50 text-emerald-600 border-slate-200 focus:outline-none rounded w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold block text-slate-900">5 : Indépendance</span>
                          <span className="text-slate-450 block text-[9px]">Base de l'impartialité et de l'objectivité des conclusions.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-150 hover:bg-slate-50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedAudit.iso19011PrinciplesChecked?.evidenceBased ?? false}
                          onChange={() => handleTogglePrinciple('evidenceBased')}
                          className="mt-0.5 bg-slate-50 text-emerald-600 border-slate-200 focus:outline-none rounded w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold block text-slate-900">6 : Preuve Rationnelle</span>
                          <span className="text-slate-450 block text-[9px]">Méthode rationnelle de conclusions vérifiables.</span>
                        </div>
                      </label>

                      <label className="flex items-start gap-2 p-2 rounded-lg border border-slate-150 hover:bg-slate-50 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedAudit.iso19011PrinciplesChecked?.riskBased ?? false}
                          onChange={() => handleTogglePrinciple('riskBased')}
                          className="mt-0.5 bg-slate-50 text-emerald-600 border-slate-200 focus:outline-none rounded w-3.5 h-3.5"
                        />
                        <div>
                          <span className="font-bold block text-slate-900">7 : Approche Risques / Opps</span>
                          <span className="text-slate-450 block text-[9px]">Considérer les risques/opps pour le programme.</span>
                        </div>
                      </label>

                    </div>
                  </div>

                  {/* AUDIT CRITICAL CONSTATATIONS & FINDINGS MANAGEMENT (PRACTICAL FIELD) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LOGGED FINDINGS LIST (8 COLS ON DESKTOP) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs lg:col-span-8 flex flex-col justify-between space-y-4">
                      
                      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                          <h4 className="font-sans font-bold text-slate-900 text-xs">Registre des Écarts & Constats formulés ({selectedAudit.findings?.length || 0})</h4>
                        </div>
                      </div>

                      {selectedAudit.findings && selectedAudit.findings.length > 0 ? (
                        <div className="space-y-3.5 divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
                          {selectedAudit.findings.map((f, index) => {
                            const isNc = f.type === 'minor_nc' || f.type === 'major_nc';
                            const hasCapa = !!f.linkedCapaId;
                            
                            const findingLabels: Record<AuditFinding['type'], { label: string, color: string }> = {
                              conformity: { label: 'Conformité Forte', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
                              minor_nc: { label: 'Écart Mineur', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                              major_nc: { label: 'Non-Conformité Majeure', color: 'text-rose-700 bg-rose-50 border-rose-200' },
                              ofi: { label: 'Piste d’Amélioration (OFI)', color: 'text-sky-700 bg-sky-50 border-sky-100' },
                              observation: { label: 'Observation simple', color: 'text-slate-600 bg-slate-100 border-slate-150' }
                            };

                            return (
                              <div key={f.id} className={`pt-3.5 space-y-2 text-xs relative group/f ${index === 0 ? 'pt-0' : ''}`}>
                                
                                <div className="flex items-start justify-between gap-3 flex-wrap">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono font-bold text-[9px] bg-slate-205 py-0.2 px-1.5 rounded text-slate-600">
                                      {f.id}
                                    </span>
                                    <span className={`text-[8.5px] px-2 py-0.2 rounded font-extrabold uppercase border font-mono ${findingLabels[f.type].color}`}>
                                      {findingLabels[f.type].label}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      Clause associée : <strong>{f.clause}</strong>
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    {isNc && !hasCapa && (
                                      <button
                                        type="button"
                                        onClick={() => handleSpawnCapaFromFinding(selectedAudit, f)}
                                        className="text-[9px] font-bold bg-amber-600 hover:bg-amber-700 text-white border border-transparent px-2.5 py-0.5 rounded cursor-pointer transition shadow-3xs flex items-center gap-0.5"
                                      >
                                        ⚡ Générer CAPA Correctif
                                      </button>
                                    )}

                                    {hasCapa && (
                                      <span className="text-[9px] font-mono font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.2 rounded">
                                        CAPA : {f.linkedCapaId}
                                      </span>
                                    )}

                                    <button
                                      onClick={() => handleDeleteFinding(f.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition opacity-0 group-hover/f:opacity-100 cursor-pointer"
                                      title="Supprimer ce constat"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <p className="text-slate-800 leading-relaxed font-sans text-xs">
                                  <strong>Description :</strong> {f.description}
                                </p>

                                {f.evidence && (
                                  <div className="bg-slate-50 p-2 border border-slate-150 rounded-lg text-[10.5px] text-slate-500 font-mono italic">
                                    Preuve(s) de constatation : {f.evidence}
                                  </div>
                                )}

                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-400 my-auto">
                          <ClipboardCheck className="w-9 h-9 text-slate-205 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-8 *">Aucun écart ou constat n’a encore été formalisé</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto leading-normal">
                            Utilisez le formulaire ci-contre pour ajouter des conformités positives ou des points de déviation QHSE selon l'ISO 19011.
                          </p>
                        </div>
                      )}

                      {/* Textbox summary report for global audit */}
                      <div className="border-t border-slate-100 pt-4 space-y-2">
                        <label className="block text-[10px] font-mono font-bold uppercase text-slate-450 tracking-wide">
                          Rapport de synthèse de l'inspection (Conclusions formelles ISO 19011)
                        </label>
                        <textarea
                          key={`summary-${selectedAudit.id}`}
                          defaultValue={selectedAudit.summaryReport || ''}
                          onBlur={(e) => handleSaveSummaryReport(e.target.value)}
                          placeholder="Rédigez les conclusions globales de l'audit... (Sauvegardé automatiquement lors du clic en dehors de cette zone)"
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 p-3 leading-relaxed focus:outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>

                    </div>

                    {/* ADD FINDING FORM (4 COLS ON DESKTOP) */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs lg:col-span-4 space-y-4">
                      
                      <div className="border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-sans font-bold text-slate-900 text-xs">Formuler un Constat</h4>
                      </div>

                      <form onSubmit={handleAddFinding} className="space-y-3.5 text-xs text-left">
                        
                        <div>
                          <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Type de Constat</label>
                          <select
                            value={findingType}
                            onChange={(e) => setFindingType(e.target.value as AuditFinding['type'])}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:outline-none font-medium"
                          >
                            <option value="conformity">Conformité Claire (Meilleure Pratique)</option>
                            <option value="minor_nc">Ecart Mineur (Anomalie isolée)</option>
                            <option value="major_nc">Non-Conformité Majeure (Réglementaire)</option>
                            <option value="ofi">Piste d'Amélioration (OFI)</option>
                            <option value="observation">Observation Simple</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Clause Normative Réf.</label>
                          <input
                            type="text"
                            value={findingClause}
                            onChange={(e) => setFindingClause(e.target.value)}
                            placeholder="ex: 9.2.1, 8.5, 4.3"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:outline-none"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Explication de l'écart / Constat</label>
                          <textarea
                            value={findingDescription}
                            onChange={(e) => setFindingDescription(e.target.value)}
                            rows={3}
                            placeholder="Décrivez l'anomalie ou la constatation objective d'inspection..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-950 focus:outline-none resize-none leading-relaxed"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">Preuves formelles associées</label>
                          <textarea
                            value={findingEvidence}
                            onChange={(e) => setFindingEvidence(e.target.value)}
                            rows={2}
                            placeholder="ex: Numéro d'enregistrement REC-QA-089 manquant, ou constat visuel direct"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-950 focus:outline-none resize-none leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold cursor-pointer transition shadow-3xs flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Enregistrer le constat d'écart</span>
                        </button>

                      </form>
                    </div>

                  </div>

                </motion.div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center my-auto shadow-3xs text-slate-400">
                  <ClipboardCheck className="w-14 h-14 text-slate-205 mx-auto mb-3" />
                  <h4 className="font-sans font-bold text-slate-900 text-sm mb-1">Aucun audit sélectionné</h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Sélectionnez un audit dans la liste latérale gauche ou créez-en un nouveau selon les exigences de la clause 9.2 pour auditer les processus de l'integrated management system.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* CONFIRMATION DELETION MODAL */}
      <AnimatePresence>
        {auditIdToDelete && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 pointer-events-auto"
            onClick={() => setAuditIdToDelete(null)}
          >
            <div
              className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-100 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-sans font-bold text-slate-900 text-sm">Supprimer l'Audit ?</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                    Cette action est irréversible et détruira définitivement cet enregistrement d'audit ISO 19011.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl text-xs space-y-1 bg-slate-50/70">
                <div className="flex justify-between">
                  <span className="text-slate-500">Référence :</span>
                  <span className="font-mono font-bold text-slate-900">{auditIdToDelete}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-500 shrink-0">Intitulé :</span>
                  <span className="font-medium text-slate-900 text-right truncate max-w-[180px]" title={audits.find(a => a.id === auditIdToDelete)?.title}>
                    {audits.find(a => a.id === auditIdToDelete)?.title}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-450 italic leading-snug">
                Note : Tous les constats, non-conformités et raccordements liés directement à cet audit seront supprimés du registre.
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAuditIdToDelete(null)}
                  className="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-xl font-bold cursor-pointer transition shadow-3xs"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteAudit}
                  className="px-3 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer transition shadow-3xs"
                >
                  Confirmer la suppression
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
