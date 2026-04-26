import { useState, useEffect } from 'react';
import type {
  Abrechnungsart,
  Anspruchsinhaber,
  ARFalltyp,
  ERFalltyp,
  Fall,
  IRFalltyp,
  WBFalltyp,
  ZRFalltyp,
} from '../../../types';
import type {
  ArbeitsrechtDaten,
  ErbrechtDaten,
  InsolvenzrechtDaten,
  WettbewerbsrechtDaten,
  ZivilrechtDaten,
} from '../../../types';
import { faelleApi } from '../../../api/faelle';

const STATUS_OPTIONEN = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'einigung', label: 'Einigung / Vergleich' },
  { value: 'klage', label: 'Klage erhoben' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
];

export { STATUS_OPTIONEN };

export function useEditFallForm(fall: Fall | null, onSave: (updated: Fall) => void) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [neuerStatus, setNeuerStatus] = useState('');

  // Verkehrsrecht
  const [vrAbrechnungsart, setVrAbrechnungsart] = useState<Abrechnungsart>('konkret');
  const [vrAnspruchsinhaber, setVrAnspruchsinhaber] = useState<Anspruchsinhaber>('mandant');
  const [vrKennzeichen, setVrKennzeichen] = useState('');
  const [vrFahrzeugTyp, setVrFahrzeugTyp] = useState('');
  const [vrBaujahr, setVrBaujahr] = useState<number>(new Date().getFullYear());
  const [vrErstzulassung, setVrErstzulassung] = useState('');
  const [vrSchadenshoehe, setVrSchadenshoehe] = useState('');
  const [vrGutachtenwert, setVrGutachtenwert] = useState('');
  const [vrReparaturkosten, setVrReparaturkosten] = useState('');
  const [vrNutzungsausfall, setVrNutzungsausfall] = useState('');
  const [vrMietwagen, setVrMietwagen] = useState('');
  const [vrPolizeiAufnahme, setVrPolizeiAufnahme] = useState<'ja' | 'nein'>('nein');
  const [vrPolizeiAz, setVrPolizeiAz] = useState('');
  const [vrStaFall, setVrStaFall] = useState<'ja' | 'nein'>('nein');
  const [vrJustizAz, setVrJustizAz] = useState('');

  // Arbeitsrecht
  const [arFalltyp, setArFalltyp] = useState<ARFalltyp>('kuendigung');
  const [arKuendigungsdatum, setArKuendigungsdatum] = useState('');
  const [arFristEnde, setArFristEnde] = useState('');
  const [arLohnrueckstand, setArLohnrueckstand] = useState('');

  // Zivilrecht
  const [zrFalltyp, setZrFalltyp] = useState<ZRFalltyp>('sonstiges');
  const [zrGegenseite, setZrGegenseite] = useState('');
  const [zrForderungsbetrag, setZrForderungsbetrag] = useState('');
  const [zrStreitwert, setZrStreitwert] = useState('');
  const [zrMahnfristEnde, setZrMahnfristEnde] = useState('');
  const [zrKlageEingereichtAm, setZrKlageEingereichtAm] = useState('');

  // Insolvenzrecht
  const [irFalltyp, setIrFalltyp] = useState<IRFalltyp>('regelinsolvenz');
  const [irSchuldner, setIrSchuldner] = useState('');
  const [irForderungsbetrag, setIrForderungsbetrag] = useState('');
  const [irInsolvenzgericht, setIrInsolvenzgericht] = useState('');
  const [irInsolvenzAktenzeichen, setIrInsolvenzAktenzeichen] = useState('');
  const [irAntragsdatum, setIrAntragsdatum] = useState('');
  const [irEroeffnungsdatum, setIrEroeffnungsdatum] = useState('');

  // Wettbewerbsrecht
  const [wbFalltyp, setWbFalltyp] = useState<WBFalltyp>('abmahnung');
  const [wbGegenseite, setWbGegenseite] = useState('');
  const [wbVerletzungshandlung, setWbVerletzungshandlung] = useState('');
  const [wbAbmahnungsdatum, setWbAbmahnungsdatum] = useState('');
  const [wbFristsetzung, setWbFristsetzung] = useState('');
  const [wbStreitwert, setWbStreitwert] = useState('');

  // Erbrecht
  const [erFalltyp, setErFalltyp] = useState<ERFalltyp>('pflichtteil');
  const [erErblasser, setErErblasser] = useState('');
  const [erTodesdatum, setErTodesdatum] = useState('');
  const [erNachlassgericht, setErNachlassgericht] = useState('');
  const [erNachlassAktenzeichen, setErNachlassAktenzeichen] = useState('');
  const [erForderungsbetrag, setErForderungsbetrag] = useState('');

  useEffect(() => {
    if (!statusDialogOpen || !fall) return;
    setNeuerStatus(fall.status);
    if (fall.verkehrsrecht) {
      setVrAbrechnungsart(fall.verkehrsrecht.abrechnungsart);
      setVrAnspruchsinhaber(fall.verkehrsrecht.anspruchsinhaber);
      setVrKennzeichen(fall.verkehrsrecht.fahrzeug.kennzeichen ?? '');
      setVrFahrzeugTyp(fall.verkehrsrecht.fahrzeug.typ ?? '');
      setVrBaujahr(fall.verkehrsrecht.fahrzeug.baujahr ?? new Date().getFullYear());
      setVrErstzulassung(fall.verkehrsrecht.fahrzeug.erstzulassung ?? '');
      setVrSchadenshoehe(fall.verkehrsrecht.schadenshoehe != null ? String(fall.verkehrsrecht.schadenshoehe) : '');
      setVrGutachtenwert(fall.verkehrsrecht.gutachtenwert != null ? String(fall.verkehrsrecht.gutachtenwert) : '');
      setVrReparaturkosten(fall.verkehrsrecht.reparaturkosten != null ? String(fall.verkehrsrecht.reparaturkosten) : '');
      setVrNutzungsausfall(fall.verkehrsrecht.nutzungsausfall != null ? String(fall.verkehrsrecht.nutzungsausfall) : '');
      setVrMietwagen(fall.verkehrsrecht.mietwagen != null ? String(fall.verkehrsrecht.mietwagen) : '');
      setVrPolizeiAufnahme(fall.verkehrsrecht.polizeiAufnahme ? 'ja' : 'nein');
      setVrPolizeiAz(fall.verkehrsrecht.polizeiAktenzeichen ?? '');
      setVrStaFall(fall.verkehrsrecht.staatsanwaltschaftFall ? 'ja' : 'nein');
      setVrJustizAz(fall.verkehrsrecht.justizAktenzeichen ?? '');
    }
    if (fall.arbeitsrecht) {
      setArFalltyp(fall.arbeitsrecht.falltyp);
      setArKuendigungsdatum(fall.arbeitsrecht.kuendigungsdatum ?? '');
      setArFristEnde(fall.arbeitsrecht.fristEnde ?? '');
      setArLohnrueckstand(
        fall.arbeitsrecht.lohnrueckstand != null ? String(fall.arbeitsrecht.lohnrueckstand) : '',
      );
    }
    if (fall.zivilrecht) {
      setZrFalltyp(fall.zivilrecht.falltyp);
      setZrGegenseite(fall.zivilrecht.gegenseite ?? '');
      setZrForderungsbetrag(
        fall.zivilrecht.forderungsbetrag != null ? String(fall.zivilrecht.forderungsbetrag) : '',
      );
      setZrStreitwert(fall.zivilrecht.streitwert != null ? String(fall.zivilrecht.streitwert) : '');
      setZrMahnfristEnde(fall.zivilrecht.mahnfristEnde ?? '');
      setZrKlageEingereichtAm(fall.zivilrecht.klageEingereichtAm ?? '');
    }
    if (fall.insolvenzrecht) {
      setIrFalltyp(fall.insolvenzrecht.falltyp);
      setIrSchuldner(fall.insolvenzrecht.schuldner ?? '');
      setIrForderungsbetrag(fall.insolvenzrecht.forderungsbetrag != null ? String(fall.insolvenzrecht.forderungsbetrag) : '');
      setIrInsolvenzgericht(fall.insolvenzrecht.insolvenzgericht ?? '');
      setIrInsolvenzAktenzeichen(fall.insolvenzrecht.insolvenzAktenzeichen ?? '');
      setIrAntragsdatum(fall.insolvenzrecht.antragsdatum ?? '');
      setIrEroeffnungsdatum(fall.insolvenzrecht.eroeffnungsdatum ?? '');
    }
    if (fall.wettbewerbsrecht) {
      setWbFalltyp(fall.wettbewerbsrecht.falltyp);
      setWbGegenseite(fall.wettbewerbsrecht.gegenseite ?? '');
      setWbVerletzungshandlung(fall.wettbewerbsrecht.verletzungshandlung ?? '');
      setWbAbmahnungsdatum(fall.wettbewerbsrecht.abmahnungsdatum ?? '');
      setWbFristsetzung(fall.wettbewerbsrecht.fristsetzung ?? '');
      setWbStreitwert(fall.wettbewerbsrecht.streitwert != null ? String(fall.wettbewerbsrecht.streitwert) : '');
    }
    if (fall.erbrecht) {
      setErFalltyp(fall.erbrecht.falltyp);
      setErErblasser(fall.erbrecht.erblasser ?? '');
      setErTodesdatum(fall.erbrecht.todesdatum ?? '');
      setErNachlassgericht(fall.erbrecht.nachlassgericht ?? '');
      setErNachlassAktenzeichen(fall.erbrecht.nachlassAktenzeichen ?? '');
      setErForderungsbetrag(fall.erbrecht.forderungsbetrag != null ? String(fall.erbrecht.forderungsbetrag) : '');
    }
  }, [statusDialogOpen, fall]);

  const handleStatusAendern = async () => {
    if (!fall || !neuerStatus) return;
    const alt = fall.status;
    const patch: Partial<Fall> = { status: neuerStatus as Fall['status'] };
    if (fall.rechtsgebiet === 'verkehrsrecht' && fall.verkehrsrecht) {
      patch.verkehrsrecht = {
        ...fall.verkehrsrecht,
        abrechnungsart: vrAbrechnungsart,
        anspruchsinhaber: vrAnspruchsinhaber,
        fahrzeug: {
          ...fall.verkehrsrecht.fahrzeug,
          kennzeichen: vrKennzeichen.trim(),
          typ: vrFahrzeugTyp.trim(),
          baujahr: vrBaujahr,
          erstzulassung: vrErstzulassung || undefined,
        },
        schadenshoehe: vrSchadenshoehe.trim() ? Number(vrSchadenshoehe) : undefined,
        gutachtenwert: vrGutachtenwert.trim() ? Number(vrGutachtenwert) : undefined,
        reparaturkosten: vrReparaturkosten.trim() ? Number(vrReparaturkosten) : undefined,
        nutzungsausfall: vrNutzungsausfall.trim() ? Number(vrNutzungsausfall) : undefined,
        mietwagen: vrMietwagen.trim() ? Number(vrMietwagen) : undefined,
        polizeiAufnahme: vrPolizeiAufnahme === 'ja',
        polizeiAktenzeichen: vrPolizeiAufnahme === 'ja' ? (vrPolizeiAz.trim() || undefined) : undefined,
        staatsanwaltschaftFall: vrStaFall === 'ja',
        justizAktenzeichen: vrStaFall === 'ja' ? (vrJustizAz.trim() || undefined) : undefined,
      };
    } else if (fall.rechtsgebiet === 'arbeitsrecht' && fall.arbeitsrecht) {
      const ar: ArbeitsrechtDaten = {
        ...fall.arbeitsrecht,
        falltyp: arFalltyp,
        kuendigungsdatum: arKuendigungsdatum || undefined,
        fristEnde: arFristEnde || undefined,
        lohnrueckstand: arLohnrueckstand.trim() ? Number(arLohnrueckstand) : undefined,
      };
      patch.arbeitsrecht = ar;
    } else if (fall.rechtsgebiet === 'zivilrecht' && fall.zivilrecht) {
      const zr: ZivilrechtDaten = {
        ...fall.zivilrecht,
        falltyp: zrFalltyp,
        gegenseite: zrGegenseite.trim() || undefined,
        forderungsbetrag: zrForderungsbetrag.trim() ? Number(zrForderungsbetrag) : undefined,
        streitwert: zrStreitwert.trim() ? Number(zrStreitwert) : undefined,
        mahnfristEnde: zrMahnfristEnde || undefined,
        klageEingereichtAm: zrKlageEingereichtAm || undefined,
      };
      patch.zivilrecht = zr;
    } else if (fall.rechtsgebiet === 'insolvenzrecht' && fall.insolvenzrecht) {
      const ir: InsolvenzrechtDaten = {
        ...fall.insolvenzrecht,
        falltyp: irFalltyp,
        schuldner: irSchuldner.trim() || undefined,
        forderungsbetrag: irForderungsbetrag.trim() ? Number(irForderungsbetrag) : undefined,
        insolvenzgericht: irInsolvenzgericht.trim() || undefined,
        insolvenzAktenzeichen: irInsolvenzAktenzeichen.trim() || undefined,
        antragsdatum: irAntragsdatum || undefined,
        eroeffnungsdatum: irEroeffnungsdatum || undefined,
      };
      patch.insolvenzrecht = ir;
    } else if (fall.rechtsgebiet === 'wettbewerbsrecht' && fall.wettbewerbsrecht) {
      const wb: WettbewerbsrechtDaten = {
        ...fall.wettbewerbsrecht,
        falltyp: wbFalltyp,
        gegenseite: wbGegenseite.trim() || undefined,
        verletzungshandlung: wbVerletzungshandlung.trim() || undefined,
        abmahnungsdatum: wbAbmahnungsdatum || undefined,
        fristsetzung: wbFristsetzung || undefined,
        streitwert: wbStreitwert.trim() ? Number(wbStreitwert) : undefined,
      };
      patch.wettbewerbsrecht = wb;
    } else if (fall.rechtsgebiet === 'erbrecht' && fall.erbrecht) {
      const er: ErbrechtDaten = {
        ...fall.erbrecht,
        falltyp: erFalltyp,
        erblasser: erErblasser.trim() || undefined,
        todesdatum: erTodesdatum || undefined,
        nachlassgericht: erNachlassgericht.trim() || undefined,
        nachlassAktenzeichen: erNachlassAktenzeichen.trim() || undefined,
        forderungsbetrag: erForderungsbetrag.trim() ? Number(erForderungsbetrag) : undefined,
      };
      patch.erbrecht = er;
    }
    const updated = await faelleApi.update(fall.id, patch);
    const withAct = await faelleApi.addAktivitaet(updated.id, {
      typ: 'status_geaendert',
      titel: 'Status geändert',
      meta: { alt, neu: neuerStatus },
    });
    onSave(withAct);
    setStatusDialogOpen(false);
  };

  return {
    statusDialogOpen,
    setStatusDialogOpen,
    neuerStatus,
    setNeuerStatus,
    vrAbrechnungsart,
    setVrAbrechnungsart,
    vrAnspruchsinhaber,
    setVrAnspruchsinhaber,
    vrKennzeichen,
    setVrKennzeichen,
    vrFahrzeugTyp,
    setVrFahrzeugTyp,
    vrBaujahr,
    setVrBaujahr,
    vrErstzulassung,
    setVrErstzulassung,
    vrSchadenshoehe,
    setVrSchadenshoehe,
    vrGutachtenwert,
    setVrGutachtenwert,
    vrReparaturkosten,
    setVrReparaturkosten,
    vrNutzungsausfall,
    setVrNutzungsausfall,
    vrMietwagen,
    setVrMietwagen,
    vrPolizeiAufnahme,
    setVrPolizeiAufnahme,
    vrPolizeiAz,
    setVrPolizeiAz,
    vrStaFall,
    setVrStaFall,
    vrJustizAz,
    setVrJustizAz,
    arFalltyp,
    setArFalltyp,
    arKuendigungsdatum,
    setArKuendigungsdatum,
    arFristEnde,
    setArFristEnde,
    arLohnrueckstand,
    setArLohnrueckstand,
    zrFalltyp,
    setZrFalltyp,
    zrGegenseite,
    setZrGegenseite,
    zrForderungsbetrag,
    setZrForderungsbetrag,
    zrStreitwert,
    setZrStreitwert,
    zrMahnfristEnde,
    setZrMahnfristEnde,
    zrKlageEingereichtAm,
    setZrKlageEingereichtAm,
    // Insolvenzrecht
    irFalltyp,
    setIrFalltyp,
    irSchuldner,
    setIrSchuldner,
    irForderungsbetrag,
    setIrForderungsbetrag,
    irInsolvenzgericht,
    setIrInsolvenzgericht,
    irInsolvenzAktenzeichen,
    setIrInsolvenzAktenzeichen,
    irAntragsdatum,
    setIrAntragsdatum,
    irEroeffnungsdatum,
    setIrEroeffnungsdatum,
    // Wettbewerbsrecht
    wbFalltyp,
    setWbFalltyp,
    wbGegenseite,
    setWbGegenseite,
    wbVerletzungshandlung,
    setWbVerletzungshandlung,
    wbAbmahnungsdatum,
    setWbAbmahnungsdatum,
    wbFristsetzung,
    setWbFristsetzung,
    wbStreitwert,
    setWbStreitwert,
    // Erbrecht
    erFalltyp,
    setErFalltyp,
    erErblasser,
    setErErblasser,
    erTodesdatum,
    setErTodesdatum,
    erNachlassgericht,
    setErNachlassgericht,
    erNachlassAktenzeichen,
    setErNachlassAktenzeichen,
    erForderungsbetrag,
    setErForderungsbetrag,
    handleStatusAendern,
  };
}
