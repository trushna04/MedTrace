import { getDoseLogs } from './doseLogs';

export async function getDaysActive(): Promise<number> {
  const logs = await getDoseLogs();
  if (logs.length === 0) return 0;
  const dates = logs.map((l: any) => l.date ?? l.takenAt?.slice(0, 10)).filter(Boolean);
  if (dates.length === 0) return 0;
  const earliest = dates.reduce((a: string, b: string) => (a < b ? a : b));
  const diff = Date.now() - new Date(earliest).getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

export async function getTotalDosesTaken(): Promise<number> {
  const logs = await getDoseLogs();
  return logs.filter(l => l.status === 'taken').length;
}
