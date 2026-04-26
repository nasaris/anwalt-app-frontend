import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Extensions } from '@tiptap/core';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Gapcursor from '@tiptap/extension-gapcursor';
import {
  Box,
  Divider,
  IconButton,
  List,
  InputAdornment,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import TitleIcon from '@mui/icons-material/Title';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import DataObjectIcon from '@mui/icons-material/DataObject';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import LinkIcon from '@mui/icons-material/Link';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import SubscriptIcon from '@mui/icons-material/Subscript';
import SuperscriptIcon from '@mui/icons-material/Superscript';
import ImageIcon from '@mui/icons-material/Image';
import TableChartIcon from '@mui/icons-material/TableChart';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import CheckIcon from '@mui/icons-material/Check';
import SearchIcon from '@mui/icons-material/Search';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  BausteinPlatzhalter,
  collapseBausteinSpanToBracketMarkers,
  expandBausteinBracketMarkersToSpanHtml,
} from '../../tiptap/bausteinPlatzhalterExtension';
import { TEXTVORLAGE_PLATZHALTER_KATALOG } from '../../utils/textvorlagePlatzhalter';

/** Eintrag für Rechtsklick → Baustein an Cursorposition einfügen (`getHtml` = Inhalt als HTML; optional wenn nur Platzhalter). */
export interface TextbausteinEinfuegenOption {
  id: string;
  label: string;
  /** Für Schreiben/Fall: Baustein-HTML. Nicht nötig, wenn `kontextmenueBausteineAlsPlatzhalter` gesetzt ist. */
  getHtml?: () => string;
}

export interface SchriftverkehrEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Mindesthöhe des Bearbeitungsbereichs (z. B. 320 oder CSS calc) */
  minHeight?: number | string;
  /** Optional oberhalb des Brieftextes (z. B. Briefkopf-Vorschau im Fokusmodus) */
  briefkopf?: ReactNode;
  /** Rechtsklick im Text: Suche und Einfügen eines Bausteins an der Cursorposition */
  textBausteineZumEinfuegen?: TextbausteinEinfuegenOption[];
  /** Textvorlagen: Rechtsklick fügt `[BAUSTEIN:id]` ein statt Baustein-Text (Standard: false = HTML aus `getHtml`). */
  kontextmenueBausteineAlsPlatzhalter?: boolean;
  /** Textvorlagen: `[BAUSTEIN:id]` an der Cursorposition einfügen (Toolbar) */
  bausteinPlatzhalterOptionen?: { id: string; label: string }[];
  /** Namen für Baustein-Chips (Vorlagen-Editor); Schlüssel = Baustein-ID */
  bausteinPlatzhalterLabels?: Record<string, string>;
}

const DEFAULT_TEXT_COLOR = '#111827';
const DEFAULT_HIGHLIGHT = '#fef08a';

type KontextMenueAnsicht = 'root' | 'bausteine' | 'system-platzhalter';

export default function SchriftverkehrEditor({
  value,
  onChange,
  placeholder = 'Brieftext eingeben…',
  minHeight = 280,
  briefkopf,
  textBausteineZumEinfuegen,
  kontextmenueBausteineAlsPlatzhalter = false,
  bausteinPlatzhalterOptionen,
  bausteinPlatzhalterLabels,
}: SchriftverkehrEditorProps) {
  const labelsRef = useRef<Record<string, string>>({});
  labelsRef.current = bausteinPlatzhalterLabels ?? {};

  const [headingAnchor, setHeadingAnchor] = useState<null | HTMLElement>(null);
  const [platzhalterAnchor, setPlatzhalterAnchor] = useState<null | HTMLElement>(null);
  const [colorAnchor, setColorAnchor] = useState<null | HTMLElement>(null);
  const [highlightAnchor, setHighlightAnchor] = useState<null | HTMLElement>(null);
  const [tableAnchor, setTableAnchor] = useState<null | HTMLElement>(null);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);

  const [highlightColor, setHighlightColor] = useState(DEFAULT_HIGHLIGHT);
  const [bausteinCtxPos, setBausteinCtxPos] = useState<{ top: number; left: number } | null>(null);
  const [kontextMenueAnsicht, setKontextMenueAnsicht] = useState<KontextMenueAnsicht>('root');
  const [kontextMenueSuche, setKontextMenueSuche] = useState('');
  /** Rechtsklick-Menü Bausteine: Platzhalter-Chip vs. vollständiger Baustein-HTML-Block */
  const [kontextmenueEinfuegenModus, setKontextmenueEinfuegenModus] = useState<'platzhalter' | 'text'>('text');

  const editorExtensions = useMemo((): Extensions => {
    const list: Extensions = [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Image.configure({ allowBase64: true }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: 'schriftverkehr-table' },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Gapcursor,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ];
    if (kontextmenueBausteineAlsPlatzhalter) {
      list.push(
        BausteinPlatzhalter.configure({
          getLabel: (id: string) => labelsRef.current[id] ?? id,
        }),
      );
    }
    return list;
  }, [kontextmenueBausteineAlsPlatzhalter, placeholder]);

  const editor = useEditor(
    {
    extensions: editorExtensions,
    content: (() => {
      const v = value?.trim() ? value : '<p></p>';
      return kontextmenueBausteineAlsPlatzhalter
        ? expandBausteinBracketMarkersToSpanHtml(v, (id) => labelsRef.current[id] ?? id)
        : v;
    })(),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'schriftverkehr-prose',
      },
    },
    onUpdate: ({ editor: ed }) => {
      let html = ed.getHTML();
      if (kontextmenueBausteineAlsPlatzhalter) {
        html = collapseBausteinSpanToBracketMarkers(html);
      }
      onChange(html);
    },
  },
  [editorExtensions, kontextmenueBausteineAlsPlatzhalter],
  );

  useEffect(() => {
    if (!editor) return;
    const incoming = (value?.trim() ? value : '<p></p>').trim();

    if (!kontextmenueBausteineAlsPlatzhalter) {
      if (editor.getHTML().trim() === incoming) return;
      editor.commands.setContent(incoming, { emitUpdate: false });
      return;
    }

    const expandedIncoming = expandBausteinBracketMarkersToSpanHtml(incoming, (id) => labelsRef.current[id] ?? id);
    const collapsedDoc = collapseBausteinSpanToBracketMarkers(editor.getHTML()).trim();
    if (collapsedDoc === incoming && editor.getHTML() === expandedIncoming) return;
    editor.commands.setContent(expandedIncoming, { emitUpdate: false });
  }, [value, editor, kontextmenueBausteineAlsPlatzhalter, bausteinPlatzhalterLabels]);

  const gefilterteBausteine = useMemo(() => {
    const list = textBausteineZumEinfuegen ?? [];
    const q = kontextMenueSuche.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => b.label.toLowerCase().includes(q));
  }, [textBausteineZumEinfuegen, kontextMenueSuche]);

  const gefilterteSystemPlatzhalter = useMemo(() => {
    const q = kontextMenueSuche.trim().toLowerCase();
    if (!q) return [...TEXTVORLAGE_PLATZHALTER_KATALOG];
    return TEXTVORLAGE_PLATZHALTER_KATALOG.filter(
      (p) =>
        p.token.toLowerCase().includes(q) ||
        p.beschreibung.toLowerCase().includes(q),
    );
  }, [kontextMenueSuche]);

  const toolbarReserve = 48;
  const placeholderMin =
    typeof minHeight === 'number' ? minHeight + toolbarReserve : 'calc(100vh - 100px)';

  if (!editor) {
    return (
      <Box
        sx={(theme) => ({
          borderRadius: 2,
          minHeight: placeholderMin,
          bgcolor: theme.palette.mode === 'light' ? '#E7E6E6' : theme.palette.grey[900],
          border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : theme.palette.divider}`,
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
        })}
      >
        <Box
          sx={(theme) => ({
            width: '100%',
            maxWidth: '210mm',
            minHeight: typeof minHeight === 'number' ? minHeight : 200,
            bgcolor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[100],
            borderRadius: 1,
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)'
                : '0 2px 12px rgba(0,0,0,0.35)',
          })}
        >
          {briefkopf}
          <Box sx={{ minHeight: typeof minHeight === 'number' ? minHeight : 120, bgcolor: 'action.hover' }} />
        </Box>
      </Box>
    );
  }

  const btnSx = { borderRadius: 1 };

  const openLinkDialog = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link-URL', prev ?? 'https://');
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  };

  const openImageDialog = () => {
    const url = window.prompt('Bild-URL (https://…)', 'https://');
    if (url === null || !url.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const schliesseBausteinMenue = () => {
    setBausteinCtxPos(null);
    setKontextMenueSuche('');
    setKontextMenueAnsicht('root');
  };

  const fuegeBausteinEin = (opt: TextbausteinEinfuegenOption) => {
    if (kontextmenueEinfuegenModus === 'platzhalter') {
      if (editor.schema.nodes.bausteinPlatzhalter) {
        editor.chain().focus().insertContent({ type: 'bausteinPlatzhalter', attrs: { id: opt.id } }).run();
      } else {
        editor.chain().focus().insertContent(`[BAUSTEIN:${opt.id}]`).run();
      }
    } else {
      const html = opt.getHtml?.() ?? '';
      if (!html) return;
      editor.chain().focus().insertContent(html).run();
    }
    schliesseBausteinMenue();
  };

  const fuegeSystemPlatzhalter = (token: string) => {
    editor.chain().focus().insertContent(token).run();
    schliesseBausteinMenue();
  };

  const headingLabel = () => {
    for (let level = 1; level <= 6; level += 1) {
      if (editor.isActive('heading', { level })) return `H${level}`;
    }
    return 'Absatz';
  };

  const listKontextBausteine = textBausteineZumEinfuegen ?? [];
  const kontextKannPlatzhalter = editor.schema.nodes.bausteinPlatzhalter !== undefined;
  const kontextKannText = listKontextBausteine.some((o) => o.getHtml !== undefined);
  const kontextZeigeModusWahl = kontextKannPlatzhalter && kontextKannText;
  const kontextHatBausteine =
    listKontextBausteine.length > 0 && (kontextKannPlatzhalter || kontextKannText);

  return (
    <>
    <Box
      sx={(theme) => ({
        borderRadius: 2,
        overflow: 'visible',
        bgcolor: theme.palette.mode === 'light' ? '#E7E6E6' : theme.palette.grey[900],
        border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : theme.palette.divider}`,
        transition: theme.transitions.create(['box-shadow'], {
          duration: theme.transitions.duration.shorter,
        }),
      })}
    >
      <Stack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        gap={0.25}
        sx={(theme) => ({
          px: 0.75,
          py: 0.5,
          borderBottom: '1px solid',
          borderColor: theme.palette.mode === 'light' ? '#E1DFDD' : theme.palette.divider,
          bgcolor: theme.palette.mode === 'light' ? '#F3F2F1' : theme.palette.grey[800],
        })}
      >
        <Tooltip title="Überschrift / Absatz">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={(e) => setHeadingAnchor(e.currentTarget)}
            color={editor.isActive('heading') ? 'primary' : 'default'}
            aria-label="Überschrift wählen"
          >
            <TitleIcon fontSize="small" />
            <Typography component="span" variant="caption" sx={{ ml: 0.25, minWidth: 28 }}>
              {headingLabel()}
            </Typography>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={headingAnchor}
          open={Boolean(headingAnchor)}
          onClose={() => setHeadingAnchor(null)}
          slotProps={{ paper: { sx: { maxHeight: 360 } } }}
        >
          <MenuItem
            onClick={() => {
              editor.chain().focus().setParagraph().run();
              setHeadingAnchor(null);
            }}
            selected={editor.isActive('paragraph') && !editor.isActive('heading')}
          >
            {editor.isActive('paragraph') && !editor.isActive('heading') ? (
              <CheckIcon fontSize="small" sx={{ mr: 1 }} />
            ) : (
              <Box component="span" sx={{ width: 24, mr: 1 }} />
            )}
            Normaler Absatz
          </MenuItem>
          {([1, 2, 3, 4, 5, 6] as const).map((level) => (
            <MenuItem
              key={level}
              onClick={() => {
                editor.chain().focus().toggleHeading({ level }).run();
                setHeadingAnchor(null);
              }}
              selected={editor.isActive('heading', { level })}
            >
              {editor.isActive('heading', { level }) ? (
                <CheckIcon fontSize="small" sx={{ mr: 1 }} />
              ) : (
                <Box component="span" sx={{ width: 24, mr: 1 }} />
              )}
              Überschrift {level}
            </MenuItem>
          ))}
        </Menu>

        {bausteinPlatzhalterOptionen && bausteinPlatzhalterOptionen.length > 0 ? (
          <>
            <Tooltip title="Textbaustein an dieser Stelle — Platzhalter [BAUSTEIN:…] einfügen">
              <IconButton
                size="small"
                sx={btnSx}
                onClick={(e) => setPlatzhalterAnchor(e.currentTarget)}
                color="primary"
                aria-label="Baustein-Platzhalter einfügen"
              >
                <NoteAddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={platzhalterAnchor}
              open={Boolean(platzhalterAnchor)}
              onClose={() => setPlatzhalterAnchor(null)}
              slotProps={{ paper: { sx: { maxHeight: 360 } } }}
            >
              {bausteinPlatzhalterOptionen.map((o) => (
                <MenuItem
                  key={o.id}
                  onClick={() => {
                    if (kontextmenueBausteineAlsPlatzhalter) {
                      editor.chain().focus().insertContent({ type: 'bausteinPlatzhalter', attrs: { id: o.id } }).run();
                    } else {
                      editor.chain().focus().insertContent(`[BAUSTEIN:${o.id}]`).run();
                    }
                    setPlatzhalterAnchor(null);
                  }}
                >
                  {o.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        ) : null}

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, alignSelf: 'stretch', my: 0.5 }} />

        <Tooltip title="Fett (Strg+B)">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleBold().run()}
            color={editor.isActive('bold') ? 'primary' : 'default'}
            aria-label="Fett"
          >
            <FormatBoldIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Kursiv (Strg+I)">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            color={editor.isActive('italic') ? 'primary' : 'default'}
            aria-label="Kursiv"
          >
            <FormatItalicIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Unterstrichen (Strg+U)">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            color={editor.isActive('underline') ? 'primary' : 'default'}
            aria-label="Unterstrichen"
          >
            <FormatUnderlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, alignSelf: 'stretch', my: 0.5 }} />

        <Tooltip title="Link setzen oder entfernen">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={openLinkDialog}
            color={editor.isActive('link') ? 'primary' : 'default'}
            aria-label="Link"
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, alignSelf: 'stretch', my: 0.5 }} />

        <Tooltip title="Linksbündig">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}
            aria-label="Linksbündig"
          >
            <FormatAlignLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zentriert">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}
            aria-label="Zentriert"
          >
            <FormatAlignCenterIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Rechtsbündig">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}
            aria-label="Rechtsbündig"
          >
            <FormatAlignRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Blocksatz">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            color={editor.isActive({ textAlign: 'justify' }) ? 'primary' : 'default'}
            aria-label="Blocksatz"
          >
            <FormatAlignJustifyIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, alignSelf: 'stretch', my: 0.5 }} />

        <Tooltip title="Schriftfarbe">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={(e) => setColorAnchor(e.currentTarget)}
            aria-label="Schriftfarbe"
          >
            <FormatColorTextIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Popover
          open={Boolean(colorAnchor)}
          anchorEl={colorAnchor}
          onClose={() => setColorAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Schriftfarbe
            </Typography>
            <input
              type="color"
              value={textColor}
              onChange={(e) => {
                const c = e.target.value;
                setTextColor(c);
                editor.chain().focus().setColor(c).run();
              }}
              aria-label="Schriftfarbe wählen"
            />
            <IconButton
              size="small"
              sx={{ mt: 1, display: 'block' }}
              onClick={() => {
                editor.chain().focus().unsetColor().run();
                setTextColor(DEFAULT_TEXT_COLOR);
                setColorAnchor(null);
              }}
            >
              Farbe zurücksetzen
            </IconButton>
          </Box>
        </Popover>

        <Tooltip title="Hervorheben (Marker)">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={(e) => setHighlightAnchor(e.currentTarget)}
            color={editor.isActive('highlight') ? 'primary' : 'default'}
            aria-label="Hervorheben"
          >
            <BorderColorIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Popover
          open={Boolean(highlightAnchor)}
          anchorEl={highlightAnchor}
          onClose={() => setHighlightAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Markerfarbe
            </Typography>
            <input
              type="color"
              value={highlightColor}
              onChange={(e) => {
                const c = e.target.value;
                setHighlightColor(c);
                editor.chain().focus().toggleHighlight({ color: c }).run();
              }}
              aria-label="Markerfarbe wählen"
            />
            <IconButton
              size="small"
              sx={{ mt: 1, display: 'block' }}
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setHighlightColor(DEFAULT_HIGHLIGHT);
                setHighlightAnchor(null);
              }}
            >
              Hervorhebung entfernen
            </IconButton>
          </Box>
        </Popover>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, alignSelf: 'stretch', my: 0.5 }} />

        <Tooltip title="Tiefgestellt">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            color={editor.isActive('subscript') ? 'primary' : 'default'}
            aria-label="Tiefgestellt"
          >
            <SubscriptIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Hochgestellt">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            color={editor.isActive('superscript') ? 'primary' : 'default'}
            aria-label="Hochgestellt"
          >
            <SuperscriptIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, alignSelf: 'stretch', my: 0.5 }} />

        <Tooltip title="Aufzählung">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            color={editor.isActive('bulletList') ? 'primary' : 'default'}
            aria-label="Aufzählung"
          >
            <FormatListBulletedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Nummerierte Liste">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            color={editor.isActive('orderedList') ? 'primary' : 'default'}
            aria-label="Nummerierte Liste"
          >
            <FormatListNumberedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, alignSelf: 'stretch', my: 0.5 }} />

        <Tooltip title="Durchgestrichen">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            color={editor.isActive('strike') ? 'primary' : 'default'}
            aria-label="Durchgestrichen"
          >
            <StrikethroughSIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zitat">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            color={editor.isActive('blockquote') ? 'primary' : 'default'}
            aria-label="Zitat"
          >
            <FormatQuoteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Inline-Code">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleCode().run()}
            color={editor.isActive('code') ? 'primary' : 'default'}
            aria-label="Inline-Code"
          >
            <CodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Code-Block">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            color={editor.isActive('codeBlock') ? 'primary' : 'default'}
            aria-label="Code-Block"
          >
            <DataObjectIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Horizontale Linie">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            aria-label="Horizontale Linie"
          >
            <HorizontalRuleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zeilenumbruch (Shift+Enter)">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={() => editor.chain().focus().setHardBreak().run()}
            aria-label="Zeilenumbruch"
          >
            <KeyboardReturnIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, alignSelf: 'stretch', my: 0.5 }} />

        <Tooltip title="Bild einfügen (URL)">
          <IconButton size="small" sx={btnSx} onClick={openImageDialog} aria-label="Bild">
            <ImageIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Tabelle">
          <IconButton
            size="small"
            sx={btnSx}
            onClick={(e) => setTableAnchor(e.currentTarget)}
            color={editor.isActive('table') ? 'primary' : 'default'}
            aria-label="Tabelle"
          >
            <TableChartIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={tableAnchor}
          open={Boolean(tableAnchor)}
          onClose={() => setTableAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
              setTableAnchor(null);
            }}
          >
            Tabelle 3×3 einfügen
          </MenuItem>
          {editor.isActive('table') && (
            <>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().addColumnBefore().run();
                  setTableAnchor(null);
                }}
              >
                Spalte links
              </MenuItem>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().addColumnAfter().run();
                  setTableAnchor(null);
                }}
              >
                Spalte rechts
              </MenuItem>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().deleteColumn().run();
                  setTableAnchor(null);
                }}
              >
                Spalte löschen
              </MenuItem>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().addRowBefore().run();
                  setTableAnchor(null);
                }}
              >
                Zeile oben
              </MenuItem>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().addRowAfter().run();
                  setTableAnchor(null);
                }}
              >
                Zeile unten
              </MenuItem>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().deleteRow().run();
                  setTableAnchor(null);
                }}
              >
                Zeile löschen
              </MenuItem>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().mergeCells().run();
                  setTableAnchor(null);
                }}
                disabled={!editor.can().mergeCells()}
              >
                Zellen verbinden
              </MenuItem>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().splitCell().run();
                  setTableAnchor(null);
                }}
                disabled={!editor.can().splitCell()}
              >
                Zelle teilen
              </MenuItem>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().toggleHeaderRow().run();
                  setTableAnchor(null);
                }}
              >
                Kopfzeile umschalten
              </MenuItem>
              <MenuItem
                onClick={() => {
                  editor.chain().focus().deleteTable().run();
                  setTableAnchor(null);
                }}
              >
                Tabelle löschen
              </MenuItem>
            </>
          )}
        </Menu>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, alignSelf: 'stretch', my: 0.5 }} />

        <Tooltip title="Rückgängig (Strg+Z)">
          <span>
            <IconButton
              size="small"
              sx={btnSx}
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              aria-label="Rückgängig"
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Wiederholen (Strg+Y)">
          <span>
            <IconButton
              size="small"
              sx={btnSx}
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              aria-label="Wiederholen"
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          p: { xs: 1.5, sm: 2, md: 2.5 },
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={(theme) => ({
            position: 'relative',
            width: '100%',
            maxWidth: '210mm',
            bgcolor: theme.palette.mode === 'light' ? '#ffffff' : theme.palette.grey[100],
            color: theme.palette.mode === 'light' ? '#242424' : 'text.primary',
            borderRadius: 1,
            border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : theme.palette.divider}`,
            boxShadow:
              theme.palette.mode === 'light'
                ? '0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.06)'
                : '0 2px 12px rgba(0,0,0,0.35)',
            transition: theme.transitions.create(['box-shadow'], {
              duration: theme.transitions.duration.shorter,
            }),
            '&:focus-within': {
              boxShadow:
                theme.palette.mode === 'light'
                  ? `0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px ${theme.palette.primary.main}`
                  : `0 4px 20px rgba(0,0,0,0.45), 0 0 0 1px ${theme.palette.primary.main}`,
            },
          })}
        >
          {/* Falzmarken + Seitentrennung entfernt — PDF-Vorschau im Fokusmodus nutzen */}
          {briefkopf ? (
            <Box
              sx={(theme) => ({
                px: 0,
                pt: 0,
                pb: 0,
                borderBottom: 'none',
                fontFamily:
                  '"Arial", "Arial MT", "Helvetica Neue", Helvetica, sans-serif',
                fontSize: '11pt',
                lineHeight: 1.5,
                color: theme.palette.mode === 'light' ? '#242424' : 'text.primary',
              })}
            >
              {briefkopf}
            </Box>
          ) : null}
          <Box
            sx={(theme) => ({
              '& .ProseMirror': {
                minHeight,
                outline: 'none',
                ...(briefkopf
                  ? {
                      pt: '12px',
                      pb: { xs: 2.5, sm: 3, md: 5 },
                      pl: '25mm',
                      pr: '20mm',
                    }
                  : {
                      px: { xs: 2, sm: 3, md: 5 },
                      py: { xs: 2.5, sm: 3, md: 5 },
                    }),
                fontFamily: briefkopf
                  ? '"Arial", "Arial MT", "Helvetica Neue", Helvetica, sans-serif'
                  : '"Segoe UI", "Calibri", "Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: '11pt',
                lineHeight: briefkopf ? 1.68 : 1.5,
                ...(briefkopf
                  ? {
                      '& p:first-of-type': { marginTop: 0 },
                    }
                  : {}),
                '& p.is-editor-empty:first-of-type::before': {
                  color: theme.palette.text.disabled,
                  float: 'left',
                  height: 0,
                  pointerEvents: 'none',
                  content: 'attr(data-placeholder)',
                },
                '& p': briefkopf ? { mt: 0, mb: '3mm' } : { mb: 1 },
                '& h1': { mt: 1.5, mb: 0.75, fontWeight: 700, fontSize: '1.75rem' },
                '& h2': { mt: 1.5, mb: 0.75, fontWeight: 600, fontSize: '1.5rem' },
                '& h3': { mt: 1.5, mb: 0.75, fontWeight: 600, fontSize: '1.25rem' },
                '& h4': { mt: 1.25, mb: 0.5, fontWeight: 600, fontSize: '1.1rem' },
                '& h5': { mt: 1.25, mb: 0.5, fontWeight: 600, fontSize: '1.05rem' },
                '& h6': { mt: 1.25, mb: 0.5, fontWeight: 600, fontSize: '1rem', fontStyle: 'italic' },
                '& ul, & ol': { pl: 2.5, my: 1 },
                '& blockquote': {
                  borderLeft: '4px solid',
                  borderColor: 'divider',
                  pl: 2,
                  my: 1,
                  color: 'text.secondary',
                  fontStyle: 'italic',
                },
                '& code': {
                  bgcolor: 'action.hover',
                  px: 0.5,
                  borderRadius: 0.5,
                  fontSize: '0.9em',
                  fontFamily: 'ui-monospace, monospace',
                },
                '& pre': {
                  bgcolor: 'action.hover',
                  p: 1.5,
                  borderRadius: 1,
                  overflow: 'auto',
                  my: 1,
                  '& code': { bgcolor: 'transparent', p: 0 },
                },
                '& hr': { my: 2, borderColor: 'divider' },
                '& a': { color: 'primary.main', textDecoration: 'underline' },
                '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1, my: 1 },
                '& table.schriftverkehr-table, & table': {
                  borderCollapse: 'collapse',
                  width: '100%',
                  my: 1,
                  tableLayout: 'auto',
                },
                '& th, & td': {
                  border: `1px solid ${theme.palette.divider}`,
                  px: 1,
                  py: 0.75,
                  verticalAlign: 'top',
                },
                '& th': { bgcolor: 'action.hover', fontWeight: 600 },
                '& .baustein-platzhalter-chip': {
                  display: 'inline-block',
                  margin: '0 1px',
                  px: 0.75,
                  py: 0.125,
                  borderRadius: 1,
                  fontSize: '0.92em',
                  lineHeight: 1.45,
                  verticalAlign: 'baseline',
                  bgcolor: theme.palette.mode === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)',
                  color: theme.palette.text.secondary,
                  border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'}`,
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              },
            })}
            onContextMenu={(e) => {
              const list = textBausteineZumEinfuegen ?? [];
              const el = e.target as HTMLElement;
              if (!el.closest?.('.ProseMirror')) return;
              const kannP = editor.schema.nodes.bausteinPlatzhalter !== undefined;
              const kannT = list.some((o) => o.getHtml !== undefined);
              const hatBausteinEinfuegen = list.length > 0 && (kannP || kannT);
              const hatSystemPlatzhalter = TEXTVORLAGE_PLATZHALTER_KATALOG.length > 0;
              if (!hatBausteinEinfuegen && !hatSystemPlatzhalter) return;
              e.preventDefault();
              if (hatBausteinEinfuegen && hatSystemPlatzhalter) {
                setKontextMenueAnsicht('root');
              } else if (hatBausteinEinfuegen) {
                setKontextMenueAnsicht('bausteine');
                let startModus: 'platzhalter' | 'text';
                if (kannP && kannT) {
                  startModus = kontextmenueBausteineAlsPlatzhalter ? 'platzhalter' : 'text';
                } else if (kannP) startModus = 'platzhalter';
                else startModus = 'text';
                setKontextmenueEinfuegenModus(startModus);
              } else {
                setKontextMenueAnsicht('system-platzhalter');
              }
              setBausteinCtxPos({ top: e.clientY, left: e.clientX });
              setKontextMenueSuche('');
            }}
          >
            <EditorContent editor={editor} />
          </Box>
        </Box>
      </Box>
    </Box>
    <Popover
      open={bausteinCtxPos !== null}
      onClose={schliesseBausteinMenue}
      anchorReference="anchorPosition"
      anchorPosition={bausteinCtxPos ?? { top: 0, left: 0 }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            width: 380,
            maxHeight: 440,
            display: 'flex',
            flexDirection: 'column',
            p: 1,
            mt: 0.5,
          },
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.75 }}>
        {kontextMenueAnsicht !== 'root' ? (
          <IconButton
            size="small"
            aria-label="Zurück"
            onClick={() => {
              setKontextMenueAnsicht('root');
              setKontextMenueSuche('');
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        ) : null}
        <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
          {kontextMenueAnsicht === 'root' && 'Einfügen'}
          {kontextMenueAnsicht === 'bausteine' && 'Textbausteine'}
          {kontextMenueAnsicht === 'system-platzhalter' && 'Fall- und Kanzlei-Platzhalter'}
        </Typography>
      </Stack>

      {kontextMenueAnsicht === 'root' ? (
        <List dense sx={{ py: 0, maxHeight: 300, overflow: 'auto' }}>
          {kontextHatBausteine ? (
            <ListItemButton
              onClick={() => {
                let startModus: 'platzhalter' | 'text';
                if (kontextZeigeModusWahl) {
                  startModus = kontextmenueBausteineAlsPlatzhalter ? 'platzhalter' : 'text';
                } else if (kontextKannPlatzhalter) startModus = 'platzhalter';
                else startModus = 'text';
                setKontextmenueEinfuegenModus(startModus);
                setKontextMenueAnsicht('bausteine');
                setKontextMenueSuche('');
              }}
            >
              <ListItemText
                primary="Textbausteine"
                secondary="Baustein-Platzhalter [BAUSTEIN:…] oder vollständigen Text einfügen"
                primaryTypographyProps={{ variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          ) : null}
          <ListItemButton
            onClick={() => {
              setKontextMenueAnsicht('system-platzhalter');
              setKontextMenueSuche('');
            }}
          >
            <ListItemText
              primary="Fall- und Kanzlei-Platzhalter"
              secondary="[MANDANT], [AZ], [FRIST], [KONTO_INFO] … — werden beim Schreiben ersetzt"
              primaryTypographyProps={{ variant: 'body2' }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItemButton>
        </List>
      ) : null}

      {kontextMenueAnsicht === 'bausteine' ? (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
            {kontextZeigeModusWahl
              ? 'Zuerst Modus, dann Baustein wählen'
              : kontextKannPlatzhalter
                ? 'Baustein-Platzhalter (Position im späteren Schreiben)'
                : 'Vollständigen Baustein-Text einfügen'}
          </Typography>
          {kontextZeigeModusWahl ? (
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              value={kontextmenueEinfuegenModus}
              onChange={(_, v: 'platzhalter' | 'text' | null) => v && setKontextmenueEinfuegenModus(v)}
              sx={{ mb: 1 }}
            >
              <ToggleButton value="platzhalter" sx={{ py: 0.5, textTransform: 'none' }}>
                Platzhalter
              </ToggleButton>
              <ToggleButton value="text" sx={{ py: 0.5, textTransform: 'none' }}>
                Textbaustein
              </ToggleButton>
            </ToggleButtonGroup>
          ) : null}
          <TextField
            key="baustein-suche"
            size="small"
            fullWidth
            placeholder="Baustein suchen …"
            value={kontextMenueSuche}
            onChange={(ev) => setKontextMenueSuche(ev.target.value)}
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 1 }}
          />
          <List dense sx={{ flex: '1 1 auto', overflow: 'auto', py: 0, minHeight: 0, maxHeight: 240 }}>
            {gefilterteBausteine.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                Kein Treffer
              </Typography>
            ) : (
              gefilterteBausteine.map((b) => {
                const disabledText = kontextmenueEinfuegenModus === 'text' && !b.getHtml;
                return (
                  <ListItemButton key={b.id} disabled={disabledText} onClick={() => fuegeBausteinEin(b)}>
                    <ListItemText primary={b.label} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItemButton>
                );
              })
            )}
          </List>
        </>
      ) : null}

      {kontextMenueAnsicht === 'system-platzhalter' ? (
        <>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
            Token an der Cursorposition einfügen. Beim späteren Schreiben zu einem Fall ersetzt die App die Werte
            (siehe Hilfe unter dem Editor).
          </Typography>
          <TextField
            key="platzhalter-suche"
            size="small"
            fullWidth
            placeholder="Token oder Beschreibung suchen …"
            value={kontextMenueSuche}
            onChange={(ev) => setKontextMenueSuche(ev.target.value)}
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 1 }}
          />
          <List dense sx={{ flex: '1 1 auto', overflow: 'auto', py: 0, minHeight: 0, maxHeight: 280 }}>
            {gefilterteSystemPlatzhalter.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                Kein Treffer
              </Typography>
            ) : (
              gefilterteSystemPlatzhalter.map((p) => (
                <ListItemButton key={p.token} onClick={() => fuegeSystemPlatzhalter(p.token)}>
                  <ListItemText
                    primary={p.token}
                    secondary={p.beschreibung}
                    primaryTypographyProps={{ variant: 'body2', sx: { fontFamily: 'ui-monospace, monospace' } }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              ))
            )}
          </List>
        </>
      ) : null}
    </Popover>
    </>
  );
}
