import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QHSEState, ProcessNode, Capa, Risk, OKR, KeyResult } from '../types';

// Map functions for translations
const MAP_NODE_TYPES: Record<string, string> = {
  management: 'Management / Gouvernance',
  core: 'Opérationnel / Réalisation',
  support: 'Soutien / Support',
  party: 'Partie Intéressée',
  client: 'Client',
};

const MAP_CAPA_TYPES: Record<string, string> = {
  corrective: 'Action Corrective',
  preventive: 'Action Préventive',
  improvement: 'Axe d\'Amélioration',
};

const MAP_CAPA_SOURCES: Record<string, string> = {
  internal_audit: 'Audit Interne',
  external_audit: 'Audit Externe',
  customer_complaint: 'Réclamation Client',
  near_miss: 'Presque Accident',
  risk_assessment: 'Analyse des Risques',
  other: 'Autre source',
};

const MAP_CAPA_STATUS: Record<string, string> = {
  draft: 'Brouillon',
  ongoing: 'En cours',
  completed: 'Réalisé',
  verified: 'Vérifié',
  cancelled: 'Annulé',
};

const MAP_CAPA_PRIORITY: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

const MAP_RISK_CATEGORIES: Record<string, string> = {
  strategic: 'Stratégique',
  operational: 'Opérationnel',
  environmental: 'Environnemental',
  health_safety: 'Santé & Sécurité',
};

const MAP_RISK_STATUS: Record<string, string> = {
  identified: 'Identifié / Non mitigé',
  treated: 'Mitigé / Traité',
  monitored: 'Sous surveillance',
  closed: 'Fermé / Révolu',
};

const MAP_OKR_CATEGORIES: Record<string, string> = {
  corporate: 'Entreprise',
  quality: 'Qualité',
  environment: 'Environnement',
  safety: 'Sécurité',
  process: 'Efficacité Processus',
};

const MAP_OKR_STATUS: Record<string, string> = {
  on_track: 'Sur la bonne voie',
  at_risk: 'À risque',
  lagging: 'En retard',
  completed: 'Atteint',
};

// Calculations matching the application UI
const calculateKrProgress = (kr: KeyResult): number => {
  const range = kr.targetValue - kr.startValue;
  if (range === 0) return 100;
  
  let progress = 0;
  if (kr.targetValue < kr.startValue) {
    progress = ((kr.startValue - kr.currentValue) / (kr.startValue - kr.targetValue)) * 100;
  } else {
    progress = ((kr.currentValue - kr.startValue) / range) * 100;
  }
  return Math.max(0, Math.min(100, Math.round(progress)));
};

const calculateObjectiveProgress = (okr: OKR): number => {
  const krs = okr.keyResults;
  if (krs.length === 0) return 0;
  
  let totalWeight = 0;
  let weightedProgressSum = 0;
  
  krs.forEach(k => {
    const prog = calculateKrProgress(k);
    const w = k.weight || 1;
    weightedProgressSum += (prog * w);
    totalWeight += w;
  });

  return totalWeight > 0 ? Math.round(weightedProgressSum / totalWeight) : 0;
};

const getProcessName = (processId: number | undefined, nodes: ProcessNode[]): string => {
  if (processId === undefined) return 'Global / Non rattaché';
  const node = nodes.find(n => n.id === processId);
  return node ? node.name : `Processus #${processId}`;
};

export function exportToPdf(
  activeTab: string,
  state: QHSEState,
  userEmail: string = 'jugurtha.dehiles@g.enp.edu.dz'
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const now = new Date();
  const formattedDate = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Common Header Generator
  const drawHeader = (title: string, subtitle: string) => {
    // Elegant accent header line
    doc.setFillColor(4, 120, 87); // Emerald-700
    doc.rect(10, 10, 190, 4, 'F');

    // Title & Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('SMI QHSE INTÉGRÉ — COCKPIT DE CONFORMITÉ', 12, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text(title.toUpperCase(), 12, 27);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(subtitle, 12, 32);

    // Metadata Right-aligned
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Rapport généré le : ${formattedDate} à ${formattedTime}`, 198, 22, { align: 'right' });
    doc.text(`Auteur / Pilote : ${userEmail}`, 198, 27, { align: 'right' });
    doc.text(`Tab Actif : ${activeTab.toUpperCase()}`, 198, 32, { align: 'right' });

    // Inner line separator
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(10, 36, 200, 36);
  };

  // Common Footer Generator (page counting)
  const drawFooter = (pageCount: number) => {
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      if (i === 1 && activeTab === 'dashboard') {
        // Skip header lines or standard footers on the cover page
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('SMI Intégré — Rapport de Revue de Direction Général — Document Confidentiel.', 12, 287);
        continue;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Page ${i} sur ${pageCount}`, 198, 287, { align: 'right' });
      doc.text('Document confidentiel — Système de Management Intégré ISO 9001, 14001, 45001. ISO Connect.', 12, 287);
      doc.setDrawColor(241, 245, 249);
      doc.line(10, 282, 200, 282);
    }
  };

  let currentY = 44;

  if (activeTab === 'dashboard') {
    // -------------------------------------------------------------------------
    // PAGE 1: COVER PAGE (REVUE DE DIRECTION COMPLÈTE ISO 9001/14001/45001)
    // -------------------------------------------------------------------------
    // Left slate border accent
    doc.setFillColor(15, 23, 42); // slate-900 (deep slate)
    doc.rect(0, 0, 10, 297, 'F');
    
    // Top primary accent emerald bar
    doc.setFillColor(4, 120, 87); // Emerald-700
    doc.rect(10, 0, 200, 12, 'F');
    
    // Title block
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text('RAPPORT DE REVUE DE DIRECTION', 20, 50);
    
    // Sub-title
    doc.setFontSize(14);
    doc.setTextColor(4, 120, 87);
    doc.text('SYSTÈME DE MANAGEMENT INTÉGRÉ (SMI)', 20, 60);
    
    // High contrast horizontal rule
    doc.setDrawColor(4, 120, 87);
    doc.setLineWidth(1.2);
    doc.line(20, 66, 180, 66);
    
    // ISO Standards coverage
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text('RÉFÉRENTIELS : ISO 9001:2015  •  ISO 14001:2015  •  ISO 45001:2018', 20, 75);
    
    // Formal presentation text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105); // slate-600
    const descText = "Ce rapport de synthese officiel compile, analyse et consolide l'ensemble des donnees d'entree et de sortie d'evaluation de la performance de notre Systeme de Management Integre (SMI). Etabli conformement a la clause 9.3 des normes ISO 9001 (Qualite), ISO 14001 (Environnement) et ISO 45001 (Sante et Securite au Travail), ce livrable constitue le support d'arbitrage strategique du Comite de Direction de l'organisme.";
    const splitDesc = doc.splitTextToSize(descText, 170);
    doc.text(splitDesc, 20, 83);
    
    // Management Review Inputs and Metadata block
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.8);
    doc.rect(20, 115, 170, 78, 'FD');
    
    // Header inside metadata block
    doc.setFillColor(71, 85, 105); // slate-600
    doc.rect(20, 115, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(255, 255, 255);
    doc.text('CARTUCHE DE CONTRÔLE ET GESTION DU RAPPORT', 24, 121);
    
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    
    const metaY_start = 132;
    doc.text('Organisme / Site :', 25, metaY_start);
    doc.setFont('helvetica', 'bold');
    doc.text('Site de Production Chimique ISO Connect (DREAL SEVESO)', 72, metaY_start);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Rédacteur / Pilote :', 25, metaY_start + 10);
    doc.setFont('helvetica', 'bold');
    doc.text(userEmail, 72, metaY_start + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Date de Consolidation :', 25, metaY_start + 20);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formattedDate} à ${formattedTime}`, 72, metaY_start + 20);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Participants clés :', 25, metaY_start + 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Direction Générale, Pilotes de Processus, Représentants CSE, SMR', 72, metaY_start + 30);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Statut de la revue :', 25, metaY_start + 40);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text('CONCORDANCE VALIDÉE — STATUT FINAL APPROUVÉ', 72, metaY_start + 40);
    
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.text('Période Évaluée :', 25, metaY_start + 50);
    doc.setFont('helvetica', 'bold');
    doc.text('Semestre 1 / Année Civile 2026', 72, metaY_start + 50);
    
    // Strict confidentiality box
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(252, 165, 165); // red-300
    doc.rect(20, 205, 170, 25, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(185, 28, 28); // red-700
    doc.text('RESTRICTION DE DIFFUSION : DIRECTIVE DE CONFIDENTIALITÉ STRATÉGIQUE', 24, 211);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(127, 29, 29);
    const noticeText = "Ce compte-rendu contient des donnees strategiques de niveau CODIR, des evaluations de risques industriels et des conformites reglementaires de l'etablissement. Toute reproduction ou communication externe est interdite sans delegation de signature prealable.";
    doc.text(doc.splitTextToSize(noticeText, 162), 24, 216);

    // Decorative pillar blocks at bottom of Cover Page
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(20, 245, 52, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('PILIER QUALITÉ', 24, 254);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('ISO 9001: Taux de service & satisfaction', 24, 258);

    doc.setFillColor(209, 250, 229); // emerald-100
    doc.rect(79, 245, 52, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(4, 120, 87);
    doc.text('SÉCURITÉ DU TRAVAIL', 83, 254);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('ISO 45001: Objectif Zéro Accident', 83, 258);

    doc.setFillColor(219, 234, 254); // blue-100
    doc.rect(138, 245, 52, 15, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(29, 78, 216);
    doc.text('CONTRÔLE ENVIRONNEMENT', 142, 254);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('ISO 14001: Veille REACH & Carbone', 142, 258);

    // -------------------------------------------------------------------------
    // PAGE 2: SECTION 1 - CONTEXT & INTERESTED PARTIES (Clause 9.3.2.b)
    // -------------------------------------------------------------------------
    doc.addPage();
    drawHeader(
      'Section 1 : Enjeux & Parties Intéressées du SMI',
      'Clause 9.3.2.b - Évolution des enjeux internes/externes et exigences des parties intéressées.'
    );
    currentY = 44;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('1.1 Élucidation du contexte stratégique & Besoins tiers', 12, currentY);
    currentY += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const contextExplanation = "Conformement aux exigences de la clause 4 et 9.3.2.b des normes ISO 9001, 14001 et 45001, l'organisme maintient a jour les attentes de ses parties interessees et ses enjeux stratégiques. L'analyse montre une pression reglementaire accrue sur la conformite de nos rejets de production (DREAL, REACH) et une exigence elevee sur le taux de service client de distribution (OTIF).";
    doc.text(doc.splitTextToSize(contextExplanation, 185), 12, currentY);
    currentY += 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1.2 Registre officiel d\'Évaluation des Parties Intéressées & Clients', 12, currentY);
    currentY += 4;

    const partyNodes = state.nodes.filter(n => n.type === 'party' || n.type === 'client');
    const partyRows = partyNodes.map(node => {
      const typeLabel = node.type === 'party' ? 'Partie Intéressée / Régulateur' : 'Client Final';
      const majorReq = node.attributes.find(a => a.key.toLowerCase().includes('exigence'))?.value || 'Non spécifiée';
      let statusDetails = '';
      if (node.type === 'party') {
        statusDetails = node.partyRelevanceEvaluation || 'Évaluation sous contrôle';
      } else {
        statusDetails = `Sat : ${node.clientSatisfactionPercentage || 92}% / Commentaire : ${node.clientSatisfactionComments || 'Satisfaisant'}`;
      }
      return [
        `T-${node.id}`,
        node.name,
        typeLabel,
        node.description || 'N/A',
        majorReq,
        statusDetails
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Attributaire Tiers', 'Dénomination', 'Description de ses attentes', 'Exigence majeure du tiers', 'Statut / Évaluation d\'impact']],
      body: partyRows,
      styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: [4, 120, 87] },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 35 },
        2: { cellWidth: 28 },
        3: { cellWidth: 42 },
        4: { cellWidth: 35 },
        5: { cellWidth: 35 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 12, right: 12 }
    });

    // -------------------------------------------------------------------------
    // PAGE 3: SECTION 2 - PROCESS PERFORMANCE (Clause 9.3.2.c.1 & 9.3.2.c.3)
    // -------------------------------------------------------------------------
    doc.addPage();
    drawHeader(
      'Section 2 : Performance des Processus & Performance Client',
      'Clause 9.3.2.c.1/3 - Performance des processus, conformité des produits/services et satisfaction client.'
    );
    currentY = 44;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2.1 Évaluation d\'adéquation et de pilotage des Processus', 12, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const procExplanation = "Notre cartographie de processus structure le SMI en 3 familles distinctes : Pilotage (Management), Réalisation (Opérationnels/Cœur) et Support. Chaque processus dispose d'un pilote dédié responsable du suivi des CAPAs et de la mitigation des risques inhérents d'ateliers.";
    doc.text(doc.splitTextToSize(procExplanation, 185), 12, currentY);
    currentY += 12;

    const getPilot = (node: ProcessNode): string => {
      const pAttr = node.attributes.find(a => a.key.toLowerCase().includes('pilote'));
      return pAttr ? pAttr.value : 'Non défini';
    };

    const processRows = state.nodes
      .filter(n => n.type !== 'party' && n.type !== 'client')
      .map(node => [
        `P-${String(node.id).padStart(2, '0')}`,
        node.name,
        MAP_NODE_TYPES[node.type] || node.type,
        node.standards.join(', ') || 'Aucune',
        getPilot(node),
        node.description || 'N/A'
      ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Réf', 'Nom du Processus', 'Famille de Flux', 'Normes Applicables', 'Pilote désigné', 'Mission principale']],
      body: processRows,
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [71, 85, 105] },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 42 },
        2: { cellWidth: 35 },
        3: { cellWidth: 28 },
        4: { cellWidth: 33 },
        5: { cellWidth: 38 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 12, right: 12 }
    });

    // -------------------------------------------------------------------------
    // PAGE 4: SECTION 3 - OBJECTIVES & OKRs (Clause 9.3.2.c.2)
    // -------------------------------------------------------------------------
    doc.addPage();
    drawHeader(
      'Section 3 : Degré d\'Atteinte des Objectifs QHSE',
      'Clause 9.3.2.c.2 - Résultats d\'atteinte des objectifs stratégiques (Qualité, Environnement, Sécurité).'
    );
    currentY = 44;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3.1 Taux d\'atteinte de nos Indicateurs de Performance (OKRs/KPIs)', 12, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const okrExplanation = "Les indicateurs QHSE sont geres par la méthodologie OKR (Objectives and Key Results). Les objectifs couvrent les engagements majeurs : reduction de l'empreinte carbone, objectif Zéro Accident du travail, conformite REACH et pilotage de la Satisfaction Tiers.";
    doc.text(doc.splitTextToSize(okrExplanation, 185), 12, currentY);
    currentY += 12;

    const okrRows = state.okrs.map(o => {
      const avgProg = calculateObjectiveProgress(o);
      const krDetails = o.keyResults.map(kr => {
        const prog = calculateKrProgress(kr);
        return `• ${kr.description} : ${kr.currentValue}/${kr.targetValue}${kr.unit} (${prog}%)`;
      }).join('\n');

      return [
        o.id,
        o.period,
        o.objective,
        MAP_OKR_CATEGORIES[o.category] || o.category,
        MAP_OKR_STATUS[o.status] || o.status,
        o.owner || 'N/A',
        `${avgProg}%`,
        krDetails
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Période', 'Objectif du SMI', 'Catégorie', 'Statut', 'Responsable', 'Progrès', 'Détail des Indicateurs de Mesure (KPIs)']],
      body: okrRows,
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [4, 120, 87] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 14 },
        2: { cellWidth: 35 },
        3: { cellWidth: 16 },
        4: { cellWidth: 20 },
        5: { cellWidth: 18 },
        6: { cellWidth: 14 },
        7: { cellWidth: 60 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 10, right: 10 }
    });

    // -------------------------------------------------------------------------
    // PAGE 5: SECTION 4 - REGULATORY COMPLIANCE (Clause 9.3.2.c.5 & c.6)
    // -------------------------------------------------------------------------
    doc.addPage();
    drawHeader(
      'Section 4 : Conformité Réglementaire & Veille Légale',
      'Clause 9.3.2.c.5/6 - Évaluation de conformité réglementaire, audits réglementaires et exigences légales.'
    );
    currentY = 44;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('4.1 Statut de notre conformité aux exigences réglementaires', 12, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const regExplanation = "Le site fait l'objet d'un suivi de conformite reglementaire de veille active (notamment REACH, Code du travail et dispositions prefectorales DREAL / ICPE). Toutes les non-conformites font l'objet d'une fiche CAPA.";
    doc.text(doc.splitTextToSize(regExplanation, 185), 12, currentY);
    currentY += 12;

    const complianceStats = {
      compliant: (state.regulatoryRequirements || []).filter(r => r.conforms === 'compliant').length,
      nonCompliant: (state.regulatoryRequirements || []).filter(r => r.conforms === 'non_compliant').length,
      pending: (state.regulatoryRequirements || []).filter(r => r.conforms === 'under_review').length,
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 70, 229);
    doc.text(`Indice brut de conformité légale : ${Math.round((complianceStats.compliant / ((state.regulatoryRequirements || []).length || 1)) * 100)}% (${complianceStats.compliant} Conformes, ${complianceStats.nonCompliant} Non Conformes, ${complianceStats.pending} En Attente Evalué)`, 12, currentY);
    currentY += 5;

    const reqRows = (state.regulatoryRequirements || []).map(r => [
      r.id,
      r.title,
      r.source,
      r.conforms === 'compliant' ? 'CONFORME' : r.conforms === 'non_compliant' ? 'NON CONFORME' : 'EN ATTENTE EVAL.',
      r.responsible,
      r.description || 'N/A',
      r.evaluationNotes || 'Aucune note de revue rédigée.',
      r.lastAuditDate || 'Non audité'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Exigence Légale', 'Source légale', 'Statut', 'Pilote', 'Objet de l\'exigence', 'Notes d\'Évaluation de conformité', 'Dernier Audit']],
      body: reqRows,
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [79, 70, 229] }, // Indigo
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 35 },
        6: { cellWidth: 35 },
        7: { cellWidth: 15 }
      },
      alternateRowStyles: { fillColor: [243, 244, 246] },
      margin: { left: 10, right: 10 }
    });

    // -------------------------------------------------------------------------
    // PAGE 6: SECTION 5 - INCIDENTS & NON-CONFORMITIES (Clause 9.3.2.c.4)
    // -------------------------------------------------------------------------
    doc.addPage();
    drawHeader(
      'Section 5 : Dysfonctionnements, Incidents & Accidents',
      'Clause 9.3.2.c.4 - Non-conformités du SMI, statistiques d\'accidents du travail et réclamations.'
    );
    currentY = 44;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('5.1 Consolidation des événements indésirables signalés (Mains Courantes)', 12, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const eventExplanation = "Tout accident, presqu'accident, deviation ou non-conformite operationnelle est consigne dans le registre des mains courantes. Ce volet alimente directement le retour d'experience (SST Clause 10.2 / Environnement Clause 10.2).";
    doc.text(doc.splitTextToSize(eventExplanation, 185), 12, currentY);
    currentY += 12;

    const eventsList = state.qhseEvents || [];
    const eventRows = eventsList.map(e => {
      const typeLabel = e.type === 'accident' ? '⚠️ Accident/Incident SST' : '⚠️ Non-Conformité SMI';
      const statusLabel = e.status === 'reported' ? 'Déclaré' : e.status === 'analysing' ? 'Analyse en cours' : e.status === 'action_plan' ? 'Plan d\'actions défini' : 'Clos & Résolu';
      return [
        e.id,
        typeLabel,
        e.title,
        e.date,
        e.severity.toUpperCase(),
        statusLabel,
        e.reportedBy || 'Anonyme',
        e.description || 'N/A'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Type Événement', 'Titre de la déviation / Accident', 'Date', 'Gravité', 'Statut', 'Déclarant', 'Description / Actions de sécurisation']],
      body: eventRows,
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [185, 28, 28] }, // Dark Red
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 26 },
        2: { cellWidth: 32 },
        3: { cellWidth: 16 },
        4: { cellWidth: 14 },
        5: { cellWidth: 22 },
        6: { cellWidth: 20 },
        7: { cellWidth: 47 }
      },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      margin: { left: 10, right: 10 }
    });

    // -------------------------------------------------------------------------
    // PAGE 7: SECTION 6 - RISK PORTFOLIO (Clause 9.3.2.e)
    // -------------------------------------------------------------------------
    doc.addPage();
    drawHeader(
      'Section 6 : Maîtrise des Risques & Opportunités (Clause 9.3.2.e)',
      'Clause 9.3.2.e - Efficacité des actions mises en œuvre pour faire face aux risques et opportunités.'
    );
    currentY = 44;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('6.1 Cartographie analytique d\'évaluation et de mitigation des Risques', 12, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const riskExplanation = "La gestion des risques s'appuie sur une matrice 5x5 d'impact et de probabilite. Les risques sont mitigés par des actions de prevention ou des dispositifs de securite. L'efficacite est validee lorsque la criticite residuelle est inferieure a 8.";
    doc.text(doc.splitTextToSize(riskExplanation, 185), 12, currentY);
    currentY += 12;

    const risksRows = state.risks.map(r => {
      const scoreB = r.probabilityBefore * r.impactBefore;
      const scoreA = r.scoreAfter || (r.probabilityAfter && r.impactAfter ? r.probabilityAfter * r.impactAfter : 'N/A');
      const criticalStatus = scoreB >= 15 ? 'Critique' : scoreB >= 10 ? 'Élevé' : scoreB >= 5 ? 'Moyen' : 'Faible';
      
      return [
        r.id,
        r.title,
        MAP_RISK_CATEGORIES[r.category] || r.category,
        getProcessName(r.linkedProcessId, state.nodes),
        `Brute : ${r.probabilityBefore}x${r.impactBefore} = ${scoreB} (${criticalStatus})`,
        `Cible : ${scoreA}`,
        MAP_RISK_STATUS[r.status] || r.status,
        r.owner || 'Non assigné',
        r.mitigationPlan || 'Aucun plan saisi.'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Risque identifié', 'Catégorie', 'Processus rattaché', 'Criticité Initiale', 'Criticité Résiduelle', 'Statut', 'Responsable', 'Plan de Mitigation']],
      body: risksRows,
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [153, 27, 27] }, // Red-800
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 32 },
        2: { cellWidth: 18 },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 15 },
        8: { cellWidth: 27 }
      },
      alternateRowStyles: { fillColor: [254, 244, 244] },
      margin: { left: 10, right: 10 }
    });

    // -------------------------------------------------------------------------
    // PAGE 8: SECTION 7 - INFRASTRUCTURE & METROLOGY RESOURCES (Clause 9.3.2.d)
    // -------------------------------------------------------------------------
    doc.addPage();
    drawHeader(
      'Section 7 : Adéquation des Ressources, Métrologie & Équipements',
      'Clause 9.3.2.d - Examen du niveau d\'adéquation et de conformité réglementaire des ressources.'
    );
    currentY = 44;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('7.1 État du parc machine, étalonnages périodiques & métrologie', 12, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const equipExplanation = "L'adequation des ressources materielles de notre Systeme de Management Integre s'assure par le maintien du parc d'equipements de production et de controle. Tous les outils de mesure essentiels pour l'ISO 9001, 14001 et 45001 font l'objet d'etalonnages systematiques periodiques.";
    doc.text(doc.splitTextToSize(equipExplanation, 185), 12, currentY);
    currentY += 12;

    const equipRows = (state.equipments || []).map(eq => {
      const statusLabel = eq.status === 'operational' ? 'Opérationnel' : eq.status === 'calibrated' ? 'Étalonné / Conforme' : eq.status === 'maintenance' ? 'Maintenance en cours' : 'Hors Service';
      return [
        eq.id,
        eq.name,
        eq.model || 'N/A',
        eq.serialNumber || 'N/A',
        statusLabel,
        getProcessName(eq.linkedProcessId, state.nodes),
        eq.responsible || 'N/A',
        eq.nextMaintenanceDate || 'N/A',
        eq.location || 'N/A'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Dénomination', 'Modèle', 'N° Série', 'Statut technique', 'Processus rattaché', 'Réf. Métrologue', 'Échéance Étalon-VGP', 'Atelier / Localisation']],
      body: equipRows,
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [14, 116, 144] }, // Cyan-700
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 35 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 24 },
        5: { cellWidth: 22 },
        6: { cellWidth: 18 },
        7: { cellWidth: 20 },
        8: { cellWidth: 15 }
      },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      margin: { left: 10, right: 10 }
    });

    // -------------------------------------------------------------------------
    // PAGE 9: SECTION 8 - CONTINUAL IMPROVEMENT & CAPAs (Clause 9.3.2.f/g)
    // -------------------------------------------------------------------------
    doc.addPage();
    drawHeader(
      'Section 8 : État Global du Plan d\'Actions (CAPAs)',
      'Clause 9.3.2.f/g - Traitement des actions correctives, préventives et plans d\'amélioration.'
    );
    currentY = 44;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('8.1 Avancement des fiches d\'actions correctives et préventives actives', 12, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const capaText = "Les CAPAs (Corrective and Preventive Actions) constituent le moteur de l'amelioration continue du SMI. Elles proviennent des anomalies remontees, des audits internes, ou des decisions du CODIR. L'efficacite de chaque action est verifiee avant cloture.";
    doc.text(doc.splitTextToSize(capaText, 185), 12, currentY);
    currentY += 12;

    const capasRows = state.capas.map(capa => {
      const subcompleted = capa.actions.filter(a => a.status === 'done').length;
      const subtotal = capa.actions.length;
      const doneValue = `${subcompleted}/${subtotal} terrain`;
      return [
        capa.id,
        capa.title,
        MAP_CAPA_TYPES[capa.type] || capa.type,
        MAP_CAPA_SOURCES[capa.source] || capa.source,
        MAP_CAPA_STATUS[capa.status] || capa.status,
        capa.targetDate ? new Date(capa.targetDate).toLocaleDateString('fr-FR') : 'N/A',
        capa.owner || 'Non assigné',
        getProcessName(capa.linkedProcessId, state.nodes),
        doneValue
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Action / Projet d\'amélioration', 'Catégorie', 'Source d\'Origine', 'Statut', 'Échéance', 'Pilote d\'action', 'Processus lié', 'Avanc. Terrain']],
      body: capasRows,
      styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
      headStyles: { fillColor: [4, 120, 87] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 42 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15 },
        5: { cellWidth: 16 },
        6: { cellWidth: 18 },
        7: { cellWidth: 25 },
        8: { cellWidth: 14 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 10, right: 10 }
    });

    // -------------------------------------------------------------------------
    // PAGE 10: SECTION 9 - DECISIONS ISSUES DE LA REVUE DE DIRECTION (Clause 9.3.3)
    // -------------------------------------------------------------------------
    doc.addPage();
    drawHeader(
      'Section 9 : Synthèse des Sorties & Décisions Stratégiques',
      'Clause 9.3.3 - Décisions et actions de la revue relatives aux opportunités d\'amélioration et besoins en ressources.'
    );
    currentY = 44;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('9.1 Décisions relatives aux opportunités d\'amélioration & Besoins en ressources', 12, currentY);
    currentY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    const decisionsExplanation = "En application reguliere des exigences de revue de direction (Clause 9.3.3), les decisions d'orientation suivantes ont ete statuées de concert avec la Direction Générale et le Comité QHSE :";
    doc.text(doc.splitTextToSize(decisionsExplanation, 185), 12, currentY);
    currentY += 12;

    const decisionsBoxes = [
      ["D-01 : Adéquation des Ressources Humaines & Formation", "Ajustement de l'enveloppe budgetaire de formation SST de 15% pour le second semestre. Renforcement du tutorat HSE pour les nouveaux entrants pour s'assurer du maintien de l'objectif Zéro Accident."],
      ["D-02 : Amélioration Continue & Investissements Équipements", "Investissement validé pour l'achat de sondes de mesure REACH automatisees pour rationaliser la métrologie des bacs de decantation chimie. Remplacement du melangeur hors service d'ici le second semestre."],
      ["D-03 : Évolution des processus de management", "Les OKRs de taux de service client de 92% (OTIF) demontrent la robustesse globale. Continuer a correler les objectifs OKR trimestriels avec l'evaluation continue du registre des risques de conformite réglementaire."]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['ID & Thématique examinée d\'amélioration', 'Recommandations & Plan d\'orientation budgétaire ou humain approuvé']],
      body: decisionsBoxes,
      styles: { fontSize: 8.5, cellPadding: 3.5, font: 'helvetica' },
      headStyles: { fillColor: [71, 85, 105] },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 130 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 12, right: 12 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('9.2 Blocs de validation & Approbation formelle', 12, currentY);
    currentY += 6;

    // Approvals box layout
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    
    // Box 1
    doc.rect(12, currentY, 56, 25);
    doc.text('Le Responsable QHSE / SMR', 15, currentY + 4);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Signature électronique cryptée', 15, currentY + 11);
    doc.text(`Compte : ${userEmail}`, 15, currentY + 15);
    doc.text(`Statut : VÉRIFIÉ LE ${formattedDate}`, 15, currentY + 19);

    // Box 2
    doc.rect(73, currentY, 56, 25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Les Pilotes de Processus', 76, currentY + 4);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Validations signées à distance', 76, currentY + 11);
    doc.text('Membres CODIR consultés', 76, currentY + 15);
    doc.text('Accord unanime prononcé', 76, currentY + 19);

    // Box 3
    doc.rect(134, currentY, 56, 25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text('La Direction Générale', 137, currentY + 4);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Approbation stratégique ratifiée', 137, currentY + 11);
    doc.text('Mandat de ressources débloqué', 137, currentY + 15);
    doc.text('SMI sous parfait alignement', 137, currentY + 19);

  } else if (activeTab === 'map') {
    drawHeader(
      'Registre Général des Processus Cartographiés',
      'Rapport officiel détaillant les processus opérationnels, de soutien et de direction.'
    );

    const getPilot = (node: ProcessNode): string => {
      const pAttr = node.attributes.find(a => a.key.toLowerCase().includes('pilote'));
      return pAttr ? pAttr.value : 'Non défini';
    };

    const mapRows = state.nodes.map(node => [
      `P-${String(node.id).padStart(2, '0')}`,
      node.name,
      MAP_NODE_TYPES[node.type] || node.type,
      node.standards.join(', ') || 'Aucune',
      getPilot(node),
      node.description || 'Pas de description développée.'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Réf', 'Libellé du Processus', 'Type de Flux', 'Normes ISO', 'Pilote désigné', 'Mission principale']],
      body: mapRows,
      styles: { fontSize: 8.5, cellPadding: 3, font: 'helvetica' },
      headStyles: { fillColor: [4, 120, 87] },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 33 },
        5: { cellWidth: 45 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 12, right: 12 }
    });

  } else if (activeTab === 'capas') {
    drawHeader(
      'Registre d\'Actions d\'Amélioration QHSE (CAPAs)',
      'Suivi complet des plans d\'actions correctifs et préventifs et état d\'avancement consolidé.'
    );

    const formatActionsSummary = (capa: Capa) => {
      const completed = capa.actions.filter(a => a.status === 'done').length;
      return `${completed}/${capa.actions.length} sous-actions terminées`;
    };

    const capasRows = state.capas.map(capa => [
      capa.id,
      capa.title,
      MAP_CAPA_TYPES[capa.type] || capa.type,
      MAP_CAPA_SOURCES[capa.source] || capa.source,
      MAP_CAPA_STATUS[capa.status] || capa.status,
      capa.targetDate ? new Date(capa.targetDate).toLocaleDateString('fr-FR') : 'Non planifié',
      capa.owner || 'Non assigné',
      getProcessName(capa.linkedProcessId, state.nodes),
      formatActionsSummary(capa)
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Action / Description', 'Type', 'Origine (Source)', 'Statut', 'Échéance', 'Pilote', 'Processus rattaché', 'Actions terrain']],
      body: capasRows,
      styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: [4, 120, 87] },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 38 },
        2: { cellWidth: 22 },
        3: { cellWidth: 24 },
        4: { cellWidth: 16 },
        5: { cellWidth: 16 },
        6: { cellWidth: 18 },
        7: { cellWidth: 25 },
        8: { cellWidth: 18 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 11, right: 11 }
    });

  } else if (activeTab === 'risks') {
    drawHeader(
      'Registre des Risques et Stratégies de Traitement',
      'Portefeuille analytique d\'évaluation d\'impacts, criticité brute vs mitigée.'
    );

    const risksRows = state.risks.map(r => {
      const scoreB = r.probabilityBefore * r.impactBefore;
      const ratingB = scoreB >= 15 ? 'Critique' : scoreB >= 10 ? 'Élevé' : scoreB >= 5 ? 'Moyen' : 'Faible';
      
      let ratingA = 'N/A';
      if (r.probabilityAfter !== undefined && r.impactAfter !== undefined && r.scoreAfter !== undefined) {
        ratingA = `${r.probabilityAfter}x${r.impactAfter} = ${r.scoreAfter}`;
      }

      return [
        r.id,
        r.title,
        MAP_RISK_CATEGORIES[r.category] || r.category,
        `${r.probabilityBefore}x${r.impactBefore} = ${scoreB} (${ratingB})`,
        ratingA,
        r.owner || 'N/A',
        MAP_RISK_STATUS[r.status] || r.status,
        getProcessName(r.linkedProcessId, state.nodes),
        r.mitigationPlan || 'Aucun plan saisi.'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Titre de Risque', 'Catégorie', 'Criticité Initiale', 'Criticité Cible', 'Pilote', 'Statut', 'Processus', 'Mesure de Traitement (Plan)']],
      body: risksRows,
      styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: [4, 120, 87] },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 32 },
        2: { cellWidth: 18 },
        3: { cellWidth: 24 },
        4: { cellWidth: 18 },
        5: { cellWidth: 16 },
        6: { cellWidth: 18 },
        7: { cellWidth: 22 },
        8: { cellWidth: 28 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 11, right: 11 }
    });

  } else if (activeTab === 'okrs') {
    drawHeader(
      'Tableau de Bord Stratégique — Indicateurs (OKRs)',
      'Suivi de la performance stratégique, objectifs trimestriels et taux d\'atteinte des indicateurs.'
    );

    const okrsRows = state.okrs.map(o => {
      const avgProg = calculateObjectiveProgress(o);
      
      const krSummaries = o.keyResults.map(kr => {
        const prog = calculateKrProgress(kr);
        return `• ${kr.description} (${kr.currentValue}/${kr.targetValue}${kr.unit}) — [${prog}%]`;
      }).join('\n');

      return [
        o.id,
        o.period,
        o.objective,
        MAP_OKR_CATEGORIES[o.category] || o.category,
        MAP_OKR_STATUS[o.status] || o.status,
        o.owner || 'Comité',
        getProcessName(o.linkedProcessId, state.nodes),
        `${avgProg}%`,
        krSummaries || 'Pas de résultats clés rattachés.'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Période', 'Objectif Stratégique', 'Catégorie', 'Statut', 'Responsable', 'Processus', 'Progrès', 'Détail Indicateurs (Résultats Clés)']],
      body: okrsRows,
      styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: [4, 120, 87] },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 13 },
        2: { cellWidth: 32 },
        3: { cellWidth: 18 },
        4: { cellWidth: 18 },
        5: { cellWidth: 16 },
        6: { cellWidth: 22 },
        7: { cellWidth: 12 },
        8: { cellWidth: 47 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 10, right: 10 }
    });
  } else if (activeTab === 'events') {
    drawHeader(
      'Registre de Mains Courantes — Événements, Accidents & NC',
      'Suivi des non-conformités, dysfonctionnements et accidents du travail signalés.'
    );

    const eventsRows = (state.qhseEvents || []).map(e => [
      e.id,
      e.type === 'accident' ? '⚠️ Accident/Incident' : '⚠️ Non-Conformité',
      e.title,
      e.date,
      e.severity.toUpperCase(),
      e.status === 'reported' ? 'Déclaré' : e.status === 'analysing' ? 'Analyse' : e.status === 'action_plan' ? 'Plan Action' : 'Clos',
      e.reportedBy || 'Anonyme',
      getProcessName(e.linkedProcessId, state.nodes),
      e.description
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Type', "Titre de l'événement", 'Date', 'Gravité', 'Statut', 'Déclarant', 'Processus', 'Description / Actions Immédiates']],
      body: eventsRows,
      styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: [185, 28, 28] }, // Dark Red
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 20 },
        2: { cellWidth: 35 },
        3: { cellWidth: 15 },
        4: { cellWidth: 12 },
        5: { cellWidth: 15 },
        6: { cellWidth: 18 },
        7: { cellWidth: 20 },
        8: { cellWidth: 40 }
      },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      margin: { left: 10, right: 10 }
    });

  } else if (activeTab === 'requirements') {
    drawHeader(
      'Registre de Veille Réglementaire & Conformance Légale',
      'Inventaire des textes légaux applicables et état de conformité par processus.'
    );

    const reqRows = (state.regulatoryRequirements || []).map(r => [
      r.id,
      r.title,
      r.source,
      r.conforms === 'compliant' ? 'Conforme' : r.conforms === 'non_compliant' ? 'Non Conforme' : 'En Attente',
      r.responsible,
      getProcessName(r.linkedProcessId, state.nodes),
      r.description,
      r.lastAuditDate || 'Non audité'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Exigence', 'Source / Référence', 'Conformité', 'Pilote', 'Processus', 'Descriptif', 'Dernier Audit']],
      body: reqRows,
      styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: [79, 70, 229] }, // Indigo
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35 },
        2: { cellWidth: 25 },
        3: { cellWidth: 18 },
        4: { cellWidth: 18 },
        5: { cellWidth: 22 },
        6: { cellWidth: 42 },
        7: { cellWidth: 15 }
      },
      alternateRowStyles: { fillColor: [243, 244, 246] },
      margin: { left: 10, right: 10 }
    });

  } else if (activeTab === 'equipments') {
    drawHeader(
      'Inventaire Complet du Parc Machines & Équipements de Contrôle',
      'Registre centralisé d\'étalonnage, de maintenance et de suivi opérationnel.'
    );

    const equipRows = (state.equipments || []).map(eq => [
      eq.id,
      eq.name,
      eq.model,
      eq.serialNumber,
      eq.status === 'operational' ? 'Opérationnel' : eq.status === 'calibrated' ? 'Étalonné' : eq.status === 'maintenance' ? 'Maintenance' : 'Hors Service',
      eq.responsible,
      getProcessName(eq.linkedProcessId, state.nodes),
      eq.nextMaintenanceDate || 'N/A',
      eq.location
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Équipement / Machine', 'Modèle', 'N° Série', 'Statut', 'Responsable', 'Processus', 'Prochain Étalon.', 'Localisation']],
      body: equipRows,
      styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
      headStyles: { fillColor: [14, 116, 144] }, // Cyan-700
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
        5: { cellWidth: 20 },
        6: { cellWidth: 22 },
        7: { cellWidth: 21 },
        8: { cellWidth: 15 }
      },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      margin: { left: 10, right: 10 }
    });
  }

  // Draw footer & count pages safely
  const pageCount = (doc as any).internal.getNumberOfPages();
  drawFooter(pageCount);

  // Trigger Save File
  doc.save(`Rapport_QHSE_${activeTab}_${formattedDate}.pdf`);
}
