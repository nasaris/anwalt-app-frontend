import client from './client';

export type SettingsKey = 'kanzlei' | 'aufgaben' | 'vorlagen' | 'dokumente' | 'abrechnung' | 'rvgTabellen' | 'schadenskalkulation';

export async function getSettings<T>(key: SettingsKey): Promise<T | null> {
  try {
    const r = await client.get<{ key: string; value: T }>(`/api/settings/${key}`);
    return r.data.value;
  } catch {
    return null;
  }
}

export async function putSettings<T>(key: SettingsKey, value: T): Promise<void> {
  await client.put(`/api/settings/${key}`, value);
}

