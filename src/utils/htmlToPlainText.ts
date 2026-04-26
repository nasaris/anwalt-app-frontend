/**
 * Klartext aus HTML (Tiptap) für PDF, mailto und Leerprüfung.
 * Ohne Tags wird der String unverändert zurückgegeben (Legacy-Klartext).
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Mehrzeilige Vorlagen (nur \n) in minimales HTML für Tiptap. */
function plainBriefToHtml(plain: string): string {
  const normalized = plain.replace(/\r\n/g, '\n');
  if (!normalized.trim()) return '<p></p>';
  const blocks = normalized.split(/\n\n+/);
  return blocks
    .map((block) => {
      const lines = block.split('\n');
      const inner = lines.map((line) => escapeHtml(line)).join('<br>');
      return `<p>${inner}</p>`;
    })
    .join('');
}

/** Grobe Erkennung, ob der String bereits HTML (z. B. von Tiptap) ist. */
function looksLikeHtml(s: string): boolean {
  const t = s.trim();
  return t.startsWith('<') && /<[a-z][\s\S]*>/i.test(t);
}

/** Vorlagen- oder Legacy-Klartext → HTML für den Editor. */
export function toEditorHtml(raw: string): string {
  if (!raw.trim()) return '<p></p>';
  if (looksLikeHtml(raw)) return raw;
  return plainBriefToHtml(raw);
}

/**
 * HTML → lesbarer Klartext mit Zeilenumbrüchen (Browser).
 * Absätze (&lt;/p&gt;) werden zu Leerzeilen, damit PDF/E-Mail Absätze erhalten.
 */
export function htmlToPlainText(html: string): string {
  if (!html.trim()) return '';
  if (!html.includes('<')) return html.replace(/\r\n/g, '\n');
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const normalized = html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n');

  const el = document.createElement('div');
  el.innerHTML = normalized;
  const text = (el.innerText ?? el.textContent ?? '').replace(/\u00a0/g, ' ');
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Ob der Inhalt nach Entfernen von Whitespace/HTML leer ist. */
export function isEditorContentEmpty(html: string): boolean {
  return htmlToPlainText(html).trim().length === 0;
}
