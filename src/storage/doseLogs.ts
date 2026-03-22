import AsyncStorage from '@react-native-async-storage/async-storage';
import { DoseLog } from '../types';

const KEY = 'doseLogs';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDoseLogs(): Promise<DoseLog[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveDoseLog(
  medicineId: string,
  medicineName: string,
  status: 'taken' | 'missed' | 'skipped'
): Promise<void> {
  const logs = await getDoseLogs();
  const log: DoseLog & { medicineName: string; date: string } = {
    id: Math.random().toString(36).substring(2, 11),
    medicineId,
    medicineName,
    takenAt: new Date().toISOString(),
    status,
    date: todayString(),
  };
  logs.push(log);
  await AsyncStorage.setItem(KEY, JSON.stringify(logs));
}

export async function getTodaysDoseLogs(): Promise<DoseLog[]> {
  const logs = await getDoseLogs();
  const today = todayString();
  return logs.filter((l: any) => l.date === today);
}

export async function calculateStreak(
  totalMedicines: number
): Promise<{ count: number; type: 'gold' | 'silver' | 'none' }> {
  const todayLogs = await getTodaysDoseLogs();
  const takenCount = todayLogs.filter(l => l.status === 'taken').length;

  if (totalMedicines === 0) return { count: 0, type: 'none' };

  const pct = takenCount / totalMedicines;
  if (pct >= 1) return { count: takenCount, type: 'gold' };
  if (pct >= 0.5) return { count: takenCount, type: 'silver' };
  return { count: takenCount, type: 'none' };
}
