export type ActivityStatus = 'pendente' | 'atrasada' | 'devolvida' | 'concluida';

export type AppTheme = 'light' | 'dark';
export type AppLanguage = 'pt-BR' | 'en-US' | 'es-ES';
export type UiScale = 'compact' | 'default' | 'comfortable';
export type SubscriptionPlan = 'free-seed' | 'spa-plus';

export interface ClassroomPerson {
  userId: string;
  name: string;
  email?: string;
  photoUrl?: string;
}

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  room?: string;
  descriptionHeading?: string;
  alternateLink?: string;
  courseState?: string;
  colorHex: string;
  teachers: ClassroomPerson[];
  students: ClassroomPerson[];
  rosterRestricted?: boolean;
  pendingCount: number;
  returnedCount: number;
  overdueCount: number;
  totalActivities: number;
}

export interface ActivityMaterial {
  title: string;
  url?: string;
  type: 'link' | 'drive' | 'youtube' | 'form';
}

export interface ClassroomActivity {
  id: string;
  courseId: string;
  courseName: string;
  courseColor: string;
  title: string;
  description?: string;
  workType?: string;
  state?: string;
  dueDateIso?: string; // YYYY-MM-DD
  dueTimeDisplay?: string; // HH:mm
  dueTimestamp?: number;
  creationTime?: string;
  maxPoints?: number;
  assignedGrade?: number;
  submissionState?: string;
  late?: boolean;
  status: ActivityStatus;
  alternateLink?: string;
  materials: ActivityMaterial[];
  teacherEmail?: string;
  teacherName?: string;
}

export interface ClassroomAnnouncement {
  id: string;
  courseId: string;
  courseName: string;
  courseColor: string;
  text: string;
  creationTime: string;
  dateIso: string; // YYYY-MM-DD
  alternateLink?: string;
  creatorName?: string;
}

export interface CustomCalendarEvent {
  id: string;
  title: string;
  dateIso: string; // YYYY-MM-DD
  timeDisplay?: string;
  courseId?: string;
  courseName: string;
  colorHex: string;
  notes?: string;
  createdByRole: 'aluno' | 'professor';
}

export interface ClassroomSyncPayload {
  syncedAt: string;
  courses: ClassroomCourse[];
  activities: ClassroomActivity[];
  announcements: ClassroomAnnouncement[];
}

export interface FreeHourSlot {
  id: string;
  label: string; // e.g. "Manhã (09:00 - 11:00)"
  startHour: number;
  endHour: number;
  enabled: boolean;
  idleScore: number; // 0-100 estimated availability
}

export interface StudentProfile {
  uid: string;
  nomeConta: string;
  email: string;
  photoUrl?: string;
  isEscolaDomain: boolean;
  domainLabel: string;
  dataNascimento: string;
  serie: string;
  nivelEnsino: string;
  escolaNome: string;
  telefone: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AppSettings {
  theme: AppTheme;
  language: AppLanguage;
  uiScale: UiScale;
  highContrast: boolean;
  notificationsEnabled: boolean;
  maxNotificationsPerDay: number;
  advanceNoticeHours: 12 | 24 | 48 | 72;
  notifyOnReturned: boolean;
  notifyOnAnnouncements: boolean;
  enabledCourseIds: string[]; // empty means all enabled until customized
  freeHourSlots: FreeHourSlot[];
  avgDailyScreenHours: number;
  showCompletedOnDashboard: boolean;
  compactActivityList: boolean;
  subscriptionPlan: SubscriptionPlan;
}

export interface AiActivitySummary {
  summary: string;
  checklist: string[];
  estimatedMinutes: number;
  priorityNote: string;
  generatedAt: string;
}

export interface AiScheduleInsight {
  recommendedWindow: string;
  rationale: string;
  dailyPlan: Array<{
    timeSlot: string;
    taskTitle: string;
    courseName: string;
    tip: string;
  }>;
  generatedAt: string;
}

export type ActiveView =
  | 'dashboard'
  | 'calendar'
  | 'settings'
  | 'course-detail'
  | 'activity-detail';
