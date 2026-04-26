import { Node, mergeAttributes } from '@tiptap/core';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Speicherformat in Vorlagen: `[BAUSTEIN:id]` → im Editor als grauer Chip mit Anzeigename. */
export function expandBausteinBracketMarkersToSpanHtml(
  html: string,
  getLabel: (id: string) => string,
): string {
  if (!html.includes('[BAUSTEIN:')) return html;
  return html.replace(/\[BAUSTEIN:([^\]]+)\]/g, (_m, rawId: string) => {
    const id = String(rawId).trim();
    const label = escapeHtml(getLabel(id) || id);
    const escId = escapeHtml(id);
    return `<span data-baustein-ph="1" data-baustein-id="${escId}" class="baustein-platzhalter-chip">${label}</span>`;
  });
}

/** Editor-HTML → Kanonisches Format mit `[BAUSTEIN:id]` für Speicherung / Schriftverkehr. */
export function collapseBausteinSpanToBracketMarkers(html: string): string {
  if (!html.includes('data-baustein-ph')) return html;
  if (typeof document === 'undefined') {
    return html.replace(
      /<span\b[^>]*\bdata-baustein-ph="1"[^>]*\bdata-baustein-id="([^"]*)"[^>]*>[\s\S]*?<\/span>/gi,
      (_m, id) => `[BAUSTEIN:${id.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')}]`,
    );
  }
  const el = document.createElement('div');
  el.innerHTML = html;
  el.querySelectorAll('span[data-baustein-ph="1"][data-baustein-id]').forEach((span) => {
    const id = span.getAttribute('data-baustein-id');
    if (!id) return;
    span.replaceWith(document.createTextNode(`[BAUSTEIN:${id}]`));
  });
  return el.innerHTML;
}

export type BausteinPlatzhalterOptions = {
  getLabel: (id: string) => string;
};

export const BausteinPlatzhalter = Node.create({
  name: 'bausteinPlatzhalter',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addOptions(): BausteinPlatzhalterOptions {
    return {
      getLabel: (id: string) => id,
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-baustein-id'),
        renderHTML: (attrs) => {
          if (!attrs.id) return {};
          return { 'data-baustein-id': attrs.id };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-baustein-ph="1"][data-baustein-id]',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const id = element.getAttribute('data-baustein-id');
          return id ? { id } : false;
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const id = node.attrs.id as string | null;
    if (!id) return ['span', mergeAttributes(HTMLAttributes, { class: 'baustein-platzhalter-chip' }), ''];
    const label = this.options.getLabel(id) || id;
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-baustein-ph': '1',
        'data-baustein-id': id,
        class: 'baustein-platzhalter-chip',
      }),
      label,
    ];
  },
});
