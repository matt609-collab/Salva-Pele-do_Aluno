import {
  AiActivitySummary,
  AppSettings,
  CustomCalendarEvent,
  FreeHourSlot,
  StudentProfile,
} from '../types';

const PROFILE_PREFIX = 'spa_profile_v1_';
const SETTINGS_PREFIX = 'spa_settings_v1_';
const EVENTS_PREFIX = 'spa_events_v1_';
const SUMMARY_PREFIX = 'spa_ai_summary_v1_';

export const DEFAULT_FREE_SLOTS: FreeHourSlot[] = [
  {
    id: 'morning',
    label: 'Manhã · Intervalo (09:30 - 11:30)',
    startHour: 9,
    endHour: 11,
    enabled: false,
    idleScore: 35,
  },
  {
    id: 'afternoon',
    label: 'Tarde · Tempo livre (14:00 - 17:00)',
    startHour: 14,
    endHour: 17,
    enabled: true,
    idleScore: 82,
  },
  {
    id: 'evening',
    label: 'Noite · Revisão (19:00 - 21:30)',
    startHour: 19,
    endHour: 21,
    enabled: true,
    idleScore: 91,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'pt-BR',
  uiScale: 'default',
  highContrast: false,
  notificationsEnabled: true,
  maxNotificationsPerDay: 4,
  advanceNoticeHours: 24,
  notifyOnReturned: true,
  notifyOnAnnouncements: true,
  enabledCourseIds: [],
  freeHourSlots: DEFAULT_FREE_SLOTS,
  avgDailyScreenHours: 4.5,
  showCompletedOnDashboard: false,
  compactActivityList: false,
  subscriptionPlan: 'free-seed',
};

export function detectSchoolDomain(email: string): {
  isEscolaDomain: boolean;
  domainLabel: string;
} {
  const normalized = email.trim().toLowerCase();
  const domain = normalized.split('@')[1] || '';
  const isEscola =
    domain.includes('escola') ||
    domain.includes('edu') ||
    domain.includes('seed') ||
    domain.endsWith('.gov.br');

  if (domain.includes('escola.pr.gov.br')) {
    return { isEscolaDomain: true, domainLabel: 'Conta @escola SEED-PR verificada' };
  }
  if (isEscola) {
    return { isEscolaDomain: true, domainLabel: `Conta institucional (${domain})` };
  }
  return {
    isEscolaDomain: false,
    domainLabel: `Conta Google padrão (${domain || 'gmail.com'})`,
  };
}

export function createDefaultProfile(
  uid: string,
  displayName: string | null,
  email: string | null,
  photoURL: string | null
): StudentProfile {
  const safeEmail = email || '';
  const domainInfo = detectSchoolDomain(safeEmail);
  return {
    uid,
    nomeConta: displayName || safeEmail.split('@')[0] || 'Estudante',
    email: safeEmail,
    photoUrl: photoURL || undefined,
    isEscolaDomain: domainInfo.isEscolaDomain,
    domainLabel: domainInfo.domainLabel,
    dataNascimento: '',
    serie: '3º Ano - Ensino Médio',
    nivelEnsino: 'Ensino Médio / Técnico',
    escolaNome: domainInfo.isEscolaDomain
      ? 'Colégio Estadual Cívico-Militar Dom Pedro I'
      : '',
    telefone: '',
    onboardingCompleted: false,
    createdAt: new Date().toISOString(),
  };
}

export function loadProfile(
  uid: string,
  fallbackUser?: { displayName: string | null; email: string | null; photoURL: string | null }
): StudentProfile {
  try {
    const raw = localStorage.getItem(`${PROFILE_PREFIX}${uid}`);
    if (raw) {
      const parsed = JSON.parse(raw) as StudentProfile;
      const domainInfo = detectSchoolDomain(parsed.email || fallbackUser?.email || '');
      return {
        ...parsed,
        isEscolaDomain: domainInfo.isEscolaDomain,
        domainLabel: domainInfo.domainLabel,
      };
    }
  } catch {
    // ignore storage parse error
  }
  return createDefaultProfile(
    uid,
    fallbackUser?.displayName || null,
    fallbackUser?.email || null,
    fallbackUser?.photoURL || null
  );
}

export function saveProfile(profile: StudentProfile): void {
  localStorage.setItem(`${PROFILE_PREFIX}${profile.uid}`, JSON.stringify(profile));
}

export function loadSettings(uid: string): AppSettings {
  try {
    const raw = localStorage.getItem(`${SETTINGS_PREFIX}${uid}`);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(uid: string, settings: AppSettings): void {
  localStorage.setItem(`${SETTINGS_PREFIX}${uid}`, JSON.stringify(settings));
}

export function loadCustomEvents(uid: string): CustomCalendarEvent[] {
  try {
    const raw = localStorage.getItem(`${EVENTS_PREFIX}${uid}`);
    if (raw) {
      return JSON.parse(raw) as CustomCalendarEvent[];
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveCustomEvents(uid: string, events: CustomCalendarEvent[]): void {
  localStorage.setItem(`${EVENTS_PREFIX}${uid}`, JSON.stringify(events));
}

export function loadCachedSummary(activityId: string): AiActivitySummary | null {
  try {
    const raw = localStorage.getItem(`${SUMMARY_PREFIX}${activityId}`);
    if (raw) {
      return JSON.parse(raw) as AiActivitySummary;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveCachedSummary(activityId: string, summary: AiActivitySummary): void {
  localStorage.setItem(`${SUMMARY_PREFIX}${activityId}`, JSON.stringify(summary));
}
