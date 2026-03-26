import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { LabReport } from '../types';

const KEY = 'lab_reports';

export async function getLabReports(): Promise<LabReport[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveLabReport(
  report: Omit<LabReport, 'id' | 'uploadedAt' | 'status'>
): Promise<LabReport> {
  const newReport: LabReport = {
    ...report,
    id: Math.random().toString(36).substring(2, 11),
    uploadedAt: new Date().toISOString(),
    status: 'local',
  };

  const existing = await getLabReports();
  existing.unshift(newReport);
  await AsyncStorage.setItem(KEY, JSON.stringify(existing));

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { error } = await supabase.from('lab_reports').insert({
      id: newReport.id,
      user_id: user.id,
      title: newReport.title,
      doctor_name: newReport.doctorName,
      report_date: newReport.reportDate,
      report_type: newReport.reportType,
      notes: newReport.notes,
      file_name: newReport.fileName ?? null,
      uploaded_at: newReport.uploadedAt,
      status: 'uploaded',
    });
    if (error) console.error('Lab report sync error:', error.message);
    else console.log('Lab report synced successfully');
  }

  return newReport;
}

export async function deleteLabReport(id: string): Promise<void> {
  const all = await getLabReports();
  const updated = all.filter(r => r.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}
