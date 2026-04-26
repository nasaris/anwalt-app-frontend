import { BEISPIEL_TEXTBAUSTEINE } from '../data/beispielTextBausteine';
import { useAufgabenStore } from '../store/aufgabenStore';
import { useVorlagenStore } from '../store/vorlagenStore';

/** Leert Persist-Speicher und setzt Store-Daten auf reproduzierbare Startwerte (Tests). */
export function resetStoresForTests(): void {
  localStorage.clear();

  useAufgabenStore.setState({
    customAufgaben: [],
    deaktiviertIds: [],
    erledigtProFall: {},
    fallAufgabenMeta: {},
    systemOverrides: {},
    phasenNummern: {},
    phaseLabelOverrides: {},
  });

  useVorlagenStore.setState({
    typLabelOverrides: {},
    typAktivOverrides: {},
    typSystemOverrides: {},
    removedSystemTypIds: [],
    customTypen: [],
    vorlagen: [],
    systemVorlageOverrides: {},
    removedSystemVorlageIds: [],
    textBausteine: BEISPIEL_TEXTBAUSTEINE.map(({ id, name, inhalt, rechtsgebiet }) => ({
      id,
      name,
      inhalt,
      rechtsgebiet,
    })),
    phaseMappingOverrides: {},
  });
}
