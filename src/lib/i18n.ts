import { AppLanguage } from '../types';

export interface Translations {
  navDashboard: string;
  navCalendar: string;
  navSettings: string;
  syncNow: string;
  syncing: string;
  signOut: string;
  pendingTasksTitle: string;
  coursesTitle: string;
  details: string;
  viewDetails: string;
  back: string;
  saveAndExit: string;
  exitWithoutSaving: string;
  noPendingTasks: string;
  calendarTitle: string;
  today: string;
  settingsTitle: string;
  notificationsSection: string;
  appearanceSection: string;
  profileSection: string;
  subscriptionSection: string;
  aiSummaryTitle: string;
  generateSummary: string;
  openInClassroom: string;
  teacherContact: string;
  classmates: string;
  yearlyActivities: string;
}

const DICT: Record<AppLanguage, Translations> = {
  'pt-BR': {
    navDashboard: 'Dashboard',
    navCalendar: 'Calendário',
    navSettings: 'Configurações',
    syncNow: 'Sincronizar Classroom',
    syncing: 'Sincronizando...',
    signOut: 'Sair',
    pendingTasksTitle: 'Tarefas perto de vencer',
    coursesTitle: 'Suas turmas no Classroom',
    details: 'Detalhes',
    viewDetails: 'Ver detalhes',
    back: 'Voltar',
    saveAndExit: 'Salvar e sair',
    exitWithoutSaving: 'Sair sem salvar',
    noPendingTasks: 'Nenhuma atividade pendente no momento.',
    calendarTitle: 'Calendário de entregas',
    today: 'Hoje',
    settingsTitle: 'Configurações do sistema',
    notificationsSection: 'Notificações e rotina',
    appearanceSection: 'Customizar painel',
    profileSection: 'Perfil e cadastro',
    subscriptionSection: 'Assinatura e plano',
    aiSummaryTitle: 'Resumo gerado por IA',
    generateSummary: 'Sumarizar atividade com IA',
    openInClassroom: 'Abrir no Classroom',
    teacherContact: 'Professor e contato',
    classmates: 'Colegas da turma',
    yearlyActivities: 'Atividades ao longo do ano',
  },
  'en-US': {
    navDashboard: 'Dashboard',
    navCalendar: 'Calendar',
    navSettings: 'Settings',
    syncNow: 'Sync Classroom',
    syncing: 'Syncing...',
    signOut: 'Sign out',
    pendingTasksTitle: 'Upcoming deadlines',
    coursesTitle: 'Your Classroom courses',
    details: 'Details',
    viewDetails: 'View details',
    back: 'Back',
    saveAndExit: 'Save and exit',
    exitWithoutSaving: 'Exit without saving',
    noPendingTasks: 'No pending assignments right now.',
    calendarTitle: 'Deadlines calendar',
    today: 'Today',
    settingsTitle: 'System settings',
    notificationsSection: 'Notifications & routine',
    appearanceSection: 'Customize panel',
    profileSection: 'Profile & registration',
    subscriptionSection: 'Subscription & plan',
    aiSummaryTitle: 'AI-generated summary',
    generateSummary: 'Summarize task with AI',
    openInClassroom: 'Open in Classroom',
    teacherContact: 'Teacher & contact',
    classmates: 'Classmates',
    yearlyActivities: 'Activities across the year',
  },
  'es-ES': {
    navDashboard: 'Panel',
    navCalendar: 'Calendario',
    navSettings: 'Configuración',
    syncNow: 'Sincronizar Classroom',
    syncing: 'Sincronizando...',
    signOut: 'Salir',
    pendingTasksTitle: 'Tareas por vencer',
    coursesTitle: 'Tus clases en Classroom',
    details: 'Detalles',
    viewDetails: 'Ver detalles',
    back: 'Volver',
    saveAndExit: 'Guardar y salir',
    exitWithoutSaving: 'Salir sin guardar',
    noPendingTasks: 'No hay actividades pendientes por ahora.',
    calendarTitle: 'Calendario de entregas',
    today: 'Hoy',
    settingsTitle: 'Configuración del sistema',
    notificationsSection: 'Notificaciones y rutina',
    appearanceSection: 'Personalizar panel',
    profileSection: 'Perfil y registro',
    subscriptionSection: 'Suscripción y plan',
    aiSummaryTitle: 'Resumen generado por IA',
    generateSummary: 'Resumir actividad con IA',
    openInClassroom: 'Abrir en Classroom',
    teacherContact: 'Profesor y contacto',
    classmates: 'Compañeros de clase',
    yearlyActivities: 'Actividades del año',
  },
};

export function getTranslations(lang: AppLanguage): Translations {
  return DICT[lang] || DICT['pt-BR'];
}
