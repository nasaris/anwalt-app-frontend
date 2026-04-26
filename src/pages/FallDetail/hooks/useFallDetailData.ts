import { useState, useEffect } from 'react';
import type { Fall, Mandant, Partei, Schriftverkehr, Wiedervorlage } from '../../../types';
import { faelleApi } from '../../../api/faelle';
import { mandantenApi } from '../../../api/mandanten';
import { parteienApi, wiedervorlagenApi } from '../../../api/parteien';
import { schriftverkehrApi } from '../../../api/schriftverkehr';
import { sammleVerkehrsParteiIds } from '../../../utils/verkehrsParteienHelpers';

export function useFallDetailData(id: string | undefined) {
  const [fall, setFall] = useState<Fall | null>(null);
  const [mandant, setMandant] = useState<Mandant | null>(null);
  const [weitereMandanten, setWeitereMandanten] = useState<Mandant[]>([]);
  const [wiedervorlagen, setWiedervorlagen] = useState<Wiedervorlage[]>([]);
  const [parteienMap, setParteienMap] = useState<Record<string, Partei>>({});
  const [alleParteien, setAlleParteien] = useState<Partei[]>([]);
  const [schriftverkehr, setSchriftverkehr] = useState<Schriftverkehr[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    faelleApi.getById(id).then(async (f) => {
      setFall(f);
      const [m, w] = await Promise.all([
        mandantenApi.getById(f.mandantId),
        wiedervorlagenApi.getAll({ fallId: f.id, nurOffene: true }),
      ]);
      setMandant(m);
      setWiedervorlagen(w);

      const ids = [
        ...sammleVerkehrsParteiIds(f.verkehrsrecht),
        f.arbeitsrecht?.gegenseiteId,
        f.arbeitsrecht?.gerichtId,
      ].filter(Boolean) as string[];
      const [allParteien, sv] = await Promise.all([
        parteienApi.getAll(),
        schriftverkehrApi.getByFall(f.id),
      ]);
      setAlleParteien(allParteien);
      setSchriftverkehr(sv);
      if (ids.length > 0) {
        const map: Record<string, Partei> = {};
        allParteien.filter((p) => ids.includes(p.id)).forEach((p) => { map[p.id] = p; });
        setParteienMap(map);
      }
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    const ids = fall?.weitereMandantenIds;
    if (!ids?.length) {
      setWeitereMandanten([]);
      return;
    }
    let cancel = false;
    Promise.all(ids.map((mid) => mandantenApi.getById(mid)))
      .then((list) => { if (!cancel) setWeitereMandanten(list); })
      .catch(() => { if (!cancel) setWeitereMandanten([]); });
    return () => { cancel = true; };
  }, [fall?.weitereMandantenIds]);

  return {
    fall,
    setFall,
    mandant,
    setMandant,
    weitereMandanten,
    setWeitereMandanten,
    wiedervorlagen,
    setWiedervorlagen,
    parteienMap,
    setParteienMap,
    alleParteien,
    setAlleParteien,
    schriftverkehr,
    setSchriftverkehr,
    loading,
  };
}
