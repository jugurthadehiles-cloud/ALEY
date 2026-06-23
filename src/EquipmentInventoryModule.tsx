import React, { useState } from 'react';
import { 
  Equipment, 
  ProcessNode 
} from '../types';
import { 
  Wrench, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertOctagon, 
  Clock, 
  User, 
  Layers, 
  Calendar, 
  AlertTriangle,
  ArrowRight,
  Filter,
  Check,
  FileSpreadsheet,
  Cpu,
  Shield,
  Gauge,
  Factory,
  RotateCcw
} from 'lucide-react';

interface EquipmentInventoryModuleProps {
  equipments: Equipment[];
  nodes: ProcessNode[];
  quickAddProcessId?: number | null;
  onClearQuickAddProcess?: () => void;
  onChangeEquipments: (newEquips: Equipment[]) => void;
  onRaiseEvent?: (title: string, description: string, pId?: number) => void;
}

export const EquipmentInventoryModule: React.FC<EquipmentInventoryModuleProps> = ({
  equipments,
  nodes,
  quickAddProcessId,
  onClearQuickAddProcess,
  onChangeEquipments,
  onRaiseEvent
}) => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processFilter, setProcessFilter] = useState<string>('all');

  // Editing and creation states
  const [selectedEqpId, setSelectedEqpId] = useState<string | null>(equipments[0]?.id || null);
  const [isCreating, setIsCreating] = useState(false);
  const [eqpIdToConfirmDelete, setEqpIdToConfirmDelete] = useState<string | null>(null);

  // Form states for new equipment
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Equipment['category']>('production');
  const [newModel, setNewModel] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newStatus, setNewStatus] = useState<Equipment['status']>('operational');
  const [newLinkedProcessId, setNewLinkedProcessId] = useState<number | undefined>(undefined);
  const [newCriticality, setNewCriticality] = useState<Equipment['criticality']>('medium');
  const [newLastMaintenance, setNewLastMaintenance] = useState(new Date().toISOString().split('T')[0]);
  const [newNextMaintenance, setNewNextMaintenance] = useState('');
  const [newResponsible, setNewResponsible] = useState('Service Maintenance Industrielle');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');

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

  const selectedEquipment = equipments.find(e => e.id === selectedEqpId);

  // Compute stats
  const totalCount = equipments.length;
  const operationalCount = equipments.filter(e => e.status === 'operational' || e.status === 'calibrated').length;
  const maintenanceCount = equipments.filter(e => e.status === 'maintenance').length;
  const outOfServiceCount = equipments.filter(e => e.status === 'out_of_service').length;
  const criticalCount = equipments.filter(e => e.criticality === 'high').length;

  const operationalRate = totalCount > 0 ? Math.round((operationalCount / totalCount) * 100) : 100;

  // Filter equipments list
  const filteredEquipments = equipments.filter(eqp => {
    const matchesSearch = 
      eqp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eqp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eqp.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eqp.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (eqp.description && eqp.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || eqp.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || eqp.status === statusFilter;
    const matchesProcess = processFilter === 'all' || String(eqp.linkedProcessId) === processFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesProcess;
  });

  // Handle Save (Create) Equipment
  const handleCreateEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newModel) return;

    const generatedId = `EQP-2026-${String(equipments.length + 101)}`;
    const newEqp: Equipment = {
      id: generatedId,
      name: newName,
      category: newCategory,
      model: newModel,
      serialNumber: newSerial || 'N/A',
      status: newStatus,
      linkedProcessId: newLinkedProcessId,
      criticality: newCriticality,
      lastMaintenanceDate: newLastMaintenance || undefined,
      nextMaintenanceDate: newNextMaintenance || undefined,
      responsible: newResponsible,
      location: newLocation || 'Atelier Principal',
      description: newDescription
    };

    const updated = [...equipments, newEqp];
    onChangeEquipments(updated);
    setSelectedEqpId(newEqp.id);
    setIsCreating(false);

    // Reset Form
    setNewName('');
    setNewCategory('production');
    setNewModel('');
    setNewSerial('');
    setNewStatus('operational');
    setNewLinkedProcessId(undefined);
    setNewCriticality('medium');
    setNewLastMaintenance(new Date().toISOString().split('T')[0]);
    setNewNextMaintenance('');
    setNewResponsible('Service Maintenance Industrielle');
    setNewLocation('');
    setNewDescription('');
  };

  const handleDeleteEquipment = (id: string) => {
    const updated = equipments.filter(e => e.id !== id);
    onChangeEquipments(updated);
    setEqpIdToConfirmDelete(null);
    if (selectedEqpId === id) {
      setSelectedEqpId(updated[0]?.id || null);
    }
  };

  const handleUpdateField = (id: string, field: keyof Equipment, value: any) => {
    const updated = equipments.map(e => {
      if (e.id === id) {
        return { ...e, [field]: value };
      }
      return e;
    });
    onChangeEquipments(updated);
  };

  // Helper styles for badges & icons
  const getStatusBadge = (status: Equipment['status']) => {
    switch (status) {
      case 'operational':
        return {
          label: 'Opérationnel',
          icon: CheckCircle2,
          bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          text: 'text-emerald-700'
        };
      case 'calibrated':
        return {
          label: 'Étalonné',
          icon: Gauge,
          bg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
          text: 'text-indigo-700'
        };
      case 'maintenance':
        return {
          label: 'En Maintenance',
          icon: Clock,
          bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          text: 'text-amber-700'
        };
      case 'out_of_service':
        return {
          label: 'Hors Service',
          icon: AlertOctagon,
          bg: 'bg-red-500/10 text-red-600 border-red-500/20',
          text: 'text-red-700'
        };
    }
  };

  const getCategoryIconAndLabel = (category: Equipment['category']) => {
    switch (category) {
      case 'production': 
        return { label: 'Production / Procédé', icon: Cpu, color: 'text-amber-600' };
      case 'control_measure': 
        return { label: 'Mesure / Métrologie', icon: Gauge, color: 'text-indigo-600' };
      case 'safety': 
        return { label: 'Sécurité / EPI', icon: Shield, color: 'text-emerald-600' };
      case 'infrastructure': 
        return { label: 'Infrastructure', icon: Factory, color: 'text-blue-600' };
      case 'utility': 
        return { label: 'Utilité / Servitude', icon: Wrench, color: 'text-slate-600' };
    }
  };

  const getCriticalityBadge = (criticality: Equipment['criticality']) => {
    switch (criticality) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200 font-extrabold';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto px-6 py-6 pb-20 max-w-7xl mx-auto flex flex-col gap-6" id="equipment-module-container">
      
      {/* Header Banner & Scorecards */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6" id="equipment-dashboard-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Wrench className="w-6 h-6 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventaire & Suivi des Équipements</h1>
          </div>
          <p className="text-xs text-slate-500">
            Enregistrement des actifs industriels, suivi d'étalonnage, contrôle réglementaire et maintenance préventive liés aux processus.
          </p>
        </div>

        {/* Operational Rate Widget */}
        <div className="flex items-center gap-6 divide-x divide-slate-100">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center relative">
                <span className="text-lg font-extrabold text-slate-900 font-mono">{operationalRate}%</span>
                <div className={`absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent border-r-transparent ${operationalRate < 80 ? 'border-red-500' : 'border-indigo-500'}`} style={{ transform: 'rotate(-45deg)' }} />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono text-slate-400 tracking-wider font-semibold">Taux de Disponibilité</p>
              <h2 className="text-xl font-extrabold text-slate-900">{operationalCount} / {totalCount} <span className="text-xs font-normal text-slate-500">Actifs OK</span></h2>
            </div>
          </div>

          <div className="pl-6 grid grid-cols-3 gap-4">
            <div className="text-center px-1">
              <span className="text-xs font-bold text-amber-600 block">{maintenanceCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">Mainten.</span>
            </div>
            <div className="text-center px-1">
              <span className="text-xs font-bold text-red-600 block">{outOfServiceCount}</span>
              <span className="text-[10px] text-slate-500 font-medium">Hors Svc</span>
            </div>
            <div className="text-center px-1">
              <span className="text-xs font-bold text-red-750 block">{criticalCount}</span>
              <span className="text-[10px] text-slate-500 font-medium font-bold">Critiques !</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="equipment-workspace">
        
        {/* Left column: Equipment Directory list */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[650px]" id="equipment-sidebar">
          
          {/* Top Search bar & Filters */}
          <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher nom, modèle, SN..."
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
                Ajouter
              </button>
            </div>

            {/* Quick selectors filters */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">Catégorie</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded p-1"
                >
                  <option value="all">Toutes</option>
                  <option value="production">Production</option>
                  <option value="control_measure">Métrologie</option>
                  <option value="safety">Sécurité</option>
                  <option value="infrastructure">Immob.</option>
                  <option value="utility">Utilités</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">État</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded p-1"
                >
                  <option value="all">Tous</option>
                  <option value="operational">Opérationnel</option>
                  <option value="calibrated">Étalonné</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="out_of_service">Hors Service</option>
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

          {/* List display */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredEquipments.length > 0 ? (
              filteredEquipments.map(eqp => {
                const badge = getStatusBadge(eqp.status);
                const StatusIcon = badge.icon;
                const isSelected = eqp.id === selectedEqpId;
                const linkedProcess = nodes.find(n => n.id === eqp.linkedProcessId);
                const info = getCategoryIconAndLabel(eqp.category);
                const CatIcon = info.icon;

                return (
                  <div
                    key={eqp.id}
                    onClick={() => {
                      setSelectedEqpId(eqp.id);
                      setIsCreating(false);
                    }}
                    className={`p-4 cursor-pointer transition ${
                      isSelected ? 'bg-indigo-50/50 border-l-4 border-indigo-650' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1 py-0.2 rounded shrink-0">{eqp.id}</span>
                        <CatIcon className={`w-3.5 h-3.5 ${info.color} shrink-0`} title={info.label} />
                        {eqp.criticality === 'high' && (
                          <span className="text-[8px] bg-red-100 text-red-700 px-1 rounded font-bold uppercase tracking-wider font-mono shrink-0">CRITIQUE</span>
                        )}
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.2 rounded-full border flex items-center gap-0.5 whitespace-nowrap ${badge.bg}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {badge.label}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 mb-1">
                      {eqp.name}
                    </h4>
                    <p className="text-[10px] text-slate-450 truncate mb-2">
                      Modèle : <b>{eqp.model}</b> Sn : {eqp.serialNumber}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-dashed border-slate-100 pt-2">
                      <span className="truncate max-w-[130px]">📍 {eqp.location}</span>
                      {linkedProcess && (
                        <span className="bg-slate-100 text-slate-650 px-1.5 py-0.2 rounded-sm font-mono text-[9px]">
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
                <p className="text-xs text-slate-450 italic">Aucun équipement ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Action Worksheet Panel or Creation Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden min-h-[650px] flex flex-col" id="equipment-detail-pane">
          {isCreating ? (
            /* Equipment creation form */
            <form onSubmit={handleCreateEquipment} className="p-6 space-y-5 flex-1 flex flex-col" id="create-equipment-form">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono">+</span>
                  <h3 className="text-sm font-bold text-slate-800 font-space">Saisir un nouvel équipement</h3>
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nom / Désignation de l'actif *</label>
                  <input
                    type="text"
                    required
                    placeholder="Saisir le nom de l'appareil"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Modèle / Marque *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex. Siemens S7-1200, Mettler Toledo..."
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  >
                    <option value="production">Production / Procédé</option>
                    <option value="control_measure">Mesure / Métrologie</option>
                    <option value="safety">Sécurité / Protect.</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="utility">Utilité / Servitude</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Numéro de Série / Tag ID</label>
                  <input
                    type="text"
                    placeholder="ex. SN-8822-PL or TAG-X"
                    value={newSerial}
                    onChange={(e) => setNewSerial(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Criticité QHSE (Panne)</label>
                  <select
                    value={newCriticality}
                    onChange={(e) => setNewCriticality(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  >
                    <option value="low">Faible (Pas d'arrêt)</option>
                    <option value="medium">Moyenne (Ralentissement ou déviation)</option>
                    <option value="high">Élevée !! (Arrêt / Risque HSE)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Localisation / Atelier</label>
                  <input
                    type="text"
                    placeholder="ex. Hall B, Ligne 3, Zone Emballage"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description / Fonctionnalités clés de l'appareil</label>
                <textarea
                  rows={2}
                  placeholder="Utilité générale, tolérances d'erreur, consignes de sécurité obligatoires..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white font-sans"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-150 p-4 rounded-xl">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">État Machine</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  >
                    <option value="operational">Opérationnel</option>
                    <option value="calibrated">Étalonné</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_service">Hors Service</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Pilote de Maintenance / Prestataire</label>
                  <input
                    type="text"
                    value={newResponsible}
                    onChange={(e) => setNewResponsible(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs"
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Dernière Maintenance</label>
                  <input
                    type="date"
                    value={newLastMaintenance}
                    onChange={(e) => setNewLastMaintenance(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded text-xs font-mono"
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
                  <Check className="w-4 h-4" /> Enregistrer l'Équipement
                </button>
              </div>
            </form>
          ) : selectedEquipment ? (
            /* Equipment detailed scorecard sheet */
            <div className="flex flex-col flex-1 p-6 space-y-6" id="equipment-detail-worksheet">
              
              {/* Header with name and quick controls */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-sm shrink-0">
                        {selectedEquipment.id}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono tracking-wider">
                        {getCategoryIconAndLabel(selectedEquipment.category).label}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {selectedEquipment.name}
                    </h2>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-1.5 self-start shrink-0">
                    {eqpIdToConfirmDelete === selectedEquipment.id ? (
                      <div className="flex items-center gap-1 bg-red-50 p-1 border border-red-200 rounded-lg">
                        <span className="text-[9px] text-red-700 px-1 font-semibold">Sûr ?</span>
                        <button
                          onClick={() => handleDeleteEquipment(selectedEquipment.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-[9px] px-2 py-1 rounded font-bold cursor-pointer transition"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setEqpIdToConfirmDelete(null)}
                          className="text-slate-400 hover:text-slate-650 text-[9px] px-1.5 py-1 font-semibold"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEqpIdToConfirmDelete(selectedEquipment.id)}
                        className="text-red-500 hover:text-red-650 hover:bg-red-50 p-2 rounded-lg cursor-pointer transition"
                        title="Supprimer cet équipement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 bg-slate-50 border border-slate-205 px-2.5 py-1 rounded-sm font-mono flex items-center gap-1">
                    Modèle / SN : <strong className="text-slate-750">{selectedEquipment.model} ({selectedEquipment.serialNumber})</strong>
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-1 rounded border ${getCriticalityBadge(selectedEquipment.criticality)}`}>
                    Défaut : Criticité {selectedEquipment.criticality.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Grid mapping info & process linking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Linked Process Card */}
                <div className="border border-slate-150 p-4 rounded-xl bg-slate-50/50 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-slate-450" />
                      Processus Implanté
                    </span>
                    {selectedEquipment.linkedProcessId ? (
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          P{selectedEquipment.linkedProcessId} - {nodes.find(n => n.id === selectedEquipment.linkedProcessId)?.name || "Processus inconnu"}
                        </h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {nodes.find(n => n.id === selectedEquipment.linkedProcessId)?.description}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-450 italic">Aucun processus rattaché à cet actif.</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedEquipment.linkedProcessId || ''}
                      onChange={(e) => handleUpdateField(selectedEquipment.id, 'linkedProcessId', e.target.value ? Number(e.target.value) : undefined)}
                      className="text-[10px] border border-slate-200 bg-white p-1 rounded-md text-slate-650 flex-1 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Rattacher au processus...</option>
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>P{n.id} - {n.name.substring(0, 20)}...</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Responsible & Tech Card */}
                <div className="border border-slate-150 p-4 rounded-xl bg-slate-50/50 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-455" />
                      Responsable Technique / Pilote
                    </span>
                    <input
                      type="text"
                      value={selectedEquipment.responsible}
                      onChange={(e) => handleUpdateField(selectedEquipment.id, 'responsible', e.target.value)}
                      className="w-full text-xs font-bold bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-650 focus:ring-0 p-0 py-1"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-slate-450">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Criticité système : 
                    <select
                      value={selectedEquipment.criticality}
                      onChange={(e) => handleUpdateField(selectedEquipment.id, 'criticality', e.target.value)}
                      className="text-[10px] text-zinc-650 bg-transparent border-0 p-0 font-bold ml-1 cursor-pointer underline hover:text-indigo-600 focus:ring-0"
                    >
                      <option value="low">Faible</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Élevée</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description Detail with inline click edit */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Description et Spécifications Opérationnelles</h4>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 relative">
                  <p className="text-xs text-slate-755 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedEquipment.description || "Aucune description des spécificités techniques entrée pour ce matériel."}
                  </p>
                  <textarea
                    placeholder="Saisir les remarques d'utilisation, exigences..."
                    value={selectedEquipment.description}
                    onChange={(e) => handleUpdateField(selectedEquipment.id, 'description', e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 focus:opacity-100 bg-white p-4 border border-indigo-600 rounded-xl text-xs resize-none transition"
                  />
                  <div className="text-[9px] text-slate-400 mt-1 block italic">
                    💡 Cliquez à l'intérieur du bloc pour de l'édition directe textuelle.
                  </div>
                </div>
              </div>

              {/* Status and maintenance schedule */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white shadow-xs">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                    État des Moyens et Planning Curatif/Préventif
                  </span>

                  {/* Status switches */}
                  <div className="flex bg-slate-200/50 p-0.5 rounded-lg border border-slate-200">
                    {(['operational', 'calibrated', 'maintenance', 'out_of_service'] as const).map(status => {
                      const badgeConfig = getStatusBadge(status);
                      const isSelected = selectedEquipment.status === status;
                      
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleUpdateField(selectedEquipment.id, 'status', status)}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-bold cursor-pointer transition font-mono ${
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
                  {/* Out of Service High Criticality Link Alert */}
                  {selectedEquipment.status === 'out_of_service' && (
                    <div className="bg-red-50/70 border border-red-200 p-4 rounded-xl space-y-3">
                      <div className="flex items-start gap-2 text-red-750">
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0 animate-bounce" />
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold">Alerte : Système Hors Service en Production !</h5>
                          <p className="text-[11px] text-red-650 leading-relaxed">
                            Cet actif est critique pour l'usine. Un arrêt non planifié perturbe le processus rattaché.
                          </p>
                        </div>
                      </div>

                      {onRaiseEvent && (
                        <div className="pt-1.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => onRaiseEvent(
                              `Panne Équipement : ${selectedEquipment.name}`,
                              `L'équipement ${selectedEquipment.name} (${selectedEquipment.model}) est déclaré hors-service. Localisation : ${selectedEquipment.location}. Impact fort sur le processus.`,
                              selectedEquipment.linkedProcessId
                            )}
                            className="text-[10px] bg-red-650 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md transition cursor-pointer font-mono flex items-center gap-1"
                          >
                            Signaler un Incident de Production <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dates of maintenance */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dernière Maintenance Préventive / Étalonnage</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          value={selectedEquipment.lastMaintenanceDate || ''}
                          onChange={(e) => handleUpdateField(selectedEquipment.id, 'lastMaintenanceDate', e.target.value)}
                          className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Échéance de Prochaine Vérification</label>
                      <div className="relative">
                        <Calendar className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="date"
                          value={selectedEquipment.nextMaintenanceDate || ''}
                          onChange={(e) => handleUpdateField(selectedEquipment.id, 'nextMaintenanceDate', e.target.value)}
                          className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Localisation précise d'implantation dans l'usine</label>
                    <input
                      type="text"
                      value={selectedEquipment.location}
                      onChange={(e) => handleUpdateField(selectedEquipment.id, 'location', e.target.value)}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center">
              <Wrench className="w-12 h-12 text-slate-300 animate-bounce" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 font-space">Aucun équipement enregistré</h3>
                <p className="text-xs text-slate-450 max-w-sm">
                  Démarrez en ajoutant un actif comme une machine ou un outil de contrôle qualité.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
