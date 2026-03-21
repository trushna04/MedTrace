import AsyncStorage from '@react-native-async-storage/async-storage';
import { DoseLog } from '../types';

const KEY = 'doseLogs';

export async function getDoseLogs(): Promise<DoseLog[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function logDose(log: DoseLog): Promise<void> {
  const logs = await getDoseLogs();
  logs.push(log);
  await AsyncStorage.setItem(KEY, JSON.stringify(logs));
}

export async function getLogsForMedicine(medicineId: string): Promise<DoseLog[]> {
  const logs = await getDoseLogs();
  return logs.filter(l => l.medicineId === medicineId);
}
