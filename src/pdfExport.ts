/**
 * pdfExport.ts
 * Client-side PDF generation using jsPDF (loaded from CDN).
 * Three exports:
 *   exportTicketPDF  — single ticket report with all comments
 *   exportAssetPDF   — single asset report with linked tickets
 *   exportDashboardPDF — IT performance summary
 */

// jsPDF is injected via CDN in index.html — access via window
declare const window: any;

// ─── helpers ──────────────────────────────────────────────────────────────────

const BRAND   = '#6366f1';
const DARK    = '#111827';
const MID     = '#374151';
const LIGHT   = '#6b7280';
const BORDER  = '#f0f1f5';
const BG_PAGE = '#f7f8fc';

const STATUS_LABEL: Record<string, string> = {
  open: 'Aberto', 'in-progress': 'Em Atendimento', resolved: 'Resolvido', closed: 'Fechado',
};
const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};
const STATUS_COLOR: Record<string, string> = {
  open: '#f59e0b', 'in-progress': '#3b82f6', resolved: '#10b981', closed: '#9ca3af',
};
const PRIORITY_COLOR: Record<string, string> = {
  low: '#10b981', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444',
};
const ATIVO_STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo', manutencao: 'Manutenção', reserva: 'Reserva', desativado: 'Desativado',
};

function fmtDate(d: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(d));
}

function fmtDateShort(d: Date | string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(d));
}

/** Load jsPDF from CDN if not already loaded */
async function getJsPDF(): Promise<any> {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  if ((window as any).jsPDF) return (window as any).jsPDF;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load jsPDF'));
    document.head.appendChild(s);
  });
  return window.jspdf?.jsPDF || (window as any).jsPDF;
}

/** Draw page header with brand stripe */
function drawHeader(doc: any, title: string, subtitle: string) {
  const W = doc.internal.pageSize.getWidth();
  // indigo top bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, W, 14, 'F');
  // logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('SUPORTE TI', 14, 9.5);
  // title
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 30);
  // subtitle
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 37);
  // divider
  doc.setDrawColor(240, 241, 245);
  doc.setLineWidth(0.4);
  doc.line(14, 41, W - 14, 41);
  return 48; // y cursor after header
}

/** Draw a labelled key-value row */
function kv(doc: any, label: string, value: string, x: number, y: number, maxW = 80) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(17, 24, 39);
  const lines = doc.splitTextToSize(value || '—', maxW);
  doc.text(lines, x, y + 4.5);
  return y + 4.5 + lines.length * 4.5;
}

/** Colored pill badge */
function badge(doc: any, text: string, color: string, x: number, y: number) {
  const W = doc.getTextWidth(text) + 6;
  const H = 5.5;
  // parse hex
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  // light background (20% opacity approximation)
  doc.setFillColor(Math.round(r + (255 - r) * 0.8), Math.round(g + (255 - g) * 0.8), Math.round(b + (255 - b) * 0.8));
  doc.roundedRect(x, y - 4, W, H, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(r, g, b);
  doc.text(text, x + 3, y);
}

/** Page footer with page number */
function drawFooter(doc: any, pageNum: number, totalPages: number) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setDrawColor(240, 241, 245);
  doc.setLineWidth(0.3);
  doc.line(14, H - 12, W - 14, H - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(156, 163, 175);
  doc.text(`Gerado em ${fmtDate(new Date())}`, 14, H - 7);
  doc.text(`Página ${pageNum} de ${totalPages}`, W - 14, H - 7, { align: 'right' });
}

/** Check y and add new page if needed */
function checkPage(doc: any, y: number, margin = 20): number {
  const H = doc.internal.pageSize.getHeight();
  if (y > H - margin) {
    doc.addPage();
    return 20;
  }
  return y;
}

// ─── 1. TICKET PDF ────────────────────────────────────────────────────────────

export async function exportTicketPDF(ticket: any, userRole: string) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  let y = drawHeader(doc, `Chamado #${ticket.id}`, ticket.title);

  // ── Status + Priority badges ──
  badge(doc, STATUS_LABEL[ticket.status] || ticket.status, STATUS_COLOR[ticket.status] || '#9ca3af', 14, y + 2);
  badge(doc, PRIORITY_LABEL[ticket.priority] || ticket.priority, PRIORITY_COLOR[ticket.priority] || '#9ca3af', 14 + doc.getTextWidth(STATUS_LABEL[ticket.status] || ticket.status) + 12, y + 2);
  y += 10;

  // ── Info grid ──
  const col1 = 14, col2 = W / 2 + 4;
  const y1e = kv(doc, 'Categoria', ticket.category, col1, y, 80);
  const y2e = kv(doc, 'Aberto por', ticket.submittedBy, col2, y, 80);
  y = Math.max(y1e, y2e) + 2;

  const y3e = kv(doc, 'Criado em', fmtDate(ticket.createdAt), col1, y, 80);
  const y4e = kv(doc, 'Última atualização', fmtDate(ticket.updatedAt), col2, y, 80);
  y = Math.max(y3e, y4e) + 2;

  if (ticket.tecnicos?.length) {
    const names = ticket.tecnicos.map((t: any) => t.nome).join(', ');
    y = kv(doc, 'Técnicos responsáveis', names, col1, y, W - 28) + 2;
  }

  // ── Divider ──
  doc.setDrawColor(240, 241, 245);
  doc.line(14, y, W - 14, y);
  y += 6;

  // ── Description ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('DESCRIÇÃO', 14, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  const descLines = doc.splitTextToSize(ticket.description || '', W - 28);
  doc.text(descLines, 14, y);
  y += descLines.length * 4.5 + 6;

  // ── Comments ──
  const visibleComments = ticket.comments?.filter((c: any) =>
    userRole === 'it-executive' || !c.isInternal
  ) || [];

  if (visibleComments.length > 0) {
    doc.setDrawColor(240, 241, 245);
    doc.line(14, y, W - 14, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`COMENTÁRIOS (${visibleComments.length})`, 14, y);
    y += 7;

    for (const comment of visibleComments) {
      y = checkPage(doc, y, 30);

      // Comment bubble background
      const authorLine = `${comment.author?.split('@')[0] || 'Usuário'}  ·  ${fmtDate(comment.timestamp)}`;
      const contentLines = doc.splitTextToSize(comment.content || '', W - 36);
      const bubbleH = 5 + contentLines.length * 4.5 + 4;

      doc.setFillColor(247, 248, 252);
      doc.roundedRect(14, y - 4, W - 28, bubbleH, 2, 2, 'F');

      // Author
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(17, 24, 39);
      doc.text(comment.author?.split('@')[0] || 'Usuário', 18, y);

      // Timestamp
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      const nameW = doc.getTextWidth(comment.author?.split('@')[0] || 'Usuário') + 4;
      doc.text(`· ${fmtDate(comment.timestamp)}`, 18 + nameW, y);

      // Internal tag
      if (comment.isInternal && userRole === 'it-executive') {
        doc.setFillColor(238, 242, 255);
        const iW = doc.getTextWidth('INTERNO') + 4;
        doc.roundedRect(W - 14 - iW - 4, y - 3.5, iW + 4, 5, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(99, 102, 241);
        doc.text('INTERNO', W - 14 - iW, y);
      }

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      doc.text(contentLines, 18, y);
      y += contentLines.length * 4.5 + 6;
    }
  }

  // ── Page numbers ──
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  doc.save(`chamado-${ticket.id}.pdf`);
}

// ─── 2. ASSET PDF ─────────────────────────────────────────────────────────────

export async function exportAssetPDF(asset: any) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  const statusLabel = ATIVO_STATUS_LABEL[asset.status] || asset.status;
  const statusColors: Record<string, string> = {
    ativo: '#10b981', manutencao: '#f97316', reserva: '#6366f1', desativado: '#9ca3af',
  };

  let y = drawHeader(doc, asset.nome, `Relatório de Ativo · ${fmtDateShort(new Date())}`);

  // Status badge
  badge(doc, statusLabel, statusColors[asset.status] || '#9ca3af', 14, y + 2);
  y += 10;

  // ── Info grid ──
  const col1 = 14, col2 = W / 2 + 4;

  const y1 = kv(doc, 'Tipo', asset.tipo || '—', col1, y, 80);
  const y2 = kv(doc, 'Status', statusLabel, col2, y, 80);
  y = Math.max(y1, y2) + 2;

  const y3 = kv(doc, 'Número de Série', asset.numero_serie || '—', col1, y, 80);
  const y4 = kv(doc, 'Patrimônio', asset.patrimonio || '—', col2, y, 80);
  y = Math.max(y3, y4) + 2;

  const y5 = kv(doc, 'Localização', asset.localizacao || '—', col1, y, 80);
  const y6 = kv(doc, 'Responsável', asset.responsavel_nome || '—', col2, y, 80);
  y = Math.max(y5, y6) + 2;

  const y7 = kv(doc, 'Cadastrado em', fmtDate(asset.created_at), col1, y, 80);
  const y8 = kv(doc, 'Última atualização', fmtDate(asset.updated_at), col2, y, 80);
  y = Math.max(y7, y8) + 2;

  if (asset.observacoes) {
    doc.setDrawColor(240, 241, 245);
    doc.line(14, y, W - 14, y);
    y += 6;
    y = kv(doc, 'Observações', asset.observacoes, 14, y, W - 28) + 2;
  }

  // ── Linked tickets ──
  const chamados = asset.chamados || [];
  if (chamados.length > 0) {
    doc.setDrawColor(240, 241, 245);
    doc.line(14, y, W - 14, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`CHAMADOS VINCULADOS (${chamados.length})`, 14, y);
    y += 7;

    // Table header
    const cols = { id: 14, title: 26, status: 130, date: 162 };
    doc.setFillColor(247, 248, 252);
    doc.rect(14, y - 4, W - 28, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text('#', cols.id, y);
    doc.text('TÍTULO', cols.title, y);
    doc.text('STATUS', cols.status, y);
    doc.text('DATA', cols.date, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    for (const c of chamados) {
      y = checkPage(doc, y, 12);
      doc.setDrawColor(240, 241, 245);
      doc.line(14, y - 2, W - 14, y - 2);
      doc.setTextColor(55, 65, 81);
      doc.text(String(c.id || ''), cols.id, y + 2);
      const titleLines = doc.splitTextToSize(c.titulo || c.title || '—', 100);
      doc.text(titleLines[0], cols.title, y + 2);
      const sl = STATUS_LABEL[c.status] || c.status || '—';
      const sc = STATUS_COLOR[c.status] || '#9ca3af';
      badge(doc, sl, sc, cols.status, y + 3);
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(8);
      doc.text(c.created_at ? fmtDateShort(c.created_at) : '—', cols.date, y + 2);
      doc.setFontSize(8.5);
      y += 7;
    }
  } else {
    y += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('Nenhum chamado vinculado a este ativo.', 14, y);
  }

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  doc.save(`ativo-${asset.id}-${(asset.nome || 'relatorio').replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

// ─── 3. DASHBOARD PDF ─────────────────────────────────────────────────────────

export async function exportDashboardPDF(stats: {
  total: number; open: number; inProgress: number; resolved: number; closed: number;
  assets: { total: number; ativo: number; manutencao: number; desativado: number };
  weekData: { day: string; abertos: number; resolvidos: number }[];
  topCategories: { name: string; count: number }[];
  generatedBy: string;
}) {
  const JsPDF = await getJsPDF();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  const month = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());
  let y = drawHeader(doc, 'Relatório de Desempenho', `Equipe de TI · ${month.charAt(0).toUpperCase() + month.slice(1)}`);

  // ── Ticket stats cards (2×2) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('CHAMADOS', 14, y);
  y += 5;

  const cards = [
    { label: 'Total', value: stats.total, color: '#6366f1' },
    { label: 'Abertos', value: stats.open, color: '#f59e0b' },
    { label: 'Em Atendimento', value: stats.inProgress, color: '#3b82f6' },
    { label: 'Resolvidos', value: stats.resolved, color: '#10b981' },
  ];

  const cardW = (W - 28 - 9) / 4;
  cards.forEach((card, i) => {
    const cx = 14 + i * (cardW + 3);
    const r = parseInt(card.color.slice(1, 3), 16);
    const g = parseInt(card.color.slice(3, 5), 16);
    const b = parseInt(card.color.slice(5, 7), 16);
    doc.setFillColor(Math.round(r + (255 - r) * 0.9), Math.round(g + (255 - g) * 0.9), Math.round(b + (255 - b) * 0.9));
    doc.roundedRect(cx, y, cardW, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(r, g, b);
    doc.text(String(card.value), cx + cardW / 2, y + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(card.label, cx + cardW / 2, y + 17, { align: 'center' });
  });
  y += 26;

  // ── Asset stats ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('ATIVOS', 14, y);
  y += 5;

  const assetCards = [
    { label: 'Total', value: stats.assets.total, color: '#6366f1' },
    { label: 'Ativos', value: stats.assets.ativo, color: '#10b981' },
    { label: 'Manutenção', value: stats.assets.manutencao, color: '#f97316' },
    { label: 'Desativados', value: stats.assets.desativado, color: '#9ca3af' },
  ];

  assetCards.forEach((card, i) => {
    const cx = 14 + i * (cardW + 3);
    const r = parseInt(card.color.slice(1, 3), 16);
    const g = parseInt(card.color.slice(3, 5), 16);
    const b = parseInt(card.color.slice(5, 7), 16);
    doc.setFillColor(Math.round(r + (255 - r) * 0.9), Math.round(g + (255 - g) * 0.9), Math.round(b + (255 - b) * 0.9));
    doc.roundedRect(cx, y, cardW, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(r, g, b);
    doc.text(String(card.value), cx + cardW / 2, y + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(card.label, cx + cardW / 2, y + 17, { align: 'center' });
  });
  y += 26;

  // ── Resolution rate ──
  if (stats.total > 0) {
    const resolutionRate = Math.round((stats.resolved / stats.total) * 100);
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    doc.text(`${resolutionRate}% de taxa de resolução`, W / 2, y + 8.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text(`${stats.resolved} de ${stats.total} chamados resolvidos`, W / 2, y + 13, { align: 'center' });
    y += 20;
  }

  // ── Weekly activity bar chart (drawn manually) ──
  doc.setDrawColor(240, 241, 245);
  doc.line(14, y, W - 14, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('ATIVIDADE SEMANAL', 14, y);
  y += 6;

  if (stats.weekData.length > 0) {
    const chartH = 35;
    const chartW = W - 28;
    const maxVal = Math.max(...stats.weekData.flatMap(d => [d.abertos, d.resolvidos]), 1);
    const barW = (chartW / stats.weekData.length) * 0.3;
    const gap  = (chartW / stats.weekData.length) * 0.1;
    const slotW = chartW / stats.weekData.length;

    // y-axis gridlines
    for (let g2 = 0; g2 <= 4; g2++) {
      const gy = y + chartH - (g2 / 4) * chartH;
      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.2);
      doc.line(14, gy, 14 + chartW, gy);
    }

    stats.weekData.forEach((d, i) => {
      const x = 14 + i * slotW;
      const bH1 = (d.abertos / maxVal) * chartH;
      const bH2 = (d.resolvidos / maxVal) * chartH;

      // abertos bar (amber)
      doc.setFillColor(245, 158, 11);
      doc.rect(x + gap, y + chartH - bH1, barW, bH1, 'F');

      // resolvidos bar (green)
      doc.setFillColor(16, 185, 129);
      doc.rect(x + gap + barW + 1, y + chartH - bH2, barW, bH2, 'F');

      // day label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(156, 163, 175);
      doc.text(d.day, x + slotW / 2, y + chartH + 4, { align: 'center' });
    });

    y += chartH + 8;

    // Legend
    doc.setFillColor(245, 158, 11);
    doc.rect(14, y, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text('Abertos', 19, y + 2.5);

    doc.setFillColor(16, 185, 129);
    doc.rect(40, y, 3, 3, 'F');
    doc.text('Resolvidos', 45, y + 2.5);
    y += 8;
  }

  // ── Top categories table ──
  if (stats.topCategories.length > 0) {
    doc.setDrawColor(240, 241, 245);
    doc.line(14, y, W - 14, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('CHAMADOS POR CATEGORIA', 14, y);
    y += 6;

    const maxCount = Math.max(...stats.topCategories.map(c => c.count), 1);
    for (const cat of stats.topCategories) {
      y = checkPage(doc, y, 12);
      const barMaxW = W - 28 - 50;
      const bW = (cat.count / maxCount) * barMaxW;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(55, 65, 81);
      doc.text(cat.name, 14, y + 2);

      doc.setFillColor(238, 242, 255);
      doc.roundedRect(90, y - 2, barMaxW, 6, 1, 1, 'F');
      doc.setFillColor(99, 102, 241);
      if (bW > 0) doc.roundedRect(90, y - 2, bW, 6, 1, 1, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(99, 102, 241);
      doc.text(String(cat.count), 90 + barMaxW + 3, y + 2);
      y += 9;
    }
  }

  // ── Generated by ──
  y = checkPage(doc, y, 16);
  doc.setDrawColor(240, 241, 245);
  doc.line(14, y + 4, W - 14, y + 4);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text(`Relatório gerado por ${stats.generatedBy} em ${fmtDate(new Date())}`, 14, y);

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
  }

  doc.save(`relatorio-ti-${new Date().toISOString().slice(0, 7)}.pdf`);
}