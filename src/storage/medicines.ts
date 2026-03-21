import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medicine } from '../types';

const KEY = 'medicines';

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
