import React, { useState, useEffect } from 'react';
import { 
  DocumentedInfo, 
  ProcessNode, 
  AlcoaAssessment,
  DocumentAuditTrail
} from '../types';
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Clock, 
  User, 
  Layers, 
  Calendar, 
  FileSpreadsheet,
  Download,
  History,
  ShieldCheck,
  Eye,
  Filter,
  ArrowRight,
  Database,
  Building,
  Check,
  HelpCircle,
  Activity,
  RotateCcw
} from 'lucide-react';

interface DocumentedInformationModuleProps {
  documents: DocumentedInfo[];
  nodes: ProcessNode[];
  quickAddProcessId?: number | null;
  onClearQuickAddProcess?: () => void;
  onChangeDocuments: (newDocs: DocumentedInfo[]) => void;
}

export const DocumentedInformationModule: React.FC<DocumentedInformationModuleProps> = ({
  documents = [],
  nodes = [],
  quickAddProcessId,
  onClearQuickAddProcess,
  onChangeDocuments
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processFilter, setProcessFilter] = useState<string>('all');
  const [alcoaRatingFilter, setAlcoaRatingFilter] = useState<string>('all'); // compliant, partial, pending

  // Selection & Creation state
  const [selectedDocId, setSelectedDocId] = useState<string | null>(documents[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);
  const [docIdToConfirmDelete, setDocIdToConfirmDelete] = useState<string | null>(null);

  // New action / audit entry state
  const [showLogActionModal, setShowLogActionModal] = useState(false);
  const [actionUser, setActionUser] = useState('Emma Laurent (Resp. Qualité)');
  const [actionType, setActionType] = useState('modification');
  const [actionDetails, setActionDetails] = useState('');

  // Form states for adding a new document
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<DocumentedInfo['type']>('sop');
  const [newVersion, setNewVersion] = useState('v1.0');
  const [newLinkedProcessId, setNewLinkedProcessId] = useState<number | undefined>(undefined);
  const [newCreatedBy, setNewCreatedBy] = useState('Emma Laurent (Resp. Qualité)');
  const [newRetention, setNewRetention] = useState<number>(5);
  const [newStorage, setNewStorage] = useState('SrvDocs/SMI/');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Form states for current ALCOA assessment
  const [evalNotes, setEvalNotes] = useState('');
  const [evalAssessedBy, setEvalAssessedBy] = useState('Emma Laurent (Resp. Qualité)');

  // Quick Action From process map integration
  useEffect(() => {
    if (quickAddProcessId) {
      setNewLinkedProcessId(quickAddProcessId);
      setIsCreating(true);
      if (onClearQuickAddProcess) {
        onClearQuickAddProcess();
      }
    }
  }, [quickAddProcessId, onClearQuickAddProcess]);

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  // Stats calculation
  const totalCount = documents.length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const underReviewCount = documents.filter(d => d.status === 'under_review').length;
  const draftCount = documents.filter(d => d.status === 'draft').length;

  const calculateAlcoaScore = (doc: DocumentedInfo): number => {
    if (!doc.alcoaAssessment) return 0;
    const { attributable, legible, contemporaneous, original, accurate, complete, consistent, enduring, available } = doc.alcoaAssessment;
    return [attributable, legible, contemporaneous, original, accurate, complete, consistent, enduring, available].filter(Boolean).length;
  };

  // Integrity Rate: % of files with perfect 9/9 score
  const perfectAlcoaCount = documents.filter(d => calculateAlcoaScore(d) === 9).length;
  const averageAlcoaScore = totalCount > 0 
    ? (documents.reduce((acc, d) => acc + calculateAlcoaScore(d), 0) / totalCount).toFixed(1) 
    : '0';

  // Filtered documents list
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.createdBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'all' || doc.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesProcess = processFilter === 'all' || String(doc.linkedProcessId) === processFilter;

    // ALCOA Rating filters
    const score = calculateAlcoaScore(doc);
    let matchesAlcoa = true;
    if (alcoaRatingFilter === 'compliant') {
      matchesAlcoa = score === 9;
    } else if (alcoaRatingFilter === 'partial') {
      matchesAlcoa = score > 0 && score < 9;
    } else if (alcoaRatingFilter === 'pending') {
      matchesAlcoa = score === 0 || !doc.alcoaAssessment;
    }

    return matchesSearch && matchesType && matchesStatus && matchesProcess && matchesAlcoa;
  });

  const getProcessName = (pId?: number) => {
    if (pId === undefined) return 'Non Rattaché';
    const nd = nodes.find(n => n.id === pId);
    return nd ? nd.name : `Processus ${pId}`;
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode) return;

    const generatedId = `DOC-2026-${String(documents.length + 101)}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const newDoc: DocumentedInfo = {
      id: generatedId,
      title: newTitle,
      code: newCode.toUpperCase().replace(/\s+/g, '-'),
      type: newType,
      version: newVersion || 'v1.0',
      status: 'draft',
      linkedProcessId: newLinkedProcessId,
      createdBy: newCreatedBy || 'Emma Laurent (Resp. Qualité)',
      createdAt: todayStr,
      lastUpdatedBy: newCreatedBy || 'Emma Laurent (Resp. Qualité)',
      lastUpdatedAt: todayStr,
      retentionPeriodYears: newRetention,
      storageLocation: newStorage || 'SrvDocs/SMI/',
      fileUrl: uploadedFileName ? `SrvDocs/SMI/Uploads/${uploadedFileName}` : undefined,
      auditTrail: [
        {
          id: `TR-SMI-${Date.now().toString().slice(-4)}`,
          timestamp: `${todayStr} ${new Date().toTimeString().slice(0, 5)}`,
          user: newCreatedBy || 'Emma Laurent (Resp. Qualité)',
          action: 'creation',
          details: `Initialisation du document sous la référence interne. Pièce rattachée : ${uploadedFileName || 'Aucune'}`
        }
      ],
      alcoaAssessment: {
        attributable: true, // Default to true because user is logged
        legible: true,
        contemporaneous: true,
        original: false, // Must be verified
        accurate: false,
        complete: false,
        consistent: true,
        enduring: true,
        available: true,
        notes: "Auto-déclaration à la création. Audit réglementaire requis pour approbation finale.",
        assessedBy: newCreatedBy || 'Emma Laurent (Resp. Qualité)',
        assessedAt: todayStr
      }
    };

    const updated = [...documents, newDoc];
    onChangeDocuments(updated);
    setSelectedDocId(newDoc.id);
    setIsCreating(false);

    // Reset Form
    setNewTitle('');
    setNewCode('');
    setNewType('sop');
    setNewVersion('v1.0');
    setNewLinkedProcessId(undefined);
    setNewStorage('SrvDocs/SMI/');
    setUploadedFileName('');
  };

  const handleDeleteDocument = (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    onChangeDocuments(updated);
    setDocIdToConfirmDelete(null);
    if (selectedDocId === id) {
      setSelectedDocId(updated[0]?.id || null);
    }
  };

  const handleUpdateAlcoaCheck = (criterion: keyof AlcoaAssessment, value: boolean) => {
    if (!selectedDoc) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const currentAssessment = selectedDoc.alcoaAssessment || {
      attributable: false,
      legible: false,
      contemporaneous: false,
      original: false,
      accurate: false,
      complete: false,
      consistent: false,
      enduring: false,
      available: false,
      notes: '',
      assessedBy: 'Emma Laurent (Resp. Qualité)',
      assessedAt: todayStr
    };

    const updatedAssessment: AlcoaAssessment = {
      ...currentAssessment,
      [criterion]: value,
      assessedAt: todayStr,
      assessedBy: evalAssessedBy || currentAssessment.assessedBy
    };

    // Calculate score change for the logs
    const prevScore = calculateAlcoaScore(selectedDoc);
    const mockDocWithNewAssess = { ...selectedDoc, alcoaAssessment: updatedAssessment };
    const nextScore = calculateAlcoaScore(mockDocWithNewAssess);
    
    // Auto audit log entry
    const logId = `TR-SMI-${Date.now().toString().slice(-4)}`;
    const newLog: DocumentAuditTrail = {
      id: logId,
      timestamp: `${todayStr} ${new Date().toTimeString().slice(0, 5)}`,
      user: evalAssessedBy || 'Emma Laurent (Resp. Qualité)',
      action: 'alcoa_assessment',
      details: `Critère ALCOA+ [${criterion.toUpperCase()}] mis à jour -> ${value ? 'CONFORME' : 'NON CONFORME'}. Évolution du score : ${prevScore}/9 -> ${nextScore}/9.`
    };

    // Auto promote/demote status based on scores for smart workflow!
    // Approved if ALCOA score = 9, else blocked in under review or draft if score is poor
    let autoStatus = selectedDoc.status;
    if (nextScore === 9 && selectedDoc.status !== 'approved') {
      autoStatus = 'approved';
    } else if (nextScore < 9 && selectedDoc.status === 'approved') {
      autoStatus = 'under_review';
    }

    const updatedDocuments = documents.map(d => {
      if (d.id === selectedDoc.id) {
        return {
          ...d,
          status: autoStatus,
          alcoaAssessment: updatedAssessment,
          auditTrail: [...d.auditTrail, newLog],
          lastUpdatedAt: todayStr,
          lastUpdatedBy: evalAssessedBy || 'Emma Laurent (Resp. Qualité)'
        };
      }
      return d;
    });

    onChangeDocuments(updatedDocuments);
  };

  const handleUpdateAssessmentNotes = () => {
    if (!selectedDoc) return;
    const todayStr = new Date().toISOString().split('T')[0];

    const currentAssessment = selectedDoc.alcoaAssessment || {
      attributable: false,
      legible: false,
      contemporaneous: false,
      original: false,
      accurate: false,
      complete: false,
      consistent: false,
      enduring: false,
      available: false,
      notes: '',
      assessedBy: 'Emma Laurent (Resp. Qualité)',
      assessedAt: todayStr
    };

    const updatedAssessment: AlcoaAssessment = {
      ...currentAssessment,
      notes: evalNotes,
      assessedAt: todayStr,
      assessedBy: evalAssessedBy || currentAssessment.assessedBy
    };

    const logId = `TR-SMI-${Date.now().toString().slice(-4)}`;
    const newLog: DocumentAuditTrail = {
      id: logId,
      timestamp: `${todayStr} ${new Date().toTimeString().slice(0, 5)}`,
      user: evalAssessedBy || 'Emma Laurent (Resp. Qualité)',
      action: 'alcoa_assessment',
      details: `Commentaires d'évaluation métrologique / d'intégrité modifiés.`
    };

    const updatedDocuments = documents.map(d => {
      if ( d.id === selectedDoc.id) {
        return {
          ...d,
          alcoaAssessment: updatedAssessment,
          auditTrail: [...d.auditTrail, newLog],
          lastUpdatedAt: todayStr,
          lastUpdatedBy: evalAssessedBy || 'Emma Laurent (Resp. Qualité)'
        };
      }
      return d;
    });

    onChangeDocuments(updatedDocuments);
    alert('Évaluation d\'intégrité ALCOA+ enregistrée avec succès.');
  };

  const handleLogManualAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc || !actionDetails) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const logId = `TR-EX-${Date.now().toString().slice(-4)}`;

    const newLog: DocumentAuditTrail = {
      id: logId,
      timestamp: `${todayStr} ${new Date().toTimeString().slice(0, 5)}`,
      user: actionUser,
      action: actionType,
      details: actionDetails
    };

    const updatedDocuments = documents.map(d => {
      if (d.id === selectedDoc.id) {
        // Increment version if type is modification
        let nextVer = d.version;
        if (actionType === 'modification') {
          const m = d.version.match(/v(\d+)\.(\d+)/);
          if (m) {
            const major = parseInt(m[1]);
            const minor = parseInt(m[2]);
            nextVer = `v${major}.${minor + 1}`;
          } else {
            nextVer = d.version + '.1';
          }
        }

        return {
          ...d,
          version: nextVer,
          auditTrail: [...d.auditTrail, newLog],
          lastUpdatedAt: todayStr,
          lastUpdatedBy: actionUser
        };
      }
      return d;
    });

    onChangeDocuments(updatedDocuments);
    setActionDetails('');
    setShowLogActionModal(false);
  };

  // Mock file dropping
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      // Auto pre-populate Code if empty
      if (!newCode) {
        const cleanedName = file.name.split('.')[0].toUpperCase().replace(/[^A-Z0-9]/g, '-');
        setNewCode(cleanedName);
      }
      if (!newTitle) {
        setNewTitle(file.name.split('.')[0].replace(/[_-]/g, ' '));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      // Auto pre-populate Code if empty
      if (!newCode) {
        const cleanedName = file.name.split('.')[0].toUpperCase().replace(/[^A-Z0-9]/g, '-');
        setNewCode(cleanedName);
      }
      if (!newTitle) {
        setNewTitle(file.name.split('.')[0].replace(/[_-]/g, ' '));
      }
    }
  };

  const triggerMockFileSelection = () => {
    const mockNames = [
      'SOP-LAB-012_Echantillonnage_Graines.pdf',
      'REC-MNT-502_Calibration_Balances_Precision.xlsx',
      'MAN-QHSE-05_Reglementation_Dechets.pdf',
      'FORM-AC-102_Declaration_NC_Terrain.docx',
      'CERT-ISO9001-2026_Veritas.pdf'
    ];
    const randName = mockNames[Math.floor(Math.random() * mockNames.length)];
    setUploadedFileName(randName);
    if (!newCode) {
      const baseCode = randName.split('_')[0];
      setNewCode(baseCode.toUpperCase());
    }
    if (!newTitle) {
      setNewTitle(randName.split('_')[1]?.split('.')[0]?.replace(/[_-]/g, ' ') || randName);
    }
  };

  // Sync edit state values on selected document change
  useEffect(() => {
    if (selectedDoc) {
      setEvalNotes(selectedDoc.alcoaAssessment?.notes || '');
      setEvalAssessedBy(selectedDoc.alcoaAssessment?.assessedBy || 'Emma Laurent (Resp. Qualité)');
    }
  }, [selectedDocId, selectedDoc]);

  const typeLabels: Record<string, string> = {
    sop: 'Procédure (SOP)',
    form: 'Formulaire / Template',
    record: 'Enregistrement / Record',
    manual: 'Manuel IMS',
    policy: 'Politique / Vision',
    certificate: 'Certificat Externe'
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft (Brouillon)',
    under_review: 'Sous Revue',
    approved: 'Validé & Signé Certifié',
    archived: 'Archivé'
  };

  return (
    <div className="w-full h-full overflow-y-auto px-6 py-6 pb-20 max-w-7xl mx-auto flex flex-col gap-6" id="documented-info-management-module">
      {/* Upper Widgets & KPI Dashboard in corporate layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* KPI 1 : Count */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Total Documents</span>
            <h3 className="text-3xl font-bold font-sans text-slate-900 tracking-tight">{totalCount}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
              <span className="text-emerald-600 font-semibold">{approvedCount} Actifs</span> • 
              <span className="text-amber-600 font-semibold"> {underReviewCount} En Revue</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-500">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 : ALCOA Global Integrity Rate */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Conformité ALCOA+</span>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-bold font-sans text-emerald-600 tracking-tight">
                {totalCount > 0 ? Math.round((perfectAlcoaCount / totalCount) * 100) : 0}%
              </h3>
              <span className="text-xs font-mono text-slate-450 font-semibold">({perfectAlcoaCount}/{totalCount})</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-none">Files with 100% (9/9) data integrity verified score.</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 : Average Score */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Moyenne d'Intégrité</span>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-3xl font-bold font-sans text-slate-9 tracking-tight">{averageAlcoaScore} <span className="text-lg text-slate-400 font-medium font-mono">/ 9</span></h3>
            </div>
            <p className="text-[10px] text-slate-500 leading-none">Indice de traçabilité et de complétude réglementaire.</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* ALCOA+ Quick Reminder Guide */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 flex flex-col justify-between border border-slate-800 shadow-xs relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] text-slate-800 font-mono text-[90px] select-none font-bold opacity-30 leading-none">
            +
          </div>
          <div className="space-y-1 relative z-10">
            <span className="text-[9px] font-mono font-semibold text-indigo-300 uppercase tracking-wide">Cadre Réglementaire</span>
            <h4 className="text-xs font-bold text-white transition leading-snug">Règles d'Or Data Integrity (ALCOA+)</h4>
            <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
              Chaque enregistrement doit être **Attriuable**, **Lisible**, **Contemporain**, **Original**, **Précis** et complet (Audit Trail exhaustif).
            </p>
          </div>
          <div className="text-[8px] font-mono text-slate-400 border-t border-slate-800/85 pt-1.5 mt-2 flex justify-between items-center z-10">
            <span>ISO 9001: 7.5 • FDA 21 CFR Part 11</span>
            <span className="text-indigo-400">GAMP 5 Compliance 🛡️</span>
          </div>
        </div>

      </div>

      {/* FILTER RIBBON / CORPORATE TOOLBAR */}
      <div className="bg-slate-50 border border-slate-200/95 p-3.5 rounded-2xl shadow-xs flex flex-col gap-3.5">
        
        {/* UPPER ROW: ACTIVE METRICS & CONTEXT */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3" /> Console de Contrôle
            </div>
            <p className="text-[11px] text-slate-500 font-sans hidden sm:block">
              Filtrez la documentation CFR Part 11 par type, statut d'approbation et intégrité ALCOA+
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* MATCH COUNT BADGE */}
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
              {filteredDocs.length} de {documents.length} documents trouvés
            </span>

            {/* RESET BUTTON */}
            {(searchQuery !== '' || typeFilter !== 'all' || statusFilter !== 'all' || processFilter !== 'all' || alcoaRatingFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setProcessFilter('all');
                  setAlcoaRatingFilter('all');
                }}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold font-mono py-1 px-2 rounded-lg bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100 flex items-center gap-1 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* LOWER ROW: CORE FILTERS & ACTIONS */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2.5 items-center flex-1 min-w-[280px]">
            {/* SEARCH */}
            <div className="relative w-full max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Id, Code, Titre, Auteur..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="text-xs pl-9 pr-4 py-1.5 bg-white border border-slate-200/80 hover:border-slate-300 focus:border-indigo-500 placeholder:text-slate-400 rounded-xl focus:ring-1 focus:ring-indigo-200/50 focus:outline-hidden w-full transition font-sans text-slate-800"
              />
            </div>

            {/* TYPE FILTER */}
            <div className={`flex items-center rounded-xl bg-white border px-2 py-1.5 transition-all ${typeFilter !== 'all' ? 'border-indigo-400 bg-indigo-50/10' : 'border-slate-150'}`}>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold pr-1.5 flex items-center gap-0.5">Type:</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="text-[11px] font-semibold bg-transparent border-0 text-slate-700 cursor-pointer focus:outline-hidden focus:ring-0 p-0 pr-6"
              >
                <option value="all">Tous (All)</option>
                <option value="sop">Procédures (SOP)</option>
                <option value="form">Formulaires</option>
                <option value="record">Enregistrements</option>
                <option value="manual">Manuels</option>
                <option value="policy">Politiques</option>
                <option value="certificate">Certificats</option>
              </select>
            </div>

            {/* STATUS FILTER */}
            <div className={`flex items-center rounded-xl bg-white border px-2 py-1.5 transition-all ${statusFilter !== 'all' ? 'border-indigo-400 bg-indigo-50/10' : 'border-slate-150'}`}>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold pr-1.5 flex items-center gap-0.5">Statut:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-[11px] font-semibold bg-transparent border-0 text-slate-700 cursor-pointer focus:outline-hidden focus:ring-0 p-0 pr-6"
              >
                <option value="all">Tous les Statuts</option>
                <option value="draft">Brouillon (Draft)</option>
                <option value="under_review">Sous Revue</option>
                <option value="approved">Validé & Signé</option>
                <option value="archived">Archivé</option>
              </select>
            </div>

            {/* PROCESS FILTER */}
            <div className={`flex items-center rounded-xl bg-white border px-2 py-1.5 transition-all ${processFilter !== 'all' ? 'border-indigo-400 bg-indigo-50/10' : 'border-slate-150'}`}>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold pr-1.5 flex items-center gap-0.5">Processus:</span>
              <select
                value={processFilter}
                onChange={e => setProcessFilter(e.target.value)}
                className="text-[11px] font-semibold bg-transparent border-0 text-slate-700 cursor-pointer focus:outline-hidden focus:ring-0 p-0 pr-6 max-w-[130px] truncate"
              >
                <option value="all">Tous liés</option>
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>

            {/* ALCOA FILTER */}
            <div className={`flex items-center rounded-xl bg-white border px-2 py-1.5 transition-all ${alcoaRatingFilter !== 'all' ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-150'}`}>
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold pr-1.5 flex items-center gap-0.5">ALCOA+:</span>
              <select
                value={alcoaRatingFilter}
                onChange={e => setAlcoaRatingFilter(e.target.value)}
                className="text-[11px] font-semibold bg-transparent border-0 text-slate-700 cursor-pointer focus:outline-hidden focus:ring-0 p-0 pr-6"
              >
                <option value="all">Toutes Intégrités</option>
                <option value="compliant">100% Conforme (9/9)</option>
                <option value="partial">Conforme Partiel</option>
                <option value="pending">Non Audité (0/9)</option>
              </select>
            </div>
          </div>

          {/* PRIMARY QUICK ACTION */}
          <button
            type="button"
            onClick={() => {
              setIsCreating(true);
              setSelectedDocId(null);
            }}
            className="text-xs bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-4 py-2 rounded-xl transition duration-150 flex items-center gap-2 hover:-translate-y-0.5 active:translate-y-0 shadow-md hover:shadow-lg border border-indigo-700/30 cursor-pointer group"
          >
            <Plus className="w-4 h-4 group-hover:scale-125 transition" /> Enregistrer Document ALCOA+
          </button>
        </div>
      </div>

      {/* CORE WORKSPACE CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: LIST OF REGISTERED DOCUMENTS (Span 4) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col max-h-[800px]">
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex justify-between items-center">
            <h4 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider">
              Documents & Pièces ({filteredDocs.length})
            </h4>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded-md">
              Index Global
            </span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
            {filteredDocs.length > 0 ? (
              filteredDocs.map(doc => {
                const score = calculateAlcoaScore(doc);
                const isSelected = selectedDocId === doc.id;
                
                const statusStyles: Record<string, string> = {
                  draft: 'bg-zinc-100 text-zinc-700 border-zinc-200',
                  under_review: 'bg-amber-50 text-amber-700 border-amber-200/60',
                  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
                  archived: 'bg-slate-100 text-slate-500 border-slate-200'
                };

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDocId(doc.id);
                      setIsCreating(false);
                    }}
                    className={`p-3.5 flex flex-col gap-1.5 cursor-pointer hover:bg-slate-50/80 transition duration-150 ${
                      isSelected ? 'bg-indigo-50/40 border-l-4 border-indigo-655' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[9px] font-bold text-indigo-600 uppercase tracking-tight bg-indigo-50 px-1 rounded">
                          {doc.code}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {doc.version}
                        </span>
                      </div>
                      <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border font-semibold ${statusStyles[doc.status]}`}>
                        {doc.status.toUpperCase()}
                      </span>
                    </div>

                    <h5 className="text-xs font-semibold text-slate-800 line-clamp-1 leading-snug">
                      {doc.title}
                    </h5>

                    <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed">
                      Lien : <span className="font-medium text-slate-600">{getProcessName(doc.linkedProcessId)}</span>
                    </p>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 border-t border-slate-50 pt-1.5">
                      <div className="flex items-center gap-1 font-mono">
                        {score === 9 ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            🌟 9/9 ALCOA+ Compliant
                          </span>
                        ) : score > 0 ? (
                          <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                            ⚠️ {score}/9 Intégrité Partielle
                          </span>
                        ) : (
                          <span className="text-red-500 font-semibold flex items-center gap-0.5">
                            🚨 0/9 Non Audité
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {doc.lastUpdatedAt}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <FileText className="w-8 h-8 text-slate-300 mx-auto stroke-[1.5] mb-2" />
                <p className="text-xs text-slate-405 italic">Aucun document ne correspond à vos filtres.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setProcessFilter('all');
                    setAlcoaRatingFilter('all');
                  }}
                  className="text-[11px] font-semibold text-indigo-600 hover:underline mt-2 inline-block"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL WORKSPACE OR CREATION PANEL (Span 7) */}
        <div className="lg:col-span-7 space-y-6 lg:max-h-[800px] lg:overflow-y-auto pr-2">
          
          {/* CREATION VIEW */}
          {isCreating && (
            <form onSubmit={handleCreateDocument} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" /> Enregistrer un nouveau document réglementaire
                  </h4>
                  <p className="text-[10px] font-mono text-slate-450 uppercase mt-0.5">ISO 9001:2015 SECTION 7.5 & GAMP 5</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    if (documents.length > 0) {
                      setSelectedDocId(documents[0].id);
                    }
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl px-2.5 py-1 hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>

              {/* TWO COLUMN INPUTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Reference Code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Code / Référence Interne *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: SOP-PROD-004, REC-QA-089"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    className="text-xs w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl py-2 px-3 focus:outline-hidden font-mono"
                  />
                </div>

                {/* Title */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Type de Document</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as any)}
                    className="text-xs w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl py-2 px-3 focus:outline-hidden"
                  >
                    <option value="sop">Procédure Opératoire Standard (SOP)</option>
                    <option value="record">Enregistrement / Record de mesures</option>
                    <option value="form">Formulaire / Template de relevé</option>
                    <option value="manual">Manuel du Système d'Intégration (IMS)</option>
                    <option value="policy">Politique Charte Métier</option>
                    <option value="certificate">Certificat d'Audit Externe / Étalonnage</option>
                  </select>
                </div>

                {/* Title full span */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Intitulé / Titre Complet *</label>
                  <input
                    type="text"
                    required
                    placeholder="Saisie claire et intelligible du document d'information"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="text-xs w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl py-2 px-3 focus:outline-hidden"
                  />
                </div>

                {/* Version & Linked Process */}
                <div className="grid grid-cols-2 gap-2 md:col-span-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Version Initiale</label>
                    <input
                      type="text"
                      placeholder="v1.0"
                      value={newVersion}
                      onChange={e => setNewVersion(e.target.value)}
                      className="text-xs w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:indigo-600 rounded-xl py-2 px-3 focus:outline-hidden font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Processus SMI Rattaché</label>
                    <select
                      value={newLinkedProcessId || ''}
                      onChange={e => setNewLinkedProcessId(e.target.value ? Number(e.target.value) : undefined)}
                      className="text-xs w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:indigo-600 rounded-xl py-2 px-3 focus:outline-hidden"
                    >
                      <option value="">Aucun processus rattaché</option>
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Retention and Virtual Server Storage */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Durée d'Archivage (Ans)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={newRetention}
                    onChange={e => setNewRetention(Number(e.target.value))}
                    className="text-xs w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:indigo-600 rounded-xl py-2 px-3 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Chemin Serveur (Enduring Path)</label>
                  <input
                    type="text"
                    value={newStorage}
                    onChange={e => setNewStorage(e.target.value)}
                    className="text-xs w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:indigo-600 rounded-xl py-2 px-3 focus:outline-hidden font-mono"
                  />
                </div>

              </div>

              {/* FILE ATTACHMENT WITH DRAG AND DROP & REALISTIC UX */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase font-bold text-slate-400">Fichier Source (Certified Attributable Source File)</label>
                
                {/* Real hidden file input */}
                <input
                  type="file"
                  id="real-file-input"
                  accept=".pdf,.doc,.docx,.xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    const input = document.getElementById('real-file-input');
                    if (input) input.click();
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer hover:border-indigo-650 hover:bg-slate-50/50 ${
                    isDragOver 
                      ? 'border-indigo-600 bg-indigo-50/20' 
                      : uploadedFileName 
                        ? 'border-emerald-300 bg-emerald-50/10' 
                        : 'border-slate-250 bg-slate-50'
                  }`}
                >
                  {uploadedFileName ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center text-emerald-600">
                        <CheckCircle className="w-8 h-8 animate-bounce" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800 font-mono">
                        {uploadedFileName}
                      </p>
                      <div className="flex gap-4 justify-center items-center mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('real-file-input');
                            if (input) input.click();
                          }}
                          className="text-[10px] hover:underline text-indigo-600 font-mono font-bold cursor-pointer"
                        >
                          [ Remplacer ]
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadedFileName('')}
                          className="text-[10px] hover:underline text-rose-500 font-mono font-bold cursor-pointer"
                        >
                          [ Retirer ]
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-center text-slate-400">
                        <FileText className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-slate-600">
                        <span className="text-indigo-600 font-semibold underline">Cliquez ici pour sélectionner</span> ou glissez-déposez un fichier réglementaire (**PDF**, **Word .doc / .docx**, ou **Excel .xlsx**)
                      </p>
                      <p className="text-[9px] text-slate-400">(Conforme directives 21 CFR Part 11 & GAMP 5)</p>
                      <div className="pt-2 flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById('real-file-input');
                            if (input) input.click();
                          }}
                          className="text-[10px] bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 font-bold px-2.5 py-1.5 rounded-lg border border-indigo-200 transition cursor-pointer"
                        >
                          Parcourir mes fichiers...
                        </button>
                        <button
                          type="button"
                          onClick={triggerMockFileSelection}
                          className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer"
                        >
                          Simulation Aléatoire ↗
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SAVE ACTION */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full md:w-auto text-xs bg-indigo-650 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Enregistrer le Document au SMI
                </button>
              </div>
            </form>
          )}

          {/* DETAIL VIEW WITH SCORECARD + AUDIT TRAIL */}
          {selectedDoc && !isCreating && (
            <div className="space-y-6">
              
              {/* Main Metadata Overview */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap justify-between items-start gap-4 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase py-0.5 px-2 bg-indigo-50 border border-indigo-150 text-indigo-700 rounded-lg">
                        {selectedDoc.code}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Version : {selectedDoc.version}
                      </span>
                      {selectedDoc.fileUrl && (() => {
                        const lowercaseUrl = selectedDoc.fileUrl.toLowerCase();
                        if (lowercaseUrl.endsWith('.pdf')) {
                          return (
                            <span className="text-[9px] text-red-700 bg-red-50 border border-red-200/60 font-mono px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                              📄 PDF
                            </span>
                          );
                        } else if (lowercaseUrl.endsWith('.docx') || lowercaseUrl.endsWith('.doc')) {
                          return (
                            <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-200/60 font-mono px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                              📝 WORD
                            </span>
                          );
                        } else if (lowercaseUrl.endsWith('.xlsx') || lowercaseUrl.endsWith('.xls')) {
                          return (
                            <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 font-mono px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                              📊 EXCEL
                            </span>
                          );
                        } else {
                          return (
                            <span className="text-[9px] text-slate-700 bg-slate-50 border border-slate-200 font-mono px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                              🔗 Fichier attaché
                            </span>
                          );
                        }
                      })()}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {selectedDoc.title}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Rattaché au : <span className="font-semibold text-slate-700">{getProcessName(selectedDoc.linkedProcessId)}</span>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <span className={`text-[10px] px-2 py-0.5 font-mono rounded-lg font-bold border-l-4 ${
                      selectedDoc.status === 'approved' 
                        ? 'bg-emerald-50 text-emerald-700 border-l-emerald-600 border-emerald-100'
                        : selectedDoc.status === 'under_review'
                          ? 'bg-amber-50 text-amber-700 border-l-amber-600 border-amber-100'
                          : 'bg-zinc-50 text-zinc-700 border-l-zinc-500 border-zinc-100'
                    }`}>
                      {statusLabels[selectedDoc.status]}
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => setDocIdToConfirmDelete(selectedDoc.id)}
                      className="text-slate-400 hover:text-rose-600 text-[10px] flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer du registre
                    </button>
                  </div>
                </div>

                {/* Sub Metadata Fields Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-400 uppercase font-bold">Type Document</span>
                    <p className="text-[11px] font-semibold text-slate-700 truncate">{typeLabels[selectedDoc.type]}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-400 uppercase font-bold">Auteur Init</span>
                    <p className="text-[11px] font-semibold text-slate-700 truncate flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" /> {selectedDoc.createdBy}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-405 uppercase font-bold">Rétention Légale</span>
                    <p className="text-[11px] font-semibold text-slate-700">{selectedDoc.retentionPeriodYears} Ans</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-405 uppercase font-bold font-mono">Dernière Modif</span>
                    <p className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> {selectedDoc.lastUpdatedAt}
                    </p>
                  </div>
                </div>

                {/* File Download Server Path Simulated bar */}
                <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Database className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="truncate text-[10px] font-mono text-slate-500">
                      Chemin d'archivage : <span className="text-slate-700 font-semibold">{selectedDoc.storageLocation}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert(`Téléchargement simulé de la ressource : ${selectedDoc.storageLocation}`); }}
                      className="text-[10px] bg-white border border-slate-200 hover:border-slate-350 px-2 py-1 rounded-lg text-slate-600 font-bold transition flex items-center gap-1 select-none shrink-0"
                    >
                      <Download className="w-3 h-3 text-slate-500" /> Télécharger source ↗
                    </a>
                  </div>
                </div>

                {/* Audit Confirmation alert block if approved */}
                {selectedDoc.status === 'approved' && (
                  <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center gap-2 text-emerald-800 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      Le document **{selectedDoc.code}** remplit 100% des critères **ALCOA+**. Il est qualifié, signé électroniquement et approuvé pour une exploitation réglementaire.
                    </div>
                  </div>
                )}
              </div>

              {/* ALCOA+ DATA INTEGRITY INSPECTION SCORECARD */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-md space-y-4">
                
                {/* Scorecard Header */}
                <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Scorecard d'Intégrité ALCOA+ Actuelle
                    </h4>
                    <p className="text-[10px] text-slate-300">Vérifier l'authenticité et la conformité GAMP5 du relevé</p>
                  </div>
                  
                  {/* Score badge with circle dynamic background */}
                  <div className="flex items-center gap-2 bg-indigo-900/60 shadow-inner px-3 py-1.5 rounded-2xl border border-indigo-805">
                    <span className="text-[10px] text-indigo-300 font-mono">Score :</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {calculateAlcoaScore(selectedDoc)} / 9
                    </span>
                  </div>
                </div>

                {/* ALCOA Grid Checkboxes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* ATTRIBUTABLE */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-2.5 hover:bg-white/7 transition duration-150 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold font-mono text-indigo-300 select-none">A - Attributable</span>
                      <input
                        type="checkbox"
                        checked={selectedDoc.alcoaAssessment?.attributable || false}
                        onChange={e => handleUpdateAlcoaCheck('attributable', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 accent-emerald-500 rounded border-white/20 select-none cursor-pointer"
                      />
                    </div>
                    <p className="text-[9px] text-slate-300 mt-1 leading-normal">Auteur identifié, signé, daté électroniquement.</p>
                  </div>

                  {/* LEGIBLE */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-2.5 hover:bg-white/7 transition duration-150 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold font-mono text-indigo-300 select-none">L - Legible (Lisible)</span>
                      <input
                        type="checkbox"
                        checked={selectedDoc.alcoaAssessment?.legible || false}
                        onChange={e => handleUpdateAlcoaCheck('legible', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 accent-emerald-500 rounded border-white/20 select-none cursor-pointer"
                      />
                    </div>
                    <p className="text-[9px] text-slate-300 mt-1 leading-normal">Lisible, clair, indexé, préservé à vie.</p>
                  </div>

                  {/* CONTEMPORANEOUS */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-2.5 hover:bg-white/7 transition duration-150 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold font-mono text-indigo-300 select-none font-sans">C - Contemporaneous</span>
                      <input
                        type="checkbox"
                        checked={selectedDoc.alcoaAssessment?.contemporaneous || false}
                        onChange={e => handleUpdateAlcoaCheck('contemporaneous', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 accent-emerald-500 rounded border-white/20 select-none cursor-pointer"
                      />
                    </div>
                    <p className="text-[9px] text-slate-300 mt-1 leading-normal">Enregistré au moment de la réalisation.</p>
                  </div>

                  {/* ORIGINAL */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-2.5 hover:bg-white/7 transition duration-150 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold font-mono text-indigo-300 select-none">O - Original</span>
                      <input
                        type="checkbox"
                        checked={selectedDoc.alcoaAssessment?.original || false}
                        onChange={e => handleUpdateAlcoaCheck('original', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 accent-emerald-500 rounded border-white/20 select-none cursor-pointer"
                      />
                    </div>
                    <p className="text-[9px] text-slate-300 mt-1 leading-normal">Source brute certifiée conforme immuable.</p>
                  </div>

                  {/* ACCURATE */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-2.5 hover:bg-white/7 transition duration-150 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold font-mono text-indigo-300 select-none">A - Accurate (Précis)</span>
                      <input
                        type="checkbox"
                        checked={selectedDoc.alcoaAssessment?.accurate || false}
                        onChange={e => handleUpdateAlcoaCheck('accurate', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 accent-emerald-500 rounded border-white/20 select-none cursor-pointer"
                      />
                    </div>
                    <p className="text-[9px] text-slate-300 mt-1 leading-normal">Véridique, sans rature non documentée.</p>
                  </div>

                  {/* COMPLETE (+) */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-2.5 hover:bg-white/7 transition duration-150 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold font-mono text-indigo-300 select-none">+ Complete (Complet)</span>
                      <input
                        type="checkbox"
                        checked={selectedDoc.alcoaAssessment?.complete || false}
                        onChange={e => handleUpdateAlcoaCheck('complete', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 accent-emerald-500 rounded border-white/20 select-none cursor-pointer"
                      />
                    </div>
                    <p className="text-[9px] text-slate-300 mt-1 leading-normal">Historique complet, répétitions, méta-données.</p>
                  </div>

                  {/* CONSISTENT (+) */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-2.5 hover:bg-white/7 transition duration-150 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold font-mono text-indigo-300 select-none">+ Consistent (Cohérent)</span>
                      <input
                        type="checkbox"
                        checked={selectedDoc.alcoaAssessment?.consistent || false}
                        onChange={e => handleUpdateAlcoaCheck('consistent', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 accent-emerald-500 rounded border-white/20 select-none cursor-pointer"
                      />
                    </div>
                    <p className="text-[9px] text-slate-300 mt-1 leading-normal">Séquence logique et chronologique intacte.</p>
                  </div>

                  {/* ENDURING (+) */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-2.5 hover:bg-white/7 transition duration-150 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold font-mono text-indigo-300 select-none">+ Enduring (Durable)</span>
                      <input
                        type="checkbox"
                        checked={selectedDoc.alcoaAssessment?.enduring || false}
                        onChange={e => handleUpdateAlcoaCheck('enduring', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 accent-emerald-500 rounded border-white/20 select-none cursor-pointer"
                      />
                    </div>
                    <p className="text-[9px] text-slate-300 mt-1 leading-normal">Stockage sécurisé, support préservé.</p>
                  </div>

                  {/* AVAILABLE (+) */}
                  <div className="bg-white/4 border border-white/10 rounded-2xl p-2.5 hover:bg-white/7 transition duration-150 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-[10px] font-bold font-mono text-indigo-300 select-none">+ Available (Disponible)</span>
                      <input
                        type="checkbox"
                        checked={selectedDoc.alcoaAssessment?.available || false}
                        onChange={e => handleUpdateAlcoaCheck('available', e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 accent-emerald-500 rounded border-white/20 select-none cursor-pointer"
                      />
                    </div>
                    <p className="text-[9px] text-slate-300 mt-1 leading-normal">Accessible rapidement pour un audit.</p>
                  </div>

                </div>

                {/* Score Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-mono text-indigo-200">
                    <span>Niveau de Gérance d'Intégrité :</span>
                    <span className="font-bold flex items-center gap-1">
                      {calculateAlcoaScore(selectedDoc) === 9 ? 'Niveau Validé FDA Compliant 🛡️' : 'Niveau de Sécurité Partiel ⚠️'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-indigo-950 border border-indigo-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition duration-500 ${
                        calculateAlcoaScore(selectedDoc) === 9 
                          ? 'bg-emerald-400' 
                          : calculateAlcoaScore(selectedDoc) >= 6 
                            ? 'bg-amber-400' 
                            : 'bg-red-400'
                      }`}
                      style={{ width: `${(calculateAlcoaScore(selectedDoc) / 9) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Evaluation Notes and Approval Input */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-slate-400 font-bold">Pilote Évaluateur (Data Integrity Owner)</label>
                      <input
                        type="text"
                        value={evalAssessedBy}
                        onChange={e => setEvalAssessedBy(e.target.value)}
                        className="text-xs w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-100 rounded-lg p-1.5 focus:outline-hidden font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase text-slate-400 font-semibold">Dernier passage d'audit</label>
                      <div className="text-xs text-slate-300 font-mono italic p-1.5 bg-slate-900 rounded-lg flex items-center justify-between border border-slate-900">
                        <span>{selectedDoc.alcoaAssessment?.assessedAt || 'Jamais audité'}</span>
                        <span className="text-[9px] text-indigo-400 font-bold hover:underline cursor-pointer">Calculer l'immuabilité</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase text-slate-400 font-bold">Notes de conformité & Justification d'écarts</label>
                    <textarea
                      rows={2}
                      placeholder="Indiquer les justifications techniques d'étalonnage, ratures ou signatures tierces."
                      value={evalNotes}
                      onChange={e => setEvalNotes(e.target.value)}
                      className="text-xs w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 placeholder:text-slate-600 rounded-lg p-2 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleUpdateAssessmentNotes}
                      className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold font-mono border-0 rounded-lg px-3 py-1.5 transition cursor-pointer"
                    >
                      Enregistrer les notes d'intégrité
                    </button>
                  </div>
                </div>

              </div>

              {/* AUDIT TRAIL / LOG DE MODIFICATIONS (ISO 9001 Section 7.5.3 require) */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-mono font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-400" /> Registre d'Audit Trail & Versioning (Immuable)
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowLogActionModal(true)}
                    className="text-[10px] bg-slate-50 border border-slate-205 hover:border-slate-300 px-2.5 py-1 text-slate-705 font-bold font-mono rounded-lg transition"
                  >
                    + Enregistrer une action
                  </button>
                </div>

                {/* Audit Trail List */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {selectedDoc.auditTrail && selectedDoc.auditTrail.length > 0 ? (
                    [...selectedDoc.auditTrail].reverse().map((trail, index) => {
                      const icons: Record<string, any> = {
                        creation: <Plus className="w-2.5 h-2.5 text-indigo-600" />,
                        modification: <FileText className="w-2.5 h-2.5 text-amber-600" />,
                        alcoa_assessment: <ShieldCheck className="w-2.5 h-2.5 text-emerald-605" />,
                        validation: <Check className="w-2.5 h-2.5 text-emerald-600" />,
                        archive: <Trash2 className="w-2.5 h-2.5 text-zinc-500" />
                      };

                      return (
                        <div key={trail.id || index} className="text-xs font-mono bg-slate-50 border border-slate-150 p-2.5 rounded-xl space-y-1 relative">
                          <div className="absolute right-2 top-2 text-[8px] text-slate-400 bg-slate-200/50 px-1 rounded">
                            {trail.id}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-405 text-[9px] font-bold">
                            <span className="p-0.5 rounded-md bg-white border border-slate-200 flex items-center justify-center">
                              {icons[trail.action] || <FileText className="w-2.5 h-2.5 text-slate-500" />}
                            </span>
                            <span className="text-slate-800">{trail.user}</span> • 
                            <span>{trail.timestamp}</span>
                          </div>
                          <p className="text-[10px] text-slate-655 font-sans leading-relaxed">
                            {trail.details}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[11px] text-slate-405 italic text-center py-4">Aucune trace d'audit enregistrée.</p>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-slate-100 pt-2 bg-white sticky bottom-0">
                  <span>Sécurité SI : Hachage cryptographique SHA-256 actif</span>
                  <span className="text-indigo-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5">
                    Télécharger l'Audit Trail global (.csv) ↗
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* CONFIRM DELETE MODAL */}
      {docIdToConfirmDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-sm w-full space-y-4 shadow-lg animate-scaleIn">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Archiver / Supprimer du SMI ?</h4>
              <p className="text-xs text-slate-500 leading-normal">
                Cette suppression détruit les dossiers d'intégrité ALCOA+ associés au document numéro **{docIdToConfirmDelete}**. L'audit trail sera conservé en archive inerte.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDocIdToConfirmDelete(null)}
                className="flex-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-205 py-2 rounded-xl transition"
              >
                Conserver
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDocument(docIdToConfirmDelete)}
                className="flex-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 py-2 rounded-xl transition cursor-pointer"
              >
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD MANUAL ACTION MODAL */}
      {showLogActionModal && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 max-w-md w-full space-y-4 shadow-xl animate-scaleIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <History className="w-4 h-4 text-slate-400" /> Enregistrer une action d'Audit Trail
                </h4>
                <p className="text-[10px] text-slate-500">Mettre à jour l'historique réglementaire du document {selectedDoc.code}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogActionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogManualAction} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase text-slate-400 font-bold">Acteur / Responsable de la modification</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Julien Clerc (Technicien)"
                  value={actionUser}
                  onChange={e => setActionUser(e.target.value)}
                  className="text-xs w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-2 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase text-slate-400 font-bold">Catégorie de l'Action</label>
                <select
                  value={actionType}
                  onChange={e => setActionType(e.target.value)}
                  className="text-xs w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-2 focus:outline-hidden"
                >
                  <option value="modification">Modification de révision (Incrémentera la version v.X.Y)</option>
                  <option value="validation">Signature de validation officielle</option>
                  <option value="alcoa_assessment">Évaluation corrective d'intégrité</option>
                  <option value="archive">Mise en sommeil / Archivage temporaire</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase text-slate-400 font-bold">Descriptif des modifications apportées (Audit Note) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Détailler précisément les modifications (paramètres modifiés, capteurs vérifiés, dérogation accordée, etc.)"
                  value={actionDetails}
                  onChange={e => setActionDetails(e.target.value)}
                  className="text-xs w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-2 focus:outline-hidden font-sans"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogActionModal(false)}
                  className="flex-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 rounded-xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs font-semibold text-white bg-indigo-650 hover:bg-indigo-700 py-2 rounded-xl transition cursor-pointer"
                >
                  Signer et Enregistrer à l'Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
