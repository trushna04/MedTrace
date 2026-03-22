import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine, Frequency } from '../types';

const KEY = 'medicines';
const LINK_CODE_KEY = 'myLinkCode';
const GUARDIAN_LINK_KEY = 'guardianLink';

const today = new Date().toISOString();

const DEFAULTS: Medicine[] = [
  { id: '1', name: 'Metformin',  dosageMg: 500,  frequency: Frequency.ONCE_DAILY, reminderTime: '08:00', pillColor: '#1D9E75', startDate: today },
  { id: '2', name: 'Lisinopril', dosageMg: 10,   frequency: Frequency.ONCE_DAILY, reminderTime: '09:00', pillColor: '#378ADD', startDate: today },
  { id: '3', name: 'Vitamin D',  dosageMg: 1000, frequency: Frequency.ONCE_DAILY, reminderTime: '08:00', pillColor: '#F59E0B', startDate: today },
];

export async function getMedicines(): Promise<Medicine[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return DEFAULTS;
  const parsed: Medicine[] = JSON.parse(raw);
  return parsed.length > 0 ? parsed : DEFAULTS;
}

export async function saveMedicine(medicine: Omit<Medicine, 'id'>): Promise<void> {
  const medicines = await getMedicines();
  const newMedicine: Medicine = {
    ...medicine,
    id: Math.random().toString(36).substring(2, 11),
  };
  medicines.push(newMedicine);
  await AsyncStorage.setItem(KEY, JSON.stringify(medicines));
}

export async function deleteMedicine(id: string): Promise<void> {
  const medicines = await getMedicines();
  await AsyncStorage.setItem(KEY, JSON.stringify(medicines.filter(m => m.id !== id)));
}

export function generateLinkCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function saveLinkCode(code: string): Promise<void> {
  await AsyncStorage.setItem(LINK_CODE_KEY, code);
}

export async function getLinkCode(): Promise<string> {
  const saved = await AsyncStorage.getItem(LINK_CODE_KEY);
  if (saved) return saved;
  const code = generateLinkCode();
  await saveLinkCode(code);
  return code;
}

export async function saveGuardianLink(code: string, patientName: string): Promise<void> {
  await AsyncStorage.setItem(GUARDIAN_LINK_KEY, JSON.stringify({ code, patientName }));
}

export async function getGuardianLink(): Promise<{ code: string; patientName: string } | null> {
  const raw = await AsyncStorage.getItem(GUARDIAN_LINK_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearGuardianLink(): Promise<void> {
  await AsyncStorage.removeItem(GUARDIAN_LINK_KEY);
}
