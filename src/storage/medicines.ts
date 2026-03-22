import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine } from '../types';

const KEY = 'medicines';
const LINK_CODE_KEY = 'myLinkCode';
const GUARDIAN_LINK_KEY = 'guardianLink';

export async function getMedicines(): Promise<Medicine[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveMedicine(medicine: Medicine): Promise<void> {
  const medicines = await getMedicines();
  medicines.push(medicine);
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
