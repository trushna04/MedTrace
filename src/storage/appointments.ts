import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Appointment } from '../types';

const KEY = 'appointments';

export async function getAppointments(): Promise<Appointment[]> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveAppointment(
  appt: Omit<Appointment, 'id' | 'createdAt' | 'status'>
): Promise<Appointment> {
  const newAppt: Appointment = {
    ...appt,
    id: Math.random().toString(36).substring(2, 11),
    status: 'upcoming',
    createdAt: new Date().toISOString(),
  };

  const existing = await getAppointments();
  existing.unshift(newAppt);
  await AsyncStorage.setItem(KEY, JSON.stringify(existing));

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { error } = await supabase.from('appointments').insert({
      id: newAppt.id,
      user_id: user.id,
      doctor_name: newAppt.doctorName,
      specialty: newAppt.specialty,
      date: newAppt.date,
      time: newAppt.time,
      location: newAppt.location,
      notes: newAppt.notes,
      status: newAppt.status,
      created_at: newAppt.createdAt,
    });
    if (error) console.error('Appointment sync error:', error.message);
    else console.log('Appointment synced to Supabase');
  }

  return newAppt;
}

export async function getUpcomingAppointments(): Promise<Appointment[]> {
  const all = await getAppointments();
  const today = new Date().toISOString().split('T')[0];
  return all
    .filter(a => a.date >= today && a.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function markAppointmentComplete(id: string): Promise<void> {
  const all = await getAppointments();
  const updated = all.map(a =>
    a.id === id ? { ...a, status: 'completed' as const } : a
  );
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}
