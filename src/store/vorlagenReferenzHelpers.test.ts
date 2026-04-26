import { describe, expect, it } from 'vitest';
import {
  arraysEqual,
  stripBausteinFromVorlage,
  stripBausteinPlatzhalterAusHtml,
  stripTypFromPhaseMapping,
} from './vorlagenReferenzHelpers';
import type { Textvorlage } from './vorlagenStore';

describe('stripTypFromPhaseMapping', () => {
  it('entfernt eine Typ-ID aus allen Phasen', () => {
    const mapping = {
      verkehrsrecht: {
        1: ['schadensanzeige', 'custom-x'],
        2: ['custom-x', 'sonstiges'],
      },
    };
    const next = stripTypFromPhaseMapping(mapping, 'custom-x');
    expect(next.verkehrsrecht?.[1]).toEqual(['schadensanzeige']);
    expect(next.verkehrsrecht?.[2]).toEqual(['sonstiges']);
  });
});

describe('stripBausteinFromVorlage', () => {
  const base: Textvorlage = {
    id: 'vl-1',
    name: 'Test',
    typId: 'sonstiges',
    rechtsgebiet: 'alle',
    betreff: '',
    inhalt: 'Hallo [BAUSTEIN:tb-1] Ende',
    zugewieseneBausteinIds: ['tb-1', 'tb-2'],
  };

  it('entfernt Platzhalter und Baustein-ID aus der Zuweisungsliste', () => {
    const v = stripBausteinFromVorlage(base, 'tb-1');
    expect(v.inhalt).toBe('Hallo  Ende');
    expect(v.zugewieseneBausteinIds).toEqual(['tb-2']);
  });

  it('lässt zugewieseneBausteinIds weg, wenn leer', () => {
    const v = stripBausteinFromVorlage(
      { ...base, zugewieseneBausteinIds: ['tb-1'], inhalt: '' },
      'tb-1',
    );
    expect(v.zugewieseneBausteinIds).toBeUndefined();
  });
});

describe('stripBausteinPlatzhalterAusHtml', () => {
  it('entfernt nur den angegebenen Platzhalter', () => {
    const html = 'A [BAUSTEIN:a] B [BAUSTEIN:b]';
    expect(stripBausteinPlatzhalterAusHtml(html, 'a')).toBe('A  B [BAUSTEIN:b]');
  });
});

describe('arraysEqual', () => {
  it('behandelt undefined wie leere Arrays', () => {
    expect(arraysEqual(undefined, [])).toBe(true);
    expect(arraysEqual(['a'], undefined)).toBe(false);
  });
});
