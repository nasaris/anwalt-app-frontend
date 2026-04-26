import { describe, expect, it, beforeEach } from 'vitest';
import { resetStoresForTests } from '../test/resetStores';
import { useAufgabenStore } from './aufgabenStore';
import { useVorlagenStore } from './vorlagenStore';

describe('Referenz-Bereinigung (Vorlagen ↔ Aufgaben)', () => {
  beforeEach(() => {
    resetStoresForTests();
  });

  it('deleteCustomTyp: Phasen-Mapping, Vorlagen und Aufgaben-Verweise werden bereinigt', () => {
    const typId = 'custom-typ-99';
    useVorlagenStore.setState({
      customTypen: [{ id: typId, label: 'Eigen', aktiv: true, system: false }],
      vorlagen: [
        {
          id: 'vl-custom-1',
          name: 'V',
          typId,
          rechtsgebiet: 'alle',
          betreff: '',
          inhalt: '',
        },
      ],
      phaseMappingOverrides: {
        verkehrsrecht: { 1: ['schadensanzeige', typId] },
      },
    });

    useAufgabenStore.setState({
      customAufgaben: [
        {
          id: 'ca-bridge',
          text: 'Bridge',
          rechtsgebiet: 'verkehrsrecht',
          phase: 1,
          system: false,
          reihenfolge: 99,
          schriftverkehrTypId: typId,
          standardTextvorlageId: 'vl-custom-1',
        },
      ],
    });

    useVorlagenStore.getState().deleteCustomTyp(typId);

    expect(useVorlagenStore.getState().phaseMappingOverrides.verkehrsrecht?.[1]).toEqual([
      'schadensanzeige',
    ]);
    expect(useVorlagenStore.getState().vorlagen).toHaveLength(0);

    const ca = useAufgabenStore.getState().customAufgaben.find((a) => a.id === 'ca-bridge');
    expect(ca?.schriftverkehrTypId).toBeUndefined();
    expect(ca?.standardTextvorlageId).toBeUndefined();
  });

  it('deleteDokumentTyp (Bundle): nach „nicht System“ können Typ und Aufgaben-Mappings entfallen', () => {
    useVorlagenStore.getState().updateSystemTyp('schadensanzeige', { system: false });
    useVorlagenStore.getState().deleteDokumentTyp('schadensanzeige');

    expect(useVorlagenStore.getState().removedSystemTypIds).toContain('schadensanzeige');
    const o = useAufgabenStore.getState().systemOverrides['vr-2-1'];
    expect(o?.schriftverkehrTypId).toBe('');
    expect(o?.standardTextvorlageId).toBe('');
  });

  it('getTypenFuerPhase filtert entfernte System-Typen aus der Standard-Zuordnung', () => {
    useVorlagenStore.getState().updateSystemTyp('schadensanzeige', { system: false });
    useVorlagenStore.getState().deleteDokumentTyp('schadensanzeige');

    const typen = useVorlagenStore.getState().getTypenFuerPhase('verkehrsrecht', 1);
    expect(typen).not.toContain('schadensanzeige');
    expect(typen).toContain('sonstiges');
  });

  it('deleteVorlage: Standard-Textvorlage an Custom-Aufgabe wird entfernt', () => {
    useVorlagenStore.setState({
      vorlagen: [
        {
          id: 'vl-del',
          name: 'Weg',
          typId: 'sonstiges',
          rechtsgebiet: 'alle',
          betreff: '',
          inhalt: '',
        },
      ],
    });
    useAufgabenStore.setState({
      customAufgaben: [
        {
          id: 'ca-vl',
          text: 'Mit Vorlage',
          rechtsgebiet: 'verkehrsrecht',
          phase: 1,
          system: false,
          reihenfolge: 5,
          standardTextvorlageId: 'vl-del',
        },
      ],
    });

    useVorlagenStore.getState().deleteVorlage('vl-del');

    const ca = useAufgabenStore.getState().customAufgaben[0];
    expect(ca?.standardTextvorlageId).toBeUndefined();
  });

  it('deleteTextBaustein: Zuweisung und Platzhalter in eigener Vorlage werden entfernt', () => {
    const bausteinId = 'tb-test-bridge';
    useVorlagenStore.setState({
      textBausteine: [
        ...useVorlagenStore.getState().textBausteine,
        { id: bausteinId, name: 'B', inhalt: 'x', rechtsgebiet: 'alle' },
      ],
      vorlagen: [
        {
          id: 'vl-tb',
          name: 'Mit Baustein',
          typId: 'sonstiges',
          rechtsgebiet: 'alle',
          betreff: '',
          inhalt: `Text [BAUSTEIN:${bausteinId}] Ende`,
          zugewieseneBausteinIds: [bausteinId],
        },
      ],
    });

    useVorlagenStore.getState().deleteTextBaustein(bausteinId);

    const v = useVorlagenStore.getState().vorlagen.find((x) => x.id === 'vl-tb');
    expect(v?.inhalt).toBe('Text  Ende');
    expect(v?.zugewieseneBausteinIds).toBeUndefined();
    expect(useVorlagenStore.getState().textBausteine.some((t) => t.id === bausteinId)).toBe(false);
  });
});
