import type { Textbaustein } from '../store/vorlagenStore';

/**
 * Standard-Beispiele für den Reiter „Textbausteine“ (werden in den Store übernommen, bearbeit- und löschbar).
 */
export const BEISPIEL_TEXTBAUSTEINE: Textbaustein[] = [
  {
    id: 'sys-tb-anrede-neutral',
    name: 'Anrede (neutral)',
    rechtsgebiet: 'alle',
    inhalt: 'Sehr geehrte Damen und Herren,',
  },
  {
    id: 'sys-tb-anrede-versicherung',
    name: 'Anrede Versicherung',
    rechtsgebiet: 'verkehrsrecht',
    inhalt: 'Sehr geehrte Damen und Herren,\n\nin der oben genannten Schadenangelegenheit zeigen wir an, dass wir [MANDANT] rechtlich vertreten.',
  },
  {
    id: 'sys-tb-schadenmeldung-kern',
    name: 'Schadenmeldung (Kern)',
    rechtsgebiet: 'verkehrsrecht',
    inhalt: 'Wir melden den Schaden aus dem Verkehrsunfall an und bitten um schnellstmögliche Bearbeitung.\n\nFahrzeug: [KENNZEICHEN]\nAktenzeichen: [AZ]',
  },
  {
    id: 'sys-tb-bitte-az',
    name: 'Bitte um eigenes Aktenzeichen',
    rechtsgebiet: 'alle',
    inhalt: 'Wir bitten um Bestätigung des Eingangs sowie um Mitteilung Ihres Aktenzeichens bis zum [FRIST].',
  },
  {
    id: 'sys-tb-gruss-kanzlei',
    name: 'Grußformel',
    rechtsgebiet: 'alle',
    inhalt: 'Mit freundlichen Grüßen',
  },
  {
    id: 'sys-tb-zahlungsaufforderung',
    name: 'Zahlungsaufforderung (kurz)',
    rechtsgebiet: 'alle',
    inhalt: 'Wir fordern Sie auf, den ausgewiesenen Betrag bis zum [FRIST] zu begleichen.',
  },
  {
    id: 'sys-tb-ar-einstieg',
    name: 'Arbeitsrecht — Einstieg',
    rechtsgebiet: 'arbeitsrecht',
    inhalt: 'Sehr geehrte Damen und Herren,\n\nin der arbeitsrechtlichen Angelegenheit unseres Mandanten [MANDANT] (AZ: [AZ]) nehmen wir wie folgt Stellung:',
  },
  {
    id: 'sys-tb-zivil-forderung',
    name: 'Zivil — Forderungsrückstand',
    rechtsgebiet: 'zivilrecht',
    inhalt: 'Trotz Mahnung und Fristsetzung ist die geschuldete Leistung bis heute nicht erbracht worden. Wir fordern Sie erneut auf, den offenen Betrag bis zum [FRIST] zu begleichen.',
  },
];
