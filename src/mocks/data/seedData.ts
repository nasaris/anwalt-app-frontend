/**
 * DSGVO-Hinweis: Alle Personen in diesen Seed-Daten sind vollständig fiktiv.
 * Es werden ausschließlich erfundene Namen, Adressen und Kontaktdaten verwendet.
 * Diese Daten dienen nur der Entwicklung / Demo-Zwecken.
 */

import type {
  Mandant,
  Partei,
  ParteienTyp,
  Fall,
  Wiedervorlage,
  FallStatus,
  VRPhase,
  ARPhase,
  ARFalltyp,
  MandantEngagementStatus,
  MandantKategorie,
} from '../../types';

const pad = (n: number, w = 3) => String(n).padStart(w, '0');

// ── Mandanten (Basis + Demo-Erweiterung) ──────────────────

const VORNAMEN = [
  'Max', 'Erika', 'Hans', 'Anna', 'Felix', 'Laura', 'Jonas', 'Sarah', 'Tim', 'Julia',
  'Paul', 'Nina', 'Leon', 'Mia', 'Noah', 'Emma', 'Ben', 'Lea', 'Finn', 'Hannah',
  'Jan', 'Clara', 'Lukas', 'Marie', 'Tom', 'Sophie', 'David', 'Katharina', 'Simon', 'Verena',
];

const NACHNAMEN = [
  'Bergmann', 'Klein', 'Wolf', 'Neumann', 'Schmidt', 'Fischer', 'Weber', 'Meyer', 'Wagner',
  'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Richter', 'Kaiser', 'Krüger', 'Lorenz', 'Brandt',
  'Ziegler', 'Busch', 'Peters', 'Sauer', 'Frank', 'Arnold', 'Pohl', 'Heinrich', 'Winkler',
];

const ORTE = [
  { plz: '40210', ort: 'Düsseldorf' },
  { plz: '50667', ort: 'Köln' },
  { plz: '45127', ort: 'Essen' },
  { plz: '40215', ort: 'Düsseldorf' },
  { plz: '44135', ort: 'Dortmund' },
  { plz: '30159', ort: 'Hannover' },
  { plz: '60311', ort: 'Frankfurt' },
  { plz: '70173', ort: 'Stuttgart' },
  { plz: '80331', ort: 'München' },
  { plz: '20095', ort: 'Hamburg' },
];

const mandantenBasis: Mandant[] = [
  {
    id: 'm-001',
    vorname: 'Max',
    nachname: 'Mustermann',
    email: 'max.mustermann@beispiel.de',
    telefon: '0211 123456',
    adresse: { strasse: 'Musterstraße 1', plz: '40210', ort: 'Düsseldorf' },
    rsv: true,
    rsvGesellschaft: 'ARAG',
    rsvNummer: 'RSV-2024-001',
    erstelltAm: '2024-11-15T09:00:00Z',
    kategorie: 'privat',
    engagementStatus: 'aktiv',
  },
  {
    id: 'm-002',
    vorname: 'Erika',
    nachname: 'Musterfrau',
    email: 'erika.musterfrau@beispiel.de',
    telefon: '0221 654321',
    adresse: { strasse: 'Beispielweg 7', plz: '50667', ort: 'Köln' },
    rsv: false,
    erstelltAm: '2025-01-20T14:00:00Z',
    kategorie: 'privat',
    engagementStatus: 'onboarding',
  },
  {
    id: 'm-003',
    vorname: 'Hans',
    nachname: 'Beispiel',
    email: 'hans.beispiel@test.de',
    telefon: '0201 987654',
    adresse: { strasse: 'Testgasse 3', plz: '45127', ort: 'Essen' },
    rsv: true,
    rsvGesellschaft: 'Roland',
    rsvNummer: 'RSV-2025-044',
    erstelltAm: '2025-02-10T10:30:00Z',
    kategorie: 'unternehmen',
    engagementStatus: 'aktiv',
  },
  {
    id: 'm-004',
    vorname: 'Anna',
    nachname: 'Probst',
    email: 'anna.probst@mail.de',
    telefon: '0211 555000',
    adresse: { strasse: 'Probstweg 12', plz: '40215', ort: 'Düsseldorf' },
    rsv: false,
    erstelltAm: '2025-03-01T08:00:00Z',
    kategorie: 'privat',
    engagementStatus: 'ruhend',
  },
];

const mandantenDemo: Mandant[] = Array.from({ length: 26 }, (_, i) => {
  const nr = i + 5;
  const ort = ORTE[i % ORTE.length];
  const vn = VORNAMEN[i % VORNAMEN.length];
  const nn = NACHNAMEN[i % NACHNAMEN.length];
  const kat: MandantKategorie = i % 4 === 0 ? 'unternehmen' : 'privat';
  const eng: MandantEngagementStatus = (['aktiv', 'aktiv', 'onboarding', 'aktiv', 'ruhend'] as const)[i % 5];
  return {
    id: `m-${pad(nr)}`,
    vorname: vn,
    nachname: nn,
    email: `${vn.toLowerCase()}.${nn.toLowerCase().replace(/\s/g, '')}@demo-anwalt.test`,
    telefon: `02${10 + (i % 89)} ${100000 + (i * 137) % 900000}`,
    adresse: { strasse: `Demoallee ${nr}`, plz: ort.plz, ort: ort.ort },
    rsv: i % 3 !== 0,
    kategorie: kat,
    engagementStatus: eng,
    ...(i % 3 !== 0
      ? {
          rsvGesellschaft: ['ARAG', 'Roland', 'DEVK', 'DKV'][i % 4],
          rsvNummer: `RSV-DEMO-${pad(nr, 4)}`,
        }
      : {}),
    erstelltAm: new Date(Date.UTC(2024, (i % 12), 1 + (i % 20), 10, 0, 0)).toISOString(),
  };
});

export const mandanten: Mandant[] = [...mandantenBasis, ...mandantenDemo];

// ── Parteien ──────────────────────────────────────────────

const PARTEI_TYP_ROT: ParteienTyp[] = ['gutachter', 'werkstatt', 'versicherung', 'gegenseite', 'gericht'];

const parteienBasis: Partei[] = [
  {
    id: 'p-001',
    typ: 'gutachter',
    name: 'Gutachterbüro Sachverstand GmbH',
    email: 'info@sachverstand.de',
    telefon: '0211 111222',
    adresse: { strasse: 'Gutachterring 5', plz: '40210', ort: 'Düsseldorf' },
    gutachterNr: 'BVSK-4711',
    erstelltAm: new Date(Date.UTC(2023, 1, 12)).toISOString(),
  },
  {
    id: 'p-002',
    typ: 'werkstatt',
    name: 'Auto-Fachbetrieb Meier KG',
    email: 'werkstatt@meier-auto.de',
    telefon: '0211 333444',
    adresse: { strasse: 'Werkstattstraße 22', plz: '40212', ort: 'Düsseldorf' },
    erstelltAm: new Date(Date.UTC(2023, 3, 2)).toISOString(),
  },
  {
    id: 'p-003',
    typ: 'versicherung',
    name: 'MustervVersicherungs AG',
    email: 'schaden@musterversicherung.de',
    telefon: '0800 123456',
    adresse: { strasse: 'Versicherungsallee 1', plz: '80333', ort: 'München' },
    schadensnummer: 'SCH-2025-88371',
    erstelltAm: new Date(Date.UTC(2022, 5, 20)).toISOString(),
  },
  {
    id: 'p-004',
    typ: 'versicherung',
    name: 'Beispiel Versicherung SE',
    email: 'kfz@beispiel-vers.de',
    telefon: '0800 654321',
    adresse: { strasse: 'Hauptstraße 100', plz: '60311', ort: 'Frankfurt' },
    schadensnummer: 'SCH-2025-11029',
    erstelltAm: new Date(Date.UTC(2024, 0, 8)).toISOString(),
  },
  {
    id: 'p-005',
    typ: 'gegenseite',
    name: 'Muster GmbH (Arbeitgeber)',
    email: 'personal@muster-gmbh.de',
    telefon: '0211 888999',
    adresse: { strasse: 'Industrieweg 50', plz: '40231', ort: 'Düsseldorf' },
    erstelltAm: new Date(Date.UTC(2023, 8, 1)).toISOString(),
  },
  {
    id: 'p-006',
    typ: 'gericht',
    name: 'Arbeitsgericht Düsseldorf',
    adresse: { strasse: 'Ludwig-Erhard-Allee 21', plz: '40227', ort: 'Düsseldorf' },
    erstelltAm: new Date(Date.UTC(2021, 10, 15)).toISOString(),
  },
];

const parteienDemo: Partei[] = Array.from({ length: 16 }, (_, i) => {
  const n = 7 + i;
  const typ = PARTEI_TYP_ROT[i % PARTEI_TYP_ROT.length];
  const id = `p-${String(n).padStart(3, '0')}`;
  return {
    id,
    typ,
    name: `Demo Partner ${n} (${typ})`,
    email: `partner${n}@demo-kanzlei.de`,
    telefon: `0211 ${String(200000 + n * 17).slice(0, 6)}`,
    adresse: { strasse: `Partnerweg ${n}`, plz: String(40000 + (n % 90)), ort: 'Düsseldorf' },
    erstelltAm: new Date(Date.UTC(2024, (n * 3) % 12, 1 + (n % 20))).toISOString(),
    ...(typ === 'gutachter' ? { gutachterNr: `BVSK-${4000 + n}` } : {}),
    ...(typ === 'versicherung' ? { schadensnummer: `SCH-2025-${9000 + n}` } : {}),
  };
});

export const parteien: Partei[] = [...parteienBasis, ...parteienDemo];

const KFZ = [
  { k: 'D-AB 1001', t: 'VW Golf 8', b: 2022 },
  { k: 'K-EM 5678', t: 'BMW 320d', b: 2021 },
  { k: 'D-MM 2233', t: 'Audi A4 Avant', b: 2020 },
  { k: 'B-XY 9012', t: 'Mercedes C-Klasse', b: 2019 },
  { k: 'AC-TS 4455', t: 'Opel Corsa', b: 2018 },
  { k: 'HB-CD 7788', t: 'Skoda Octavia', b: 2023 },
  { k: 'M-LL 3344', t: 'Ford Focus', b: 2017 },
  { k: 'S-WZ 1122', t: 'Seat Leon', b: 2022 },
  { k: 'F-NN 5566', t: 'Hyundai i30', b: 2021 },
  { k: 'N-UR 8899', t: 'Toyota Corolla', b: 2020 },
];

const AR_TYPEN: ARFalltyp[] = ['kuendigung', 'abmahnung', 'aufhebung', 'lohn', 'mobbing', 'versetzung'];

function statusFuerIndex(i: number): FallStatus {
  const r = i % 17;
  if (r === 0 || r === 8) return 'abgeschlossen';
  if (r === 3 || r === 11) return 'klage';
  if (r === 5 || r === 14) return 'einigung';
  if (r === 7) return 'frist_abgelaufen';
  return 'aktiv';
}

function buildFall(n: number): Fall {
  const id = `f-${pad(n)}`;
  const mandantId = `m-${pad(((n - 1) % 30) + 1)}`;
  const status = statusFuerIndex(n - 1);
  const erstelltAm = new Date(Date.UTC(2024 + ((n * 7) % 2), (n % 12), 1 + (n % 25), 9 + (n % 8), (n * 13) % 60)).toISOString();
  const isVR = n % 2 === 1;

  if (isVR) {
    const phase = (1 + ((n + 2) % 4)) as VRPhase;
    const kfz = KFZ[(n - 1) % KFZ.length];
    const abrech: 'fiktiv' | 'konkret' = n % 3 === 0 ? 'fiktiv' : 'konkret';
    const anspr: 'mandant' | 'leasing' | 'bank' = n % 5 === 0 ? 'leasing' : n % 7 === 0 ? 'bank' : 'mandant';
    const wvTage = status === 'aktiv' ? 1 + ((n * 5) % 28) : undefined;
    return {
      id,
      aktenzeichen: `VR/2025/${pad(n, 3)}`,
      rechtsgebiet: 'verkehrsrecht',
      status,
      phase,
      mandantId,
      ...(wvTage && status === 'aktiv'
        ? { wiedervorlage: new Date(Date.now() + wvTage * 86400000).toISOString() }
        : {}),
      erstelltAm,
      notizen:
        n % 4 === 0
          ? 'Haftpflicht bestreitet Mitverschulden; Gutachten liegt vor.'
          : n % 6 === 0
            ? 'Mietwagen läuft noch; Nutzungsausfall geklärt.'
            : undefined,
      verkehrsrecht: {
        abrechnungsart: abrech,
        anspruchsinhaber: anspr,
        fahrzeug: { kennzeichen: kfz.k, typ: kfz.t, baujahr: kfz.b },
        gutachterId: 'p-001',
        ...(n % 2 === 0 ? { werkstattId: 'p-002' } : {}),
        versicherungId: n % 2 === 0 ? 'p-003' : 'p-004',
        gutachtenwert: 5000 + (n * 173) % 15000,
        ...(abrech === 'konkret' ? { reparaturkosten: 6000 + (n * 211) % 12000 } : {}),
        schadenshoehe: 7000 + (n * 199) % 18000,
      },
    };
  }

  const phase = (1 + ((n + 1) % 3)) as ARPhase;
  const falltyp = AR_TYPEN[(n - 1) % AR_TYPEN.length];
  const mitKschg = falltyp === 'kuendigung' && status === 'aktiv' && n % 5 === 1;
  const wvTage = status === 'aktiv' ? 2 + ((n * 3) % 21) : undefined;

  return {
    id,
    aktenzeichen: `AR/2025/${pad(n, 3)}`,
    rechtsgebiet: 'arbeitsrecht',
    status,
    phase,
    mandantId,
    ...(wvTage && status === 'aktiv'
      ? { wiedervorlage: new Date(Date.now() + wvTage * 86400000).toISOString() }
      : {}),
    erstelltAm,
    notizen:
      n % 5 === 2
        ? 'Betriebsrat angehört; Verhandlungstermin vorgeschlagen.'
        : n % 8 === 3
          ? 'Unterlagen vom Mandanten vollständig.'
          : undefined,
    arbeitsrecht: {
      falltyp,
      gegenseiteId: 'p-005',
      ...(n % 4 === 0 ? { gerichtId: 'p-006' } : {}),
      ...(mitKschg
        ? {
            kuendigungsdatum: new Date(Date.now() - 18 * 86400000).toISOString(),
            fristEnde: new Date(Date.now() + (3 + (n % 5)) * 86400000).toISOString(),
          }
        : {}),
      ...(falltyp === 'lohn' ? { lohnrueckstand: 1500 + (n * 97) % 8000 } : {}),
    },
  };
}

export const faelle: Fall[] = Array.from({ length: 50 }, (_, i) => buildFall(i + 1));

// ── Wiedervorlagen (Demo-Menge, verknüpft mit aktiven Fällen) ─

const WV_TEXT: Record<number, string> = {
  0: 'Schriftverkehr Versicherung prüfen; Frist beachten.',
  1: 'Stellungnahme zu Kürzungsschreiben.',
  2: 'Mandant zu Vergleichsangebot rückfragen.',
  3: 'Gutachten nachfordern; Termin Werkstatt.',
  4: 'RSV-Deckungsanfrage; Schreiben vorbereiten.',
  5: 'Gegenseite: Fristsetzung läuft.',
  6: 'Anhörung Betriebsrat dokumentieren.',
  7: 'Vergleichsvorschlag prüfen und beantworten.',
};

function buildWiedervorlagen(): Wiedervorlage[] {
  const list: Wiedervorlage[] = [];
  let w = 0;
  for (const f of faelle) {
    if (f.status !== 'aktiv') continue;
    if (w >= 38) break;
    const faellig = new Date(Date.now() + ((w * 11 + 3) % 45) * 86400000);
    const typ =
      f.rechtsgebiet === 'arbeitsrecht' && f.arbeitsrecht?.falltyp === 'kuendigung' && w % 6 === 0
        ? ('kschg_frist' as const)
        : w % 5 === 0
          ? ('frist_versicherung' as const)
          : ('allgemein' as const);

    list.push({
      id: `w-${pad(w + 1)}`,
      fallId: f.id,
      typ,
      faelligAm: faellig.toISOString(),
      beschreibung:
        typ === 'kschg_frist'
          ? 'KSchG § 4 — Klagefrist; Klageschrift vorbereiten.'
          : WV_TEXT[w % 8] ?? `Wiedervorlage Fall ${f.aktenzeichen}`,
      erledigt: false,
    });
    w += 1;
  }
  return list;
}

export const wiedervorlagen: Wiedervorlage[] = buildWiedervorlagen();
