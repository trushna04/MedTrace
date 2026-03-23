import { supabase } from './supabase';
import { Medicine, DoseLog } from '../types';

export async function syncMedicines(userId: string, medicines: Medicine[]): Promise<void> {
  const rows = medicines.map(m => ({
    id: m.id,
    user_id: userId,
    name: m.name,
    dosage_mg: m.dosageMg,
    frequency: m.frequency,
    reminder_time: m.reminderTime,
    pill_color: m.pillColor,
    start_date: m.startDate,
  }));
  await supabase.from('medicines').upsert(rows, { onConflict: 'id,user_id' });
}

export async function syncDoseLog(userId: string, doseLog: DoseLog & { medicineName?: string; date?: string }): Promise<void> {
  await supabase.from('dose_logs').upsert({
    id: doseLog.id,
    user_id: userId,
    medicine_id: doseLog.medicineId,
    medicine_name: doseLog.medicineName ?? '',
    status: doseLog.status,
    taken_at: doseLog.takenAt,
    date: doseLog.date ?? doseLog.takenAt.slice(0, 10),
  });
}

export async function saveUserProfile(userId: string, name: string, linkCode: string): Promise<void> {
  await supabase.from('profiles').upsert({ id: userId, name, link_code: linkCode });
}

export async function getUserProfile(userId: string): Promise<{ name: string; linkCode: string } | null> {
  const { data } = await supabase
    .from('profiles')
    .select('name, link_code')
    .eq('id', userId)
    .single();
  if (!data) return null;
  return { name: data.name, linkCode: data.link_code };
}

export async function getPatientData(linkCode: string): Promise<{
  medicines: Medicine[];
  doseLogs: DoseLog[];
  patientName: string;
} | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('link_code', linkCode)
    .single();

  if (!profile) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: medsData }, { data: logsData }] = await Promise.all([
    supabase.from('medicines').select('*').eq('user_id', profile.id),
    supabase.from('dose_logs').select('*').eq('user_id', profile.id).eq('date', today),
  ]);

  const medicines: Medicine[] = (medsData ?? []).map((m: any) => ({
    id: m.id,
    name: m.name,
    dosageMg: m.dosage_mg,
    frequency: m.frequency,
    reminderTime: m.reminder_time,
    pillColor: m.pill_color,
    startDate: m.start_date,
  }));

  const doseLogs: DoseLog[] = (logsData ?? []).map((l: any) => ({
    id: l.id,
    medicineId: l.medicine_id,
    takenAt: l.taken_at,
    status: l.status,
  }));

  return { medicines, doseLogs, patientName: profile.name };
}
