import { QHSEState } from './types';

export const INITIAL_STATE: QHSEState = {
  nodes: [],
  edges: [],
  capas: [],
  risks: [],
  okrs: [],
  qhseEvents: [],
  regulatoryRequirements: [],
  equipments: [],
  documents: [],
  nextId: 1
};

export const DEMO_STATE: QHSEState = {
  nodes: [
    {
      id: 1,
      x: 350,
      y: 80,
      name: "Revue de Direction & Leadership",
      type: "management",
      description: "Définition de la politique QHSE, des objectifs stratégiques et revue de la performance du Système de Management Intégré.",
      standards: ["ISO 9001", "ISO 14001", "ISO 45001"],
      attributes: [
        { key: "Pilote du processus", value: "Directeur Général (CEO)" },
        { key: "Objectif principal", value: "Assurer la conformité et l'alignement stratégique de l'IMS" },
        { key: "KPI Clé", value: "Taux de réalisation des actions de revue (Cible > 95%)" }
      ],
      resources: [
        { name: "MDI-01 Manuel d'Intégration", kind: "procedure", content: "Manuel général décrivant l'ensemble de la gouvernance IMS." },
        { name: "CR-REV-2026-01 Compte-rendu Revue", kind: "record", content: "Compte rendu officiel de la dernière revue de direction." }
      ]
    },
    {
      id: 2,
      x: 750,
      y: 80,
      name: "Audits & Amélioration Continue",
      type: "management",
      description: "Planification des audits internes, gestion des non-conformités historiques et impulsion des dynamiques de progrès.",
      standards: ["ISO 9001"],
      attributes: [
        { key: "Pilote du processus", value: "Responsable Amélioration Continue" },
        { key: "Fréquence d'Audit", value: "Cycle annuel complet" },
        { key: "KPI Clé", value: "Taux de clôture à temps des CAPA (Cible > 90%)" }
      ],
      resources: [
        { name: "PR-AC-20 Gestion des non-conformités", kind: "procedure", content: "Procédure régissant la capture des anomalies et le montage des CAPA." }
      ]
    },
    {
      id: 3,
      x: 100,
      y: 300,
      name: "Relation Client & Ventes",
      type: "core",
      description: "Prise en compte des exigences clients, contractualisation et évaluation de la satisfaction globale.",
      standards: ["ISO 9001"],
      attributes: [
        { key: "Pilote du processus", value: "Directeur Commercial" },
        { key: "Indicateur", value: "NPS (Net Promoter Score) - Cible > 45" }
      ],
      resources: [
        { name: "PR-COM-01 Revue de contrat", kind: "procedure", content: "Protocole de validation technique et financière des commandes complexes." }
      ]
    },
    {
      id: 4,
      x: 400,
      y: 300,
      name: "R&D - Conception Produit",
      type: "core",
      description: "Études de faisabilité, éco-conception pour réduction d'impact environnemental, validation et prototypage.",
      standards: ["ISO 9001", "ISO 14001"],
      attributes: [
        { key: "Pilote du processus", value: "Chef de projet R&D" },
        { key: "Éco-conception", value: "Analyse du cycle de vie intégrée dès l'étape d'idéation." }
      ],
      resources: [
        { name: "PR-RD-04 Jalons de conception", kind: "procedure", content: "Passage des portes de conception avec validation QHSE intégrée." }
      ]
    },
    {
      id: 5,
      x: 700,
      y: 300,
      name: "Achats & Logistique",
      type: "core",
      description: "Sélection des matières premières, notation environnementale et sociale des fournisseurs (Critères CSR), logistique interne.",
      standards: ["ISO 9001", "ISO 14001"],
      attributes: [
        { key: "Pilote du processus", value: "Responsable Supply Chain" },
        { key: "KPI Clé", value: "Taux de fournisseurs certifiés ISO 14001 (>75%)" }
      ],
      resources: [
        { name: "PR-ACH-02 Charte Achats Durables", kind: "procedure", content: "Critères d'évaluation appliqués à tous les sous-traitants et fournisseurs." }
      ]
    },
    {
      id: 6,
      x: 1000,
      y: 300,
      name: "Production & Opérations",
      type: "core",
      description: "Transformation des matières et assemblage sur les lignes industrielles. Suivi rigoureux de l'efficacité et de l'efficience.",
      standards: ["ISO 9001", "ISO 14001", "ISO 45001"],
      attributes: [
        { key: "Pilote du processus", value: "Directeur d'Usine" },
        { key: "Objectif OEE", value: "Supérieur à 82%" },
        { key: "KPI Énergie", value: "kWh consommés par tonne produite" }
      ],
      resources: [
        { name: "WI-PRD-10 Consignes poste de découpage", kind: "instruction", content: "Règles opératoires et de sécurité critiques." }
      ]
    },
    {
      id: 7,
      x: 1300,
      y: 300,
      name: "Contrôle Qualité & Métrologie",
      type: "core",
      description: "Vérifications intermédiaires, tests finaux de conformité produits et gestion du parc d'instruments de mesure.",
      standards: ["ISO 9001"],
      attributes: [
        { key: "Pilote du processus", value: "Responsable Qualité" },
        { key: "Indicateur", value: "Taux de non-conformité usine (<0.4%)" }
      ],
      resources: [
        { name: "PR-QA-08 Contrôle libératoire", kind: "procedure", content: "Étapes de validation finale avant expédition." }
      ]
    },
    {
      id: 8,
      x: 200,
      y: 530,
      name: "Ressources Humaines & Compétences",
      type: "support",
      description: "Gestion des habilitations de sécurité obligatoires, plan de développement des compétences et recrutement.",
      standards: ["ISO 45001"],
      attributes: [
        { key: "Pilote du processus", value: "Responsable RH" },
        { key: "Suivi Habilitations", value: "100% à jour (électrique, cariste, etc.)" }
      ],
      resources: [
        { name: "PR-HR-03 Accueil Nouveaux Entrants", kind: "procedure", content: "Protocole d'intégration avec sensibilisation QHSE obligatoire." }
      ]
    },
    {
      id: 9,
      x: 550,
      y: 530,
      name: "Maintenance & Équipements",
      type: "support",
      description: "Maintenance préventive des infrastructures de sécurité, interventions curatives et plan de calibration annuel.",
      standards: ["ISO 9001", "ISO 14001", "ISO 45001"],
      attributes: [
        { key: "Pilote du processus", value: "Responsable Maintenance" },
        { key: "Taux préventif", value: "Cible > 80% des interventions totales" }
      ],
      resources: [
        { name: "PR-MNT-01 Calendrier préventif", kind: "procedure", content: "Planification automatique sous GMAO." }
      ]
    },
    {
      id: 10,
      x: 900,
      y: 530,
      name: "Support QHSE & Sécurité Site",
      type: "support",
      description: "Analyse environnementale, évaluation des risques professionnels (Document Unique), veille réglementaire et inspections d'usine.",
      standards: ["ISO 14001", "ISO 45001"],
      attributes: [
        { key: "Pilote du processus", value: "Ingénieur QHSE" },
        { key: "Inspection", value: "Visites terrain bi-mensuelles" },
        { key: "Indicateur sécurité", value: "Taux de gravité des accidents (Cible: 0)" }
      ],
      resources: [
        { name: "REG-ENV-01 Veille réglementaire", kind: "record", content: "Registre de conformité aux décrets environnementaux nationaux." },
        { name: "DUER 2026", kind: "record", content: "Document Unique d'Évaluation des Risques du site industriel." }
      ]
    },
    {
      id: 11,
      x: 50,
      y: 90,
      name: "Autorités & Régulateurs (DREAL)",
      type: "party",
      description: "DREAL, Inspections du travail et organismes de contrôle exigeant la stricte conformité réglementaire environnementale et de sécurité.",
      standards: ["Other"],
      attributes: [
        { key: "Type de tiers", value: "Organisme Régulateur" },
        { key: "Exigence majeure", value: "Conformité REACH, contrôles réglementaires périodiques (VGP) et déclarations de sécurité." }
      ],
      partyRelevance: "pertinent",
      partyRelevanceEvaluation: "Crucial pour maintenir l'autorisation d'exploiter du site et éviter tout risque d'arrêt d'activité ou d'amende administrative.",
      resources: []
    },
    {
      id: 13,
      x: 50,
      y: 250,
      name: "Clients Finaux (Marché)",
      type: "client",
      description: "Clients et distributeurs exigeant des livraisons de produits entièrement conformes, sans défaut et dans les délais convenus.",
      standards: ["ISO 9001"],
      attributes: [
        { key: "Type de tiers", value: "Client Final" },
        { key: "Exigence majeure", value: "Qualité zéro défaut (PPM), taux de service de livraison (OTIF) supérieur à 95%." }
      ],
      clientSatisfaction: 5,
      clientSatisfactionPercentage: 92,
      clientSatisfactionComments: "Très bon taux de service général, réactivité appréciée sur le support technique et le développement.",
      resources: []
    },
    {
      id: 12,
      x: 1550,
      y: 300,
      name: "Client Privilégié - Automotive SA",
      type: "client",
      description: "Constructeur automobile de premier rang exigeant un niveau de service zéro défaut et une réactivité totale.",
      standards: ["ISO 9001"],
      attributes: [
        { key: "Contact Clé", value: "Acheteur Senior - M. Dupont" },
        { key: "Exigence Qualité", value: "PPM Client < 50" }
      ],
      resources: [],
      clientSatisfaction: 4,
      clientSatisfactionPercentage: 85,
      clientSatisfactionComments: "Excellente réactivité sur le dernier lot d'échantillons, mais demande une amélioration sur le suivi des délais de livraison."
    }
  ],
  edges: [
    {
      id: 1,
      from: 13,
      to: 3,
      name: "Commande & Exigences spécifiques",
      type: "feedback",
      description: "Transmission des besoins des clients et cahiers des charges d'homologation réglementaire.",
      attributes: [],
      resources: []
    },
    {
      id: 2,
      from: 3,
      to: 4,
      name: "Fiche d'opportunité produit",
      type: "info",
      description: "Brief commercial décrivant les exigences fonctionnelles et environnementales du marché.",
      attributes: [],
      resources: []
    },
    {
      id: 3,
      from: 4,
      to: 5,
      name: "Nomenclature & Liste de matériaux validés",
      type: "document",
      description: "Fiche technique des matières requises avec validation de non-toxicité réglementaire.",
      attributes: [],
      resources: []
    },
    {
      id: 4,
      from: 5,
      to: 6,
      name: "Approvisionnement composants",
      type: "io",
      description: "Livraison physique des matières premières vérifiées en magasin.",
      attributes: [],
      resources: []
    },
    {
      id: 5,
      from: 6,
      to: 7,
      name: "Produit fini assemblé",
      type: "io",
      description: "Transfert des lots finis pour contrôle qualité obligatoire avant mise en conteneur.",
      attributes: [],
      resources: []
    },
    {
      id: 6,
      from: 7,
      to: 13,
      name: "Livraisons & Certificats de conformité COA",
      type: "document",
      description: "Soumission des produits conformes avec rapports d'essais finaux.",
      attributes: [],
      resources: []
    },
    {
      id: 7,
      from: 10,
      to: 6,
      name: "Analyses de risques & Consignes de sécurité",
      type: "feedback",
      description: "Revues périodiques de sécurité machine et fiches d'exposition adaptées.",
      attributes: [],
      resources: []
    },
    {
      id: 8,
      from: 6,
      to: 2,
      name: "Remontées d'anomalies terrain",
      type: "info",
      description: "Signalement des micro-arrêts et dérives de processus sous forme d'audits flash ou tickets.",
      attributes: [],
      resources: []
    },
    {
      id: 9,
      from: 2,
      to: 1,
      name: "Bilan annuel CAPA & Performance audits",
      type: "document",
      description: "Rapport agrégé synthétisant les forces et axes d'amélioration pour la gouvernance.",
      attributes: [],
      resources: []
    },
    {
      id: 10,
      from: 1,
      to: 8,
      name: "Besoins de compétences stratégiques",
      type: "info",
      description: "Identification des manques de compétences clés lors du comité d'exercice stratégique.",
      attributes: [],
      resources: []
    },
    {
      id: 11,
      from: 7,
      to: 12,
      name: "Livraisons Qualifiées & Rapports d'Essais",
      type: "document",
      description: "Envoi périodique des certificats de conformité (COA) et enquêtes de satisfaction.",
      attributes: [],
      resources: []
    },
    {
      id: 12,
      from: 10,
      to: 11,
      name: "Déclarations réglementaires & Rapports",
      type: "document",
      description: "Transmission des registres de suivi des déchets, du DUER et rapports de contrôles officiels.",
      attributes: [],
      resources: []
    }
  ],
  capas: [
    {
      id: "CAPA-2026-001",
      title: "Non-respect récurrent du port des protections auditives en zone Emboutissage",
      description: "Constat répété d'opérateurs ne portant pas leurs bouchons moulés individuels lors des audits de sécurité de niveau 1. Risque d'altération de l'audition à long terme.",
      type: "corrective",
      source: "internal_audit",
      status: "ongoing",
      priority: "high",
      owner: "Ingénieur QHSE",
      creationDate: "2026-05-10",
      targetDate: "2026-07-20",
      linkedProcessId: 10,
      rootCauseAnalysis: {
        fiveWhys: [
          "Les opérateurs ne portent pas les bouchons en permanence sur ligne.",
          "Les bouchons provoquent une gêne / démangeaison après 2h d'utilisation continue.",
          "Aucun modèle alternatif n'est proposé aux personnes sensibles.",
          "Le catalogue d'EPI validé au niveau national est unique et rigide.",
          "Aucun retour d'expérience n'a été mené auprès du service achats pour assouplir la politique."
        ],
        ishikawa: {
          manpower: ["Sensibilisation insuffisante au risque sonore à long terme", "Biais d'habitude chez les opérateurs expérimentés"],
          machines: ["Absence de signalisation sonore automatique en entrée de zone"],
          materials: ["Moulage des bouchons mal réalisé ou inadapté à la morphologie de certains conduits"],
          methods: ["Audit de sécurité trop espacé pour maintenir la rigueur"],
          measurement: ["Mesures de décibels non affichées en temps réel sur la ligne"],
          environment: ["Chaleur importante favorisant la transpiration au niveau des oreilles"]
        }
      },
      actions: [
        {
          id: "act-1",
          title: "Organiser une réunion d'accueil terrain (Tool-box meeting) pour recueillir les avis ergonomiques",
          owner: "Chef d'équipe Production",
          targetDate: "2026-05-25",
          status: "done"
        },
        {
          id: "act-2",
          title: "Hokey-inspections et moulage de dépistage ORL pour les 4 cas sensibles identifiés",
          owner: "Médecine du travail",
          targetDate: "2026-06-30",
          status: "pending"
        },
        {
          id: "act-3",
          title: "Intégrer 2 modèles de casques à arceaux légers en alternative réglementaire",
          owner: "Acheteur EPI / Service Achats",
          targetDate: "2026-07-15",
          status: "pending"
        }
      ]
    },
    {
      id: "CAPA-2026-002",
      title: "Mise à jour du protocole de traitement des produits chimiques obsolètes",
      description: "Le tri des réactifs périmés du laboratoire de métrologie présente des risques de mélange de substances incompatibles. Nécessité de formaliser une filière dédiée rigoureuse.",
      type: "preventive",
      source: "risk_assessment",
      status: "completed",
      priority: "medium",
      owner: "Responsable HSE",
      creationDate: "2026-04-01",
      targetDate: "2026-06-15",
      completionDate: "2026-06-10",
      linkedProcessId: 7,
      rootCauseAnalysis: {
        fiveWhys: [
          "Mélange accidentel de solvants incompatibles évité de justesse.",
          "Les bouteilles de déchets n'avaient pas d'étiquetage normalisé.",
          "Le protocole d'étiquetage n'était pas imposé au laboratoire principal.",
          "La procédure de contrôle interne datait de 2018 et omettait le laboratoire chimie.",
          "Manque de mise à jour périodique de nos audits de conformité chimique."
        ],
        ishikawa: {
          manpower: ["Nouveaux chimistes non formés au protocole d'étiquetage d'élimination"],
          machines: [],
          materials: ["Bouteilles d'évacuation sans gabarit pré-imprimé"],
          methods: ["Procédure datant de 2018 non mise à jour suite à la réorganisation"],
          measurement: [],
          environment: ["Espace restreint de stockage intermédiaire favorisant les erreurs"]
        }
      },
      actions: [
        {
          id: "act-4",
          title: "Rédiger et valider la nouvelle procédure PR-LAB-12 sur les déchets chimiques dangereux",
          owner: "Chef de Labo QA",
          targetDate: "2026-04-30",
          status: "done"
        },
        {
          id: "act-5",
          title: "Mettre en place des casiers de rétention différenciés par couleur avec étiquetage SGH",
          owner: "Service logistique usine",
          targetDate: "2026-05-15",
          status: "done"
        },
        {
          id: "act-6",
          title: "Former l'équipe du laboratoire aux fiches de sécurité de compatibilité",
          owner: "Responsable HSE",
          targetDate: "2026-06-10",
          status: "done"
        }
      ]
    }
  ],
  risks: [
    {
      id: "RISK-01",
      title: "Rupture de chaîne d'approvisionnement sur les cartes de régulation",
      description: "Le fournisseur unique de cartes de régulation traverse des difficultés financières. Risque d'arrêt de la ligne d'assemblage principale.",
      linkedProcessId: 5,
      category: "operational",
      owner: "Responsable Achats",
      probabilityBefore: 4,
      impactBefore: 4,
      scoreBefore: 16,
      probabilityAfter: 2,
      impactAfter: 4,
      scoreAfter: 8,
      mitigationPlan: "Identification d'un second fournisseur européen alternatif en cours d'homologation (Processus R&D). Relèvement du stock de sécurité de 2 à 6 semaines.",
      status: "treated"
    },
    {
      id: "RISK-02",
      title: "Incident d'hybridation ou pollution accidentelle du bassin d'orage réglementaire",
      description: "Lessivage accidentel de lubrifiants lors des déchargements en cour extérieure en cas d'orage de forte intensité.",
      linkedProcessId: 10,
      category: "environmental",
      owner: "Ingénieur QHSE",
      probabilityBefore: 3,
      impactBefore: 4,
      scoreBefore: 12,
      probabilityAfter: 1,
      impactAfter: 4,
      scoreAfter: 4,
      mitigationPlan: "Installation d'un obturateur pneumatique d'urgence sur la conduite finale activable en un point central. Distribution de kits anti-pollution mobiles aux postes de déchargement.",
      status: "monitored"
    },
    {
      id: "RISK-03",
      title: "Accident grave lors du levage des outils lourds sur la presse 400T",
      description: "Coincement ou chute d'outil lourd lors des changements de série de production si les élingues de levage sont usées ou le pont mal téléguidé.",
      linkedProcessId: 6,
      category: "health_safety",
      owner: "Directeur d'Usine",
      probabilityBefore: 2,
      impactBefore: 5,
      scoreBefore: 10,
      probabilityAfter: 1,
      impactAfter: 4,
      scoreAfter: 4,
      mitigationPlan: "Inspections magnétoscopiques trimestrielles des apparaux de levage. Formation initiale CACES pont à commande manuelle impérative pour les régleurs.",
      status: "treated",
      linkedCapaId: "CAPA-2026-001"
    }
  ],
  okrs: [
    {
      id: "OKR-2026-01",
      objective: "Renforcer l'excellence et la culture de sécurité absolue sur le site d'Usine Nord",
      period: "Année 2026",
      category: "safety",
      linkedProcessId: 10,
      owner: "Directeur de Site",
      status: "on_track",
      keyResults: [
        {
          id: "kr-1",
          description: "Atteindre zéro accident du travail avec arrêt sur toute la population interne et intérimaire",
          startValue: 3,
          targetValue: 0,
          currentValue: 0,
          unit: "accidents",
          weight: 2
        },
        {
          id: "kr-2",
          description: "Réaliser 100% des Visites Comportementales de Sécurité (VCS) planifiées par le comité de direction",
          startValue: 0,
          targetValue: 48,
          currentValue: 22,
          unit: "visites",
          weight: 1
        },
        {
          id: "kr-3",
          description: "Former l'ensemble du personnel de maintenance à l'habilitation de cadenassage complexe LOTO",
          startValue: 40,
          targetValue: 100,
          currentValue: 85,
          unit: "%",
          weight: 1
        }
      ]
    },
    {
      id: "OKR-2026-02",
      objective: "Optimiser les process industriels pour réduire les déchets et l'empreinte environnementale",
      period: "Q2-Q3 2026",
      category: "environment",
      linkedProcessId: 6,
      owner: "Directeur de Production",
      status: "on_track",
      keyResults: [
        {
          id: "kr-4",
          description: "Réduire le ratio de déchets industriels non valorisés en valorisant des rebuts de découpe thermoplastique",
          startValue: 12.4,
          targetValue: 5.0,
          currentValue: 8.2,
          unit: "%",
          weight: 2
        },
        {
          id: "kr-5",
          description: "Ajuster la vitesse des extracteurs d'air pour réduire la consommation énergétique hors production",
          startValue: 320,
          targetValue: 220,
          currentValue: 260,
          unit: "MWh",
          weight: 1.5
        }
      ]
    }
  ],
  qhseEvents: [
    {
      id: "EVT-2026-001",
      type: "accident",
      title: "Glissade d'un opérateur lors du nettoyage (Atelier Thermoformage)",
      description: "Un opérateur a glissé sur un film d'eau résiduel non balisé après le lavage de la zone. Chute sur le coude entraînant une ecchymose grave et un arrêt de travail temporaire.",
      date: "2026-06-12",
      time: "14:15",
      linkedProcessId: 6,
      severity: "high",
      status: "action_plan",
      immediateActions: "Balisage d'urgence immédiat, évacuation de l'exposé, rappel des consignes de nettoyage en présence d'opérateurs.",
      reportedBy: "Superviseur HSE",
      location: "Zone de thermoformage - Atelier Principal",
      linkedCapaId: undefined
    },
    {
      id: "EVT-2026-002",
      type: "incident",
      title: "Surchauffe sur l'arbre d'aspiration du système de découpe",
      description: "Alarme de température déclenchée suite à une obturation du collecteur de poussières plastiques. Pas d'incendie mais arrêt d'urgence de la ligne pendant 45 minutes.",
      date: "2026-06-18",
      time: "09:45",
      linkedProcessId: 6,
      severity: "medium",
      status: "reported",
      immediateActions: "Coupure de sécurité, nettoyage des grilles de filtration d'air, test d'échauffement à vide avant relance.",
      reportedBy: "Opérateur de Ligne",
      location: "Poste d'usinage / Sciage",
      linkedCapaId: undefined
    },
    {
      id: "EVT-2026-003",
      type: "non_conformity",
      title: "Absence de fiche de contrôle validée au poste d'extrusion",
      description: "Lors d'un audit de conformité du lot #EXT-2026-98, la fiche d'auto-contrôle dimensionnel de l'épaisseur n'était pas renseignée par l'opérateur.",
      date: "2026-06-19",
      time: "16:30",
      linkedProcessId: 2,
      severity: "medium",
      status: "analysing",
      immediateActions: "Mise en attente du lot concerné et prélèvements rétroactifs d'épaisseurs pour garantir la conformité externe.",
      reportedBy: "Contrôleur Qualité",
      location: "Atelier Extrusion",
      linkedCapaId: undefined
    }
  ],
  regulatoryRequirements: [
    {
      id: "REQ-2026-001",
      title: "Gestion et Tri à la Source des Déchets d'Emballages",
      source: "Code de l'environnement - Article R541-21-10",
      category: "legal",
      description: "Obligation de tri des déchets de papier, métal, plastique, verre et bois. Tenue à jour du registre des déchets sortants de l'usine.",
      linkedProcessId: 6,
      conforms: "compliant",
      frequency: "continuous",
      lastAuditDate: "2026-01-15",
      nextAuditDate: "2026-07-15",
      responsible: "Responsable Environnement & RSE",
      evaluationNotes: "Le registre de suivi est à jour. Les bacs de tri sont identifiés et vidés régulièrement par le prestataire agréé."
    },
    {
      id: "REQ-2026-002",
      title: "Contrôles Périodiques des Systèmes de Levage et Chariots",
      source: "Code du travail - Article R4323-23",
      category: "regulatory",
      description: "Vérification générale périodique (VGP) semestrielle des appareils de levage et des accessoires de manutention par un organisme agréé.",
      linkedProcessId: 6,
      conforms: "under_review",
      frequency: "quarterly",
      lastAuditDate: "2026-03-22",
      nextAuditDate: "2026-09-22",
      responsible: "Animateur HSE Terrain",
      evaluationNotes: "La dernière visite de Dekra a été faite, en attente de la réception du rapport officiel pour clôture formelle."
    },
    {
      id: "REQ-2026-003",
      title: "Enregistrement et Restrictions de Substances Chimiques (REACH)",
      source: "Règlement Européen (CE) n° 1907/2006 (REACH)",
      category: "legal",
      description: "Garantir que les colorants et additifs plastiques utilisés pour l'extrusion ne contiennent pas de SVHC au-delà de 0,1% p/p sans autorisation.",
      linkedProcessId: 2,
      conforms: "non_compliant",
      frequency: "annual",
      lastAuditDate: "2025-11-10",
      nextAuditDate: "2026-11-10",
      responsible: "Responsable Qualité & Laboratoire",
      evaluationNotes: "Un des nouveaux fournisseurs d'additifs n'a pas transmis sa déclaration de conformité REACH mise à jour. Relances techniques en cours."
    },
    {
      id: "REQ-2026-004",
      title: "Étalonnage Métrologique des Capteurs et Balances",
      source: "Norme ISO 9001 - Section 7.1.5",
      category: "normative",
      description: "Étalonnage annuel des têtes d'extrusion de précision et des micromètres d'épaisseur pour assurer la traçabilité des mesures.",
      linkedProcessId: 2,
      conforms: "compliant",
      frequency: "annual",
      lastAuditDate: "2026-02-05",
      nextAuditDate: "2027-02-05",
      responsible: "Métrologue Référent",
      evaluationNotes: "Tous les certificats d'étalonnage COFRAC sont à jour et enregistrés dans la base documentaire."
    }
  ],
  equipments: [
    {
      id: "EQP-2026-001",
      name: "Extrudeuse Haute Précision - EXT-02",
      category: "production",
      model: "PolymerX-5000",
      serialNumber: "SN-9281-PL",
      status: "operational",
      linkedProcessId: 2,
      criticality: "high",
      lastMaintenanceDate: "2026-02-10",
      nextMaintenanceDate: "2026-08-10",
      responsible: "Chef d'Atelier Extrusion",
      location: "Hall A - Ligne 2",
      description: "Extrudeuse principale pour la fabrication des gaines polyéthylène de précision."
    },
    {
      id: "EQP-2026-002",
      name: "Analyseur de Spectrométrie de Masse",
      category: "control_measure",
      model: "SpectroLab-Q4",
      serialNumber: "SN-1029-QM",
      status: "calibrated",
      linkedProcessId: 2,
      criticality: "medium",
      lastMaintenanceDate: "2026-03-05",
      nextMaintenanceDate: "2026-09-05",
      responsible: "Technicien de Métrologie",
      location: "Laboratoire de Contrôle Qualité",
      description: "Spectromètre utilisé pour contrôler la pureté chimique des matières premières reçues."
    },
    {
      id: "EQP-2026-003",
      name: "Compacteur à Déchets Hydraulique",
      category: "utility",
      model: "PressMax-400",
      serialNumber: "SN-4820-WS",
      status: "maintenance",
      linkedProcessId: 6,
      criticality: "medium",
      lastMaintenanceDate: "2026-05-18",
      nextMaintenanceDate: "2026-11-18",
      responsible: "Technicien Curatif Maintenance",
      location: "Zone de Gestion des Déchets - Cour Nord",
      description: "Compacteur principal pour la réduction du volume des emballages cartons et plastiques usagés."
    },
    {
      id: "EQP-2026-004",
      name: "Système d'Aspiration & Filtration des COV",
      category: "safety",
      model: "PureAir-99",
      serialNumber: "SN-5512-SF",
      status: "out_of_service",
      linkedProcessId: 6,
      criticality: "high",
      lastMaintenanceDate: "2025-12-01",
      nextMaintenanceDate: "2026-06-01",
      responsible: "Responsable Maintenance / HSE",
      location: "Zone d'alimentation Extrusion - Hall A",
      description: "Système d'extraction forcée des vapeurs et poussières fines. Ventilateur d'aspiration principal en panne, pièce de rechange en cours d'acheminement."
    }
  ],
  documents: [
    {
      id: "DOC-2026-001",
      title: "Procédure d'Extrusion Haute Précision - Polymères",
      code: "SOP-PROD-004",
      type: "sop",
      version: "v4.2",
      status: "approved",
      linkedProcessId: 6,
      createdBy: "Marc Dubois (Chef d'Atelier)",
      createdAt: "2026-01-15",
      lastUpdatedBy: "Emma Laurent (Resp. Qualité)",
      lastUpdatedAt: "2026-04-12",
      retentionPeriodYears: 10,
      storageLocation: "SrvDocs/SMI/SOP/SOP-PROD-004_v4.2.pdf",
      alcoaAssessment: {
        attributable: true,
        legible: true,
        contemporaneous: true,
        original: true,
        accurate: true,
        complete: true,
        consistent: true,
        enduring: true,
        available: true,
        notes: "Excellent niveau de conformité. Signatures électroniques cryptographiques actives. Traçabilité complète du cycle de vie sous ISO 9001 Section 7.5.3.",
        assessedBy: "Emma Laurent (Resp. Qualité)",
        assessedAt: "2026-04-12"
      },
      auditTrail: [
        { id: "TR-001", timestamp: "2026-01-15 10:00", user: "Marc Dubois", action: "creation", details: "Initialisation suite à l'achat du PolymerX-5000." },
        { id: "TR-002", timestamp: "2026-04-12 14:30", user: "Emma Laurent", action: "modification", details: "Mise à jour des paramètres critiques de réglulation température." },
        { id: "TR-003", timestamp: "2026-04-12 16:15", user: "Emma Laurent", action: "alcoa_assessment", details: "Validation de l'Audit ALCOA+. Score de conformité: 9/9." }
      ]
    },
    {
      id: "DOC-2026-002",
      title: "Enregistrement Pesée & Contrôle Dimensionnel Intermédiaire",
      code: "REC-QA-089",
      type: "record",
      version: "v1.0",
      status: "approved",
      linkedProcessId: 7,
      createdBy: "Julien Clerc (Technicien)",
      createdAt: "2026-06-18",
      lastUpdatedBy: "Julien Clerc (Technicien)",
      lastUpdatedAt: "2026-06-18",
      retentionPeriodYears: 5,
      storageLocation: "SrvDocs/SMI/Records/REC_QA_089_20260618.xlsx",
      alcoaAssessment: {
        attributable: true,
        legible: true,
        contemporaneous: true,
        original: true,
        accurate: true,
        complete: true,
        consistent: true,
        enduring: true,
        available: true,
        notes: "Données générées par connectivité de balance intelligente. Pas d'erreur de saisie humaine possible. Conforme CFR 21 Part 11.",
        assessedBy: "Julien Clerc",
        assessedAt: "2026-06-18"
      },
      auditTrail: [
        { id: "TR-004", timestamp: "2026-06-18 08:30", user: "Julien Clerc", action: "creation", details: "Enregistrement direct sur banc d'essai." },
        { id: "TR-005", timestamp: "2026-06-18 08:32", user: "System (Sensor API)", action: "modification", details: "Transmission automatique des valeurs de pesée par capteur." }
      ]
    },
    {
      id: "DOC-2026-003",
      title: "Manuel d'Analyse d'Impact Environnemental et Pollution",
      code: "MAN-HSE-002",
      type: "manual",
      version: "v3.0",
      status: "under_review",
      linkedProcessId: 10,
      createdBy: "Ingénieur HSE Réf.",
      createdAt: "2026-05-10",
      lastUpdatedBy: "Jean-Pierre Raffin (Consultant)",
      lastUpdatedAt: "2026-06-15",
      retentionPeriodYears: 15,
      storageLocation: "SrvDocs/SMI/HSE/MAN-HSE-002_DraftV3.docx",
      alcoaAssessment: {
        attributable: true,
        legible: true,
        contemporaneous: false,
        original: true,
        accurate: true,
        complete: false,
        consistent: true,
        enduring: true,
        available: true,
        notes: "Attention! Le document est toujours en retard d'approbation et manque de signatures de validation formelle. Le paragraphe 5.2 est incomplet (données de bruit d'usine manquantes). Statut bloqué tant qu'ALCOA+ est partiel.",
        assessedBy: "Emma Laurent (Resp. Qualité)",
        assessedAt: "2026-06-20"
      },
      auditTrail: [
        { id: "TR-006", timestamp: "2026-05-10 11:20", user: "HSE Referent", action: "creation", details: "Création du squelette Word suite aux retours de la DREAL." },
        { id: "TR-007", timestamp: "2026-06-15 15:00", user: "Jean-Pierre Raffin", action: "modification", details: "Ré-écriture de la section de calcul de rejets de solvants." },
        { id: "TR-008", timestamp: "2026-06-20 09:12", user: "Emma Laurent", action: "alcoa_assessment", details: "Refus de validation ALCOA+ pour absence de synchronicité et complétude de la base de mesure." }
      ]
    }
  ],
  audits: [
    {
      id: "AUD-2026-001",
      title: "Audit Interne du Processus Operatif Production",
      type: "internal",
      standards: ["ISO 9001", "ISO 14001", "ISO 45001"],
      linkedProcessId: 6,
      auditor: "Emma Laurent (Qualiticienne Sénior / IRCA)",
      auditee: "Marc Dubois (Directeur de Production)",
      scheduledDate: "2026-06-15",
      completedDate: "2026-06-16",
      status: "completed",
      objectives: "Vérifier la maîtrise des paramètres d'extrusion, la conformité du tri sélectif des déchets dangereux, et le port des EPI pour réduction des risques d'ateliers.",
      scope: "Lignes d'extrusion Polymères, local de stockage solvants et quai d'expédition chimie.",
      findings: [
        {
          id: "FND-001",
          type: "minor_nc",
          clause: "8.5.1",
          description: "Absence de mise à disposition de la Fiche de Données de Sécurité (FDS) au poste d'extrusion de plastique.",
          evidence: "Le classeur de sécurité du poste 3 contenait une version obsolète de la FDS de 2018.",
          linkedCapaId: "CAPA-2026-001"
        },
        {
          id: "FND-002",
          type: "conformity",
          clause: "8.1",
          description: "Renseignement systématique et rigoureux du dossier de lot et contrôle dimensionnel.",
          evidence: "Les 15 derniers dossiers inspectés contiennent toutes les signatures en temps réel avec validation ALCOA+.",
        },
        {
          id: "FND-003",
          type: "ofi",
          clause: "7.1.3",
          description: "Améliorer l'éclairage de la cabine de contrôle optique pour limiter la fatigue visuelle des pilotes.",
          evidence: "Niveau lumineux mesuré à 250 lux, ce qui est suffisant mais améliorable pour le confort ophtalmique."
        }
      ],
      summaryReport: "L'audit du processus Production s'est déroulé dans un excellent esprit de transparence opérationnelle. La maîtrise réglementaire est au rendez-vous. L'écart identifié (FDS obsolète) a été documenté et une action CAPA corrective a immédiatement été initiée par le pilote d'atelier. La maturité QHSE de l'équipe de production est remarquable.",
      iso19011PrinciplesChecked: {
        integrity: true,
        fairPresentation: true,
        professionalCare: true,
        confidentiality: true,
        independence: true,
        evidenceBased: true,
        riskBased: true
      }
    },
    {
      id: "AUD-2026-002",
      title: "Médiation Tierce Partie & Revue Leadership",
      type: "certification",
      standards: ["ISO 9001", "ISO 14001", "ISO 45001"],
      linkedProcessId: 1,
      auditor: "Céline Roux (Lead Auditeur SAS Bureau Veritas)",
      auditee: "Hugo Bernard (Directeur Général & CODIR)",
      scheduledDate: "2026-07-20",
      status: "scheduled",
      objectives: "Vérifier l'alignement des objectifs stratégiques (OKRs/KPIs) avec la politique QHSE de l'usine et évaluer le leadership direct.",
      scope: "Comité de Direction Générale, suivi financier, revues de direction 2025/2026 et communication interne.",
      findings: [],
      iso19011PrinciplesChecked: {
        integrity: true,
        fairPresentation: true,
        professionalCare: true,
        confidentiality: true,
        independence: true,
        evidenceBased: true,
        riskBased: true
      }
    },
    {
      id: "AUD-2026-003",
      title: "Vérification HSE & Échappements Fluides",
      type: "site_safety",
      standards: ["ISO 14001", "ISO 45001"],
      linkedProcessId: 10,
      auditor: "Olivier Picard (Responsable HSE)",
      auditee: "Stéphane Legrand (Réf. Maintenance)",
      scheduledDate: "2026-06-25",
      status: "in_progress",
      objectives: "Contrôler le programme d'inspections des disconnecteurs chimiques et l'arrosage automatique de secours incendie.",
      scope: "Bâtiment fluide intermédiaire B et zones SEVESO connexes.",
      findings: [
        {
          id: "FND-004",
          type: "observation",
          clause: "8.1.2",
          description: "La pression sur le compensateur B-12 présente des micro-oscillations bien qu'elle reste dans les clous opérationnels.",
          evidence: "Examen du graphe de pression hebdomadaire montrant une légère dérive cyclique de 0.2 bars."
        }
      ],
      iso19011PrinciplesChecked: {
        integrity: true,
        fairPresentation: true,
        professionalCare: true,
        confidentiality: true,
        independence: true,
        evidenceBased: true,
        riskBased: true
      }
    }
  ],
  nextId: 14
};
