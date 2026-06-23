export interface Attribute {
  key: string;
  value: string;
}

export interface Resource {
  name: string;
  kind: 'procedure' | 'record' | 'instruction' | 'link' | 'note';
  content: string;
}

export interface ProcessNode {
  id: number;
  x: number;
  y: number;
  name: string;
  type: 'management' | 'core' | 'support' | 'party' | 'client';
  description: string;
  standards: string[];
  attributes: Attribute[];
  resources: Resource[];
  // Interested Party evaluation (Parties Intéressées) & Supplier performance
  partyRelevance?: 'pertinent' | 'non_pertinent' | 'undetermined';
  partyRelevanceEvaluation?: string;
  isSupplier?: boolean;
  supplierRating?: number; // 1 to 5 stars
  supplierRatingComments?: string;
  // Client satisfaction evaluation
  clientSatisfaction?: number; // 1 to 5 stars
  clientSatisfactionPercentage?: number; // 0 to 100 %
  clientSatisfactionComments?: string;
}

export interface ProcessEdge {
  id: number;
  from: number;
  to: number;
  name: string;
  type: 'io' | 'info' | 'document' | 'feedback';
  description: string;
  attributes: Attribute[];
  resources: Resource[];
}

export interface CapaAction {
  id: string;
  title: string;
  owner: string;
  targetDate: string;
  status: 'pending' | 'done';
}

export interface Capa {
  id: string;
  title: string;
  description: string;
  type: 'corrective' | 'preventive' | 'improvement';
  source: 'internal_audit' | 'external_audit' | 'customer_complaint' | 'near_miss' | 'risk_assessment' | 'other';
  status: 'draft' | 'ongoing' | 'completed' | 'verified' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner: string;
  creationDate: string;
  targetDate: string;
  completionDate?: string;
  linkedProcessId?: number; // References ProcessNode.id
  rootCauseAnalysis?: {
    fiveWhys: string[];
    ishikawa: {
      manpower: string[];
      machines: string[];
      materials: string[];
      methods: string[];
      measurement: string[];
      environment: string[];
    };
  };
  actions: CapaAction[];
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  linkedProcessId?: number; // References ProcessNode.id
  category: 'strategic' | 'operational' | 'environmental' | 'health_safety';
  owner: string;
  probabilityBefore: number; // 1 to 5
  impactBefore: number; // 1 to 5
  scoreBefore: number; // probability * impact (1 to 25)
  probabilityAfter?: number; // 1 to 5
  impactAfter?: number; // 1 to 5
  scoreAfter?: number;
  mitigationPlan: string;
  status: 'identified' | 'treated' | 'monitored' | 'closed';
  linkedCapaId?: string; // References Capa.id
}

export interface KeyResult {
  id: string;
  description: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number; // e.g. 1
}

export interface OKR {
  id: string;
  objective: string;
  period: string; // e.g., "Q1 2026", "Q2 2026", "2026 Annual"
  category: 'corporate' | 'quality' | 'environment' | 'safety' | 'process';
  linkedProcessId?: number; // References ProcessNode.id
  owner: string;
  status: 'on_track' | 'at_risk' | 'lagging' | 'completed';
  keyResults: KeyResult[];
}

export interface QhseEvent {
  id: string;
  type: 'non_conformity' | 'incident' | 'accident' | 'near_miss';
  title: string;
  description: string;
  date: string;
  time?: string;
  linkedProcessId?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'analysing' | 'action_plan' | 'closed';
  immediateActions: string;
  reportedBy: string;
  location?: string;
  linkedCapaId?: string; // References Capa.id if linked
}

export interface RegulatoryRequirement {
  id: string;
  title: string;
  source: string;
  category: 'legal' | 'regulatory' | 'normative';
  description: string;
  linkedProcessId?: number;
  conforms: 'compliant' | 'non_compliant' | 'not_applicable' | 'under_review';
  frequency: 'annual' | 'quarterly' | 'monthly' | 'continuous';
  lastAuditDate?: string;
  nextAuditDate?: string;
  responsible: string;
  evaluationNotes?: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: 'production' | 'control_measure' | 'safety' | 'infrastructure' | 'utility';
  model: string;
  serialNumber: string;
  status: 'operational' | 'maintenance' | 'calibrated' | 'out_of_service';
  linkedProcessId?: number;
  criticality: 'high' | 'medium' | 'low';
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  responsible: string;
  location: string;
  description?: string;
}

export interface AlcoaAssessment {
  attributable: boolean;
  legible: boolean;
  contemporaneous: boolean;
  original: boolean;
  accurate: boolean;
  complete: boolean;
  consistent: boolean;
  enduring: boolean;
  available: boolean;
  notes?: string;
  assessedBy: string;
  assessedAt: string;
}

export interface DocumentAuditTrail {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export interface DocumentedInfo {
  id: string;
  title: string;
  code: string;
  type: 'sop' | 'form' | 'record' | 'manual' | 'policy' | 'certificate';
  version: string;
  status: 'draft' | 'under_review' | 'approved' | 'archived';
  linkedProcessId?: number;
  createdBy: string;
  createdAt: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  alcoaAssessment?: AlcoaAssessment;
  auditTrail: DocumentAuditTrail[];
  fileUrl?: string;
  retentionPeriodYears: number;
  storageLocation: string;
}

export interface AuditFinding {
  id: string;
  type: 'conformity' | 'minor_nc' | 'major_nc' | 'ofi' | 'observation';
  description: string;
  evidence: string;
  clause: string; // e.g. "8.2.1"
  linkedCapaId?: string; // Auto-generated CAPA reference
}

export interface Audit {
  id: string;
  title: string;
  type: 'internal' | 'external' | 'certification' | 'process' | 'site_safety';
  standards: string[]; // e.g. ["ISO 9001", "ISO 14001"]
  linkedProcessId: number;
  auditor: string;
  auditee: string;
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  objectives: string;
  scope: string;
  findings: AuditFinding[];
  summaryReport?: string;
  iso19011PrinciplesChecked: {
    integrity: boolean; // Principle 1: Integrity (deontological foundation)
    fairPresentation: boolean; // Principle 2: Fair presentation (truth and accuracy)
    professionalCare: boolean; // Principle 3: Due professional care (diligence)
    confidentiality: boolean; // Principle 4: Confidentiality (security of info)
    independence: boolean; // Principle 5: Independence (impartiality)
    evidenceBased: boolean; // Principle 6: Evidence-based (rational method)
    riskBased: boolean; // Principle 7: Risk-based (assessment of risks/opps)
  };
}

export interface QHSEState {
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  capas: Capa[];
  risks: Risk[];
  okrs: OKR[];
  qhseEvents?: QhseEvent[];
  regulatoryRequirements?: RegulatoryRequirement[];
  equipments?: Equipment[];
  documents?: DocumentedInfo[];
  audits?: Audit[];
  nextId: number;
}
