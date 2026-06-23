import React, { useState } from 'react';
import { QhseEvent, ProcessNode, Capa } from '../types';
import {
  Plus,
  Trash2,
  Search,
  Filter,
  User,
  Layers,
  ShieldAlert,
  Activity,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FileText,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface QhseEventsModuleProps {
  qhseEvents: QhseEvent[];
  nodes: ProcessNode[];
  capas: Capa[];
  quickAddProcessId?: number | null;
  quickAddEventType?: QhseEvent['type'] | null;
  onClearQuickAddProcess?: () => void;
  onChangeEvents: (newEvents: QhseEvent[]) => void;
  onChangeCapas: (newCapas: Capa[]) => void;
  onSwitchTab?: (tab: 'capas') => void;
}

export const QhseEventsModule: React.FC<QhseEventsModuleProps> = ({
  qhseEvents,
  nodes,
  capas,
  quickAddProcessId,
  quickAddEventType,
  onClearQuickAddProcess,
  onChangeEvents,
  onChangeCapas,
  onSwitchTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processFilter, setProcessFilter] = useState('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(qhseEvents[0]?.id || null);
  const [eventIdToConfirmDelete, setEventIdToConfirmDelete] = useState<string | null>(null);

  // Form toggle and inputs
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<QhseEvent['type']>('non_conformity');
  const [newCategory, setNewCategory] = useState<'quality' | 'safety' | 'environment' | 'hygiene' | 'other'>('quality');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('08:30');
  const [newLinkedProcessId, setNewLinkedProcessId] = useState<number | undefined>(undefined);
  const [newSeverity, setNewSeverity] = useState<QhseEvent['severity']>('medium');
  const [newImmediateActions, setNewImmediateActions] = useState('');
  const [newReportedBy, setNewReportedBy] = useState('Pilote de Ligne');
  const [newLocation, setNewLocation] = useState('Atelier de sciage / Thermoformage');

  React.useEffect(() => {
    if (quickAddProcessId) {
      setNewLinkedProcessId(quickAddProcessId);
      if (quickAddEventType) {
        setNewType(quickAddEventType);
      }
      setIsCreating(true);
      if (onClearQuickAddProcess) {
        onClearQuickAddProcess();
      }
    }
  }, [quickAddProcessId, quickAddEventType, onClearQuickAddProcess]);

  // Labels & styles
  const typeLabels: Record<QhseEvent['type'], string> = {
    non_conformity: '❌ Non-Conformité',
    incident: '⚠️ Incident',
    accident: '🚨 Accident',
    near_miss: '🔍 Presque-Accident'
  };

  const severityLabels: Record<QhseEvent['severity'], string> = {
    low: 'Faible',
    medium: 'Moyenne',
    high: 'Grave',
    critical: 'Critique'
  };

  const statusLabels: Record<QhseEvent['status'], string> = {
    reported: 'Déclaré / Nouveau',
    analysing: 'Analyse en cours',
    action_plan: 'Plan d’actions',
    closed: 'Clôturé / Résolu'
  };

  const typeColors: Record<QhseEvent['type'], string> = {
    non_conformity: 'border-blue-200 bg-blue-50 text-blue-700',
    incident: 'border-amber-200 bg-amber-50 text-amber-700',
    accident: 'border-red-200 bg-red-50 text-red-700',
    near_miss: 'border-indigo-200 bg-indigo-50 text-indigo-700'
  };

  const severityBadges: Record<QhseEvent['severity'], string> = {
    low: 'bg-slate-100 text-slate-700 border-slate-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    high: 'bg-orange-50 text-orange-850 border-orange-200 font-semibold',
    critical: 'bg-red-50 text-red-850 border-red-200 font-bold animate-pulse'
  };

  const statusBadges: Record<QhseEvent['status'], string> = {
    reported: 'border-sky-200 bg-sky-50 text-sky-750',
    analysing: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    action_plan: 'border-purple-200 bg-purple-50 text-purple-750',
    closed: 'border-emerald-200 bg-emerald-50 text-emerald-800'
  };

  // Filter logic
  const filteredEvents = qhseEvents.filter(evt => {
    const matchesSearch = 
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      evt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || evt.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || evt.status === statusFilter;
    const matchesProcess = processFilter === 'all' || evt.linkedProcessId === Number(processFilter);

    return matchesSearch && matchesType && matchesStatus && matchesProcess;
  });

  const selectedEvent = qhseEvents.find(e => e.id === selectedEventId);

  // Submit new report
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const maxIdSerial = qhseEvents.reduce((max, evt) => {
      const parts = evt.id.split('-');
      const s = Number(parts[2]);
      return !isNaN(s) ? Math.max(max, s) : max;
    }, 0);

    const year = new Date(newDate).getFullYear();
    const newId = `EVT-${year}-${String(maxIdSerial + 1).padStart(3, '0')}`;

    const newObj: QhseEvent = {
      id: newId,
      type: newType,
      title: newTitle,
      description: newDescription,
      date: newDate,
      time: newTime,
      linkedProcessId: newLinkedProcessId,
      severity: newSeverity,
      status: 'reported',
      immediateActions: newImmediateActions,
      reportedBy: newReportedBy,
      location: newLocation
    };

    const nextEvents = [newObj, ...qhseEvents];
    onChangeEvents(nextEvents);
    setSelectedEventId(newId);
    setIsCreating(false);

    // Reset fields
    setNewTitle('');
    setNewDescription('');
    setNewImmediateActions('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setNewTime('08:30');
    setNewLinkedProcessId(undefined);
  };

  // Delete event
  const handleDeleteEvent = (id: string, bypassConfirm = false) => {
    if (bypassConfirm) {
      const nextEvents = qhseEvents.filter(e => e.id !== id);
      onChangeEvents(nextEvents);
      setSelectedEventId(nextEvents[0]?.id || null);
      setEventIdToConfirmDelete(null);
    }
  };

  // Escalate to CAPA Action Plan
  const handleEscalateToCapa = (event: QhseEvent) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const serial = String(capas.length + 1).padStart(3, '0');
    const capaId = `AC-EVT-${serial}`;

    const newCapa: Capa = {
      id: capaId,
      title: `CAPA Corrective - ${event.title}`,
      description: `Plan d'actions correctives suite à la déclaration de l'événement ${event.id} : ${event.description}`,
      type: 'corrective',
      source: event.type === 'non_conformity' ? 'customer_complaint' : 'near_miss',
      status: 'ongoing',
      priority: event.severity === 'critical' ? 'critical' : event.severity === 'high' ? 'high' : 'medium',
      owner: event.reportedBy || 'Ingénieur QHSE',
      creationDate: todayStr,
      targetDate: (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().split('T')[0];
      })(),
      linkedProcessId: event.linkedProcessId,
      rootCauseAnalysis: {
        fiveWhys: [
          `L'événement ${event.id} s'est produit le ${event.date}.`,
          `Actions immédiates prises : ${event.immediateActions || 'Aucune renseignée'}`
        ],
        ishikawa: {
          manpower: [],
          machines: [],
          materials: [],
          methods: ["Vérifier la procédure de travail appliquée et le respect des consignes"],
          measurement: [],
          environment: event.location ? [`Lieu identifié : ${event.location}`] : []
        }
      },
      actions: [
        {
          id: `act-evt-${Date.now()}`,
          title: `Analyser et remédier définitivement aux anomalies de l'événement ${event.id}`,
          owner: event.reportedBy || 'Ingénieur QHSE',
          targetDate: todayStr,
          status: 'pending'
        }
      ]
    };

    // Update event to reference this newly created CAPA, and change event status to action_plan
    const nextEvents = qhseEvents.map(evt => 
      evt.id === event.id 
        ? { ...evt, status: 'action_plan' as const, linkedCapaId: capaId } 
        : evt
    );

    onChangeEvents(nextEvents);
    onChangeCapas([...capas, newCapa]);

    // Show notice / navigate to capas
    if (onSwitchTab) {
      if (confirm(`Un nouveau plan d'action ${capaId} a été généré avec succès ! Souhaitez-vous basculer vers l'onglet des CAPAs pour l'examiner ?`)) {
        onSwitchTab('capas');
      }
    } else {
      alert(`Plan d'action correctif ${capaId} généré et lié à l'incident.`);
    }
  };

  // Bird's Safety Pyramid calculation from current list of events
  // Levels:
  // Level 4 (Top - red): Accidents with severe impacts
  // Level 3 (Orange): Minor Accidents or Incidents (severity high/critical)
  // Level 2 (Amber): Near Misses (presque-accidents)
  // Level 1 (Indigo/Blue - Base): Non-Conformités formatées / acts suspects
  const countAccidents = qhseEvents.filter(e => e.type === 'accident').length;
  const countIncidents = qhseEvents.filter(e => e.type === 'incident').length;
  const countNearMisses = qhseEvents.filter(e => e.type === 'near_miss').length;
  const countNCs = qhseEvents.filter(e => e.type === 'non_conformity').length;

  return (
    <div className="flex h-full bg-slate-50 relative overflow-hidden" id="qhse-events-container">
      
      {/* Dynamic Left Column: Event List + Pyramide de Bird */}
      <div className="w-[430px] border-r border-slate-200 bg-white flex flex-col shrink-0 h-full overflow-hidden">
        
        {/* Bird Safety Pyramid - Enterprise Standard */}
        <div className="p-4 bg-slate-900 text-white shrink-0 border-b border-slate-950">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase font-mono text-emerald-400 tracking-wider">
              Pyramide de Sécurité (Bird)
            </span>
            <span className="text-[9px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
              SMI Live
            </span>
          </div>

          {/* Interactive Stacked Triangle Representation */}
          <div className="flex flex-col items-center justify-center space-y-1 py-1.5 transform scale-98">
            
            {/* Tier 1: Accidents */}
            <div 
              className="w-16 h-7 bg-red-600 hover:bg-red-750 transition flex flex-col items-center justify-center rounded-xs text-[10px] font-bold shadow-xs cursor-help"
              title="Accidents majeurs ou corporels"
            >
              <div className="text-[9px] opacity-80 uppercase leading-none font-sans">Accidents</div>
              <div className="text-xs font-mono font-bold leading-none mt-0.5">{countAccidents}</div>
            </div>

            {/* Tier 2: Incidents */}
            <div 
              className="w-32 h-7 bg-amber-500 hover:bg-amber-650 transition flex flex-col items-center justify-center rounded-xs text-[10px] font-bold shadow-2xs cursor-help"
              title="Incidents matériels ou techniques"
            >
              <div className="text-[9px] opacity-80 uppercase leading-none font-sans">Incidents</div>
              <div className="text-xs font-mono font-bold leading-none mt-0.5">{countIncidents}</div>
            </div>

            {/* Tier 3: Near Misses */}
            <div 
              className="w-48 h-7 bg-indigo-600 hover:bg-indigo-750 transition flex flex-col items-center justify-center rounded-xs text-[10px] font-bold shadow-2xs cursor-help"
              title="Presque-accidents / Situations à risques déclarées"
            >
              <div className="text-[9px] opacity-80 uppercase leading-none font-sans">Presque-accidents</div>
              <div className="text-xs font-mono font-bold leading-none mt-0.5">{countNearMisses}</div>
            </div>

            {/* Tier 4: Non-Conformités */}
            <div 
              className="w-64 h-7 bg-slate-700 hover:bg-slate-650 transition flex flex-col items-center justify-center rounded-xs text-[10px] font-bold shadow-2xs cursor-help"
              title="Non-conformités qualité ou écarts documentaires"
            >
              <div className="text-[9px] opacity-80 uppercase leading-none font-sans">Non-Conformités Quality</div>
              <div className="text-xs font-mono font-bold leading-none mt-0.5">{countNCs}</div>
            </div>

          </div>

          <p className="text-[9px] text-slate-400 text-center mt-3 leading-relaxed font-mono">
            Rapport standard 1-10-30-600 appliqué à la réduction opérationnelle des dangers.
          </p>
        </div>

        {/* Filters Panel & Tools */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3 shrink-0">
          
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, ID ou texte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500 transition shadow-2xs text-slate-800"
            />
          </div>

          {/* Core Selector dropdowns */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[8.5px] font-bold text-slate-500 uppercase tracking-wide mb-1">Typologie</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full text-[11px] bg-white border border-slate-200 p-1.5 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tous types ({qhseEvents.length})</option>
                <option value="non_conformity">❌ Non-Conformité</option>
                <option value="incident">⚠️ Incident</option>
                <option value="accident">🚨 Accident</option>
                <option value="near_miss">🔍 Presque-Accident</option>
              </select>
            </div>

            <div>
              <label className="block text-[8.5px] font-bold text-slate-500 uppercase tracking-wide mb-1">Réseau / Profil</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-[11px] bg-white border border-slate-200 p-1.5 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tout Statut</option>
                <option value="reported">Nouveau</option>
                <option value="analysing">En cours d'analyse</option>
                <option value="action_plan">Plan correctif</option>
                <option value="closed">Clôturé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[8.5px] font-bold text-slate-500 uppercase tracking-wide mb-1">Processus Lié</label>
            <select
              value={processFilter}
              onChange={(e) => setProcessFilter(e.target.value)}
              className="w-full text-[11px] bg-white border border-slate-200 p-1.5 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Tous processus</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>P{n.id} - {n.name.slice(0, 32)}...</option>
              ))}
            </select>
          </div>

          {/* Action trigger: New declaration */}
          <button
            onClick={() => {
              setIsCreating(true);
              setNewTitle('');
              setNewDescription('');
              setNewImmediateActions('');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Déclarer un événement QHSE
          </button>

        </div>

        {/* Scrollable Declarations Stack */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto stroke-1.5 text-slate-300 mb-2" />
              <p className="text-xs">Aucun signalement ne correspond à vos filtres.</p>
            </div>
          ) : (
            filteredEvents.map(evt => {
              const active = evt.id === selectedEventId;
              const linkedProc = nodes.find(n => n.id === evt.linkedProcessId);
              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    setSelectedEventId(evt.id);
                    setIsCreating(false);
                    setEventIdToConfirmDelete(null);
                  }}
                  className={`p-3.5 transition duration-150 cursor-pointer border-l-3 ${
                    active 
                      ? 'bg-slate-50 border-l-emerald-600' 
                      : 'hover:bg-slate-50/50 border-l-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{evt.id}</span>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-2.5 h-2.5 text-slate-400" />
                      {evt.date}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1 mb-1.5">
                    {evt.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[9px] px-1.5 py-0.5 border rounded-full font-medium`}>
                      {typeLabels[evt.type]}
                    </span>
                    
                    <span className={`text-[9px] px-1.5 py-0.5 border rounded-full font-semibold ${severityBadges[evt.severity]}`}>
                      {severityLabels[evt.severity]}
                    </span>

                    <span className="text-[9px] text-slate-400 font-medium">
                      {linkedProc ? `P${linkedProc.id}` : 'Général'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Right Column: Event Worksheets & Forms */}
      <div className="flex-1 overflow-y-auto bg-slate-50 shadow-inner h-full flex flex-col">
        {isCreating ? (
          /* Event Declaration Form */
          <form onSubmit={handleCreateEvent} className="p-6 max-w-2xl mx-auto w-full my-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
            
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h2 className="text-base font-bold text-slate-900">Nouveau Signalement QHSE</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">Saisie d'un constat d'anomalie, non-conformité ISO ou d'un incident de sécurité physique.</p>
            </div>

            {/* Event Typology Switch */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Type d'Événement</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(typeLabels) as QhseEvent['type'][]).map(type => {
                  const active = newType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setNewType(type);
                        if (type === 'non_conformity') {
                          setNewCategory('quality');
                          setNewSeverity('medium');
                        } else if (type === 'accident') {
                          setNewCategory('safety');
                          setNewSeverity('high');
                        } else if (type === 'incident') {
                          setNewCategory('safety');
                        }
                      }}
                      className={`p-2.5 border text-center rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        active 
                          ? 'border-emerald-500 bg-emerald-50/55 text-emerald-800 shadow-2xs font-semibold' 
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">{typeLabels[type].split(' ')[0]}</span>
                      <span className="text-[10px] font-medium leading-none">{typeLabels[type].split(' ')[1]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Event Title */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Titre Résumé du Dysfonctionnement</label>
              <input
                type="text"
                required
                placeholder="Ex. Absence d'un extincteur réglementaire au poste extrusion..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/20 text-slate-800 focus:bg-white transition"
              />
            </div>

            {/* Multi-tier inputs */}
            <div className="grid grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Date du Constat</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs pl-9 border border-slate-200 p-2 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Heure exacte</label>
                <div className="relative">
                  <Clock className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-xs pl-9 border border-slate-200 p-2 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-700 font-mono"
                  />
                </div>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Niveau de Gravité</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full text-xs bg-white border border-slate-200 p-2.5 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="low">🟡 {severityLabels.low} (Faibles impacts)</option>
                  <option value="medium">🟠 {severityLabels.medium} (Moyen / Écart qualité)</option>
                  <option value="high">🔴 {severityLabels.high} (Grave - Arrêt de poste)</option>
                  <option value="critical">💀 {severityLabels.critical} (Urgence critique)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Processus Lié du SMI</label>
                <select
                  value={newLinkedProcessId === undefined ? '' : newLinkedProcessId}
                  onChange={(e) => setNewLinkedProcessId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full text-xs bg-white border border-slate-200 p-2.5 rounded-xl text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Non rattaché (SMI Global) --</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>P{n.id} - {n.name}</option>
                  ))}
                </select>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Lieu / Atelier</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex. Zone Extrusion, Atelier B..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full text-xs pl-9 border border-slate-200 p-2 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Déclarant / Signaleur</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ex. Technicien HSE..."
                    value={newReportedBy}
                    onChange={(e) => setNewReportedBy(e.target.value)}
                    className="w-full text-xs pl-9 border border-slate-200 p-2 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
                  />
                </div>
              </div>

            </div>

            {/* Description details */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Description des circonstances / Défaut constaté</label>
              <textarea
                required
                rows={4}
                placeholder="Rédigez un compte-rendu clair des faits constatés. Précisez l'écart vis-à-vis des exigences ou la nature du choc/incident."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full text-xs border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/20 text-slate-800 focus:bg-white resize-none font-sans"
              />
            </div>

            {/* Immediate Actions */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Mesures Conservatoires Immédiates Prises</label>
              <textarea
                required
                rows={2}
                placeholder="Ex. Balisage de la zone d'huile, arrêt de la machine défectueuse..."
                value={newImmediateActions}
                onChange={(e) => setNewImmediateActions(e.target.value)}
                className="w-full text-xs border border-slate-200 p-2.5 rounded-xl focus:outline-none focus:border-emerald-500 bg-slate-50/20 text-slate-800 focus:bg-white resize-none font-sans"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer transition shadow-xs"
              >
                Valider la Déclaration
              </button>
            </div>

          </form>
        ) : selectedEvent ? (
          /* Event Detail View Worksheet */
          <div className="p-6 max-w-4xl w-full mx-auto my-4 space-y-6">
            
            {/* Ribbon Header Card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold border border-slate-200">
                      {selectedEvent.id}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold uppercase ${severityBadges[selectedEvent.severity]}`}>
                      Gravité: {severityLabels[selectedEvent.severity]}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-full font-medium ${statusBadges[selectedEvent.status]}`}>
                      {statusLabels[selectedEvent.status]}
                    </span>
                  </div>
                  <h1 className="text-md sm:text-lg font-bold text-slate-900 mt-1">{selectedEvent.title}</h1>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {eventIdToConfirmDelete === selectedEvent.id ? (
                    <div className="flex items-center gap-1.5 border border-red-200 bg-red-50/70 py-1 px-2 rounded-xl">
                      <span className="text-[10px] text-red-750 font-bold font-mono">Confirmer ?</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(selectedEvent.id, true)}
                        className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded cursor-pointer transition"
                      >
                        Oui
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventIdToConfirmDelete(null)}
                        className="px-2 py-0.5 bg-slate-200 hover:bg-slate-350 text-slate-705 text-[10px] font-medium rounded cursor-pointer transition"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEventIdToConfirmDelete(selectedEvent.id)}
                      className="p-2 border border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-400 hover:text-red-550 rounded-xl cursor-pointer transition"
                      title="Supprimer cette déclaration"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Déclarant</span>
                  <div className="flex items-center gap-1.5 pt-0.5 font-medium text-slate-800">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {selectedEvent.reportedBy}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Date & Heure</span>
                  <div className="flex items-center gap-1.5 pt-0.5 text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{selectedEvent.date} {selectedEvent.time && `à ${selectedEvent.time}`}</span>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Emplacement</span>
                  <div className="flex items-center gap-1.5 pt-0.5 text-slate-800">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedEvent.location || 'N/A'}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Processus Associé</span>
                  <div className="flex items-center gap-1.5 pt-0.5 text-slate-800 font-semibold font-mono">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    {selectedEvent.linkedProcessId ? (
                      `P${selectedEvent.linkedProcessId} - ${nodes.find(n => n.id === selectedEvent.linkedProcessId)?.name.slice(0, 18)}...`
                    ) : (
                      'Global d’Usine'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Process Flow & Escalate workflow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Details block */}
              <div className="col-span-2 space-y-6">
                
                {/* Description */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 border-b border-slate-50 pb-2">Description des Faits</h3>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/40 p-4 rounded-xl border border-slate-100 font-sans">
                    {selectedEvent.description || 'Aucune description fournie.'}
                  </p>
                </div>

                {/* Immediate Actions */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold text-orange-900 border-b border-orange-50 pb-2 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-orange-500" />
                    Actions Conservatoires Immédiates Prises
                  </h3>
                  <p className="text-xs text-orange-950 leading-relaxed bg-orange-50/40 p-4 rounded-xl border border-orange-100/60">
                    {selectedEvent.immediateActions || 'Aucune mesure conservatoire immédiate n\'a été déclarée.'}
                  </p>
                </div>

              </div>

              {/* Right Workflow Column */}
              <div className="space-y-6">
                
                {/* Corrective Action Integration card (CAPA) */}
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-xs font-bold text-slate-900">Lien CAPA & Traitement</h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Les règles QHSE de l'ISO 9001/45001 requièrent de monter un plan d’action correctif et préventif (CAPA) pour tout incident ou écart constaté.
                  </p>

                  {selectedEvent.linkedCapaId ? (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-800 font-mono">Plan CAPA Associé</span>
                        <span className="text-[9.5px] bg-emerald-600 text-white px-2 py-0.5 rounded font-mono font-bold">LIVRÉ</span>
                      </div>
                      <div className="text-[11px] text-slate-700 leading-snug">
                        Une fiche d'amélioration continue <span className="font-mono font-bold text-emerald-900 bg-emerald-100/50 px-1 rounded">{selectedEvent.linkedCapaId}</span> est activement rattachée à cet événement.
                      </div>
                      {onSwitchTab && (
                        <button
                          onClick={() => onSwitchTab('capas')}
                          className="w-full mt-2 flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-emerald-850 hover:text-emerald-950 bg-white border border-emerald-250 hover:bg-emerald-50 rounded-lg cursor-pointer transition"
                        >
                          Consulter la fiche CAPA
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-805 leading-relaxed">
                        ⚠️ Cet événement n'est pas encore traité par un plan d'action correctif formel.
                      </div>
                      <button
                        onClick={() => handleEscalateToCapa(selectedEvent)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-2xs"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Générer Fiche CAPA Corrective
                      </button>
                    </div>
                  )}
                </div>

                {/* ISO Standards Coverage Helper */}
                <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl shadow-2xs space-y-3 font-mono text-[10px]">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="font-bold uppercase tracking-wider">Normes Couvertes</span>
                  </div>
                  <ul className="space-y-1.5 text-slate-400 leading-relaxed">
                    <li>• <span className="text-white font-semibold">ISO 9001 (Art 10.2)</span>: Traitement des non-conformités & actions correctives.</li>
                    <li>• <span className="text-white font-semibold">ISO 45001 (Art 10.2)</span>: Incidents, non-conformités & actions associées.</li>
                    <li>• <span className="text-white font-semibold">ISO 14001 (Art 10.2)</span>: Management opérationnel des urgences environnementales.</li>
                  </ul>
                </div>

              </div>

            </div>

          </div>
        ) : (
          /* Landing Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-slate-450 p-8">
            <FileText className="w-16 h-16 stroke-1 stroke-slate-300 text-slate-300 mb-3" />
            <h2 className="text-sm font-bold text-slate-800">Bienvenue sur le Cockpit de Déclarations</h2>
            <p className="text-xs text-slate-500 max-w-sm text-center mt-1 leading-relaxed">
              Sélectionnez une fiche de signalement à gauche pour analyser les circonstances, ou déclarez un nouvel incident de fabrication en un clic.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
