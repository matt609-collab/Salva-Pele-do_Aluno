import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertCircle,
  Bell,
  Calendar as CalendarIcon,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  clearAccessToken,
  getAccessToken,
  googleSignIn,
  initAuth,
  logout,
} from './lib/firebaseAuth';
import {
  ClassroomAuthExpiredError,
  syncClassroomFromGoogle,
} from './lib/classroomClient';
import { getTranslations } from './lib/i18n';
import {
  DEFAULT_SETTINGS,
  loadCustomEvents,
  loadProfile,
  loadSettings,
  saveCustomEvents,
  saveProfile,
  saveSettings,
} from './lib/storage';
import {
  ActiveView,
  AppSettings,
  ClassroomActivity,
  ClassroomAnnouncement,
  ClassroomCourse,
  ClassroomSyncPayload,
  CustomCalendarEvent,
  StudentProfile,
} from './types';
import { LoginView } from './components/LoginView';
import { OnboardingWizard } from './components/OnboardingWizard';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { SettingsView } from './components/SettingsView';
import { ClassDetailView } from './components/ClassDetailView';
import { ActivityDetailView } from './components/ActivityDetailView';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [customEvents, setCustomEvents] = useState<CustomCalendarEvent[]>([]);

  const [courses, setCourses] = useState<ClassroomCourse[]>([]);
  const [activities, setActivities] = useState<ClassroomActivity[]>([]);
  const [announcements, setAnnouncements] = useState<ClassroomAnnouncement[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [originView, setOriginView] = useState<'dashboard' | 'calendar'>('dashboard');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = useMemo(() => getTranslations(settings.language), [settings.language]);

  // Apply theme & uiScale on root element
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (settings.uiScale === 'compact') {
      root.style.fontSize = '14px';
    } else if (settings.uiScale === 'comfortable') {
      root.style.fontSize = '17.5px';
    } else {
      root.style.fontSize = '16px';
    }
  }, [settings.theme, settings.uiScale]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  const syncClassroom = useCallback(async (tokenOverride?: string) => {
    const token = tokenOverride || getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const payload = await syncClassroomFromGoogle(token);
      setCourses(payload.courses || []);
      setActivities(payload.activities || []);
      setAnnouncements(payload.announcements || []);
      setLastSyncedAt(payload.syncedAt);
    } catch (err: any) {
      if (err instanceof ClassroomAuthExpiredError) {
        clearAccessToken();
        setAccessToken(null);
        setNeedsAuth(true);
        setAuthError(err.message);
        return;
      }
      setSyncError(err?.message || 'Não foi possível buscar dados do Classroom.');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const hydrateUserSession = useCallback(
    async (firebaseUser: User, token: string) => {
      setUser(firebaseUser);
      setAccessToken(token);
      setNeedsAuth(false);
      setAuthError(null);

      const loadedProfile = loadProfile(firebaseUser.uid, {
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
      });
      const loadedSettings = loadSettings(firebaseUser.uid);
      const loadedEvents = loadCustomEvents(firebaseUser.uid);

      setProfile(loadedProfile);
      setSettings(loadedSettings);
      setCustomEvents(loadedEvents);
      setShowOnboarding(!loadedProfile.onboardingCompleted);

      await syncClassroom(token);
    },
    [syncClassroom]
  );

  useEffect(() => {
    const unsubscribe = initAuth(
      (firebaseUser, token) => {
        hydrateUserSession(firebaseUser, token);
      },
      () => {
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, [hydrateUserSession]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        await hydrateUserSession(result.user, result.accessToken);
      }
    } catch (err: any) {
      const msg =
        err?.code === 'auth/popup-closed-by-user'
          ? 'A janela de login foi fechada antes da conclusão. Tente novamente.'
          : err?.message || 'Não foi possível autenticar com o Google.';
      setAuthError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
    setCourses([]);
    setActivities([]);
    setAnnouncements([]);
    setActiveView('dashboard');
  };

  const handleOnboardingComplete = (
    updatedProfile: StudentProfile,
    updatedSettings: AppSettings
  ) => {
    saveProfile(updatedProfile);
    saveSettings(updatedProfile.uid, updatedSettings);
    setProfile(updatedProfile);
    setSettings(updatedSettings);
    setShowOnboarding(false);
    showToast('Cadastro concluído. Painel e calendário construídos!');
  };

  const handleOpenCourse = (courseId: string, from?: 'dashboard' | 'calendar') => {
    if (from) setOriginView(from);
    setSelectedCourseId(courseId);
    setActiveView('course-detail');
  };

  const handleOpenActivity = (activityId: string, from?: 'dashboard' | 'calendar') => {
    if (from) setOriginView(from);
    setSelectedActivityId(activityId);
    setActiveView('activity-detail');
  };

  const handleSaveSettingsAndExit = (
    updatedProfile: StudentProfile,
    updatedSettings: AppSettings
  ) => {
    saveProfile(updatedProfile);
    saveSettings(updatedProfile.uid, updatedSettings);
    setProfile(updatedProfile);
    setSettings(updatedSettings);
    setActiveView('dashboard');
    showToast('Configurações salvas com sucesso.');
  };

  const handleAddCustomEvent = (event: CustomCalendarEvent) => {
    if (!profile) return;
    const next = [...customEvents, event];
    setCustomEvents(next);
    saveCustomEvents(profile.uid, next);
    showToast('Lembrete adicionado ao calendário.');
  };

  const handleDeleteCustomEvent = (eventId: string) => {
    if (!profile) return;
    const next = customEvents.filter((e) => e.id !== eventId);
    setCustomEvents(next);
    saveCustomEvents(profile.uid, next);
  };

  if (needsAuth || !user || !accessToken) {
    return (
      <LoginView
        onLogin={handleLogin}
        isLoggingIn={isLoggingIn}
        authError={authError}
      />
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedActivity = activities.find((a) => a.id === selectedActivityId);

  const pendingTotal = activities.filter((a) => a.status !== 'concluida').length;

  return (
    <div
      className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col ${
        settings.highContrast ? 'contrast-125' : ''
      }`}
    >
      {/* Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2.5 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span>SPA · Salva Pele</span>
          </button>

          {/* Zone 2: Primary navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeView === 'dashboard' || activeView === 'course-detail' || activeView === 'activity-detail'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t.navDashboard}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('calendar')}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeView === 'calendar'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>{t.navCalendar}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('settings')}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                activeView === 'settings'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>{t.navSettings}</span>
            </button>
          </nav>

          {/* Zone 3: Primary sync action + profile */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => syncClassroom()}
              disabled={isSyncing}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isSyncing ? t.syncing : t.syncNow}
              </span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={profile?.nomeConta || 'Perfil'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover bg-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold flex items-center justify-center">
                  {(profile?.nomeConta || 'AL').slice(0, 2).toUpperCase()}
                </div>
              )}

              <button
                type="button"
                onClick={handleLogout}
                title={t.signOut}
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Bar */}
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className={`px-3 py-1.5 rounded-md ${
              activeView === 'dashboard'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.navDashboard}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('calendar')}
            className={`px-3 py-1.5 rounded-md ${
              activeView === 'calendar'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.navCalendar}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('settings')}
            className={`px-3 py-1.5 rounded-md ${
              activeView === 'settings'
                ? 'text-blue-600 dark:text-blue-400 font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.navSettings}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Context Metadata Line */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {profile?.nomeConta || user.displayName}
            </span>
            <span aria-hidden="true">·</span>
            <span>{profile?.domainLabel || user.email}</span>
            {profile?.serie && (
              <>
                <span aria-hidden="true">·</span>
                <span>{profile.serie}</span>
              </>
            )}
          </div>
          <div className="font-mono tabular-nums">
            {lastSyncedAt
              ? `Sincronizado às ${new Date(lastSyncedAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })} · ${pendingTotal} pendência(s)`
              : 'Conectando ao Google Classroom...'}
          </div>
        </div>

        {syncError && (
          <div
            role="alert"
            className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 flex items-center justify-between gap-4 text-sm text-red-700 dark:text-red-300"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{syncError}</span>
            </div>
            <button
              type="button"
              onClick={() => syncClassroom()}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 shrink-0 cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            courses={courses}
            activities={activities}
            announcements={announcements}
            settings={settings}
            isLoading={isSyncing}
            t={t}
            onSelectCourse={(id) => handleOpenCourse(id, 'dashboard')}
            onSelectActivity={(id) => handleOpenActivity(id, 'dashboard')}
            onGoCalendar={() => setActiveView('calendar')}
            onSync={() => syncClassroom()}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView
            courses={courses}
            activities={activities}
            announcements={announcements}
            customEvents={customEvents}
            t={t}
            onSelectActivity={(id) => handleOpenActivity(id, 'calendar')}
            onSelectCourse={(id) => handleOpenCourse(id, 'calendar')}
            onAddCustomEvent={handleAddCustomEvent}
            onDeleteCustomEvent={handleDeleteCustomEvent}
          />
        )}

        {activeView === 'settings' && profile && (
          <SettingsView
            profile={profile}
            settings={settings}
            courses={courses}
            activities={activities}
            t={t}
            onSaveAndExit={handleSaveSettingsAndExit}
            onExitWithoutSaving={() => setActiveView('dashboard')}
            onReopenTutorial={() => setShowOnboarding(true)}
            onTriggerTestNotification={(msg) => showToast(msg)}
          />
        )}

        {activeView === 'course-detail' && selectedCourse && (
          <ClassDetailView
            course={selectedCourse}
            activities={activities}
            t={t}
            backLabel={
              originView === 'calendar'
                ? 'Voltar ao calendário'
                : 'Voltar ao dashboard'
            }
            onBack={() => setActiveView(originView)}
            onSelectActivity={(id) => handleOpenActivity(id)}
          />
        )}

        {activeView === 'activity-detail' && selectedActivity && (
          <ActivityDetailView
            activity={selectedActivity}
            t={t}
            backLabel={
              originView === 'calendar'
                ? 'Voltar ao calendário'
                : 'Voltar ao dashboard'
            }
            onBack={() => setActiveView(originView)}
            onOpenCourse={(id) => handleOpenCourse(id)}
          />
        )}
      </main>

      {/* Onboarding / Cadastro Wizard */}
      {showOnboarding && profile && (
        <OnboardingWizard
          profile={profile}
          settings={settings}
          courses={courses}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Toast Notification Preview */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm p-4 rounded-xl bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 shadow-lg flex items-start gap-3">
          <Bell className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
