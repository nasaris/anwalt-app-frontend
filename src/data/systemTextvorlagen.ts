import type { Textvorlage } from '../store/vorlagenStore';

/**
 * Standard-Textvorlagen (ein Eintrag pro Dokumententyp).
 * Platzhalter siehe `buildTextvorlagePlatzhalterMap` in `utils/textvorlagePlatzhalter.ts`.
 */
export const SYSTEM_TEXTVORLAGEN: Textvorlage[] = [
  {
    id: 'sys-schadensanzeige',
    system: true,
    name: 'Standard: Schadensanzeige',
    typId: 'schadensanzeige',
    rechtsgebiet: 'alle',
    betreff: 'Schadensanzeige — Verkehrsunfall — [MANDANT] — AZ: [AZ]',
    inhalt: `Sehr geehrte Damen und Herren,

in der o.g. Angelegenheit zeigen wir an, dass wir [MANDANT] rechtlich vertreten.

Wir melden hiermit den Schaden aus dem Verkehrsunfall an und bitten um schnellstmögliche Bearbeitung.

Fahrzeug: [KENNZEICHEN][FAHRZEUG_SUFFIX]
[SCHADENSHOEHE_ZEILE]Aktenzeichen: [AZ]

[BAUSTEIN:sys-tb-bitte-az]

Wir bitten um Bestätigung des Eingangs sowie Mitteilung Ihres Aktenzeichens bis zum [FRIST].

Mit freundlichen Grüßen`,
  },
  {
    id: 'sys-gutachten_uebersandt',
    system: true,
    name: 'Standard: Gutachten übersandt',
    typId: 'gutachten_uebersandt',
    rechtsgebiet: 'alle',
    betreff: 'Gutachtenübersendung — [MANDANT] — AZ: [AZ]',
    inhalt: `Sehr geehrte Damen und Herren,

anbei übersenden wir Ihnen das Sachverständigengutachten für das Fahrzeug mit dem Kennzeichen [KENNZEICHEN].

[GUTACHTEN_SCHADENS_SATZ]Wir bitten Sie, die geltend gemachten Schadenspositionen vollumfänglich zu regulieren. Die Zahlung erwarten wir bis zum [FRIST].

Zahlungsdaten:
[KONTO_INFO]

Aktenzeichen: [AZ]

Mit freundlichen Grüßen`,
  },
  {
    id: 'sys-rechnung_uebersandt',
    system: true,
    name: 'Standard: Reparaturrechnung übersandt',
    typId: 'rechnung_uebersandt',
    rechtsgebiet: 'alle',
    betreff: 'Reparaturrechnung — [MANDANT] — AZ: [AZ]',
    inhalt: `Sehr geehrte Damen und Herren,

anbei erhalten Sie die Reparaturrechnung der ausführenden Werkstatt.

[REPARATUR_ZEILE]Wir bitten um Regulierung des ausgewiesenen Betrags bis zum [FRIST] auf folgendes Konto:

[KONTO_INFO]

Aktenzeichen: [AZ]

Mit freundlichen Grüßen`,
  },
  {
    id: 'sys-nutzungsausfall',
    system: true,
    name: 'Standard: Nutzungsausfall / Mietwagen',
    typId: 'nutzungsausfall',
    rechtsgebiet: 'alle',
    betreff: 'Nutzungsausfall/Mietwagen — [MANDANT] — AZ: [AZ]',
    inhalt: `Sehr geehrte Damen und Herren,

für die unfallbedingte Reparaturdauer macht unser Mandant [MANDANT] Nutzungsausfallentschädigung geltend.

[NUTZUNGSAUSFALL_BLOCK]Wir bitten um Regulierung bis zum [FRIST].

[KONTO_INFO]

Aktenzeichen: [AZ]

Mit freundlichen Grüßen`,
  },
  {
    id: 'sys-kuerzungsschreiben_eingegangen',
    system: true,
    name: 'Standard: Kürzungsschreiben (eingegangen)',
    typId: 'kuerzungsschreiben_eingegangen',
    rechtsgebiet: 'alle',
    betreff: 'Kürzungsschreiben erhalten — [MANDANT] — AZ: [AZ]',
    inhalt: `[Interner Vermerk — Kürzungsschreiben eingegangen]

Datum des Eingangs: [Datum eintragen]
Von: [EMPFAENGER]
Aktenzeichen Gegenseite: [AZ Gegenseite]

Gekürzter Betrag: [Betrag] €
Begründung der Kürzung: [Begründung]

Nächste Schritte:
- Gutachten und Kürzung prüfen
- Stellungnahme vorbereiten bis [FRIST]
- Ggf. Mahnschreiben bei weiterer Ablehnung`,
  },
  {
    id: 'sys-stellungnahme',
    system: true,
    name: 'Standard: Stellungnahme',
    typId: 'stellungnahme',
    rechtsgebiet: 'alle',
    betreff: 'Stellungnahme zur Kürzung — [MANDANT] — AZ: [AZ]',
    inhalt: `Sehr geehrte Damen und Herren,

mit Schreiben vom [Datum Ihres Schreibens] haben Sie die geltend gemachten Schadensersatzansprüche teilweise abgelehnt bzw. gekürzt.

Hierzu nehmen wir wie folgt Stellung:

[Begründung zur Ablehnung/Kürzung — z.B. Gutachten widerlegt die Kürzung, weil ...]

[STELLUNGNAHME_SCHADENS_SATZ]Wir fordern Sie auf, den vollständigen Schadensbetrag bis zum [FRIST] zu begleichen. Anderenfalls behalten wir uns vor, die Angelegenheit gerichtlich geltend zu machen.

[KONTO_INFO]

Aktenzeichen: [AZ]

Mit freundlichen Grüßen`,
  },
  {
    id: 'sys-anschreiben_gegenseite',
    system: true,
    name: 'Standard: Anschreiben Gegenseite',
    typId: 'anschreiben_gegenseite',
    rechtsgebiet: 'alle',
    betreff: 'Arbeitsrechtliche Angelegenheit [MANDANT] — AZ: [AZ]',
    inhalt: `Sehr geehrte Damen und Herren,

in der Angelegenheit unseres Mandanten [MANDANT] gegen [EMPFAENGER] zeigen wir an, dass wir die rechtliche Interessenvertretung übernommen haben.

[AR_SACHVERHALT]

Wir fordern Sie auf, [AR_FORDERUNG] bis zum [FRIST].

Sollten Sie dieser Aufforderung nicht fristgerecht nachkommen, werden wir die Angelegenheit gerichtlich geltend machen.

Aktenzeichen: [AZ]

Mit freundlichen Grüßen`,
  },
  {
    id: 'sys-deckungsanfrage_rsv',
    system: true,
    name: 'Standard: Deckungsanfrage RSV',
    typId: 'deckungsanfrage_rsv',
    rechtsgebiet: 'alle',
    betreff: 'Deckungsanfrage — [MANDANT] — Versicherungsnummer: [RSV_NUMMER]',
    inhalt: `Sehr geehrte Damen und Herren,

wir vertreten Herrn/Frau [MANDANT], Versicherungsnummer: [RSV_NUMMER].

Wir bitten um Erteilung einer Deckungszusage für die rechtliche Vertretung in folgender Angelegenheit:

Falltyp: [AR_FALLTYP]
[AR_KUENDIGUNGSDATUM_ZEILE]Aktenzeichen: [AZ]
Gegner: [EMPFAENGER]

Bitte bestätigen Sie die Deckung bis zum [FRIST].

Mit freundlichen Grüßen`,
  },
  {
    id: 'sys-mahnschreiben',
    system: true,
    name: 'Standard: Mahnschreiben',
    typId: 'mahnschreiben',
    rechtsgebiet: 'alle',
    betreff: 'Letzte Mahnung — [MANDANT] — AZ: [AZ] — Frist: [FRIST]',
    inhalt: `Sehr geehrte Damen und Herren,

trotz unserer bisherigen Korrespondenz haben Sie den fälligen Betrag in Höhe von [BETRAG_MAHNUNG] bis heute nicht beglichen.

Wir setzen Ihnen hiermit eine letzte Frist bis zum [FRIST].

Nach Fristablauf werden wir ohne weitere Ankündigung gerichtliche Schritte einleiten und alle dadurch entstehenden Kosten zu Ihren Lasten geltend machen.

Aktenzeichen: [AZ]

Mit freundlichen Grüßen`,
  },
  {
    id: 'sys-klageschrift',
    system: true,
    name: 'Standard: Klageschrift (Rohgerüst)',
    typId: 'klageschrift',
    rechtsgebiet: 'alle',
    betreff: 'Klage — [MANDANT] ./. [EMPFAENGER] — AZ: [AZ]',
    inhalt: `[Klageschrift — bitte vor Einreichung vollständig überarbeiten]

An das [EMPFAENGER]

Kläger: [MANDANT]
Beklagter: [EMPFAENGER]
Aktenzeichen: [AZ]

Streitwert: [STREITWERT]

I. Klageanträge

[Klageanträge formulieren]

II. Sachverhalt

[Sachverhalt ausführlich darstellen]

III. Rechtliche Begründung

[Rechtliche Begründung — z.B. § 7 StVG, § 115 VVG / § 4 KSchG etc.]

IV. Beweisangebote

[Beweismittel benennen]`,
  },
  {
    id: 'sys-sonstiges',
    system: true,
    name: 'Standard: Sonstiges',
    typId: 'sonstiges',
    rechtsgebiet: 'alle',
    betreff: '[Betreff] — [MANDANT] — AZ: [AZ]',
    inhalt: `Sehr geehrte Damen und Herren,

[Inhalt]

Mit freundlichen Grüßen`,
  },
];
