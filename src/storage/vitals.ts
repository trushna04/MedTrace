import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vital, VitalType } from '../types';
import { supabase } from '../lib/supabase';

const VITALS_KEY = 'vitals';

function getUnit(type: VitalType): string {
  const units: Record<VitalType, string> = {
    blood_pressure: 'mmHg',
    glucose: 'mg/dL',
    weight: 'kg',
    spo2: '%',
    heart_rate: 'bpm',
    temperature: '°F',
  };
  return units[type];
}

export async function getVitals(type?: VitalType): Promise<Vital[]> {
  const raw = await AsyncStorage.getItem(VITALS_KEY);
  const all: Vital[] = raw ? JSON.parse(raw) : [];
  if (type) return all.filter(v => v.type === type);
  return all;
}

export async function saveVital(
  type: VitalType,
  value: string,
  note?: string
): Promise<Vital> {
  const vital: Vital = {
    id: Math.random().toString(36).substring(2, 11),
    type,
    value,
    unit: getUnit(type),
    recordedAt: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    note,
  };

  const existing = await getVitals();
  existing.unshift(vital);
  await AsyncStorage.setItem(VITALS_KEY, JSON.stringify(existing));

  const { data: { user } } = await supabase.auth.getUser();
  console.log('Saving vital for user:', user?.id);
  if (user) {
    const { error } = await supabase.from('vitals').insert({
      id: vital.id,
      user_id: user.id,
      type: vital.type,
      value: vital.value,
      unit: vital.unit,
      recorded_at: vital.recordedAt,
      date: vital.date,
      note: vital.note ?? null,
    });
    if (error) {
      console.error('Vitals Supabase error:', error.message);
    } else {
      console.log('Vital synced to Supabase successfully:', vital.type);
    }
  }

  return vital;
}

export async function getLatestVitals(): Promise<Partial<Record<VitalType, Vital>>> {
  const all = await getVitals();
  const latest: Partial<Record<VitalType, Vital>> = {};
  for (const vital of all) {
    if (!latest[vital.type]) {
      latest[vital.type] = vital;
    }
  }
  return latest;
}
