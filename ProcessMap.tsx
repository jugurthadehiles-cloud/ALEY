import React, { useState, useRef, useEffect } from 'react';
import { 
  ProcessNode, 
  ProcessEdge, 
  Capa, 
  Risk, 
  OKR, 
  QhseEvent,
  RegulatoryRequirement,
  Equipment,
  DocumentedInfo,
  Attribute, 
  Resource,
  Audit
} from '../types';
import { 
  Plus, 
  Link2, 
  Trash2, 
  Wrench,
  ZoomIn, 
  ZoomOut, 
  Check, 
  FileText, 
  ExternalLink, 
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  AlertTriangle,
  Info,
  Layers,
  Download,
  Camera,
  X,
  Eye,
  Settings,
  User,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProcessMapProps {
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
  onChangeData: (data: { nodes: ProcessNode[]; edges: ProcessEdge[] }) => void;
  onQuickAddCapaForProcess: (processId: number) => void;
  onQuickAddRiskForProcess: (processId: number) => void;
  onQuickAddOkrForProcess: (processId: number) => void;
  onQuickAddEventForProcess: (processId: number, type: QhseEvent['type']) => void;
  onQuickAddRequirementForProcess: (processId: number) => void;
  onQuickAddEquipmentForProcess: (processId: number) => void;
  onQuickAddDocumentForProcess: (processId: number) => void;
  onQuickAddAuditForProcess?: (processId: number) => void;
  onSwitchTab: (tab: 'capas' | 'risks' | 'okrs' | 'events' | 'requirements' | 'equipments' | 'documents' | 'audits') => void;
}

const NODE_W = 212;
const NODE_H = 108;

const NODE_TYPES = {
  management: { label: 'Management', color: '#a78bfa' }, // violet
  core: { label: 'Opérationnel / Cœur', color: '#10b981' }, // emerald
  support: { label: 'Support / Soutien', color: '#3b82f6' }, // blue
  party: { label: 'Partie Intéressée', color: '#f59e0b' }, // amber
  client: { label: 'Client', color: '#ec4899' }, // pink
};

const EDGE_TYPES = {
  io: { label: 'Input / output', color: '#10b981', dash: '0' },
  info: { label: 'Information flow', color: '#3b82f6', dash: '6, 4' },
  document: { label: 'Document / record flow', color: '#f59e0b', dash: '2, 4' },
  feedback: { label: 'Requirement / feedback', color: '#a78bfa', dash: '3, 6' },
};

const RES_KINDS = {
  procedure: { label: 'Procédure', placeholder: 'Réf & Titre (ex: PR-QHSE-014 Gestion des déchets)' },
  record: { label: 'Enregistrement / Formulaire', placeholder: 'Réf & Titre (ex: FRM-12 Rapport d’incident)' },
  instruction: { label: 'Instruction de travail', placeholder: 'Consignes de poste précises...' },
  link: { label: 'Lien externe', placeholder: 'https://...' },
  note: { label: 'Note / Mémo', placeholder: 'Détails ou remarques importantes...' },
};

const STANDARDS = ['ISO 9001', 'ISO 14001', 'ISO 45001', 'ISO 50001', 'Autre'];

const NODE_ATTR_SUGGESTIONS = [
  'Pilote du processus',
  'Objectif principal',
  'Entrées clés',
  'Sorties clés',
  'Fréquence de revue',
  'KPI Principal',
];

const EDGE_ATTR_SUGGESTIONS = [
  'Format de transfert',
  'Fréquence d’échange',
  'Responsable de l’envoi',
  'Support (Digital/Papier)',
];

export const ProcessMap: React.FC<ProcessMapProps> = ({
  nodes,
  edges,
  capas,
  risks,
  okrs,
  qhseEvents = [],
  regulatoryRequirements = [],
  equipments = [],
  documents = [],
  audits = [],
  onChangeData,
  onQuickAddCapaForProcess,
  onQuickAddRiskForProcess,
  onQuickAddOkrForProcess,
  onQuickAddEventForProcess,
  onQuickAddRequirementForProcess,
  onQuickAddEquipmentForProcess,
  onQuickAddDocumentForProcess,
  onQuickAddAuditForProcess,
  onSwitchTab
}) => {
  const [selected, setSelected] = useState<{ type: 'node' | 'edge'; id: number } | null>(null);
  const [linkMode, setLinkMode] = useState<boolean>(false);
  const [pendingSource, setPendingSource] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [drawerTab, setDrawerTab] = useState<'info' | 'edit'>('info');
  const [nodeIdToConfirmDelete, setNodeIdToConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    setNodeIdToConfirmDelete(null);
    if (selected?.type === 'node') {
      setDrawerTab('info');
    }
  }, [selected?.id, selected?.type]);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: number;
    moved: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Keyboard deletion support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        e.preventDefault();
        if (selected.type === 'node') {
          handleDeleteNode(selected.id);
        } else {
          handleDeleteEdge(selected.id);
        }
      }
      if (e.key === 'Escape') {
        setLinkMode(false);
        setPendingSource(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, nodes, edges]);

  // Quick deletion helpers
  const handleDeleteNode = (id: number) => {
    const nextNodes = nodes.filter(n => n.id !== id);
    const nextEdges = edges.filter(e => e.from !== id && e.to !== id);
    onChangeData({ nodes: nextNodes, edges: nextEdges });
    setSelected(null);
    setNodeIdToConfirmDelete(null);
  };

  const handleDeleteEdge = (id: number) => {
    const nextEdges = edges.filter(e => e.id !== id);
    onChangeData({ nodes, edges: nextEdges });
    setSelected(null);
  };

  // Drag handlers
  const handleNodeMouseDown = (e: React.MouseEvent, n: ProcessNode) => {
    if (linkMode) return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragRef.current = {
      id: n.id,
      moved: false,
      startX: (e.clientX - rect.left) / zoom,
      startY: (e.clientY - rect.top) / zoom,
      origX: n.x,
      origY: n.y,
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const dx = x - drag.startX;
    const dy = y - drag.startY;

    if (Math.abs(dx) + Math.abs(dy) > 2) {
      drag.moved = true;
    }

    const updatedNodes = nodes.map(n => {
      if (n.id === drag.id) {
        return {
          ...n,
          x: Math.max(0, Math.floor(drag.origX + dx)),
          y: Math.max(0, Math.floor(drag.origY + dy)),
        };
      }
      return n;
    });

    onChangeData({ nodes: updatedNodes, edges });
  };

  const handleGlobalMouseUp = () => {
    dragRef.current = null;
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  // Action: Add new process node
  const handleAddNode = () => {
    const scrollLeft = canvasRef.current?.parentElement?.scrollLeft || 0;
    const scrollTop = canvasRef.current?.parentElement?.scrollTop || 0;
    
    // Position center-ish on screen
    const x = (scrollLeft + 150) / zoom + (Math.random() * 40 - 20);
    const y = (scrollTop + 120) / zoom + (Math.random() * 40 - 20);
    
    const maxId = nodes.reduce((max, n) => Math.max(max, n.id), 0);
    
    const newNode: ProcessNode = {
      id: maxId + 1,
      x: Math.max(20, Math.floor(x)),
      y: Math.max(20, Math.floor(y)),
      name: `Nouveau Processus`,
      type: 'core',
      description: 'Définissez le rôle et le périmètre de ce processus dans le SMI.',
      standards: [],
      attributes: [],
      resources: [],
    };

    onChangeData({ nodes: [...nodes, newNode], edges });
    setSelected({ type: 'node', id: newNode.id });
  };

  // Action: Reset entire process map
  const handleResetMap = () => {
    if (confirm("Voulez-vous vraiment vider toute la cartographie de processus ?")) {
      onChangeData({ nodes: [], edges: [] });
      setSelected(null);
      setPendingSource(null);
      setLinkMode(false);
    }
  };

  // Node Clicking
  const handleNodeClick = (e: React.MouseEvent, n: ProcessNode) => {
    if (dragRef.current?.moved) return;

    if (linkMode) {
      if (pendingSource === null) {
        setPendingSource(n.id);
      } else if (pendingSource !== n.id) {
        // Create edge
        const maxEdgeId = edges.reduce((max, edge) => Math.max(max, edge.id), 0);
        const newEdgeObj: ProcessEdge = {
          id: maxEdgeId + 1,
          from: pendingSource,
          to: n.id,
          name: '',
          type: 'io',
          description: '',
          attributes: [],
          resources: [],
        };
        onChangeData({ nodes, edges: [...edges, newEdgeObj] });
        setSelected({ type: 'edge', id: newEdgeObj.id });
        setPendingSource(null);
        setLinkMode(false);
      }
      return;
    }

    setSelected({ type: 'node', id: n.id });
  };

  // Helper ports and lines math
  const getPortPoint = (n: ProcessNode, otherCx: number, otherCy: number) => {
    const cx = n.x + NODE_W / 2;
    const cy = n.y + NODE_H / 2;
    const dx = otherCx - cx;
    const dy = otherCy - cy;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0 
        ? { x: n.x + NODE_W, y: cy, dir: 'r' as const } 
        : { x: n.x, y: cy, dir: 'l' as const };
    } else {
      return dy >= 0 
        ? { x: cx, y: n.y + NODE_H, dir: 'b' as const } 
        : { x: cx, y: n.y, dir: 't' as const };
    }
  };

  const getCtrlPoint = (p: { x: number; y: number; dir: 'r' | 'l' | 'b' | 't' }, ext: number) => {
    switch (p.dir) {
      case 'r': return { x: p.x + ext, y: p.y };
      case 'l': return { x: p.x - ext, y: p.y };
      case 'b': return { x: p.x, y: p.y + ext };
      case 't': return { x: p.x, y: p.y - ext };
    }
  };

  const getBezierPath = (p1: any, p2: any) => {
    const ext = 60;
    const c1 = getCtrlPoint(p1, ext);
    const c2 = getCtrlPoint(p2, ext);
    return `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  };

  const getBezierPoint = (p0: any, p1: any, p2: any, p3: any, t: number) => {
    const u = 1 - t;
    const x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
    const y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
    return { x, y };
  };

  // State entities getters
  const selectedNode = selected?.type === 'node' ? nodes.find(n => n.id === selected.id) : null;
  const selectedEdge = selected?.type === 'edge' ? edges.find(e => e.id === selected.id) : null;

  // Selected process metrics linked (CAPAs, Risks, OKRs)
  const linkedProcessCapas = selectedNode ? capas.filter(c => c.linkedProcessId === selectedNode.id) : [];
  const linkedProcessRisks = selectedNode ? risks.filter(r => r.linkedProcessId === selectedNode.id) : [];
  const linkedProcessOkrs = selectedNode ? okrs.filter(o => o.linkedProcessId === selectedNode.id) : [];
  const linkedProcessEvents = selectedNode ? qhseEvents.filter(e => e.linkedProcessId === selectedNode.id) : [];
  const linkedProcessRequirements = selectedNode ? regulatoryRequirements.filter(r => r.linkedProcessId === selectedNode.id) : [];
  const linkedProcessEquipments = selectedNode ? equipments.filter(eq => eq.linkedProcessId === selectedNode.id) : [];
  const linkedProcessDocuments = selectedNode ? documents.filter(d => d.linkedProcessId === selectedNode.id) : [];
  const linkedProcessAudits = selectedNode && audits ? audits.filter(a => a.linkedProcessId === selectedNode.id) : [];

  // EXPORT PROCESS MAP UTILITIES (SVG & PNG)
  const handleExportSVG = () => {
    if (nodes.length === 0) {
      alert("Aucun processus à exporter.");
      return null;
    }

    const escapeSvg = (str: string) => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Calculate bounding box of the active diagram to fit view beautifully
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs) - 80;
    const minY = Math.min(...ys) - 130;
    const maxX = Math.max(...xs.map(x => x + NODE_W)) + 80;
    const maxY = Math.max(...ys.map(y => y + NODE_H)) + 120;

    const width = Math.max(960, maxX - minX);
    const height = Math.max(720, maxY - minY);
    const viewBoxX = Math.max(0, Math.floor(minX));
    const viewBoxY = Math.max(0, Math.floor(minY));

    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${width} ${height}" width="${width}" height="${height}" style="background-color: #0b0f19; font-family: system-ui, -apple-system, sans-serif;">`;

    // Inject CSS styles for standard rendering
    svgString += `
      <style>
        .node-title { font-family: system-ui, -apple-system, sans-serif; font-size: 11px; font-weight: 700; fill: #ffffff; }
        .node-desc { font-family: system-ui, -apple-system, sans-serif; font-size: 8.5px; fill: #64748b; }
        .node-hdr { font-family: monospace, Courier, sans-serif; font-size: 8px; font-weight: 600; letter-spacing: 1px; }
        .edge-label { font-family: monospace, Courier, sans-serif; font-size: 8px; fill: #94a3b8; }
        .legend-title { font-family: system-ui, -apple-system, sans-serif; font-size: 10px; font-weight: 800; fill: #f8fafc; letter-spacing: 1px; }
        .legend-text { font-family: system-ui, -apple-system, sans-serif; font-size: 9px; fill: #cbd5e1; }
      </style>
    `;

    // Define dot grid pattern and marker arrows
    svgString += `
      <defs>
        <pattern id="grid-pattern-download" width="32" height="32" patternUnits="userSpaceOnUse" x="0" y="0">
          <circle cx="16" cy="16" r="1.2" fill="#334155" opacity="0.3" />
        </pattern>
    `;

    Object.entries(EDGE_TYPES).forEach(([key, t]) => {
      svgString += `
        <marker
          id="arrow-dl-${key}"
          markerWidth="7"
          markerHeight="7"
          refX="5.5"
          refY="2.5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0.5 L5.5,2.5 L0,4.5 Z" fill="${t.color}" />
        </marker>
      `;
    });

    svgString += `</defs>`;

    // Render underlying dark workspace pattern
    svgString += `<rect x="${viewBoxX}" y="${viewBoxY}" width="${width}" height="${height}" fill="#0b0f19" />`;
    svgString += `<rect x="${viewBoxX}" y="${viewBoxY}" width="${width}" height="${height}" fill="url(#grid-pattern-download)" />`;

    // Modern Header Title block inside vector canvas
    const textStartY = viewBoxY + 45;
    svgString += `
      <g>
        <rect x="${viewBoxX + 30}" y="${viewBoxY + 18}" width="${width - 60}" height="55" rx="8" fill="#090d16" stroke="#1e293b" stroke-width="1" />
        <text x="${viewBoxX + 45}" y="${textStartY}" font-family="system-ui, -apple-system, sans-serif" font-size="16px" font-weight="900" fill="#f8fafc" letter-spacing="-0.5px">SYSTÈME DE MANAGEMENT INTÉGRÉ — CARTOGRAPHIE DES PROCESSUS</text>
        <text x="${viewBoxX + 45}" y="${textStartY + 18}" font-family="system-ui, -apple-system, sans-serif" font-size="9.5px" fill="#475569">Rapport d&apos;interopérabilité des flux — Date de génération : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})}</text>
        <text x="${viewBoxX + width - 45}" y="${textStartY + 8}" text-anchor="end" font-family="monospace, Courier" font-size="12px" font-weight="900" fill="#10b981">V1.2.0-PRODUCTION</text>
      </g>
    `;

    // 1. Draw curves (bridges)
    edges.forEach(edge => {
      const src = nodes.find(n => n.id === edge.from);
      const dest = nodes.find(n => n.id === edge.to);
      if (!src || !dest) return;

      const srcCx = src.x + NODE_W / 2;
      const srcCy = src.y + NODE_H / 2;
      const destCx = dest.x + NODE_W / 2;
      const destCy = dest.y + NODE_H / 2;

      const p1 = getPortPoint(src, destCx, destCy);
      const p2 = getPortPoint(dest, srcCx, srcCy);
      const d = getBezierPath(p1, p2);

      const t = EDGE_TYPES[edge.type] || EDGE_TYPES.io;
      const strokeDash = t.dash !== '0' ? `stroke-dasharray="${t.dash}"` : '';

      svgString += `<path d="${d}" fill="none" stroke="${t.color}" stroke-width="1.8" ${strokeDash} marker-end="url(#arrow-dl-${edge.type})" />`;

      // Draw floating node label over curves
      const ext = 60;
      const c1 = getCtrlPoint(p1, ext);
      const c2 = getCtrlPoint(p2, ext);
      const mid = getBezierPoint(p1, c1, c2, p2, 0.5);
      const labelText = edge.name || t.label;
      const labelWidth = Math.max(64, labelText.length * 5.2 + 10);

      svgString += `
        <g>
          <rect x="${mid.x - labelWidth / 2}" y="${mid.y - 7}" width="${labelWidth}" height="14" rx="3" fill="#090d16" stroke="#1e293b" stroke-width="0.8" />
          <text x="${mid.x}" y="${mid.y + 3}" text-anchor="middle" font-family="monospace, Courier" font-size="7.5px" fill="#94a3b8">${escapeSvg(labelText)}</text>
        </g>
      `;
    });

    // 2. Draw nodes cards
    nodes.forEach(n => {
      const t = NODE_TYPES[n.type] || NODE_TYPES.core;

      svgString += `
        <g>
          <rect x="${n.x}" y="${n.y}" width="${NODE_W}" height="${NODE_H}" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1.5" />
          <path d="M ${n.x + 12} ${n.y} L ${n.x + NODE_W - 12} ${n.y} A 12 12 0 0 1 ${n.x + NODE_W} ${n.y + 12} L ${n.x + NODE_W} ${n.y + 24} L ${n.x} ${n.y + 24} L ${n.x} ${n.y + 12} A 12 12 0 0 1 ${n.x + 12} ${n.y} Z" fill="${t.color}" opacity="0.08" />
          <line x1="${n.x}" y1="${n.y + 24}" x2="${n.x + NODE_W}" y2="${n.y + 24}" stroke="#1e293b" stroke-width="1" />
          
          <text x="${n.x + 10}" y="${n.y + 16}" class="node-hdr" fill="${t.color}">${escapeSvg(t.label).toUpperCase()}</text>
          <text x="${n.x + NODE_W - 10}" y="${n.y + 16}" text-anchor="end" font-family="monospace, Courier" font-size="8.5px" fill="#475569" font-weight="700">#${n.id}</text>
      `;

      // Name wrap
      const processName = n.name || "Processus";
      let line1 = processName;
      let line2 = "";
      if (processName.length > 24) {
        const words = processName.split(' ');
        line1 = "";
        let i = 0;
        while (i < words.length && (line1 + words[i]).length <= 24) {
          line1 += words[i] + " ";
          i++;
        }
        line2 = words.slice(i).join(' ');
      }

      if (line2) {
        svgString += `
          <text x="${n.x + 12}" y="${n.y + 42}" class="node-title">${escapeSvg(line1.trim())}</text>
          <text x="${n.x + 12}" y="${n.y + 55}" class="node-title">${escapeSvg(line2.trim())}</text>
        `;
      } else {
        svgString += `
          <text x="${n.x + 12}" y="${n.y + 46}" class="node-title">${escapeSvg(line1.trim())}</text>
        `;
      }

      // Desc wrapping
      const desc = n.description || "";
      let descLines: string[] = [];
      const descWords = desc.split(' ');
      let currentLine = "";
      for (const word of descWords) {
        if ((currentLine + " " + word).length > 34) {
          descLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = currentLine ? currentLine + " " + word : word;
        }
        if (descLines.length === 2) break;
      }
      if (descLines.length < 2 && currentLine) {
        descLines.push(currentLine);
      }

      const descStartY = line2 ? 70 : 62;
      descLines.forEach((lineStr, lineIdx) => {
        svgString += `
          <text x="${n.x + 12}" y="${n.y + descStartY + (lineIdx * 11)}" class="node-desc">${escapeSvg(lineStr.length > 38 ? lineStr.substring(0, 35) + '...' : lineStr)}</text>
        `;
      });

      // Badges
      if (n.standards && n.standards.length > 0) {
        let badgeX = n.x + 12;
        n.standards.forEach(std => {
          const badgeWidth = std.length * 5 + 8;
          svgString += `
            <rect x="${badgeX}" y="${n.y + NODE_H - 22}" width="${badgeWidth}" height="13" rx="3" fill="#1e293b" />
            <text x="${badgeX + badgeWidth/2}" y="${n.y + NODE_H - 12}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="7px" font-weight="700" fill="#94a3b8">${escapeSvg(std)}</text>
          `;
          badgeX += badgeWidth + 4;
        });
      }

      // Anchor nodes points indicators
      svgString += `
          <circle cx="${n.x}" cy="${n.y + NODE_H/2}" r="1.5" fill="#1e293b" stroke="#334155" stroke-width="1" />
          <circle cx="${n.x + NODE_W}" cy="${n.y + NODE_H/2}" r="1.5" fill="#1e293b" stroke="#334155" stroke-width="1" />
        </g>
      `;
    });

    // 3. Draw Legend Card
    const legendX = viewBoxX + width - 365;
    const legendY = viewBoxY + height - 165;
    svgString += `
      <g>
        <rect x="${legendX}" y="${legendY}" width="335" height="140" rx="8" fill="#090d16" stroke="#1e293b" stroke-width="1.2" />
        <text x="${legendX + 12}" y="${legendY + 16}" class="legend-title">LÉGENDE DES SÉQUENCES SMI</text>

        <rect x="${legendX + 12}" y="${legendY + 28}" width="12" height="12" rx="2" fill="#a78bfa" />
        <text x="${legendX + 30}" y="${legendY + 37}" class="legend-text">Processus de Management</text>

        <rect x="${legendX + 12}" y="${legendY + 48}" width="12" height="12" rx="2" fill="#10b981" />
        <text x="${legendX + 30}" y="${legendY + 57}" class="legend-text">Processus Opérationnel / Cœur</text>

        <rect x="${legendX + 12}" y="${legendY + 68}" width="12" height="12" rx="2" fill="#3b82f6" />
        <text x="${legendX + 30}" y="${legendY + 77}" class="legend-text">Processus de Support</text>

        <rect x="${legendX + 12}" y="${legendY + 88}" width="12" height="12" rx="2" fill="#f59e0b" />
        <text x="${legendX + 30}" y="${legendY + 97}" class="legend-text">Partie Intéressée</text>

        <rect x="${legendX + 12}" y="${legendY + 108}" width="12" height="12" rx="2" fill="#ec4899" />
        <text x="${legendX + 30}" y="${legendY + 117}" class="legend-text">Client</text>

        <line x1="${legendX + 185}" y1="${legendY + 34}" x2="${legendX + 215}" y2="${legendY + 34}" stroke="#10b981" stroke-width="2" />
        <text x="${legendX + 222}" y="${legendY + 37}" class="legend-text">Flux Entrée-Sortie (E/S)</text>

        <line x1="${legendX + 185}" y1="${legendY + 54}" x2="${legendX + 215}" y2="${legendY + 54}" stroke="#3b82f6" stroke-width="2" stroke-dasharray="3,3" />
        <text x="${legendX + 222}" y="${legendY + 57}" class="legend-text">Flux d&apos;Information</text>

        <line x1="${legendX + 185}" y1="${legendY + 74}" x2="${legendX + 215}" y2="${legendY + 74}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="1,2" />
        <text x="${legendX + 222}" y="${legendY + 77}" class="legend-text">Flux d&apos;Enregistrements</text>
      </g>
    `;

    svgString += `</svg>`;
    return { svgString, width, height };
  };

  const downloadSVG = () => {
    try {
      const result = handleExportSVG();
      if (!result) return;
      const { svgString } = result;
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const cleanLink = document.createElement('a');
      cleanLink.href = url;
      cleanLink.download = `cartographie-processus-smi-${new Date().toISOString().split('T')[0]}.svg`;
      document.body.appendChild(cleanLink);
      cleanLink.click();
      document.body.removeChild(cleanLink);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Échec du téléchargement SVG", e);
      alert("Impossible d'exporter le fichier SVG.");
    }
  };

  const downloadPNG = () => {
    try {
      const result = handleExportSVG();
      if (!result) return;
      const { svgString, width, height } = result;

      const img = new Image();
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw neat theme background before overlay
            ctx.fillStyle = '#0b0f19';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0);
            
            const pngUrl = canvas.toDataURL('image/png');
            const cleanLink = document.createElement('a');
            cleanLink.href = pngUrl;
            cleanLink.download = `cartographie-processus-smi-${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(cleanLink);
            cleanLink.click();
            document.body.removeChild(cleanLink);
          } else {
            throw new Error("2D Context unavailable");
          }
        } catch (canvasErr) {
          console.warn("Échec du rendu Canvas/PNG (restreint par iframe). Déclenchement d'un téléchargement SVG de secours...", canvasErr);
          const cleanLink = document.createElement('a');
          cleanLink.href = url;
          cleanLink.download = `cartographie-processus-smi-${new Date().toISOString().split('T')[0]}.svg`;
          document.body.appendChild(cleanLink);
          cleanLink.click();
          document.body.removeChild(cleanLink);
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      img.onerror = (err) => {
        console.error("Échec de chargement de l'image SVG temporaire pour conversion PNG", err);
        const cleanLink = document.createElement('a');
        cleanLink.href = url;
        cleanLink.download = `cartographie-processus-smi-${new Date().toISOString().split('T')[0]}.svg`;
        document.body.appendChild(cleanLink);
        cleanLink.click();
        document.body.removeChild(cleanLink);
      };

      img.src = url;
    } catch (e) {
      console.error("Échec du téléchargement PNG", e);
      alert("Impossible de générer le fichier PNG.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-120px)] lg:overflow-hidden h-full overflow-y-auto w-full relative" id="process-map-container">
      
      {/* Visual Workspace Canvas */}
      <div className="flex-1 overflow-auto relative bg-slate-950/40 border border-slate-800 rounded-xl m-4 flex flex-col lg:h-full min-h-[500px] lg:min-h-0 shrink-0">
        
        {/* Dynamic Canvas Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 p-2 rounded-xl shadow-lg">
          <button
            id="canvas-add-node"
            onClick={handleAddNode}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" /> Nouveau Processus
          </button>
          
          <button
            id="canvas-toggle-link"
            onClick={() => {
              setLinkMode(!linkMode);
              setPendingSource(null);
            }}
            className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer ${
              linkMode 
                ? 'bg-amber-500 text-slate-950 font-bold animate-pulse' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <Link2 className="w-4 h-4" /> 
            {linkMode ? 'Clickez sur 2 processus...' : 'Relier les processus'}
          </button>

          <div className="w-[1px] h-6 bg-slate-800 self-center" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(prev => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
              className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
              title="Zoom arrière"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-medium text-slate-400 w-12 text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(1.5, Number((prev + 0.1).toFixed(2))))}
              className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer"
              title="Zoom avant"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-6 bg-slate-800 self-center" />

          {/* Export options */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={downloadSVG}
              className="bg-slate-800 hover:bg-slate-700 hover:text-emerald-400 text-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition"
              title="Exporter au format vectoriel (SVG)"
            >
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
              <span>SVG</span>
            </button>
            <button
              onClick={downloadPNG}
              className="bg-slate-800 hover:bg-slate-700 hover:text-emerald-400 text-slate-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition"
              title="Exporter comme Image (PNG)"
            >
              <Camera className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
              <span>PNG</span>
            </button>
          </div>

          <div className="w-[1px] h-6 bg-slate-800 self-center" />

          <button
            onClick={handleResetMap}
            className="text-slate-400 hover:text-red-400 text-xs font-medium px-2 py-1.5 hover:bg-red-950/20 rounded-lg cursor-pointer transition"
          >
            Remettre à zéro
          </button>
        </div>

        {/* Floating helper note */}
        {linkMode && (
          <div className="absolute top-18 left-4 z-10 bg-amber-500/20 text-amber-300 text-xs border border-amber-500/30 px-3/2 py-2 rounded-xl flex items-center gap-2 max-w-sm shadow-xl backdrop-blur">
            <Info className="w-4 h-4 flex-shrink-0" />
            <div>
              {pendingSource === null 
                ? 'Sélectionnez un processus source (clic gauche)...' 
                : `Source sélectionnée (#${pendingSource}). Sélectionnez maintenant un processus cible.`}
              <span className="block text-[10px] text-amber-400/80">Pressez Échap pour annuler</span>
            </div>
          </div>
        )}

        {/* Canvas Body wrapper */}
        <div 
          className="flex-1 relative overflow-auto min-h-[500px]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelected(null);
              setPendingSource(null);
            }
          }}
        >
          {nodes.length === 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-slate-500 max-w-sm pointers-even-none">
              <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="font-space font-semibold text-slate-300 text-md mb-2">Cartographie vide</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Ajoutez de nouveaux processus ou importez des données par défaut pour structurer votre Système de Management Intégré.
              </p>
            </div>
          )}

          {/* Zoomable Canvas Surface */}
          <div 
            ref={canvasRef}
            id="canvas"
            className="relative transform-origin-top-left"
            style={{ 
              width: '2400px', 
              height: '1500px',
              transform: `scale(${zoom})`,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }}
          >
            {/* SVG Link lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              <defs>
                {Object.entries(EDGE_TYPES).map(([key, t]) => (
                  <marker
                    key={key}
                    id={`arrow-${key}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="5"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill={t.color} />
                  </marker>
                ))}
              </defs>

              {/* Edge selection vectors */}
              {edges.map(edge => {
                const src = nodes.find(n => n.id === edge.from);
                const dest = nodes.find(n => n.id === edge.to);
                if (!src || !dest) return null;

                const srcCx = src.x + NODE_W / 2;
                const srcCy = src.y + NODE_H / 2;
                const destCx = dest.x + NODE_W / 2;
                const destCy = dest.y + NODE_H / 2;

                const p1 = getPortPoint(src, destCx, destCy);
                const p2 = getPortPoint(dest, srcCx, srcCy);
                const d = getBezierPath(p1, p2);

                const t = EDGE_TYPES[edge.type] || EDGE_TYPES.io;
                const isSel = selected?.type === 'edge' && selected.id === edge.id;

                return (
                  <g key={edge.id} className="pointer-events-auto cursor-pointer">
                    {/* Tick invisible path for easier hover/click trigger */}
                    <path
                      d={d}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="16"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected({ type: 'edge', id: edge.id });
                      }}
                    />
                    
                    {/* Visual Path */}
                    <path
                      d={d}
                      fill="none"
                      stroke={isSel ? t.color : `${t.color}a0`}
                      strokeWidth={isSel ? '2.5' : '1.75'}
                      strokeDasharray={t.dash}
                      markerEnd={`url(#arrow-${edge.type})`}
                      style={isSel ? { filter: `drop-shadow(0 0 3px ${t.color}88)` } : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected({ type: 'edge', id: edge.id });
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Edge labels floating over curves */}
            {edges.map(edge => {
              const src = nodes.find(n => n.id === edge.from);
              const dest = nodes.find(n => n.id === edge.to);
              if (!src || !dest) return null;

              const srcCx = src.x + NODE_W / 2;
              const srcCy = src.y + NODE_H / 2;
              const destCx = dest.x + NODE_W / 2;
              const destCy = dest.y + NODE_H / 2;

              const p1 = getPortPoint(src, destCx, destCy);
              const p2 = getPortPoint(dest, srcCx, srcCy);

              const ext = 60;
              const c1 = getCtrlPoint(p1, ext);
              const c2 = getCtrlPoint(p2, ext);
              
              const mid = getBezierPoint(p1, c1, c2, p2, 0.5);
              const t = EDGE_TYPES[edge.type] || EDGE_TYPES.io;
              const labelText = edge.name || t.label;
              const isSel = selected?.type === 'edge' && selected.id === edge.id;

              return (
                <div
                  key={`lbl-${edge.id}`}
                  style={{
                    position: 'absolute',
                    left: `${mid.x}px`,
                    top: `${mid.y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 5
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected({ type: 'edge', id: edge.id });
                  }}
                  className={`px-2 py-0.5 max-w-[150px] truncate text-[9px] font-mono rounded cursor-pointer border select-none transition-all duration-150 ${
                    isSel 
                      ? 'bg-slate-900 border-amber-400 text-amber-400 font-bold shadow shadow-amber-500/20' 
                      : 'bg-slate-950/90 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {labelText}
                </div>
              );
            })}

            {/* Nodes floating cards */}
            {nodes.map(n => {
              const t = NODE_TYPES[n.type] || NODE_TYPES.core;
              const isSel = selected?.type === 'node' && selected.id === n.id;
              const isPending = pendingSource === n.id;
              const isLinkable = linkMode && pendingSource !== n.id;

              return (
                <div
                  key={n.id}
                  style={{
                    position: 'absolute',
                    left: `${n.x}px`,
                    top: `${n.y}px`,
                    width: `${NODE_W}px`,
                    minHeight: `${NODE_H}px`,
                    zIndex: isSel ? 10 : 8
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(e, n)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(e, n);
                  }}
                  className={`bg-slate-900 border-1.5 rounded-xl transition-all duration-150 flex flex-col group relative ${
                    isSel 
                      ? 'shadow-xl shadow-emerald-500/10' 
                      : 'hover:shadow hover:shadow-slate-800'
                  } ${
                    isPending 
                      ? 'border-amber-400/90 ring-4 ring-amber-500/25' 
                      : isLinkable 
                        ? 'border-dashed border-emerald-500/60 hover:border-emerald-400 ring-2 ring-emerald-500/10 cursor-alias' 
                        : isSel 
                          ? 'border-emerald-400' 
                          : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Decorative connection pin dots */}
                  <div className="absolute -left-[4px] top-1/2 -translate-y-1/2 w-[7px] h-[7px] bg-slate-800 border-1.5 border-slate-700 rounded-full group-hover:bg-slate-600" />
                  <div className="absolute -right-[4px] top-1/2 -translate-y-1/2 w-[7px] h-[7px] bg-slate-800 border-1.5 border-slate-700 rounded-full group-hover:bg-slate-600" />

                  {/* Header */}
                  <div 
                    className="px-3 py-1.5 rounded-t-xl text-[9px] font-mono tracking-wider uppercase font-semibold flex items-center justify-between border-b border-slate-800/60"
                    style={{ 
                      background: `${t.color}14`, 
                      color: t.color 
                    }}
                  >
                    <span>{t.label}</span>
                    <span className="text-[10px] text-slate-500/80">#{n.id}</span>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h4 className="text-white text-xs font-semibold leading-tight mb-1 font-space line-clamp-2">
                      {n.name || 'Processus sans nom'}
                    </h4>
                    {n.description && (
                      <p className="text-[10px] text-slate-400 line-clamp-2 mb-2 leading-normal">
                        {n.description}
                      </p>
                    )}

                    {/* Partie Intéressée indicator badge inside card */}
                    {n.type === 'party' && (
                      <div className="border-t border-slate-800/60 pt-2 mt-1 mb-2 space-y-1 text-[9px] font-mono">
                        <div className="flex items-center justify-between text-slate-450">
                          <span>Pertinence :</span>
                          <span className={
                            n.partyRelevance === 'pertinent' 
                              ? 'text-emerald-400 font-bold' 
                              : n.partyRelevance === 'non_pertinent' 
                                ? 'text-rose-400 font-bold' 
                                : 'text-slate-500'
                          }>
                            {n.partyRelevance === 'pertinent' && 'Pertinent'}
                            {n.partyRelevance === 'non_pertinent' && 'Non Pertinent'}
                            {(!n.partyRelevance || n.partyRelevance === 'undetermined') && 'Indéterminé'}
                          </span>
                        </div>
                        {n.isSupplier && (
                          <div className="flex items-center justify-between text-slate-450">
                            <span>Performance :</span>
                            <span className="text-amber-400 font-bold flex items-center">
                              {n.supplierRating ? '★'.repeat(n.supplierRating) + '☆'.repeat(5 - n.supplierRating) : 'Sans Note'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Client satisfaction indicator badge inside card */}
                    {n.type === 'client' && (
                      <div className="border-t border-slate-800/60 pt-2 mt-1 mb-2 space-y-1 text-[9px] font-mono">
                        <div className="flex items-center justify-between text-slate-450">
                          <span>Satisfaction :</span>
                          <span className="text-pink-400 font-bold flex items-center shadow-xs">
                            {n.clientSatisfaction ? '★'.repeat(n.clientSatisfaction) + '☆'.repeat(5 - n.clientSatisfaction) : 'Sans Note'}
                          </span>
                        </div>
                        {n.clientSatisfactionPercentage !== undefined && (
                          <div className="flex items-center justify-between text-slate-450">
                            <span>Score Global :</span>
                            <span className="text-pink-300 font-bold">
                              {n.clientSatisfactionPercentage}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meta count chips */}
                    <div className="flex flex-wrap gap-1 mt-auto items-center">
                      {n.standards.map(s => (
                        <span key={s} className="px-1 py-0.2 bg-slate-950/80 text-slate-400 border border-slate-800/80 rounded text-[8px] font-mono font-medium">
                          {s}
                        </span>
                      ))}

                      {/* Attribute count indicator */}
                      {n.attributes.length > 0 && (
                        <span className="text-[8px] font-mono px-1 bg-violet-950/20 text-violet-300 border border-violet-800/20 rounded">
                          {n.attributes.length} char.
                        </span>
                      )}
                      
                      {/* Resource Count */}
                      {n.resources.length > 0 && (
                        <span className="text-[8px] font-mono px-1 bg-blue-950/20 text-blue-300 border border-blue-800/20 rounded">
                          {n.resources.length} doc.
                        </span>
                      )}

                      {/* Dynamic connected elements metrics on card */}
                      {(() => {
                        const connectedCapas = capas.filter(c => c.linkedProcessId === n.id);
                        const connectedRisks = risks.filter(r => r.linkedProcessId === n.id);
                        const connectedOkrs = okrs.filter(o => o.linkedProcessId === n.id);
                        const connectedEvents = qhseEvents ? qhseEvents.filter(e => e.linkedProcessId === n.id) : [];
                        const connectedAccidents = connectedEvents.filter(e => e.type === 'accident');
                        const connectedNonConformities = connectedEvents.filter(e => e.type === 'non_conformity');
                        const connectedReqs = regulatoryRequirements ? regulatoryRequirements.filter(r => r.linkedProcessId === n.id) : [];
                        const hasNonCompliantReqs = connectedReqs.some(r => r.conforms === 'non_compliant');
                        const connectedEquips = equipments ? equipments.filter(eq => eq.linkedProcessId === n.id) : [];
                        const hasOutOfServiceEquips = connectedEquips.some(eq => eq.status === 'out_of_service');
                        
                        const connectedDocs = documents ? documents.filter(d => d.linkedProcessId === n.id) : [];
                        const alcoaAlert = connectedDocs.some(d => {
                          if (!d.alcoaAssessment) return true;
                          const { attributable, legible, contemporaneous, original, accurate, complete, consistent, enduring, available } = d.alcoaAssessment;
                          const score = [attributable, legible, contemporaneous, original, accurate, complete, consistent, enduring, available].filter(Boolean).length;
                          return score < 9;
                        });

                        return (
                          <>
                            {connectedDocs.length > 0 && (
                              <span className={`text-[8px] font-mono px-1 py-0.2 rounded flex items-center gap-0.5 border ${
                                alcoaAlert 
                                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/30 font-semibold' 
                                  : 'bg-indigo-950/40 text-indigo-350 border-indigo-850/30 font-bold'
                              }`} title={`${connectedDocs.length} Document(s) ALCOA+ rattaché(s) ${alcoaAlert ? '- Des anomalies d\'intégrité subsistent ⚠️' : '- Intégrité Complète 🌟'}`}>
                                📄 {connectedDocs.length} {alcoaAlert ? '⚠️' : '🌟'}
                              </span>
                            )}
                            {connectedEquips.length > 0 && (
                              <span className={`text-[8px] font-mono px-1 py-0.2 rounded flex items-center gap-0.5 border ${
                                hasOutOfServiceEquips 
                                  ? 'bg-red-950/40 text-red-300 border-red-800/30 font-bold animate-pulse' 
                                  : 'bg-zinc-900/40 text-slate-300 border-zinc-700/20'
                              }`} title={`${connectedEquips.length} Équipement(s) rattaché(s) - ${hasOutOfServiceEquips ? '⚠️ Alerte Panne !' : 'OK'}`}>
                                🔧 {connectedEquips.length} {hasOutOfServiceEquips ? '⚠️' : ''}
                              </span>
                            )}
                            {connectedOkrs.length > 0 && (
                              <span className="text-[8px] font-mono px-1 py-0.2 bg-sky-950/40 text-sky-300 border border-sky-850/30 rounded flex items-center gap-0.5" title={`${connectedOkrs.length} OKR(s) rattaché(s)`}>
                                🎯 {connectedOkrs.length}
                              </span>
                            )}
                            {connectedAccidents.length > 0 && (
                              <span className="text-[8px] font-mono px-1 py-0.2 bg-red-950/40 text-red-350 border border-red-850/30 rounded flex items-center gap-0.5 font-bold animate-pulse" title={`${connectedAccidents.length} Accident(s) rattaché(s)`}>
                                🚨 {connectedAccidents.length}
                              </span>
                            )}
                            {connectedNonConformities.length > 0 && (
                              <span className="text-[8px] font-mono px-1 py-0.2 bg-orange-950/40 text-orange-355 border border-orange-850/30 rounded flex items-center gap-0.5" title={`${connectedNonConformities.length} Non-Conformité(s) rattachée(s)`}>
                                ❌ {connectedNonConformities.length}
                              </span>
                            )}
                            {connectedReqs.length > 0 && (
                              <span className={`text-[8px] font-mono px-1 py-0.2 rounded flex items-center gap-0.5 border ${
                                hasNonCompliantReqs 
                                  ? 'bg-red-950/40 text-red-400 border-red-800/30 font-bold animate-pulse font-sans' 
                                  : 'bg-indigo-950/40 text-indigo-300 border-indigo-850/30 font-sans'
                              }`} title={`${connectedReqs.length} Exigence(s) règlementaire(s) rattachée(s)`}>
                                ⚖ {connectedReqs.length} {hasNonCompliantReqs ? '⚠️' : ''}
                              </span>
                            )}
                            {connectedCapas.length > 0 && (
                              <span className="text-[8px] font-mono px-1 py-0.2 bg-emerald-950/40 text-emerald-350 border border-emerald-850/30 rounded flex items-center gap-0.5" title={`${connectedCapas.length} CAPA rattachée(s)`}>
                                ✓ {connectedCapas.length}
                              </span>
                            )}
                            {connectedRisks.length > 0 && (
                              <span className="text-[8px] font-mono px-1 py-0.2 bg-amber-950/40 text-amber-355 border border-amber-850/30 rounded flex items-center gap-0.5" title={`${connectedRisks.length} Risques rattachés`}>
                                ⚠️ {connectedRisks.length}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>
      </div>

      {/* Detail Edit sidebar / properties control panel */}
      <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/60 backdrop-blur-md overflow-y-auto flex flex-col h-full shrink-0" id="canvas-sidebar">
        
        {/* If nothing selected */}
        {!selectedNode && !selectedEdge && (
          <div className="p-6 text-center text-slate-400 my-auto">
            <Layers className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h4 className="font-space font-semibold text-white text-sm mb-1">Aucune sélection</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Sélectionnez un processus ou une flèche de liaison pour éditer ses détails, normes applicables, caractéristiques pilotes et documents associés.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-left text-slate-500 leading-normal space-y-1">
              <span className="block font-bold">Astuces de touches:</span>
              <span className="block">• Déposez une boîte avec <span className="text-slate-300 font-mono">Nouveau Processus</span>.</span>
              <span className="block">• Reliez-les en cliquant sur <span className="text-slate-300 font-mono">Relier</span> puis sur deux cartes de suite.</span>
              <span className="block">• Supprimez un élément avec la touche <span className="text-slate-300 font-mono font-medium bg-slate-800 border border-slate-700 rounded px-1">Retour Arrière/Suppr</span>.</span>
            </div>
          </div>
        )}

        {/* Selected NODE form */}
        {selectedNode && (
          <div className="p-6 text-slate-400 my-auto text-center space-y-3.5" id="sidebar-node-placeholder">
            <Layers className="w-10 h-10 text-emerald-500/20 mx-auto" />
            <h4 className="font-space font-semibold text-white text-xs">Consultation de Processus</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed max-w-[250px] mx-auto">
              Les détails du processus <strong className="text-white font-medium">{selectedNode.name || 'sans nom'}</strong> sont ouverts dans le volet spécialisé.
            </p>
            <button 
              type="button"
              onClick={() => setSelected(null)}
              className="mt-2 text-[10px] text-slate-400 hover:text-white bg-slate-800 border border-slate-700 active:bg-slate-950 px-3 py-1.5 rounded-md transition cursor-pointer"
            >
              Désélectionner le processus
            </button>
          </div>
        )}
        {false && selectedNode && (
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3" id="sidebar-node-header">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Processus #{selectedNode.id}</span>
                <h3 className="text-sm font-semibold text-white font-space">Propriétés du Processus</h3>
              </div>
              <button
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition cursor-pointer"
                title="Supprimer le processus"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Libellé</label>
              <input 
                type="text" 
                value={selectedNode.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, name: val } : n);
                  onChangeData({ nodes: updated, edges });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                placeholder="Nom du processus..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Type de processus</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(NODE_TYPES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => {
                      const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, type: key as any } : n);
                      onChangeData({ nodes: updated, edges });
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] text-left transition flex items-center gap-1.5 cursor-pointer ${
                      selectedNode.type === key 
                        ? 'bg-slate-800 text-white font-semibold' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                    style={selectedNode.type === key ? { borderColor: t.color } : undefined}
                  >
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: t.color }} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Standards checkboxes Multi-select */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Normes Référentielles Applicables</label>
              <div className="flex flex-wrap gap-1.5">
                {STANDARDS.map(std => {
                  const has = selectedNode.standards.includes(std);
                  return (
                    <button
                      key={std}
                      onClick={() => {
                        let nextStds = [...selectedNode.standards];
                        if (has) nextStds = nextStds.filter(s => s !== std);
                        else nextStds.push(std);
                        
                        const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, standards: nextStds } : n);
                        onChangeData({ nodes: updated, edges });
                      }}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono border transition flex items-center gap-1 cursor-pointer ${
                        has 
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {has && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                      {std}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Description / Mission</label>
              <textarea
                value={selectedNode.description}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, description: val } : n);
                  onChangeData({ nodes: updated, edges });
                }}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 leading-relaxed focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Décrivez l'impact de ce processus..."
              />
            </div>

            {/* Attributes / Key Characteristics Pilots */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase font-mono mb-0">Caractéristiques d'identité</label>
                <button
                  onClick={() => {
                    const nextAttrs = [...selectedNode.attributes, { key: '', value: '' }];
                    const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, attributes: nextAttrs } : n);
                    onChangeData({ nodes: updated, edges });
                  }}
                  className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 transition flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>

              {/* Dynamic inputs */}
              <div className="space-y-2">
                {selectedNode.attributes.map((attr, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-2 border border-slate-800 rounded-lg space-y-1.5 relative group/attr">
                    <button
                      onClick={() => {
                        const nextAttrs = selectedNode.attributes.filter((_, i) => i !== idx);
                        const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, attributes: nextAttrs } : n);
                        onChangeData({ nodes: updated, edges });
                      }}
                      className="absolute right-2 top-2 p-1 text-slate-500 hover:text-red-400 rounded cursor-pointer opacity-0 group-hover/attr:opacity-100 transition-opacity bg-slate-950"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        value={attr.key}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextAttrs = selectedNode.attributes.map((a, i) => i === idx ? { ...a, key: val } : a);
                          const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, attributes: nextAttrs } : n);
                          onChangeData({ nodes: updated, edges });
                        }}
                        placeholder="Caractéristique (ex: Pilote)"
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none"
                      />
                      <input 
                        type="text" 
                        value={attr.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextAttrs = selectedNode.attributes.map((a, i) => i === idx ? { ...a, value: val } : a);
                          const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, attributes: nextAttrs } : n);
                          onChangeData({ nodes: updated, edges });
                        }}
                        placeholder="Valeur"
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-white focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggestions chips */}
              <div className="flex flex-wrap gap-1 mt-2">
                {NODE_ATTR_SUGGESTIONS.map(s => {
                  const used = selectedNode.attributes.some(a => a.key.toLowerCase() === s.toLowerCase());
                  if (used) return null;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        const nextAttrs = [...selectedNode.attributes, { key: s, value: '' }];
                        const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, attributes: nextAttrs } : n);
                        onChangeData({ nodes: updated, edges });
                      }}
                      className="px-2 py-0.5 border border-dashed border-slate-800 text-[9px] text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 rounded-full cursor-pointer transition bg-transparent"
                    >
                      + {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resources / Process Documentation */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase font-mono mb-0">Documents & Procédures SMI</label>
                <button
                  onClick={() => {
                    const nextRes = [...selectedNode.resources, { name: '', kind: 'procedure' as const, content: '' }];
                    const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, resources: nextRes } : n);
                    onChangeData({ nodes: updated, edges });
                  }}
                  className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 transition flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {selectedNode.resources.map((res, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-lg space-y-1.5 relative group/res">
                    <button
                      onClick={() => {
                        const nextRes = selectedNode.resources.filter((_, i) => i !== idx);
                        const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, resources: nextRes } : n);
                        onChangeData({ nodes: updated, edges });
                      }}
                      className="absolute right-2 top-2 p-1 text-slate-500 hover:text-red-400 rounded cursor-pointer opacity-0 group-hover/res:opacity-100 transition-opacity bg-slate-950"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={res.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextRes = selectedNode.resources.map((r, i) => i === idx ? { ...r, name: val } : r);
                          const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, resources: nextRes } : n);
                          onChangeData({ nodes: updated, edges });
                        }}
                        placeholder="Libellé du document..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-white focus:outline-none"
                      />
                      <select
                        value={res.kind}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          const nextRes = selectedNode.resources.map((r, i) => i === idx ? { ...r, kind: val } : r);
                          const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, resources: nextRes } : n);
                          onChangeData({ nodes: updated, edges });
                        }}
                        className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 cursor-pointer focus:outline-none"
                      >
                        {Object.entries(RES_KINDS).map(([k, v]) => (
                          <option key={k} value={k}>{v.label.split(' ')[0]}</option>
                        ))}
                      </select>
                    </div>

                    <textarea
                      value={res.content}
                      onChange={(e) => {
                        const val = e.target.value;
                        const nextRes = selectedNode.resources.map((r, i) => i === idx ? { ...r, content: val } : r);
                        const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, resources: nextRes } : n);
                        onChangeData({ nodes: updated, edges });
                      }}
                      rows={2}
                      placeholder={RES_KINDS[res.kind]?.placeholder || ''}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-400 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Centralisation Connectors Section */}
            <div className="border-t border-slate-800 pt-4 space-y-3 bg-slate-950/20 p-3 rounded-lg border border-slate-800/65">
              <h4 className="text-[11px] font-semibold text-slate-300 uppercase font-mono flex items-center gap-1.5 mb-2">
                <BrainCircuit className="w-4 h-4 text-emerald-400" /> Elements centralisés connectés
              </h4>

              {/* Inter-locking CAPA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Plans d'action CAPA ({linkedProcessCapas.length})</span>
                  <button
                    onClick={() => onQuickAddCapaForProcess(selectedNode.id)}
                    className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded cursor-pointer transition border border-emerald-500/20"
                  >
                    + Créer CAPA
                  </button>
                </div>
                {linkedProcessCapas.length > 0 ? (
                  <div className="space-y-1">
                    {linkedProcessCapas.map(capa => {
                      const labels: Record<string, string> = {
                        draft: 'Brouillon',
                        ongoing: 'En cours',
                        completed: 'Réalisé',
                        verified: 'Vérifié',
                        cancelled: 'Annulé',
                      };
                      const colors: Record<string, string> = {
                        draft: 'text-slate-400 bg-slate-900 border-slate-800',
                        ongoing: 'text-blue-400 bg-blue-950/40 border-blue-900/35',
                        completed: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/35',
                        verified: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/35',
                        cancelled: 'text-slate-550 bg-slate-950/30 border-slate-900 line-through',
                      };
                      return (
                        <div 
                          key={capa.id}
                          onClick={() => onSwitchTab('capas')}
                          className="text-[10px] bg-slate-955 hover:bg-slate-900 border border-slate-800 p-1.5 rounded text-slate-300 flex items-center justify-between cursor-pointer gap-2"
                        >
                          <span className="truncate pr-1"><b>{capa.id}</b>: {capa.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 border uppercase font-mono ${colors[capa.status] || ''}`}>
                            {labels[capa.status] || capa.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">Aucun plan CAPA affecté</p>
                )}
              </div>

              {/* Inter-locking Risks */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Risques Identifiés ({linkedProcessRisks.length})</span>
                  <button
                    onClick={() => onQuickAddRiskForProcess(selectedNode.id)}
                    className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded cursor-pointer transition border border-emerald-500/20"
                  >
                    + Créer/Lier Risque
                  </button>
                </div>
                {linkedProcessRisks.length > 0 ? (
                  <div className="space-y-1">
                    {linkedProcessRisks.map(risk => {
                      const labels: Record<string, string> = {
                        identified: 'Identifié',
                        treated: 'Mitigé',
                        monitored: 'Surveillé',
                        closed: 'Fermé',
                      };
                      const colors: Record<string, string> = {
                        identified: 'text-red-400 bg-red-950/30 border-red-900/35',
                        treated: 'text-indigo-400 bg-indigo-950/30 border-indigo-900/35',
                        monitored: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/35',
                        closed: 'text-slate-500 bg-slate-900/40 border border-slate-800/45',
                      };
                      return (
                        <div 
                          key={risk.id}
                          onClick={() => onSwitchTab('risks')}
                          className="text-[10px] bg-slate-955 hover:bg-slate-900 border border-slate-800 p-1.5 rounded text-slate-300 flex flex-col gap-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate pr-1"><b>{risk.id}</b>: {risk.title}</span>
                            <span className={`text-[9px] px-1 font-mono rounded shrink-0 ${
                              risk.probabilityBefore * risk.impactBefore >= 12 
                                ? 'text-red-400 bg-red-950/20' 
                                : 'text-amber-400 bg-amber-950/20'
                            }`}>Score {risk.probabilityBefore * risk.impactBefore}</span>
                          </div>
                          <div className="flex justify-end">
                            <span className={`text-[8.5px] px-1.5 py-0.2 rounded border font-medium uppercase font-mono ${colors[risk.status] || ''}`}>
                              {labels[risk.status] || risk.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">Aucun risque rattaché</p>
                )}
              </div>

              {/* Inter-locking OKRs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 font-medium font-space">OKRs Associés ({linkedProcessOkrs.length})</span>
                  <button
                    onClick={() => onSwitchTab('okrs')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer transition"
                  >
                    Aller aux OKRs
                  </button>
                </div>
                {linkedProcessOkrs.length > 0 ? (
                  <div className="space-y-1">
                    {linkedProcessOkrs.map(okr => (
                      <div 
                        key={okr.id}
                        onClick={() => onSwitchTab('okrs')}
                        className="text-[10px] bg-slate-950 hover:bg-slate-900 border border-slate-800 p-1.5 rounded text-slate-300 truncate cursor-pointer"
                      >
                        <b>{okr.period}</b>: {okr.objective}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">Aucun objectif d'alignement</p>
                )}
              </div>

              {/* Inter-locking Audits (ISO 19011) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">Audits & Inspections ({linkedProcessAudits.length})</span>
                  {onQuickAddAuditForProcess && (
                    <button
                      onClick={() => onQuickAddAuditForProcess(selectedNode.id)}
                      className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded cursor-pointer transition border border-emerald-500/20"
                    >
                      + Planifier Audit
                    </button>
                  )}
                </div>
                {linkedProcessAudits.length > 0 ? (
                  <div className="space-y-1">
                    {linkedProcessAudits.map(audit => {
                      const labels: Record<string, string> = {
                        scheduled: 'Planifié',
                        in_progress: 'En Cours',
                        completed: 'Clôturé',
                        cancelled: 'Annulé',
                      };
                      const colors: Record<string, string> = {
                        scheduled: 'text-slate-400 bg-slate-900 border-slate-800',
                        in_progress: 'text-amber-400 bg-amber-950/40 border-amber-900/35 animate-pulse',
                        completed: 'text-emerald-400 bg-emerald-950/40 border-emerald-900/35',
                        cancelled: 'text-slate-550 bg-slate-950/30 border-slate-900 line-through',
                      };
                      return (
                        <div 
                          key={audit.id}
                          onClick={() => onSwitchTab('audits')}
                          className="text-[10px] bg-slate-955 hover:bg-slate-900 border border-slate-800 p-1.5 rounded text-slate-300 flex items-center justify-between cursor-pointer gap-2"
                        >
                          <span className="truncate pr-1"><b>{audit.id}</b>: {audit.title}</span>
                          <span className={`text-[8px] px-1 py-0.2 rounded font-semibold shrink-0 border uppercase font-mono ${colors[audit.status] || ''}`}>
                            {labels[audit.status] || audit.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">Aucune inspection ou audit ISO 19011 planifié</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Selected EDGE form */}
        {selectedEdge && (
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3" id="sidebar-edge-header">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Liaison #{selectedEdge.id}</span>
                <h3 className="text-sm font-semibold text-white font-space">Propriétés du Flux</h3>
              </div>
              <button
                onClick={() => handleDeleteEdge(selectedEdge.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition cursor-pointer"
                title="Supprimer la liaison"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Display flow ends */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 flex items-center justify-between gap-2.5 text-xs text-white">
              <span className="truncate bg-slate-900 px-2.5 py-1 border border-slate-800 rounded flex-1 text-center font-medium">
                {nodes.find(n => n.id === selectedEdge.from)?.name || 'N/A'}
              </span>
              <span className="text-slate-500 font-bold shrink-0">→</span>
              <span className="truncate bg-slate-900 px-2.5 py-1 border border-slate-800 rounded flex-1 text-center font-medium">
                {nodes.find(n => n.id === selectedEdge.to)?.name || 'N/A'}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Intitulé du Flux</label>
              <input 
                type="text" 
                value={selectedEdge.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = edges.map(edge => edge.id === selectedEdge.id ? { ...edge, name: val } : edge);
                  onChangeData({ nodes, edges: updated });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                placeholder="Entrées, Sorties, Fréquence ou format..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Type de flux (Visuel)</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(EDGE_TYPES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => {
                      const updated = edges.map(edge => edge.id === selectedEdge.id ? { ...edge, type: key as any } : edge);
                      onChangeData({ nodes, edges: updated });
                    }}
                    className={`px-2 py-1.5 rounded-lg border text-[11px] text-left transition flex items-center lg:gap-1 cursor-pointer truncate ${
                      selectedEdge.type === key 
                        ? 'bg-slate-800 text-white font-semibold' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                    style={selectedEdge.type === key ? { borderColor: t.color } : undefined}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.label.split(' / ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Description / Exigences</label>
              <textarea
                value={selectedEdge.description}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated = edges.map(edge => edge.id === selectedEdge.id ? { ...edge, description: val } : edge);
                  onChangeData({ nodes, edges: updated });
                }}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 leading-relaxed focus:outline-none resize-none"
                placeholder="Quelle information ou livrable transite par ce point ?"
              />
            </div>

            {/* Attributes/Suggestions for interfaces */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase font-mono mb-0">Paramètres de transfert</label>
                <button
                  onClick={() => {
                    const nextAttrs = [...selectedEdge.attributes, { key: '', value: '' }];
                    const updated = edges.map(edge => edge.id === selectedEdge.id ? { ...edge, attributes: nextAttrs } : edge);
                    onChangeData({ nodes, edges: updated });
                  }}
                  className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 transition flex items-center gap-0.5 cursor-pointer bg-transparent border-0"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>

              <div className="space-y-2">
                {selectedEdge.attributes.map((attr, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-2 border border-slate-800 rounded-lg space-y-1.5 relative group/attr">
                    <button
                      onClick={() => {
                        const nextAttrs = selectedEdge.attributes.filter((_, i) => i !== idx);
                        const updated = edges.map(edge => edge.id === selectedEdge.id ? { ...edge, attributes: nextAttrs } : edge);
                        onChangeData({ nodes, edges: updated });
                      }}
                      className="absolute right-2 top-2 p-1 text-slate-500 hover:text-red-400 rounded cursor-pointer opacity-0 group-hover/attr:opacity-100 transition-opacity bg-slate-950"
                    >
                      <Trash2 className="w-3 link-3" />
                    </button>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        value={attr.key}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextAttrs = selectedEdge.attributes.map((a, i) => i === idx ? { ...a, key: val } : a);
                          const updated = edges.map(edge => edge.id === selectedEdge.id ? { ...edge, attributes: nextAttrs } : edge);
                          onChangeData({ nodes, edges: updated });
                        }}
                        placeholder="Critère"
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none"
                      />
                      <input 
                        type="text" 
                        value={attr.value}
                        onChange={(e) => {
                          const val = e.target.value;
                          const nextAttrs = selectedEdge.attributes.map((a, i) => i === idx ? { ...a, value: val } : a);
                          const updated = edges.map(edge => edge.id === selectedEdge.id ? { ...edge, attributes: nextAttrs } : edge);
                          onChangeData({ nodes, edges: updated });
                        }}
                        placeholder="Valeur"
                        className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-white focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {EDGE_ATTR_SUGGESTIONS.map(s => {
                  const used = selectedEdge.attributes.some(a => a.key.toLowerCase() === s.toLowerCase());
                  if (used) return null;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        const nextAttrs = [...selectedEdge.attributes, { key: s, value: '' }];
                        const updated = edges.map(edge => edge.id === selectedEdge.id ? { ...edge, attributes: nextAttrs } : edge);
                        onChangeData({ nodes, edges: updated });
                      }}
                      className="px-2 py-0.5 border border-dashed border-slate-800 text-[9px] text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 rounded-full cursor-pointer transition bg-transparent"
                    >
                      + {s}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Slide-over Drawer for Node Details overlaying map and sidebar */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: '100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="absolute top-0 right-0 h-full w-full sm:w-[480px] bg-slate-900/95 backdrop-blur-md border-l border-slate-800 shadow-2xl z-40 flex flex-col overflow-hidden"
            id="node-slideover-panel"
          >
            {/* Slideover Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase shrink-0"
                  style={{
                    backgroundColor: `${(NODE_TYPES[selectedNode.type] || NODE_TYPES.core).color}15`,
                    color: (NODE_TYPES[selectedNode.type] || NODE_TYPES.core).color,
                    border: `1px solid ${(NODE_TYPES[selectedNode.type] || NODE_TYPES.core).color}40`,
                  }}
                >
                  {(NODE_TYPES[selectedNode.type] || NODE_TYPES.core).label}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">#{selectedNode.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1 px-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition overflow-hidden cursor-pointer flex items-center justify-center"
                title="Fermer le volet"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selection tabs */}
            <div className="flex border-b border-slate-800 bg-slate-905/40 p-1 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setDrawerTab('info')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerTab === 'info'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Fiche d'Aperçu
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('edit')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  drawerTab === 'edit'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> Modifier la Fiche
              </button>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {drawerTab === 'info' ? (
                <>
                  {/* Process Name / Title */}
                  <div className="space-y-2">
                    <h2 className="text-base font-space font-semibold text-white leading-snug tracking-tight">
                      {selectedNode.name || 'Processus sans nom'}
                    </h2>

                    {selectedNode.standards.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.standards.map(std => (
                          <span key={std} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-[9px] font-mono font-medium">
                            {std}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Core Description */}
                  <div className="p-3.5 bg-slate-950/80 border border-slate-850 rounded-xl space-y-2 shadow-inner">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-400" /> Mission & Objectif principal
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedNode.description || "Aucune description de mission fournie. Ouvrez l'onglet de modification pour rédiger la fiche."}
                    </p>
                  </div>

                  {/* Interested Party & Supplier Performance Evaluation Panel */}
                  {selectedNode.type === 'party' && (
                    <div className="p-4 bg-slate-950/90 border border-amber-500/30 rounded-xl space-y-3.5 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-[10px] font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                          <User className="w-4 h-4 text-amber-400" /> Évaluation Partie Intéressée
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          selectedNode.partyRelevance === 'pertinent'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/35'
                            : selectedNode.partyRelevance === 'non_pertinent'
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/35'
                              : 'bg-slate-800 text-slate-404 border-slate-750'
                        }`}>
                          {selectedNode.partyRelevance === 'pertinent' && 'Pertinent'}
                          {selectedNode.partyRelevance === 'non_pertinent' && 'Non Pertinent'}
                          {(selectedNode.partyRelevance === 'undetermined' || !selectedNode.partyRelevance) && 'Non déterminé'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-mono">Pertinence dans le SMI :</span>
                        <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed whitespace-pre-wrap">
                          {selectedNode.partyRelevanceEvaluation || "Aucune justification ou commentaire sur la pertinence n'a été rédigé."}
                        </p>
                      </div>

                      {/* Supplier Section */}
                      <div className="border-t border-slate-850 pt-2.5 mt-2.5 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-mono">Statut du Fournisseur :</span>
                          <span className={`text-[9px] font-bold py-0.5 px-2 rounded-md ${
                            selectedNode.isSupplier 
                              ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30' 
                              : 'bg-slate-800/80 text-slate-450 border border-transparent'
                          }`}>
                            {selectedNode.isSupplier ? "Fournisseur Officiel" : "Non classé comme Fournisseur"}
                          </span>
                        </div>

                        {selectedNode.isSupplier && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                              <span className="text-[10px] text-slate-400 font-mono font-medium">Performance globale :</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span 
                                    key={star} 
                                    className={`text-sm ${(selectedNode.supplierRating || 0) >= star ? 'text-amber-400 font-bold' : 'text-slate-705 font-bold'}`}
                                  >
                                    ★
                                  </span>
                                ))}
                                <span className="text-xs font-bold text-slate-200 ml-1">
                                  ({selectedNode.supplierRating || "Aucune note"}/5)
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-404 font-mono">Critique de performance / Remarques :</span>
                              <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed whitespace-pre-wrap">
                                {selectedNode.supplierRatingComments || "Aucun commentaire de performance rédigé."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Client Satisfaction Evaluation Panel */}
                  {selectedNode.type === 'client' && (
                    <div className="p-4 bg-slate-950/90 border border-pink-500/30 rounded-xl space-y-3.5 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-[10px] font-bold text-pink-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
                          <User className="w-4 h-4 text-pink-400" /> Évaluation Satisfaction Client
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          (selectedNode.clientSatisfaction || 0) >= 4
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/35'
                            : (selectedNode.clientSatisfaction || 0) >= 3
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/35'
                              : selectedNode.clientSatisfaction
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/35'
                                : 'bg-slate-800 text-slate-400 border-slate-755'
                        }`}>
                          {selectedNode.clientSatisfaction ? `Niveau ${selectedNode.clientSatisfaction}/5` : 'Non Évalué'}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-850 shadow-xs">
                            <span className="text-[10px] text-slate-400 font-mono font-medium">Satisfaction globale (étoiles) :</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span 
                                  key={star} 
                                  className={`text-sm ${(selectedNode.clientSatisfaction || 0) >= star ? 'text-pink-400 font-bold' : 'text-slate-700 font-bold'}`}
                                >
                                  ★
                                </span>
                              ))}
                              <span className="text-xs font-bold text-slate-200 ml-1 font-mono">
                                ({selectedNode.clientSatisfaction || "Non Évalué"}/5)
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-lg border border-slate-850 shadow-xs">
                            <span className="text-[10px] text-slate-400 font-mono font-medium">Taux de satisfaction (score) :</span>
                            <div className="flex items-center gap-2">
                              {selectedNode.clientSatisfactionPercentage !== undefined ? (
                                <>
                                  <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/30">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-300 ${
                                        selectedNode.clientSatisfactionPercentage >= 85 
                                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                                          : selectedNode.clientSatisfactionPercentage >= 70 
                                            ? 'bg-pink-450 shadow-[0_0_8px_rgba(236,72,153,0.3)]'
                                            : selectedNode.clientSatisfactionPercentage >= 50 
                                              ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' 
                                              : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                                      }`}
                                      style={{ width: `${selectedNode.clientSatisfactionPercentage}%` }}
                                    />
                                  </div>
                                  <span className={`text-xs font-bold font-mono ${
                                    selectedNode.clientSatisfactionPercentage >= 85
                                      ? 'text-emerald-400'
                                      : selectedNode.clientSatisfactionPercentage >= 70
                                        ? 'text-pink-400'
                                        : selectedNode.clientSatisfactionPercentage >= 50
                                          ? 'text-amber-400'
                                          : 'text-rose-450'
                                  }`}>
                                    {selectedNode.clientSatisfactionPercentage}%
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-slate-500 font-mono">Non Renseigné</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-mono">Commentaires / Retours d'Expérience Client :</span>
                          <p className="text-xs text-slate-200 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed whitespace-pre-wrap">
                            {selectedNode.clientSatisfactionComments || "Aucun retour d'expérience client ou commentaire de satisfaction saisi."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Connected central elements */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-2 border-b border-slate-800 pb-2">
                      <BrainCircuit className="w-4 h-4 text-emerald-400 animate-pulse-slow" /> Éléments Connectés
                    </h3>

                    {/* CAPAs List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Plans d'action CAPA ({linkedProcessCapas.length})</span>
                        <button
                          type="button"
                          onClick={() => onQuickAddCapaForProcess(selectedNode.id)}
                          className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 border border-emerald-500/20 rounded cursor-pointer transition font-mono"
                        >
                          + Créer CAPA
                        </button>
                      </div>
                      {linkedProcessCapas.length > 0 ? (
                        <div className="space-y-2">
                          {linkedProcessCapas.map(capa => {
                            const labelsMap: Record<string, string> = {
                              draft: 'Brouillon',
                              ongoing: 'En cours',
                              completed: 'Réalisé',
                              verified: 'Vérifié',
                              cancelled: 'Annulé',
                            };
                            const colorsMap: Record<string, string> = {
                              draft: 'text-slate-400 bg-slate-900 border-slate-850',
                              ongoing: 'text-blue-400 bg-blue-950/40 border-blue-900/30',
                              completed: 'text-indigo-400 bg-indigo-950/40 border-indigo-900/30',
                              verified: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/30',
                              cancelled: 'text-slate-500 bg-slate-900/20 border-slate-800 line-through',
                            };
                            return (
                              <div
                                key={capa.id}
                                onClick={() => onSwitchTab('capas')}
                                className="group/capaitem bg-slate-950/50 hover:bg-slate-950 border border-slate-850 hover:border-slate-750 p-3 rounded-xl transition duration-150 cursor-pointer flex flex-col gap-2"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[9px] text-slate-500 font-bold uppercase">{capa.id}</span>
                                      <span className="text-[9px] text-slate-400 flex items-center gap-1">
                                        <User className="w-2.5 h-2.5" /> {capa.pilot || 'Pilote non défini'}
                                      </span>
                                    </div>
                                    <h5 className="text-[11px] font-semibold text-slate-200 truncate group-hover/capaitem:text-white transition">
                                      {capa.title}
                                    </h5>
                                  </div>
                                  <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-semibold border shrink-0 font-mono uppercase ${colorsMap[capa.status] || ''}`}>
                                    {labelsMap[capa.status] || capa.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900">
                                  <span>Échéance: {capa.dueDate ? new Date(capa.dueDate).toLocaleDateString('fr-FR') : 'Non planifiée'}</span>
                                  <span className="text-emerald-400 opacity-0 group-hover/capaitem:opacity-100 transition flex items-center gap-0.5">
                                    Consulter à la liste <ExternalLink className="w-2.5 h-2.5" />
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic px-1">Aucun plan CAPA affecté à ce processus.</p>
                      )}
                    </div>

                    <div className="h-[1px] bg-slate-800/80" />

                    {/* Risks List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Risques Identifiés ({linkedProcessRisks.length})</span>
                        <button
                          type="button"
                          onClick={() => onQuickAddRiskForProcess(selectedNode.id)}
                          className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 border border-emerald-500/20 rounded cursor-pointer transition font-mono"
                        >
                          + Créer/Lier Risque
                        </button>
                      </div>
                      {linkedProcessRisks.length > 0 ? (
                        <div className="space-y-2">
                          {linkedProcessRisks.map(risk => {
                            const labelsMap: Record<string, string> = {
                              identified: 'Identifié',
                              treated: 'Mitigé',
                              monitored: 'Surveillé',
                              closed: 'Fermé',
                            };
                            const colorsMap: Record<string, string> = {
                              identified: 'text-red-400 bg-red-950/30 border-red-900/30',
                              treated: 'text-indigo-400 bg-indigo-950/30 border-indigo-900/30',
                              monitored: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/30',
                              closed: 'text-slate-500 bg-slate-900/20 border-slate-800',
                            };
                            const score = risk.probabilityBefore * risk.impactBefore;
                            const isHighRisk = score >= 12;
                            return (
                              <div
                                key={risk.id}
                                onClick={() => onSwitchTab('risks')}
                                className="group/riskitem bg-slate-950/50 hover:bg-slate-950 border border-slate-850 hover:border-slate-750 p-3 rounded-xl transition duration-150 cursor-pointer flex flex-col gap-2"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[9px] text-slate-500 font-bold uppercase">{risk.id}</span>
                                      <span className={`text-[8.5px] font-mono font-bold px-1 py-0.2 rounded shrink-0 border uppercase ${
                                        isHighRisk 
                                          ? 'text-red-400 bg-red-950/15 border-red-900/30 font-bold' 
                                          : 'text-amber-400 bg-amber-950/15 border-amber-900/30 font-semibold'
                                      }`}>
                                        Criticité Brute: {score}
                                      </span>
                                    </div>
                                    <h5 className="text-[11px] font-semibold text-slate-200 truncate group-hover/riskitem:text-white transition">
                                      {risk.title}
                                    </h5>
                                  </div>
                                  <span className={`text-[8.5px] px-1.5 py-0.2 rounded border font-medium font-mono uppercase shrink-0 ${colorsMap[risk.status] || ''}`}>
                                    {labelsMap[risk.status] || risk.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900">
                                  <span className="truncate max-w-[200px]">Pilote: {risk.pilot || 'N/A'}</span>
                                  <span className="text-emerald-400 opacity-0 group-hover/riskitem:opacity-100 transition flex items-center gap-0.5">
                                    Détails Risque <ExternalLink className="w-2.5 h-2.5" />
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic px-1">Aucun risque rattaché à ce processus.</p>
                      )}
                    </div>

                    <div className="h-[1px] bg-slate-800/80" />

                    {/* OKRs Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">OKRs Stratégiques ({linkedProcessOkrs.length})</span>
                        <button
                          type="button"
                          onClick={() => onQuickAddOkrForProcess(selectedNode.id)}
                          className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 border border-emerald-500/20 rounded cursor-pointer transition font-mono"
                        >
                          + Associer OKR
                        </button>
                      </div>
                      {linkedProcessOkrs.length > 0 ? (
                        <div className="space-y-2">
                          {linkedProcessOkrs.map(okr => (
                            <div
                              key={okr.id}
                              onClick={() => onSwitchTab('okrs')}
                              className="group/okritem bg-slate-950/50 hover:bg-slate-950 border border-slate-850 hover:border-slate-750 p-3 rounded-xl transition duration-150 cursor-pointer flex flex-col gap-1.5"
                            >
                              <div className="flex justify-between items-center text-[9px] text-slate-500">
                                <span className="font-mono text-slate-405 font-bold">{okr.id}</span>
                                <span className="bg-slate-900 px-1.5 py-0.2 border border-slate-850 rounded font-mono font-medium text-[8.5px]">{okr.period}</span>
                              </div>
                              <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2 group-hover/okritem:text-white transition">{okr.objective}</p>
                              <div className="flex items-center justify-between text-[8px] text-slate-500 border-t border-slate-900/40 pt-1.5">
                                <span>Pilote : {okr.owner}</span>
                                <span className="text-emerald-400 font-mono">Consulter ↗</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic px-1">Aucun objectif OKR associé à ce processus.</p>
                      )}
                    </div>

                    <div className="h-[1px] bg-slate-800/80" />

                    {/* Veille & Exigences Réglementaires Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Exigences de Conformité ({linkedProcessRequirements.length})</span>
                        <button
                          type="button"
                          onClick={() => onQuickAddRequirementForProcess(selectedNode.id)}
                          className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 border border-indigo-500/20 rounded cursor-pointer transition font-mono flex items-center gap-1"
                        >
                          <Scale className="w-3 h-3 hover:rotate-12 transition" /> + Lier Exigence
                        </button>
                      </div>
                      {linkedProcessRequirements.length > 0 ? (
                        <div className="space-y-2">
                          {linkedProcessRequirements.map(req => {
                            const conformsStyles: Record<string, string> = {
                              compliant: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/35',
                              non_compliant: 'text-red-400 bg-red-950/30 border-red-900/35 animate-pulse font-bold',
                              evaluation_pending: 'text-amber-400 bg-amber-950/30 border-amber-900/35',
                            };
                            const conformsLabels: Record<string, string> = {
                              compliant: 'Conforme',
                              non_compliant: 'Non Conforme ⚠️',
                              evaluation_pending: 'Audit en cours',
                            };
                            return (
                              <div
                                key={req.id}
                                onClick={() => onSwitchTab('requirements')}
                                className="group/reqitem bg-slate-950/50 hover:bg-slate-950 border border-slate-850 hover:border-slate-750 p-3 rounded-xl transition duration-150 cursor-pointer flex flex-col gap-1.5"
                              >
                                <div className="flex justify-between items-center text-[9px] text-slate-500">
                                  <span className="font-mono text-slate-405 font-bold">{req.id}</span>
                                  <span className={`text-[8px] px-1.5 py-0.2 rounded border font-mono ${conformsStyles[req.conforms] || ''}`}>
                                    {conformsLabels[req.conforms] || req.conforms}
                                  </span>
                                </div>
                                <h5 className="text-[11px] font-semibold text-slate-200 truncate group-hover/reqitem:text-white transition">
                                  {req.title}
                                </h5>
                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed italic">
                                  Source : <b>{req.source}</b> • {req.description}
                                </p>
                                <div className="flex items-center justify-between text-[8px] text-slate-500 border-t border-slate-900/40 pt-1.5 mt-0.5">
                                  <span>Pilote : {req.owner}</span>
                                  <span className="text-indigo-400 font-mono">Consulter la fiche ↗</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic px-1">Aucune exigence réglementaire ou légale rattachée à ce processus.</p>
                      )}
                    </div>

                    <div className="h-[1px] bg-slate-800/80" />

                    {/* Équipements & Moyens de Production/Contrôle */}
                    <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Équipements & Moyens ({linkedProcessEquipments.length})</span>
                         <button
                           type="button"
                           onClick={() => onQuickAddEquipmentForProcess(selectedNode.id)}
                           className="text-[10px] bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.5 border border-sky-500/20 rounded cursor-pointer transition font-mono flex items-center gap-1"
                         >
                           <Wrench className="w-3 h-3 hover:rotate-12 transition" /> + Enregistrer Machine
                         </button>
                       </div>
                       {linkedProcessEquipments.length > 0 ? (
                         <div className="space-y-2">
                           {linkedProcessEquipments.map(eqp => {
                             const statusBadgeStyle: Record<string, string> = {
                               operational: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/35',
                               calibrated: 'text-indigo-400 bg-indigo-950/30 border-indigo-900/35',
                               value: 'text-indigo-400 bg-indigo-950/30 border-indigo-900/35',
                               maintenance: 'text-amber-400 bg-amber-950/30 border-amber-900/35',
                               out_of_service: 'text-red-400 bg-red-950/30 border-red-900/35 animate-pulse font-bold',
                             };
                             const statusLabels: Record<string, string> = {
                               operational: 'Opérationnel',
                               calibrated: 'Étalonné',
                               maintenance: 'En Maintenance',
                               out_of_service: 'Hors Service ⚠️',
                             };

                             return (
                               <div
                                 key={eqp.id}
                                 onClick={() => onSwitchTab('equipments')}
                                 className="group/eqpitem bg-slate-950/50 hover:bg-slate-950 border border-slate-850 hover:border-slate-750 p-3 rounded-xl transition duration-150 cursor-pointer flex flex-col gap-1.5"
                               >
                                 <div className="flex justify-between items-center text-[9px] text-slate-500">
                                   <span className="font-mono text-slate-405 font-bold">{eqp.id}</span>
                                   <span className={`text-[8px] px-1.5 py-0.2 rounded border font-mono ${statusBadgeStyle[eqp.status] || ''}`}>
                                     {statusLabels[eqp.status] || eqp.status}
                                   </span>
                                 </div>
                                 <h5 className="text-[11px] font-semibold text-slate-200 truncate group-hover/eqpitem:text-white transition">
                                   {eqp.name}
                                 </h5>
                                 <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed italic">
                                   Modèle : {eqp.model} • SN : {eqp.serialNumber}
                                 </p>
                                 <div className="flex items-center justify-between text-[8px] text-slate-500 border-t border-slate-900/40 pt-1.5 mt-0.5">
                                   <span>Pilote : {eqp.responsible}</span>
                                   <span className="text-sky-400 font-mono">Fiche Technique ↗</span>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       ) : (
                         <p className="text-[11px] text-slate-500 italic px-1">Aucun moyen technique ou équipement lié à ce processus.</p>
                       )}
                    </div>

                    <div className="h-[1px] bg-slate-800/80" />

                    {/* Documents & Enregistrements ALCOA+ */}
                    <div className="space-y-2">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Documents & Pièces ALCOA+ ({linkedProcessDocuments.length})</span>
                         <button
                           type="button"
                           onClick={() => onQuickAddDocumentForProcess(selectedNode.id)}
                           className="text-[10px] bg-indigo-500/10 hover:bg-indigo-550/20 text-indigo-300 font-semibold px-2 py-0.5 border border-indigo-505/20 rounded cursor-pointer transition font-mono flex items-center gap-1"
                         >
                           <FileText className="w-3 h-3 hover:translate-y-[-0.5px] transition" /> + Enregistrer Doc
                         </button>
                       </div>
                       {linkedProcessDocuments.length > 0 ? (
                         <div className="space-y-2">
                           {linkedProcessDocuments.map(doc => {
                             const score = [
                               doc.alcoaAssessment?.attributable, doc.alcoaAssessment?.legible, doc.alcoaAssessment?.contemporaneous,
                               doc.alcoaAssessment?.original, doc.alcoaAssessment?.accurate, doc.alcoaAssessment?.complete,
                               doc.alcoaAssessment?.consistent, doc.alcoaAssessment?.enduring, doc.alcoaAssessment?.available
                             ].filter(Boolean).length;

                             const certStyle = score === 9 
                               ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/35'
                               : 'text-amber-405 bg-amber-950/30 border-amber-900/35';

                             const docTypeLabels: Record<string, string> = {
                               sop: 'Procédure SOP',
                               form: 'Formulaire',
                               record: 'Enregistrement',
                               manual: 'Manuel SMI',
                               policy: 'Politique',
                               certificate: 'Certificat Ext.'
                             };

                             return (
                               <div
                                 key={doc.id}
                                 onClick={() => onSwitchTab('documents')}
                                 className="group/docitem bg-slate-950/50 hover:bg-slate-950 border border-slate-850 hover:border-slate-750 p-3 rounded-xl transition duration-150 cursor-pointer flex flex-col gap-1.5"
                               >
                                 <div className="flex justify-between items-center text-[9px] text-slate-500">
                                   <span className="font-mono text-slate-405 font-bold">{doc.code} ({doc.version})</span>
                                   <span className={`text-[8px] px-1.5 py-0.2 rounded border font-mono ${certStyle}`}>
                                     {score}/9 ALCOA+
                                   </span>
                                 </div>
                                 <h5 className="text-[11px] font-semibold text-slate-200 truncate group-hover/docitem:text-white transition">
                                   {doc.title}
                                 </h5>
                                 <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed italic">
                                   Type : {docTypeLabels[doc.type] || doc.type} • Garde : {doc.retentionPeriodYears} ans
                                 </p>
                                 <div className="flex items-center justify-between text-[8px] text-slate-500 border-t border-slate-900/40 pt-1.5 mt-0.5 font-mono">
                                   <span>Par : {doc.lastUpdatedBy}</span>
                                   <span className="text-indigo-400 font-bold">Dossier Traçabilité ↗</span>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       ) : (
                         <p className="text-[11px] text-slate-500 italic px-1">Aucun document réglementaire ALCOA+ lié à ce processus.</p>
                       )}
                    </div>

                    <div className="h-[1px] bg-slate-800/80" />

                    {/* QHSE Events Section (Accidents & Non-Conformités) */}
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Mains Courantes & Événements QHSE ({linkedProcessEvents.length})</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => onQuickAddEventForProcess(selectedNode.id, 'accident')}
                            className="flex-1 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-300 font-bold py-1 border border-red-500/20 rounded cursor-pointer transition text-center uppercase font-mono"
                          >
                            + Accident 🚨
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickAddEventForProcess(selectedNode.id, 'non_conformity')}
                            className="flex-1 text-[9px] bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 font-bold py-1 border border-orange-500/20 rounded cursor-pointer transition text-center uppercase font-mono"
                          >
                            + Non-Conf ❌
                          </button>
                        </div>
                      </div>

                      {linkedProcessEvents.length > 0 ? (
                        <div className="space-y-2">
                          {linkedProcessEvents.map(evt => {
                            const typeBadgeStyles: Record<string, string> = {
                              accident: 'text-red-400 bg-red-950/30 border-red-900/35',
                              non_conformity: 'text-orange-400 bg-orange-950/30 border-orange-900/35',
                              incident: 'text-amber-400 bg-amber-950/30 border-amber-900/35',
                              near_miss: 'text-slate-400 bg-slate-950/30 border-slate-900/35'
                            };
                            
                            const typeLabels: Record<string, string> = {
                              accident: 'Accident',
                              non_conformity: 'Non-Conformité',
                              incident: 'Incident',
                              near_miss: 'Presque-Accident'
                            };

                            const severityColors: Record<string, string> = {
                              low: 'text-slate-400',
                              medium: 'text-amber-400',
                              high: 'text-red-400 font-semibold',
                              critical: 'text-red-500 font-bold'
                            };

                            return (
                              <div
                                key={evt.id}
                                onClick={() => onSwitchTab('events')}
                                className="group/evtitem bg-slate-950/50 hover:bg-slate-950 border border-slate-850 hover:border-slate-750 p-3 rounded-xl transition duration-150 cursor-pointer flex flex-col gap-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono text-[9px] text-slate-500 font-bold">{evt.id}</span>
                                      <span className={`text-[8px] px-1.5 py-0.2 rounded font-semibold border uppercase font-mono ${typeBadgeStyles[evt.type] || ''}`}>
                                        {typeLabels[evt.type] || evt.type}
                                      </span>
                                    </div>
                                    <h5 className="text-[11px] font-semibold text-slate-200 truncate group-hover/evtitem:text-white transition mt-1">
                                      {evt.title}
                                    </h5>
                                  </div>
                                  <span className="text-[8.5px] text-slate-500 font-mono shrink-0">
                                    {evt.date}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed italic">
                                  {evt.description}
                                </p>
                                <div className="flex items-center justify-between text-[8px] text-slate-500 pt-1.5 border-t border-slate-900/60">
                                  <span>Gravité : <span className={severityColors[evt.severity]}>{evt.severity.toUpperCase()}</span></span>
                                  <span className="text-emerald-450 group-hover/evtitem:opacity-100 opacity-0 transition">Afficher dans Incidents & NC ↗</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic px-1">Aucun événement QHSE rattaché à ce processus.</p>
                      )}
                    </div>
                  </div>

                  {/* Fiche technique Attributes and Resources */}
                  {(selectedNode.attributes.length > 0 || selectedNode.resources.length > 0) && (
                    <div className="space-y-5 border-t border-slate-800 pt-5">
                      <h3 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Layers className="w-4 h-4 text-emerald-400" /> Caractéristiques & Documents
                      </h3>

                      {/* Attributes */}
                      {selectedNode.attributes.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Caractéristiques d'identité</span>
                          <div className="grid grid-cols-1 gap-2">
                            {selectedNode.attributes.map((attr, idx) => {
                              if (!attr.key) return null;
                              return (
                                <div key={idx} className="bg-slate-950/50 border border-slate-850 rounded-xl p-3 flex flex-col gap-1">
                                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">{attr.key}</span>
                                  <span className="text-xs font-medium text-slate-200">{attr.value || 'Non renseigné'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Documents / Resources */}
                      {selectedNode.resources.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Documents & Procédures associés ({selectedNode.resources.length})</span>
                          <div className="space-y-2.5">
                            {selectedNode.resources.map((res, idx) => {
                              if (!res.name) return null;
                              return (
                                <div key={idx} className="bg-slate-950/50 border border-slate-850 p-3 rounded-xl flex items-start gap-2.5">
                                  <div className="p-1 px-1.5 rounded bg-blue-950/30 text-blue-400 border border-blue-900/40 text-[9px] font-mono font-bold uppercase mt-0.5 shrink-0">
                                    {(RES_KINDS[res.kind] || RES_KINDS.procedure).label}
                                  </div>
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <h6 className="text-[11px] font-semibold text-slate-200 leading-tight truncate">{res.name}</h6>
                                    {res.content && (
                                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans">{res.content}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Edit Configuration Form Tab (Identical to previous selectedNode section) */
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Formulaire d'édition</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Appliquez des modifications en temps réel sur la cartographie.</p>
                    </div>
                    {nodeIdToConfirmDelete === selectedNode.id ? (
                      <div className="flex items-center gap-1 border border-red-900/40 bg-red-950/20 py-1 px-1.5 rounded-lg shrink-0">
                        <span className="text-[9px] text-red-400 font-bold font-mono">Supprimer?</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteNode(selectedNode.id)}
                          className="p-1 px-1.5 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold rounded cursor-pointer transition shadow-xs"
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          onClick={() => setNodeIdToConfirmDelete(null)}
                          className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-medium rounded cursor-pointer transition"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setNodeIdToConfirmDelete(selectedNode.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-850 rounded transition cursor-pointer"
                        title="Supprimer le processus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Inputs */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Libellé du processus</label>
                    <input 
                      type="text" 
                      value={selectedNode.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, name: val } : n);
                        onChangeData({ nodes: updated, edges });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Nom du processus..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Type de processus</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(NODE_TYPES).map(([key, t]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, type: key as any } : n);
                            onChangeData({ nodes: updated, edges });
                          }}
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] text-left transition flex items-center gap-1.5 cursor-pointer ${
                            selectedNode.type === key 
                              ? 'bg-slate-800 text-white font-semibold' 
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                          style={selectedNode.type === key ? { borderColor: t.color } : undefined}
                        >
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: t.color }} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Standards checkboxes Multi-select */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Normes Référentielles Applicables</label>
                    <div className="flex flex-wrap gap-1.5">
                      {STANDARDS.map(std => {
                        const has = selectedNode.standards.includes(std);
                        return (
                          <button
                            key={std}
                            type="button"
                            onClick={() => {
                              let nextStds = [...selectedNode.standards];
                              if (has) nextStds = nextStds.filter(s => s !== std);
                              else nextStds.push(std);
                              
                              const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, standards: nextStds } : n);
                              onChangeData({ nodes: updated, edges });
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono border transition flex items-center gap-1 cursor-pointer ${
                              has 
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold' 
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {has && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                            {std}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Description / Mission</label>
                    <textarea
                      value={selectedNode.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, description: val } : n);
                        onChangeData({ nodes: updated, edges });
                      }}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 leading-relaxed focus:outline-none focus:border-emerald-500 resize-none animate-pulse-slow"
                      placeholder="Décrivez l'impact de ce processus..."
                    />
                  </div>

                  {/* Interested Party & Supplier Evaluation Fields */}
                  {selectedNode.type === 'party' && (
                    <div className="p-4 bg-slate-950/65 border border-slate-800 rounded-lg space-y-4">
                      <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <User className="w-3.5 h-3.5 text-amber-400" /> Évaluation Partie Intéressée
                      </h4>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Pertinence dans le SMI</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { key: 'undetermined', label: 'Non déterminé' },
                            { key: 'pertinent', label: 'Pertinent' },
                            { key: 'non_pertinent', label: 'Non pertinent' }
                          ].map(item => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => {
                                const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, partyRelevance: item.key as any } : n);
                                onChangeData({ nodes: updated, edges });
                              }}
                              className={`py-1.5 px-2 rounded-lg border text-center text-[10px] cursor-pointer transition font-mono ${
                                selectedNode.partyRelevance === item.key || (!selectedNode.partyRelevance && item.key === 'undetermined')
                                  ? 'bg-slate-800 text-white font-bold border-slate-650'
                                  : 'bg-slate-900 border-slate-850 text-slate-400 hover:bg-slate-850'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1.5 uppercase font-mono">Justification / Analyse de la pertinence</label>
                        <textarea
                          value={selectedNode.partyRelevanceEvaluation || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, partyRelevanceEvaluation: val } : n);
                            onChangeData({ nodes: updated, edges });
                          }}
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                          placeholder="Évaluer l'impact sur la conformité de ce processus ..."
                        />
                      </div>

                      {/* Supplier Flag */}
                      <div className="border-t border-slate-850 pt-3">
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={selectedNode.isSupplier || false}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, isSupplier: checked, supplierRating: checked ? (selectedNode.supplierRating || 3) : undefined } : n);
                              onChangeData({ nodes: updated, edges });
                            }}
                            className="rounded border-slate-800 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <div className="text-[11px] font-semibold text-slate-300 uppercase font-mono">
                            Cette partie intéressée est un fournisseur
                          </div>
                        </label>
                        <p className="text-[9px] text-slate-500 mt-1 pl-6">
                          Active l'évaluation de performance périodique du prestataire / fournisseur.
                        </p>
                      </div>

                      {/* Supplier performance rating details */}
                      {selectedNode.isSupplier && (
                        <div className="bg-slate-900/60 border border-slate-850 rounded-lg p-3 space-y-3.5">
                          <div>
                            <label className="block text-[10px] font-mono font-semibold text-slate-400 uppercase mb-1">
                              Évaluation de performance (1 - 5)
                            </label>
                            <div className="flex items-center gap-1.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => {
                                    const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, supplierRating: star } : n);
                                    onChangeData({ nodes: updated, edges });
                                  }}
                                  className="text-lg focus:outline-none hover:scale-110 transition cursor-pointer"
                                >
                                  <span className={(selectedNode.supplierRating || 0) >= star ? 'text-amber-400' : 'text-slate-705'}>
                                    ★
                                  </span>
                                </button>
                              ))}
                              <span className="text-[10px] font-mono text-slate-400 ml-1.5">
                                Note : {selectedNode.supplierRating || 0} / 5
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono font-semibold text-slate-400 uppercase mb-1">
                              Commentaires / Résultats d'Audits
                            </label>
                            <textarea
                              value={selectedNode.supplierRatingComments || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, supplierRatingComments: val } : n);
                                onChangeData({ nodes: updated, edges });
                              }}
                              rows={2}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-amber-500 placeholder-slate-600"
                              placeholder="Qualité livraisons, respect des délais de livraison, retours non-conformités..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Client Satisfaction Evaluation Edit Fields */}
                  {selectedNode.type === 'client' && (
                    <div className="p-4 bg-slate-950/65 border border-slate-800 rounded-lg space-y-4">
                      <h4 className="text-xs font-semibold text-pink-500 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2">
                        <User className="w-3.5 h-3.5 text-pink-400" /> Évaluation Satisfaction Client
                      </h4>

                      <div>
                        <label className="block text-[10px] font-mono font-semibold text-slate-400 uppercase mb-1.5">
                          Évaluation de satisfaction (1 - 5 Étoiles)
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => {
                                const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, clientSatisfaction: star } : n);
                                onChangeData({ nodes: updated, edges });
                              }}
                              className="text-lg focus:outline-none hover:scale-110 transition cursor-pointer"
                            >
                              <span className={(selectedNode.clientSatisfaction || 0) >= star ? 'text-pink-400' : 'text-slate-700'}>
                                ★
                              </span>
                            </button>
                          ))}
                          <span className="text-[10px] font-mono text-slate-400 ml-1.5">
                            Note : {selectedNode.clientSatisfaction || 'Non Évalué'} / 5
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-semibold text-slate-400 uppercase mb-1.5 flex justify-between items-center">
                          <span>Taux de satisfaction (%)</span>
                          <span className="text-pink-400 font-bold bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/20 font-mono text-[10px]">
                            {selectedNode.clientSatisfactionPercentage !== undefined ? `${selectedNode.clientSatisfactionPercentage}%` : 'Non renseigné'}
                          </span>
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={selectedNode.clientSatisfactionPercentage !== undefined ? selectedNode.clientSatisfactionPercentage : 50}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, clientSatisfactionPercentage: val } : n);
                              onChangeData({ nodes: updated, edges });
                            }}
                            className="flex-1 accent-pink-500 cursor-pointer h-1.5 bg-slate-900 rounded-lg appearance-none border border-slate-800"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={selectedNode.clientSatisfactionPercentage !== undefined ? selectedNode.clientSatisfactionPercentage : ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                                const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, clientSatisfactionPercentage: val } : n);
                                onChangeData({ nodes: updated, edges });
                              }}
                              placeholder="--"
                              className="w-16 bg-slate-950 border border-slate-850 rounded-lg px-2 py-1 text-center text-xs text-slate-200 focus:outline-none focus:border-pink-500 font-mono shadow-inner"
                            />
                            <span className="text-slate-500 text-xs font-mono">%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-semibold text-slate-400 uppercase mb-1.5">
                          Commentaires / Retours d'Expérience Client
                        </label>
                        <textarea
                          value={selectedNode.clientSatisfactionComments || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, clientSatisfactionComments: val } : n);
                            onChangeData({ nodes: updated, edges });
                          }}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-pink-500 placeholder-slate-600"
                          placeholder="Points de douleur, compliments, satisfaction sur la qualité, retours d'opinions..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Attributes / Key Characteristics Pilots */}
                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase font-mono mb-0">Caractéristiques d'identité</label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextAttrs = [...selectedNode.attributes, { key: '', value: '' }];
                          const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, attributes: nextAttrs } : n);
                          onChangeData({ nodes: updated, edges });
                        }}
                        className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 transition flex items-center gap-0.5 cursor-pointer bg-transparent border-0 font-mono"
                      >
                        + Ajouter une clé
                      </button>
                    </div>

                    <div className="space-y-2">
                      {selectedNode.attributes.map((attr, idx) => (
                        <div key={idx} className="bg-slate-950/60 p-2 border border-slate-800 rounded-lg space-y-1.5 relative group/attr">
                          <button
                            type="button"
                            onClick={() => {
                              const nextAttrs = selectedNode.attributes.filter((_, i) => i !== idx);
                              const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, attributes: nextAttrs } : n);
                              onChangeData({ nodes: updated, edges });
                            }}
                            className="absolute right-2 top-2 p-1 text-slate-500 hover:text-red-400 rounded cursor-pointer opacity-0 group-hover/attr:opacity-100 transition-opacity bg-slate-950"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          
                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              value={attr.key}
                              onChange={(e) => {
                                const val = e.target.value;
                                const nextAttrs = selectedNode.attributes.map((a, i) => i === idx ? { ...a, key: val } : a);
                                const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, attributes: nextAttrs } : n);
                                onChangeData({ nodes: updated, edges });
                              }}
                              placeholder="Clé (ex: Pilote)"
                              className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-slate-700"
                            />
                            <input 
                              type="text" 
                              value={attr.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                const nextAttrs = selectedNode.attributes.map((a, i) => i === idx ? { ...a, value: val } : a);
                                const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, attributes: nextAttrs } : n);
                                onChangeData({ nodes: updated, edges });
                              }}
                              placeholder="Valeur"
                              className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-white focus:outline-none focus:border-slate-700"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {NODE_ATTR_SUGGESTIONS.map(s => {
                        const used = selectedNode.attributes.some(a => a.key.toLowerCase() === s.toLowerCase());
                        if (used) return null;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              const nextAttrs = [...selectedNode.attributes, { key: s, value: '' }];
                              const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, attributes: nextAttrs } : n);
                              onChangeData({ nodes: updated, edges });
                            }}
                            className="px-2 py-0.5 border border-dashed border-slate-800 text-[9px] text-slate-450 hover:text-emerald-450 hover:border-emerald-500/40 rounded-full cursor-pointer transition bg-transparent font-mono"
                          >
                            + {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Documents of process (Resources) */}
                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase font-mono mb-0">Documents associés (Fiches, Procédures)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextRes = [...selectedNode.resources, { name: '', kind: 'procedure' as const, content: '' }];
                          const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, resources: nextRes } : n);
                          onChangeData({ nodes: updated, edges });
                        }}
                        className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 transition flex items-center gap-0.5 cursor-pointer bg-transparent border-0 font-mono"
                      >
                        + Ajouter un document
                      </button>
                    </div>

                    <div className="space-y-3">
                      {selectedNode.resources.map((res, idx) => (
                        <div key={idx} className="bg-slate-950/40 p-2.5 border border-slate-800 rounded-lg space-y-2 relative group/res">
                          <button
                            type="button"
                            onClick={() => {
                              const nextRes = selectedNode.resources.filter((_, i) => i !== idx);
                              const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, resources: nextRes } : n);
                              onChangeData({ nodes: updated, edges });
                            }}
                            className="absolute right-2 top-2 p-1 text-slate-500 hover:text-red-400 rounded cursor-pointer opacity-0 group-hover/res:opacity-100 transition duration-150 bg-slate-950"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          <div className="flex gap-1.5">
                            <input 
                              type="text" 
                              value={res.name}
                              onChange={(e) => {
                                const val = e.target.value;
                                const nextRes = selectedNode.resources.map((r, i) => i === idx ? { ...r, name: val } : r);
                                const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, resources: nextRes } : n);
                                onChangeData({ nodes: updated, edges });
                              }}
                              placeholder="Nom du document..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-white focus:outline-none focus:border-slate-750"
                            />
                            <select
                              value={res.kind}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                const nextRes = selectedNode.resources.map((r, i) => i === idx ? { ...r, kind: val } : r);
                                const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, resources: nextRes } : n);
                                onChangeData({ nodes: updated, edges });
                              }}
                              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-350 focus:outline-none focus:border-slate-750 font-mono"
                            >
                              {Object.entries(RES_KINDS).map(([k, meta]) => (
                                <option key={k} value={k}>{meta.label}</option>
                              ))}
                            </select>
                          </div>

                          <textarea
                            value={res.content}
                            onChange={(e) => {
                              const val = e.target.value;
                              const nextRes = selectedNode.resources.map((r, i) => i === idx ? { ...r, content: val } : r);
                              const updated = nodes.map(n => n.id === selectedNode.id ? { ...n, resources: nextRes } : n);
                              onChangeData({ nodes: updated, edges });
                            }}
                            rows={2}
                            placeholder={RES_KINDS[res.kind]?.placeholder || ''}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-400 focus:outline-none resize-none leading-relaxed focus:border-slate-750"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
