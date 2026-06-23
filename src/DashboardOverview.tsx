import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  ProcessNode, 
  Capa, 
  Risk, 
  OKR,
  QhseEvent,
  RegulatoryRequirement,
  Equipment,
  DocumentedInfo,
  Audit
} from '../types';
import { 
  ShieldAlert, 
  Activity, 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp,
  BrainCircuit,
  Map,
  Clock,
  Layers,
  ArrowRight,
  Scale,
  Wrench,
  FileText,
  ThumbsUp,
  UserCheck,
  Star,
  Users,
  Bell,
  Search,
  AlertCircle,
  Calendar,
  ClipboardCheck
} from 'lucide-react';

interface DashboardOverviewProps {
  nodes: ProcessNode[];
  capas: Capa[];
  risks: Risk[];
  okrs: OKR[];
  qhseEvents: QhseEvent[];
  regulatoryRequirements: RegulatoryRequirement[];
  equipments: Equipment[];
  documents: DocumentedInfo[];
  audits: Audit[];
  onNavigate: (tab: 'dashboard' | 'map' | 'capas' | 'risks' | 'okrs' | 'events' | 'requirements' | 'equipments' | 'documents' | 'audits') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  nodes,
  capas,
  risks,
  okrs,
  qhseEvents,
  regulatoryRequirements,
  equipments,
  documents,
  audits = [],
  onNavigate
}) => {
  // Notifications states
  const [notifCategory, setNotifCategory] = useState<'all' | 'alerts' | 'time'>('all');
  const [notifSearch, setNotifSearch] = useState('');
  const [isNotifTrayOpen, setIsNotifTrayOpen] = useState(true);

  const notificationsList = useMemo(() => {
    const TODAY_STR = "2026-06-22";
    const todayDate = new Date(TODAY_STR);

    const getDaysDifference = (dateStr: string) => {
      if (!dateStr) return 0;
      const d = new Date(dateStr);
      const diffTime = d.getTime() - todayDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    // 1. Overdue CAPAs
    const overdueCapasNotifications = capas
      .filter(c => c.status !== 'completed' && c.status !== 'verified' && c.status !== 'cancelled')
      .filter(c => getDaysDifference(c.targetDate) < 0)
      .map(c => {
        const diff = Math.abs(getDaysDifference(c.targetDate));
        return {
          id: `capa-overdue-${c.id}`,
          type: 'capa_overdue',
          severity: 'critical' as const,
          title: `Action CAPA en retard de ${diff} jour${diff > 1 ? 's' : ''}`,
          message: `L'action CAPA [${c.id}] "${c.title}" est en retard de ${diff} jours (échéance : ${c.targetDate}, Pilote : ${c.owner}).`,
          date: c.targetDate,
          category: 'time' as const,
          tab: 'capas' as const,
          label: 'CAPA en retard'
        };
      });

    // 2. Overdue Sub-actions
    const overdueSubActionsNotifications = capas
      .filter(c => c.status !== 'completed' && c.status !== 'verified' && c.status !== 'cancelled')
      .flatMap(c => {
        return (c.actions || [])
          .filter(a => a.status === 'pending')
          .filter(a => getDaysDifference(a.targetDate) < 0)
          .map(a => {
            const diff = Math.abs(getDaysDifference(a.targetDate));
            return {
              id: `capa-subaction-overdue-${c.id}-${a.id}`,
              type: 'subaction_overdue',
              severity: 'high' as const,
              title: `Sous-action CAPA en retard`,
              message: `La sous-action "${a.title}" assignée à ${a.owner} dans le plan [${c.id}] est en retard de ${diff} jours (échéance : ${a.targetDate}).`,
              date: a.targetDate,
              category: 'time' as const,
              tab: 'capas' as const,
              label: 'Sous-action en retard'
            };
          });
      });

    // 3. Urgent / Imminent CAPAs (due within 15 days)
    const urgentCapasNotifications = capas
      .filter(c => c.status !== 'completed' && c.status !== 'verified' && c.status !== 'cancelled')
      .filter(c => {
        const diff = getDaysDifference(c.targetDate);
        return diff >= 0 && diff <= 15;
      })
      .map(c => {
        const diff = getDaysDifference(c.targetDate);
        return {
          id: `capa-urgent-${c.id}`,
          type: 'capa_urgent',
          severity: diff <= 5 ? 'high' as const : 'medium' as const,
          title: diff === 0 ? `Échéance CAPA AUJOURD'HUI` : `Échéance CAPA dans ${diff} jour${diff > 1 ? 's' : ''}`,
          message: `L'action [${c.id}] "${c.title}" arrive à échéance le ${c.targetDate} (${diff === 0 ? "aujourd'hui" : `dans ${diff} jours`}, Pilote : ${c.owner}).`,
          date: c.targetDate,
          category: 'time' as const,
          tab: 'capas' as const,
          label: 'CAPA urgente'
        };
      });

    // 4. Urgent Subparts (due within 7 days)
    const urgentSubActionsNotifications = capas
      .filter(c => c.status !== 'completed' && c.status !== 'verified' && c.status !== 'cancelled')
      .flatMap(c => {
        return (c.actions || [])
          .filter(a => a.status === 'pending')
          .filter(a => {
            const diff = getDaysDifference(a.targetDate);
            return diff >= 0 && diff <= 7;
          })
          .map(a => {
            const diff = getDaysDifference(a.targetDate);
            return {
              id: `capa-subaction-urgent-${c.id}-${a.id}`,
              type: 'subaction_urgent',
              severity: 'medium' as const,
              title: diff === 0 ? `Sous-action due AUJOURD'HUI` : `Sous-action due dans ${diff} j.`,
              message: `Dans le plan [${c.id}], la sous-action "${a.title}" assignée à ${a.owner} est à finaliser pour le ${a.targetDate}.`,
              date: a.targetDate,
              category: 'time' as const,
              tab: 'capas' as const,
              label: 'Sous-action urgente'
            };
          });
      });

    // 5. Critical General / QHSE Event Alerts
    const criticalEventsNotifications = (qhseEvents || [])
      .filter(e => e.status !== 'closed' && (e.severity === 'critical' || e.severity === 'high'))
      .map(e => ({
        id: `event-${e.id}`,
        type: 'event_critical',
        severity: e.severity === 'critical' ? 'critical' as const : 'high' as const,
        title: `Incident / Non-conformité ${e.severity === 'critical' ? 'Critique' : 'Majeure'}`,
        message: `L'événement [${e.id}] "${e.title}" (Date : ${e.date}) est toujours actif à l'état "${e.status}". Signalé par : ${e.reportedBy}.`,
        date: e.date,
        category: 'alert' as const,
        tab: 'events' as const,
        label: 'Événement QHSE'
      }));

    // 6. Regulatory Non-compliances
    const regulatoryNonCompliantNotifications = (regulatoryRequirements || [])
      .filter(r => r.conforms === 'non_compliant')
      .map(r => ({
        id: `req-${r.id}`,
        type: 'regulatory_nc',
        severity: 'high' as const,
        title: "Non-conformité réglementaire détectée",
        message: `L'exigence [${r.id}] "${r.title}" (Type : ${r.category}) est évaluée Non Conforme par le pilote ${r.responsible}. Notes de revue : ${r.evaluationNotes || 'Aucune note'}.`,
        date: r.lastAuditDate || '',
        category: 'alert' as const,
        tab: 'requirements' as const,
        label: 'Veille réglementaire'
      }));

    // 7. Critical Equipments Out-of-service
    const equipmentOutOfServiceNotifications = (equipments || [])
      .filter(e => e.status === 'out_of_service' && e.criticality === 'high')
      .map(e => ({
        id: `equip-${e.id}`,
        type: 'equipment_os',
        severity: 'high' as const,
        title: "Équipement critique hors service",
        message: `L'équipement de production/mesure haute criticité "${e.name}" [${e.id}] est actuellement hors service (Localisation : ${e.location}). Pilote : ${e.responsible}.`,
        date: e.nextMaintenanceDate || '',
        category: 'alert' as const,
        tab: 'equipments' as const,
        label: 'Équipement critique HS'
      }));

    // 8. Severe Unmitigated Risks
    const unmitigatedHighRisksNotifications = (risks || [])
      .filter(r => r.status === 'identified' && (r.probabilityBefore * r.impactBefore) >= 12)
      .map(r => ({
        id: `risk-unmitigated-${r.id}`,
        type: 'risk_unmitigated',
        severity: (r.probabilityBefore * r.impactBefore) >= 16 ? 'critical' as const : 'high' as const,
        title: `Risque critique non mitigé (Criticité ${r.probabilityBefore * r.impactBefore})`,
        message: `Le risque opérationnel/SST [${r.id}] "${r.title}" présente une criticité élevée de ${r.probabilityBefore * r.impactBefore} mais n'a pas encore de plan de mitigation validé (Pilote : ${r.owner}).`,
        date: '',
        category: 'alert' as const,
        tab: 'risks' as const,
        label: 'Risque orphelin'
      }));

    // 9. Ongoing Audits
    const ongoingAuditsNotifications = (audits || [])
      .filter(a => a.status === 'in_progress')
      .map(a => ({
        id: `audit-inprogress-${a.id}`,
        type: 'audit_inprogress',
        severity: 'medium' as const,
        title: "Audit ISO 19011 en cours",
        message: `L'audit [${a.id}] "${a.title}" est en cours de réalisation (Auditeur : ${a.auditor}, Audité : ${a.auditee}).`,
        date: a.scheduledDate || '',
        category: 'alert' as const,
        tab: 'audits' as const,
        label: 'Audit actif'
      }));

    // 10. Overdue Audits
    const overdueAuditsNotifications = (audits || [])
      .filter(a => a.status === 'scheduled')
      .filter(a => getDaysDifference(a.scheduledDate) < 0)
      .map(a => {
        const diff = Math.abs(getDaysDifference(a.scheduledDate));
        return {
          id: `audit-overdue-${a.id}`,
          type: 'audit_overdue',
          severity: 'high' as const,
          title: `Audit en retard de ${diff} jour${diff > 1 ? 's' : ''}`,
          message: `L'audit [${a.id}] "${a.title}" (échéance : ${a.scheduledDate}) n'a pas encore démarré (Auditeur : ${a.auditor}).`,
          date: a.scheduledDate,
          category: 'time' as const,
          tab: 'audits' as const,
          label: 'Audit en retard font-mono'
        };
      });

    // Combine all
    const all = [
      ...overdueCapasNotifications,
      ...overdueSubActionsNotifications,
      ...urgentCapasNotifications,
      ...urgentSubActionsNotifications,
      ...criticalEventsNotifications,
      ...regulatoryNonCompliantNotifications,
      ...equipmentOutOfServiceNotifications,
      ...unmitigatedHighRisksNotifications,
      ...ongoingAuditsNotifications,
      ...overdueAuditsNotifications
    ];

    // Priority sorting
    const severityRank = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    return all.sort((a, b) => {
      if (severityRank[b.severity] !== severityRank[a.severity]) {
        return severityRank[b.severity] - severityRank[a.severity];
      }
      return b.date.localeCompare(a.date);
    });
  }, [capas, qhseEvents, regulatoryRequirements, equipments, risks, audits]);

  const filteredNotificationsList = useMemo(() => {
    return notificationsList.filter(n => {
      // Category filter
      if (notifCategory === 'alerts' && n.category !== 'alert') return false;
      if (notifCategory === 'time' && n.category !== 'time') return false;

      // Search term filter
      if (notifSearch.trim() !== '') {
        const query = notifSearch.toLowerCase();
        return (
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          n.label.toLowerCase().includes(query) ||
          n.id.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [notificationsList, notifCategory, notifSearch]);

  // Stats calculations
  const totalProcesses = nodes.length;
  const managementCount = nodes.filter(n => n.type === 'management').length;
  const coreCount = nodes.filter(n => n.type === 'core').length;
  const supportCount = nodes.filter(n => n.type === 'support').length;

  const totalCapas = capas.length;
  const activeCapas = capas.filter(c => c.status === 'ongoing' || c.status === 'draft').length;
  const completedCapas = capas.filter(c => c.status === 'completed' || c.status === 'verified').length;
  const overdueCapas = capas.filter(c => {
    if (c.status === 'completed' || c.status === 'verified') return false;
    const today = new Date();
    const target = new Date(c.targetDate);
    return target < today;
  }).length;
  const capaCompletionRate = totalCapas > 0 ? Math.round((completedCapas / totalCapas) * 100) : 0;

  const totalRisks = risks.length;
  const highRisksCount = risks.filter(r => (r.probabilityBefore * r.impactBefore) >= 12).length;
  const monitoredRisksCount = risks.filter(r => r.status === 'monitored').length;
  const treatedRisksCount = risks.filter(r => r.status === 'treated' || r.status === 'closed').length;

  // OKR calculations: sum progress on all KR
  let totalKrProgress = 0;
  let totalKrs = 0;
  okrs.forEach(o => {
    o.keyResults.forEach(kr => {
      // Calculate progress percentage
      const range = kr.targetValue - kr.startValue;
      let progressPct = 0;
      if (range !== 0) {
        // Handle descending target e.g. target 0 accidents starting from 3
        if (kr.targetValue < kr.startValue) {
          progressPct = ((kr.startValue - kr.currentValue) / (kr.startValue - kr.targetValue)) * 100;
        } else {
          progressPct = ((kr.currentValue - kr.startValue) / range) * 100;
        }
      } else {
        progressPct = 100;
      }
      progressPct = Math.max(0, Math.min(100, progressPct));
      totalKrProgress += progressPct;
      totalKrs++;
    });
  });
  const avgOkrProgress = totalKrs > 0 ? Math.round(totalKrProgress / totalKrs) : 0;

  // Helper: compute individual OKR progress
  const getSingleOkrProgress = (okr: OKR) => {
    if (!okr.keyResults || okr.keyResults.length === 0) return 0;
    let totalP = 0;
    okr.keyResults.forEach(kr => {
      const range = kr.targetValue - kr.startValue;
      let progressPct = 0;
      if (range !== 0) {
        if (kr.targetValue < kr.startValue) {
          progressPct = ((kr.startValue - kr.currentValue) / (kr.startValue - kr.targetValue)) * 100;
        } else {
          progressPct = ((kr.currentValue - kr.startValue) / range) * 100;
        }
      } else {
        progressPct = 100;
      }
      progressPct = Math.max(0, Math.min(100, progressPct));
      totalP += progressPct;
    });
    return Math.round(totalP / okr.keyResults.length);
  };

  // --- Extended QHSE Modules & Customer Satisfaction Computations ---
  const clientsList = nodes.filter(n => n.type === 'client');
  const totalClients = clientsList.length;
  const clientsWithStars = clientsList.filter(n => n.clientSatisfaction !== undefined);
  const avgClientStars = clientsWithStars.length > 0 
    ? Number((clientsWithStars.reduce((sum, n) => sum + (n.clientSatisfaction || 0), 0) / clientsWithStars.length).toFixed(1)) 
    : 0;

  const clientsWithPct = clientsList.filter(n => n.clientSatisfactionPercentage !== undefined);
  const avgClientSatisfactionPct = clientsWithPct.length > 0
    ? Math.round(clientsWithPct.reduce((sum, n) => sum + (n.clientSatisfactionPercentage || 0), 0) / clientsWithPct.length)
    : null;

  const suppliersList = nodes.filter(n => n.type === 'party' && n.isSupplier);
  const totalSuppliers = suppliersList.length;
  const suppliersWithStars = suppliersList.filter(n => n.supplierRating !== undefined);
  const avgSupplierRating = suppliersWithStars.length > 0
    ? Number((suppliersWithStars.reduce((sum, n) => sum + (n.supplierRating || 0), 0) / suppliersWithStars.length).toFixed(1))
    : 0;

  const partiesInteressees = nodes.filter(n => n.type === 'party');
  const totalParties = partiesInteressees.length;

  // Events / Incidents Metrics
  const totalEvents = qhseEvents.length;
  const openEvents = qhseEvents.filter(e => e.status !== 'closed').length;
  const criticalEventsCount = qhseEvents.filter(e => e.severity === 'critical' || e.severity === 'high').length;

  // Regulatory Requirements Metrics
  const totalRequirements = regulatoryRequirements.length;
  const compliantRequirements = regulatoryRequirements.filter(r => r.conforms === 'compliant').length;
  const complianceRate = totalRequirements > 0 ? Math.round((compliantRequirements / totalRequirements) * 100) : 100;
  const nonCompliantReqs = regulatoryRequirements.filter(r => r.conforms === 'non_compliant').length;

  // Equipments Metrics
  const totalEquipments = equipments.length;
  const operationalEquipments = equipments.filter(e => e.status === 'operational' || e.status === 'calibrated').length;
  const equipmentOperationalRate = totalEquipments > 0 ? Math.round((operationalEquipments / totalEquipments) * 100) : 100;
  const criticalEquipmentsOutOfService = equipments.filter(e => e.criticality === 'high' && e.status === 'out_of_service').length;

  // Documents Metrics
  const totalDocuments = documents.length;
  const approvedDocuments = documents.filter(d => d.status === 'approved').length;
  const documentApprovalRate = totalDocuments > 0 ? Math.round((approvedDocuments / totalDocuments) * 100) : 100;
  const alcoaReviewedCount = documents.filter(d => d.alcoaAssessment !== undefined).length;

  // Audits & Inspections ISO 19011 Metrics
  const totalAuditsCount = audits.length;
  const completedAuditsCount = audits.filter(a => a.status === 'completed').length;
  const activeAuditsCount = audits.filter(a => a.status === 'in_progress').length;
  const scheduledAuditsCount = audits.filter(a => a.status === 'scheduled').length;
  const totalAuditFindingsCount = audits.reduce((acc, a) => acc + (a.findings ? a.findings.length : 0), 0);
  const auditClosureRate = totalAuditsCount > 0 ? Math.round((completedAuditsCount / totalAuditsCount) * 100) : 100;

  // Generate last 6 months trend data
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'];
  const curveFactors = [0.15, 0.32, 0.50, 0.68, 0.85, 1.0];
  const chartData = months.map((month, index) => {
    const curveFactor = curveFactors[index];
    const dataPoint: Record<string, any> = {
      name: month,
      'Moyenne Générale': Math.round(avgOkrProgress * curveFactor)
    };
    
    okrs.forEach((okr, oIdx) => {
      const currentProgress = getSingleOkrProgress(okr);
      let individualCurve;
      if (oIdx === 0) {
        individualCurve = [0.20, 0.40, 0.55, 0.70, 0.88, 1.0];
      } else if (oIdx === 1) {
        individualCurve = [0.08, 0.22, 0.42, 0.62, 0.80, 1.0];
      } else {
        individualCurve = [0.10, 0.30, 0.48, 0.65, 0.82, 1.0];
      }
      
      const okrKey = `OKR-${oIdx + 1} (${okr.id})`;
      dataPoint[okrKey] = Math.round(currentProgress * individualCurve[index]);
    });
    
    return dataPoint;
  });

  // Get high-risk summary
  const topRisks = [...risks]
    .sort((a,b) => (b.probabilityBefore * b.impactBefore) - (a.probabilityBefore * a.impactBefore))
    .slice(0, 3);

  // Get urgent CAPAs
  const urgentCapas = [...capas]
    .filter(c => c.status !== 'completed' && c.status !== 'verified')
    .sort((a,b) => {
      const pMap = { critical: 4, high: 3, medium: 2, low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    })
    .slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-6 py-6 h-full overflow-y-auto" id="dashboard-tab">
      
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-slate-800 shadow-xs relative overflow-hidden" id="dash-banner">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-96 h-96 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-50 text-emerald-700 font-mono text-xs px-2.5 py-1 rounded-full border border-emerald-150 shadow-2xs">
                ⭐ Cockpit Centralisé IMS
              </span>
              <span className="text-slate-450 font-mono text-xs">v1.2.0</span>
            </div>
            <h1 className="text-3xl font-space font-bold tracking-tight text-slate-900 mb-2">
              Système de Management Intégré QHSE
            </h1>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              Visualisez la cartographie de vos processus, suivez vos actions d'amélioration continue (CAPA), gérez et atténuez vos risques industriels, et alignez vos indicateurs de performance (OKRs) en temps réel.
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              id="goto-map-btn"
              onClick={() => onNavigate('map')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl transition duration-150 flex items-center gap-2 cursor-pointer shadow-xs text-sm"
            >
              <Map className="w-4 h-4" /> Cartographie des Processus <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        
        {/* KPI 1: Mapping */}
        <div 
          id="stat-mapping"
          onClick={() => onNavigate('map')}
          className="bg-white hover:bg-slate-50/50 border border-slate-200/80 rounded-xl p-5 cursor-pointer shadow-2xs transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-mono tracking-wider uppercase">Processus du SMI</span>
            <div className="p-2 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg group-hover:bg-violet-100 transition">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-space font-bold text-slate-900">{totalProcesses}</span>
            <span className="text-xs text-slate-450">Total cartographiés</span>
          </div>
          <div className="mt-3 flex gap-1.5 text-[10px] font-semibold text-slate-500">
            <span className="px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded">{managementCount} Direct.</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded">{coreCount} Opérat.</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded">{supportCount} Support</span>
          </div>
        </div>

        {/* KPI 2: CAPAs */}
        <div 
          id="stat-capas"
          onClick={() => onNavigate('capas')}
          className="bg-white hover:bg-slate-50/50 border border-slate-200/80 rounded-xl p-5 cursor-pointer shadow-2xs transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-mono tracking-wider uppercase">Plan d'Actions (CAPA)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg group-hover:bg-emerald-100 transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-space font-bold text-slate-900">{capaCompletionRate}%</span>
            <span className="text-xs text-emerald-650 font-mono font-bold">Index de Clôture</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>{activeCapas} actifs, {completedCapas} clôturés</span>
            {overdueCapas > 0 && (
              <span className="px-2 py-0.5 bg-red-50 text-red-650 border border-red-100 rounded font-medium">
                {overdueCapas} en retard
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Risks */}
        <div 
          id="stat-risks"
          onClick={() => onNavigate('risks')}
          className="bg-white hover:bg-slate-50/50 border border-slate-200/80 rounded-xl p-5 cursor-pointer shadow-2xs transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-mono tracking-wider uppercase">Gestion des Risques</span>
            <div className="p-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg group-hover:bg-amber-100 transition">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-space font-bold text-slate-900">{totalRisks}</span>
            <span className="text-xs text-slate-450">Risques identifiés</span>
          </div>
          <div className="mt-3 flex gap-2 text-[10px] font-semibold text-slate-500">
            {highRisksCount > 0 && (
              <span className="px-2 py-0.5 bg-red-50 text-red-650 border border-red-100 rounded-full font-bold">
                {highRisksCount} Critiques / Élevés
              </span>
            )}
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full">
              {monitoredRisksCount} surveillés
            </span>
          </div>
        </div>

        {/* KPI 4: OKRs */}
        <div 
          id="stat-okrs"
          onClick={() => onNavigate('okrs')}
          className="bg-white hover:bg-slate-50/50 border border-slate-200/80 rounded-xl p-5 cursor-pointer shadow-2xs transition group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-mono tracking-wider uppercase">Avancement OKRs</span>
            <div className="p-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg group-hover:bg-blue-100 transition">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-space font-bold text-slate-900">{avgOkrProgress}%</span>
            <span className="text-xs text-slate-450">Moyenne Key Results</span>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden shadow-2xs">
              <div 
                className="bg-slate-900 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${avgOkrProgress}%` }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Grid container to make Alert Center and OKR Trend adjacent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-alerts-okr-grid">
        {/* Centre d'Alertes et Notifications du SMI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between" id="dashboard-notifications">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
          <div className="flex items-start gap-2.5">
            <span className="p-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl relative flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-5 h-5" />
              {notificationsList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </span>
            <div>
              <h2 className="text-lg font-space font-semibold text-slate-900 flex items-center gap-2">
                Centre d'Alertes du SMI & Retards CAPA
                <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-slate-200">
                  {notificationsList.length}
                </span>
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                Surveillance automatique de la conformité réglementaire, dérives de calendrier CAPA, équipements critiques et risques non mitigés.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsNotifTrayOpen(!isNotifTrayOpen)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl transition cursor-pointer shrink-0 self-start md:self-center"
          >
            {isNotifTrayOpen ? "Masquer le panneau" : "Afficher le panneau"}
          </button>
        </div>

        {isNotifTrayOpen && (
          <div className="space-y-4">
            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setNotifCategory('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    notifCategory === 'all' 
                      ? 'bg-slate-950 text-white shadow-xs' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Toutes les alertes ({notificationsList.length})
                </button>
                <button
                  onClick={() => setNotifCategory('time')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    notifCategory === 'time' 
                      ? 'bg-slate-950 text-white shadow-xs' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Dérives & Échéances ({notificationsList.filter(n => n.category === 'time').length})
                </button>
                <button
                  onClick={() => setNotifCategory('alerts')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    notifCategory === 'alerts' 
                      ? 'bg-slate-950 text-white shadow-xs' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Risques & Conformité ({notificationsList.filter(n => n.category === 'alert').length})
                </button>
              </div>

              {/* Search Input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={notifSearch}
                  onChange={(e) => setNotifSearch(e.target.value)}
                  placeholder="Rechercher par mot-clé, code ou pilote..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition font-sans"
                />
                {notifSearch && (
                  <button
                    onClick={() => setNotifSearch('')}
                    className="absolute right-2.5 top-1.5 text-[10px] text-slate-400 hover:text-slate-600 font-mono"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Warnings Counters Bar */}
            {filteredNotificationsList.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-500 bg-white px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-bold text-rose-600">{notificationsList.filter(n => n.severity === 'critical').length}</span> Critiques
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="font-bold text-amber-600">{notificationsList.filter(n => n.severity === 'high').length}</span> Élevées
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-bold text-blue-600">{notificationsList.filter(n => n.severity === 'medium').length}</span> Modérées
                </span>
                {notifSearch && (
                  <span className="text-slate-400 italic">
                    (Filtré : {filteredNotificationsList.length} résultats affichés)
                  </span>
                )}
              </div>
            )}

            {/* Notifications List Container */}
            <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {filteredNotificationsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full mb-3 shadow-2xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="font-space font-semibold text-slate-950 text-sm">SMI sous parfait contrôle</p>
                  <p className="text-slate-500 text-xs max-w-sm mt-1 leading-relaxed">
                    {notifSearch 
                      ? "Aucune alerte ne correspond à vos critères de recherche. Essayez d'autres mots-clés."
                      : "Aucune dérive ou anomalie n'a été détectée dans le système. Toutes les CAPAs, exigences réglementaires, équipements et risques sont sous contrôle !"}
                  </p>
                </div>
              ) : (
                filteredNotificationsList.map((notif) => {
                  let severityBorder = "border-l-4 border-l-rose-500 border-slate-200";
                  let severityBadge = "bg-rose-50 text-rose-700 border-rose-100";
                  if (notif.severity === 'high') {
                    severityBorder = "border-l-4 border-l-amber-500 border-slate-200";
                    severityBadge = "bg-amber-50 text-amber-700 border-amber-100";
                  } else if (notif.severity === 'medium') {
                    severityBorder = "border-l-4 border-l-blue-500 border-slate-200";
                    severityBadge = "bg-blue-50 text-blue-700 border-blue-100";
                  }

                  let NotifIcon = AlertCircle;
                  if (notif.type.includes('capa') || notif.type.includes('subaction')) {
                    NotifIcon = Clock;
                  } else if (notif.type === 'regulatory_nc') {
                    NotifIcon = Scale;
                  } else if (notif.type === 'equipment_os') {
                    NotifIcon = Wrench;
                  } else if (notif.type === 'event_critical') {
                    NotifIcon = ShieldAlert;
                  } else if (notif.type === 'risk_unmitigated') {
                    NotifIcon = AlertTriangle;
                  } else if (notif.type.includes('audit')) {
                    NotifIcon = ClipboardCheck;
                  }

                  return (
                    <div
                      key={notif.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 bg-white border ${severityBorder} rounded-xl hover:bg-slate-50/70 transition-all duration-150 shadow-2xs group`}
                    >
                      <div className="flex items-start gap-3 max-w-3xl">
                        <span className={`p-2 rounded-lg shrink-0 mt-0.5 border ${
                          notif.severity === 'critical' 
                            ? 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-100' 
                            : notif.severity === 'high'
                              ? 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-100'
                              : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100'
                        } transition`}>
                          <NotifIcon className="w-4 h-4" />
                        </span>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-space font-semibold text-slate-900 text-[13px] leading-tight">
                              {notif.title}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${severityBadge}`}>
                              {notif.label}
                            </span>
                            {notif.date && (
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                                <Calendar className="w-3 h-3" /> {notif.date}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-normal leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate(notif.tab)}
                        className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-slate-900 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all duration-150 cursor-pointer self-start sm:self-center font-mono"
                      >
                        Consulter <ArrowRight className="w-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
        </div>

        {/* OKR Historical Trend Analysis */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs h-full flex flex-col justify-between" id="dashboard-okr-trend">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-space font-semibold text-slate-900">
                Analyse des Tendances OKR (SMI)
              </h3>
            </div>
            <p className="text-slate-500 text-xs pl-8">
              Suivi de la progression cumulée et individuelle des objectifs stratégiques sur les 6 derniers mois.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-900" />
              <span className="text-slate-600">Moyenne Générale ({avgOkrProgress}%)</span>
            </div>
          </div>
        </div>

        {/* Recharts Line Chart */}
        <div className="h-[280px] w-full" id="recharts-trend-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
              />
              <YAxis 
                domain={[0, 100]} 
                tickFormatter={(val) => `${val}%`}
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
                  fontSize: '12px',
                  fontFamily: 'sans-serif'
                }}
                formatter={(value: any) => [`${value}%`]}
                labelStyle={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '16px' }}
              />
              
              <Line 
                type="monotone" 
                dataKey="Moyenne Générale" 
                stroke="#0f172a" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 0, fill: '#0f172a' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />

              {okrs.map((okr, oIdx) => {
                const colors = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899'];
                const color = colors[oIdx % colors.length];
                const okrKey = `OKR-${oIdx + 1} (${okr.id})`;
                return (
                  <Line 
                    key={okr.id}
                    type="monotone" 
                    dataKey={okrKey} 
                    stroke={color} 
                    strokeWidth={1.5}
                    strokeDasharray={oIdx > 1 ? "4 4" : undefined}
                    dot={{ r: 3, strokeWidth: 0, fill: color }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
        </div>

      </div>

      {/* Dynamic Grid: CAPAs and Risks side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="bento-split">
        
        {/* Risks Heatmap Preview */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between shadow-xs" id="bento-risks">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-md font-space font-semibold text-slate-900">Analyse des risques critiques</h3>
              </div>
              <button 
                id="view-all-risks"
                onClick={() => onNavigate('risks')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
              >
                Matrice 5x5 complète <ArrowRight className="w-3" />
              </button>
            </div>

            <div className="space-y-3">
              {topRisks.length === 0 ? (
                <p className="text-sm text-slate-450 my-6 text-center">Aucun risque disponible</p>
              ) : (
                topRisks.map(risk => {
                  const score = risk.probabilityBefore * risk.impactBefore;
                  const scoreStyle = score >= 15 
                    ? 'text-red-700 bg-red-50 border-red-150' 
                    : score >= 8 
                      ? 'text-amber-700 bg-amber-50 border-amber-150' 
                      : 'text-emerald-700 bg-emerald-50 border-emerald-150';
                  const linkedProc = nodes.find(n => n.id === risk.linkedProcessId);
                  
                  return (
                    <div 
                      key={risk.id}
                      onClick={() => onNavigate('risks')}
                      className="p-3 bg-slate-50/70 hover:bg-slate-100 border border-slate-100 rounded-lg transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 border font-mono text-[10px] font-bold rounded ${scoreStyle}`}>
                            Criticité {score}
                          </span>
                          <span className="text-slate-400 font-mono text-xs">{risk.id}</span>
                          {(() => {
                            const statusBadges = {
                              identified: 'bg-red-50 text-red-700 border-red-150',
                              treated: 'bg-indigo-50 text-indigo-700 border-indigo-150',
                              monitored: 'bg-emerald-50 text-emerald-805 border-emerald-150/80',
                              closed: 'bg-slate-100 text-slate-400 border-slate-200'
                            };
                            const statusLabels = {
                              identified: 'Identifié',
                              treated: 'Mitigé',
                              monitored: 'Surveillé',
                              closed: 'Fermé'
                            };
                            return (
                              <span className={`text-[9px] px-1.5 py-0.5 select-none border rounded font-semibold shrink-0 ${statusBadges[risk.status]}`}>
                                {statusLabels[risk.status]}
                              </span>
                            );
                          })()}
                        </div>
                        <h4 className="text-slate-800 text-sm font-semibold truncate">{risk.title}</h4>
                        {linkedProc && (
                          <p className="text-slate-500 text-xs mt-1">
                            Processus: <span className="text-slate-800 font-medium">{linkedProc.name}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs">
                          {risk.owner}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Cliquez sur un risque pour l'évaluer ou lui affecter un plan de mitigation.
          </div>
        </div>

        {/* Priority CAPAs Preview */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between shadow-xs" id="bento-capas">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-violet-500" />
                <h3 className="text-md font-space font-semibold text-slate-900">Actions CAPA prioritaires</h3>
              </div>
              <button 
                id="view-all-capas"
                onClick={() => onNavigate('capas')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
              >
                Gérer tous les plans <ArrowRight className="w-3" />
              </button>
            </div>

            <div className="space-y-3">
              {urgentCapas.length === 0 ? (
                <p className="text-sm text-slate-455 my-6 text-center">Aucune action CAPA en cours d'amélioration</p>
              ) : (
                urgentCapas.map(capa => {
                  const pColors = {
                    critical: 'text-red-700 bg-red-55 border-red-100',
                    high: 'text-amber-700 bg-amber-55 border-amber-100',
                    medium: 'text-blue-700 bg-blue-55 border-blue-100',
                    low: 'text-slate-650 bg-slate-100 border-slate-200 font-bold'
                  };

                  const doneActions = capa.actions.filter(a => a.status === 'done').length;
                  const totalActions = capa.actions.length;
                  const progress = totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0;
                  
                  return (
                    <div 
                      key={capa.id}
                      onClick={() => onNavigate('capas')}
                      className="p-3 bg-slate-50/70 hover:bg-slate-100 border border-slate-100 rounded-lg transition-all flex items-center justify-between gap-3 cursor-pointer shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`px-2 py-0.5 border font-mono text-[9px] uppercase rounded tracking-wider ${pColors[capa.priority]}`}>
                            {capa.priority}
                          </span>
                          <span className="text-slate-500 font-mono text-xs">{capa.id}</span>
                          {(() => {
                            const statusColors = {
                              draft: 'bg-slate-100 text-slate-700 border-slate-205',
                              ongoing: 'bg-blue-50 text-blue-700 border-blue-200',
                              completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                              verified: 'bg-emerald-50 text-emerald-805 border-emerald-200/80',
                              cancelled: 'bg-slate-100 text-slate-400 border-slate-200',
                            };
                            const statusLabels = {
                              draft: 'Brouillon',
                              ongoing: 'En cours',
                              completed: 'Réalisé',
                              verified: 'Vérifié',
                              cancelled: 'Annulé',
                            };
                            return (
                              <span className={`text-[9.5px] px-1.5 py-0.5 select-none border rounded font-semibold shrink-0 ${statusColors[capa.status]}`}>
                                {statusLabels[capa.status]}
                              </span>
                            );
                          })()}
                        </div>
                        <h4 className="text-slate-800 text-sm font-semibold truncate">{capa.title}</h4>
                        
                        {/* Action Mini-progress */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-violet-600 h-1 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono font-medium">
                            {doneActions}/{totalActions} ss-actions
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 text-xs pl-2">
                        <div className="text-slate-700 font-bold mb-1">Échéance</div>
                        <div className="text-slate-500 font-mono text-[10px]/none">{capa.targetDate}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />
              Menez des analyses de causes Ishikawa et 5 Whys.
            </span>
            <span className="text-emerald-700 font-mono font-bold">{capaCompletionRate}% Total Réussi</span>
          </div>
        </div>

      </div>

      {/* NEW SECTION: Customer Satisfaction & Supplier Performance */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6" id="client-supplier-dash">
        <div className="flex items-center justify-between border-b border-sidebar-divider pb-4 flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-pink-50 text-pink-600 border border-pink-100 rounded-lg">
                <ThumbsUp className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-space font-semibold text-slate-900">
                Satisfaction Clients & Évaluation Partenaires
              </h3>
            </div>
            <p className="text-slate-500 text-xs pl-8">
              Mesure directe de la satisfaction des clients et de la conformité du panel des fournisseurs du Système de Management.
            </p>
          </div>
          <button
            onClick={() => onNavigate('map')}
            className="text-xs text-pink-600 hover:text-pink-700 font-semibold border border-pink-200/50 bg-pink-500/5 hover:bg-pink-500/10 px-3.5 py-1.5 rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Gérer Clients & Tiers</span>
            <ArrowRight className="w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card A: Client Satisfaction Stats */}
          <div className="bg-gradient-to-br from-white to-pink-50/20 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono tracking-wider uppercase font-medium">Score des Clients ({totalClients})</span>
                <span className="text-[10px] px-2 py-0.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-full font-bold">SMQ ISO 9001</span>
              </div>

              <div className="flex items-center gap-4 py-2">
                <div className="text-center bg-white border border-pink-100/80 rounded-2xl p-3 shadow-2xs shrink-0">
                  <div className="text-3xl font-space font-bold text-pink-600">{avgClientStars}/5</div>
                  <div className="flex items-center justify-center gap-0.5 text-amber-400 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className="text-xs">
                        {star <= Math.round(Number(avgClientStars)) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-450 uppercase font-mono font-bold">Moyenne Globale</div>
                  {avgClientSatisfactionPct !== null ? (
                    <div className="mt-1">
                      <div className="text-2xl font-space font-bold text-slate-800">{avgClientSatisfactionPct}%</div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className="bg-pink-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${avgClientSatisfactionPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-1 italic font-mono">Aucun score % saisi</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-mono flex justify-between items-center">
              <span>Clients évalués : {clientsWithStars.length}</span>
              <span className="text-pink-600 font-bold">Cible : &ge; 85%</span>
            </div>
          </div>

          {/* Card B: Testimonials Slider / List */}
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-mono tracking-wider uppercase font-medium block mb-3">Retours & Avis Récents</span>
              <div className="space-y-3">
                {clientsList.length === 0 ? (
                  <p className="text-xs text-slate-450 italic text-center py-4">Aucun client répertorié</p>
                ) : (
                  clientsList.map(c => (
                    <div key={c.id} className="bg-white p-2.5 rounded-lg border border-slate-150 shadow-3xs text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">{c.name}</span>
                        <div className="flex items-center gap-1.5">
                          {c.clientSatisfactionPercentage !== undefined && (
                            <span className="text-[10px] text-pink-600 bg-pink-50 px-1 py-0.2 rounded font-bold font-mono">
                              {c.clientSatisfactionPercentage}%
                            </span>
                          )}
                          <span className="text-amber-500 font-bold shrink-0">
                            {'★'.repeat(c.clientSatisfaction || 0) + '☆'.repeat(5 - (c.clientSatisfaction || 0))}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-500 text-[11px] leading-relaxed italic line-clamp-2">
                        &ldquo;{c.clientSatisfactionComments || "Aucun commentaire rédigé."}&rdquo;
                      </p>
                    </div>
                  )).slice(0, 2)
                )}
              </div>
            </div>

            <div className="mt-3 text-[10px] text-slate-400 font-mono text-right">
              Mise à jour en temps réel d'après la cartographie
            </div>
          </div>

          {/* Card C: Supplier Performance Rating */}
          <div className="border border-slate-200 rounded-xl p-5 bg-white flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-mono tracking-wider uppercase font-medium">Revue Sous-traitants & Fournisseurs</span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full font-bold">Exigence 8.4</span>
              </div>

              <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 shadow-3xs">
                <div className="flex justify-between items-baseline mb-2">
                  <div className="text-[11px] text-slate-550 font-medium">Fournisseurs Actifs :</div>
                  <div className="text-base font-bold text-slate-800 font-mono">{totalSuppliers}</div>
                </div>
                <div className="flex justify-between items-baseline">
                  <div className="text-[11px] text-slate-550 font-medium font-sans">Performance moyenne :</div>
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500 font-bold text-sm">★</span>
                    <span className="text-sm font-bold font-mono text-slate-850">{avgSupplierRating} <span className="text-slate-405 text-xs font-normal">/ 5</span></span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-450 uppercase font-mono block font-bold">Suppliers Critique :</span>
                {suppliersList.slice(0, 1).map(s => (
                  <div key={s.id} className="text-[11px] text-slate-600 flex items-center justify-between gap-1">
                    <span className="truncate font-semibold text-slate-800 shrink-0">{s.name}</span>
                    <span className="h-px bg-slate-200 flex-1 min-w-[10px]" />
                    <span className="text-amber-600 font-mono font-bold whitespace-nowrap shrink-0">★ {s.supplierRating || 0}/5</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
              Filtre automatique sur les prestataires et parties intéressées du SMI.
            </div>
          </div>
        </div>
      </div>

      {/* NEW SECTION: All Modules Indicators Dashboard Grid */}
      <div className="bg-slate-50/20 border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6" id="dashboard-system-modules">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-space font-semibold text-slate-900">
              Revue Systémique des Modules du SMI
            </h3>
          </div>
          <p className="text-slate-500 text-xs pl-8">
            Tableau synoptique d'intégrité, de conformité et de maintenance de l'ensemble des modules d'amélioration et de support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {/* Card 1: Incidents & Non-Conformités */}
          <div 
            onClick={() => onNavigate('events')}
            className="group bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-xs transition duration-150 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-1.5 bg-red-50 text-red-650 border border-red-100 rounded-lg group-hover:bg-red-100 transition">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Événements</span>
              </div>
              <div>
                <div className="text-2xl font-space font-bold text-slate-950">{totalEvents}</div>
                <div className="text-[11px] text-slate-700 font-medium">Dysfonctionnements & NC</div>
              </div>
              <div className="text-[11px] text-slate-455 space-y-1 pt-1.5 border-t border-slate-100">
                <div className="flex justify-between font-mono">
                  <span>En traitement :</span>
                  <span className="font-bold text-amber-600">{openEvents}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Critiques / Élevés :</span>
                  <span className="font-bold text-red-600">{criticalEventsCount}</span>
                </div>
              </div>
            </div>
            <div className="mt-3.5 text-[10px] text-blue-600 font-bold group-hover:underline flex items-center gap-1">
              Afficher le registre <ArrowRight className="w-3" />
            </div>
          </div>

          {/* Card 2: Veille Législative & Normative */}
          <div 
            onClick={() => onNavigate('requirements')}
            className="group bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-xs transition duration-150 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-1.5 bg-violet-50 text-violet-650 border border-violet-100 rounded-lg group-hover:bg-violet-100 transition">
                  <Scale className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Réglementation</span>
              </div>
              <div>
                <div className="text-2xl font-space font-bold text-slate-950">{complianceRate}%</div>
                <div className="text-[11px] text-slate-700 font-medium">Taux de Conformité</div>
              </div>
              <div className="text-[11px] text-slate-455 space-y-1 pt-1.5 border-t border-slate-100">
                <div className="flex justify-between font-mono">
                  <span>Conformes :</span>
                  <span className="font-bold text-emerald-600">{compliantRequirements}/{totalRequirements}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Non-conformités :</span>
                  <span className={`font-bold ${nonCompliantReqs > 0 ? 'text-red-500' : 'text-slate-500'}`}>{nonCompliantReqs}</span>
                </div>
              </div>
            </div>
            <div className="mt-3.5 text-[10px] text-blue-600 font-bold group-hover:underline flex items-center gap-1">
              Piloter la veille <ArrowRight className="w-3" />
            </div>
          </div>

          {/* Card 3: Moyens Techniques & Machines */}
          <div 
            onClick={() => onNavigate('equipments')}
            className="group bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-xs transition duration-150 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-1.5 bg-teal-50 text-teal-650 border border-teal-100 rounded-lg group-hover:bg-teal-100 transition">
                  <Wrench className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Équipements</span>
              </div>
              <div>
                <div className="text-2xl font-space font-bold text-slate-950">{equipmentOperationalRate}%</div>
                <div className="text-[11px] text-slate-700 font-medium">Disponibilité Opérationnelle</div>
              </div>
              <div className="text-[11px] text-slate-455 space-y-1 pt-1.5 border-t border-slate-100">
                <div className="flex justify-between font-mono">
                  <span>En service :</span>
                  <span className="font-bold text-teal-600">{operationalEquipments}/{totalEquipments}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Critiques HS :</span>
                  <span className={`font-bold ${criticalEquipmentsOutOfService > 0 ? 'text-red-500' : 'text-slate-500'}`}>{criticalEquipmentsOutOfService}</span>
                </div>
              </div>
            </div>
            <div className="mt-3.5 text-[10px] text-blue-600 font-bold group-hover:underline flex items-center gap-1">
              Gérer la maintenance <ArrowRight className="w-3" />
            </div>
          </div>

          {/* Card 4: Documents & ALCOA+ */}
          <div 
            onClick={() => onNavigate('documents')}
            className="group bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-xs transition duration-150 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-1.5 bg-slate-100 text-slate-650 border border-slate-200 rounded-lg group-hover:bg-slate-200 transition">
                  <FileText className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">GED ALCOA+</span>
              </div>
              <div>
                <div className="text-2xl font-space font-bold text-slate-950">{documentApprovalRate}%</div>
                <div className="text-[11px] text-slate-700 font-medium">Maîtrise Documentaire</div>
              </div>
              <div className="text-[11px] text-slate-455 space-y-1 pt-1.5 border-t border-slate-100">
                <div className="flex justify-between font-mono">
                  <span>Approuvés / Total :</span>
                  <span className="font-bold text-slate-800">{approvedDocuments}/{totalDocuments}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Audit intégrité :</span>
                  <span className="font-bold text-slate-800">{alcoaReviewedCount} révs</span>
                </div>
              </div>
            </div>
            <div className="mt-3.5 text-[10px] text-blue-600 font-bold group-hover:underline flex items-center gap-1">
              Consulter la GED <ArrowRight className="w-3" />
            </div>
          </div>

          {/* Card 5: Audits d'Intégrité ISO 19011 */}
          <div 
            onClick={() => onNavigate('audits')}
            className="group bg-white border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-xs transition duration-150 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="p-1.5 bg-emerald-50 text-emerald-650 border border-emerald-100 rounded-lg group-hover:bg-emerald-100 transition">
                  <ClipboardCheck className="w-4 h-4 text-emerald-500" />
                </span>
                <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">ISO 19011</span>
              </div>
              <div>
                <div className="text-2xl font-space font-bold text-slate-950">{auditClosureRate}%</div>
                <div className="text-[11px] text-slate-700 font-medium">Récurrence d'Audits</div>
              </div>
              <div className="text-[11px] text-slate-455 space-y-1 pt-1.5 border-t border-slate-100">
                <div className="flex justify-between font-mono">
                  <span>Planifiés / Total :</span>
                  <span className="font-bold text-emerald-600">{scheduledAuditsCount + activeAuditsCount + completedAuditsCount}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span>Constats d'écart :</span>
                  <span className="font-bold text-slate-800">{totalAuditFindingsCount}</span>
                </div>
              </div>
            </div>
            <div className="mt-3.5 text-[10px] text-blue-600 font-bold group-hover:underline flex items-center gap-1">
              Gérer les audits <ArrowRight className="w-3" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips / Integration Note */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-5" id="integration-blueprint">
        <h3 className="text-sm font-space font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-emerald-600" />
          Comment fonctionne la centralisation QHSE ?
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed max-w-5xl">
          Tous les modules sont **connectés dynamiquement**. Lorsque vous ajoutez une action corrective (CAPA) ou évaluez un écart, liez-le à son processus correspondant (ex: Production & Opérations). Vous disposerez immédiatement d'une vue d'impact à 360° lors de vos audits ou de votre prochaine revue de direction stratégique.
        </p>
      </div>

    </div>
  );
};
