import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Monitor,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import {
  AiScheduleInsight,
  AppLanguage,
  AppSettings,
  ClassroomActivity,
  ClassroomCourse,
  StudentProfile,
  UiScale,
} from '../types';
import { Translations } from '../lib/i18n';

interface SettingsViewProps {
  profile: StudentProfile;
  settings: AppSettings;
  courses: ClassroomCourse[];
  activities: ClassroomActivity[];
  t: Translations;
  onSaveAndExit: (updatedProfile: StudentProfile, updatedSettings: AppSettings) => void;
  onExitWithoutSaving: () => void;
  onReopenTutorial: () => void;
  onTriggerTestNotification: (message: string) => void;
}

type SettingsTab = 'notifications' | 'appearance' | 'profile' | 'subscription';

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  settings,
  courses,
  activities,
  t,
  onSaveAndExit,
  onExitWithoutSaving,
  onReopenTutorial,
  onTriggerTestNotification,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  const [draftProfile, setDraftProfile] = useState<StudentProfile>(profile);
  const [showRoutineDropdown, setShowRoutineDropdown] = useState(true);

  const [aiInsight, setAiInsight] = useState<AiScheduleInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const hasChanges =
    JSON.stringify(draftSettings) !== JSON.stringify(settings) ||
    JSON.stringify(draftProfile) !== JSON.stringify(profile);

  const toggleCourseNotification = (courseId: string) => {
    setDraftSettings((prev) => {
      const current =
        prev.enabledCourseIds.length === 0
          ? courses.map((c) => c.id)
          : prev.enabledCourseIds;
      const exists = current.includes(courseId);
      const next = exists
        ? current.filter((id) => id !== courseId)
        : [...current, courseId];
      return { ...prev, enabledCourseIds: next };
    });
  };

  const toggleFreeSlot = (slotId: string) => {
    setDraftSettings((prev) => ({
      ...prev,
      freeHourSlots: prev.freeHourSlots.map((slot) =>
        slot.id === slotId ? { ...slot, enabled: !slot.enabled } : slot
      ),
    }));
  };

  const handleGenerateInsights = async () => {
    setLoadingInsight(true);
    setInsightError(null);
    try {
      const pending = activities.filter((a) => a.status !== 'concluida');
      const res = await fetch('/api/gemini/schedule-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pendingActivities: pending,
          freeHourSlots: draftSettings.freeHourSlots,
          avgDailyScreenHours: draftSettings.avgDailyScreenHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao gerar análise.');
      }
      setAiInsight(data);
    } catch (err: any) {
      setInsightError(err.message || 'Erro ao analisar rotina.');
    } finally {
      setLoadingInsight(false);
    }
  };

  const handleTestNotification = async () => {
    const pendingCount = activities.filter((a) => a.status !== 'concluida').length;
    const msg = `Lembrete SPA: você tem ${pendingCount} atividade(s) pendente(s) no Google Classroom.`;
    if ('Notification' in window && Notification.permission !== 'denied') {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('SPA · Salva Pele do Aluno', { body: msg });
        }
      } catch {
        // fallback to in-app toast
      }
    }
    onTriggerTestNotification(msg);
  };

  const navItems: Array<{ id: SettingsTab; label: string; icon: React.ReactNode }> = [
    { id: 'notifications', label: t.notificationsSection, icon: <Bell className="w-4 h-4" /> },
    { id: 'appearance', label: t.appearanceSection, icon: <Monitor className="w-4 h-4" /> },
    { id: 'profile', label: t.profileSection, icon: <User className="w-4 h-4" /> },
    { id: 'subscription', label: t.subscriptionSection, icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Header (Figma: "salvar e sair" / "sair sem salvar") */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.settingsTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {hasChanges
              ? 'Há alterações pendentes. Clique em “Salvar e sair” para aplicar.'
              : 'Configure notificações inteligentes, acessibilidade, perfil e assinatura.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onExitWithoutSaving}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t.exitWithoutSaving}</span>
          </button>

          <button
            type="button"
            onClick={() => onSaveAndExit(draftProfile, draftSettings)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t.saveAndExit}</span>
          </button>
        </div>
      </div>

      {/* Grouped Settings Layout */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Category Menu */}
        <aside className="lg:col-span-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-lg flex items-center gap-2.5 transition-colors text-left cursor-pointer ${
                activeTab === item.id
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Right Detail Panel */}
        <section className="lg:col-span-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Toggle 1: Notificações ligadas */}
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Notificações e lembretes automáticos
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Envia alertas antes do prazo de entrega das atividades pendentes ou devolvidas.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draftSettings.notificationsEnabled}
                  onClick={() =>
                    setDraftSettings((prev) => ({
                      ...prev,
                      notificationsEnabled: !prev.notificationsEnabled,
                    }))
                  }
                  className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 cursor-pointer ${
                    draftSettings.notificationsEnabled
                      ? 'bg-emerald-600'
                      : 'bg-red-500 dark:bg-red-700'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                      draftSettings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Limites e preferências */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Limite diário de lembretes ({draftSettings.maxNotificationsPerDay}/dia)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={draftSettings.maxNotificationsPerDay}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        maxNotificationsPerDay: Number(e.target.value),
                      })
                    }
                    className="w-full accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Antecedência mínima do prazo
                  </label>
                  <select
                    value={draftSettings.advanceNoticeHours}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        advanceNoticeHours: Number(e.target.value) as 12 | 24 | 48 | 72,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value={12}>12 horas antes</option>
                    <option value={24}>24 horas antes</option>
                    <option value={48}>48 horas antes</option>
                    <option value={72}>72 horas antes</option>
                  </select>
                </div>
              </div>

              {/* Módulo 4B: Dropdown de algoritmo de horas vagas & relatório */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRoutineDropdown((v) => !v)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left cursor-pointer"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Módulo de rotina · Horas vagas e relatório de uso
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Veja com quais dados de horário ocioso o algoritmo decide quando notificar você.
                    </p>
                  </div>
                  {showRoutineDropdown ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>

                {showRoutineDropdown && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-200 dark:border-slate-800 space-y-5">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Tempo médio de uso diário do aparelho
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                          {draftSettings.avgDailyScreenHours.toFixed(1)} h/dia
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        step={0.5}
                        value={draftSettings.avgDailyScreenHours}
                        onChange={(e) =>
                          setDraftSettings({
                            ...draftSettings,
                            avgDailyScreenHours: Number(e.target.value),
                          })
                        }
                        className="w-full accent-blue-600"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Janelas consideradas horas vagas para disparo de lembretes
                      </p>
                      {draftSettings.freeHourSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={slot.enabled}
                              onChange={() => toggleFreeSlot(slot.id)}
                              className="w-4 h-4 accent-blue-600 rounded"
                            />
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {slot.label}
                            </span>
                          </label>
                          <div className="flex items-center gap-3 sm:w-48">
                            <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${slot.idleScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono tabular-nums text-slate-500">
                              {slot.idleScore}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Turmas autorizadas */}
                    {courses.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Turmas autorizadas a emitir notificações
                        </p>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {courses.map((course) => {
                            const active =
                              draftSettings.enabledCourseIds.length === 0 ||
                              draftSettings.enabledCourseIds.includes(course.id);
                            return (
                              <label
                                key={course.id}
                                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={() => toggleCourseNotification(course.id)}
                                  className="w-4 h-4 accent-blue-600 rounded"
                                />
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: course.colorHex }}
                                />
                                <span className="truncate text-slate-800 dark:text-slate-200 font-medium">
                                  {course.name}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Botões de ação do Módulo 4B */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleGenerateInsights}
                        disabled={loadingInsight}
                        className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {loadingInsight
                            ? 'Analisando rotina...'
                            : 'Analisar rotina e gerar plano com IA'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleTestNotification}
                        className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        Testar lembrete agora
                      </button>
                    </div>

                    {insightError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{insightError}</p>
                    )}

                    {aiInsight && (
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                            Janela recomendada: {aiInsight.recommendedWindow}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            Gerado por IA
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {aiInsight.rationale}
                        </p>
                        {aiInsight.dailyPlan.length > 0 && (
                          <div className="space-y-2 pt-1">
                            {aiInsight.dailyPlan.map((step, i) => (
                              <div
                                key={i}
                                className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                              >
                                <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                                  <span>{step.taskTitle}</span>
                                  <span className="font-mono text-blue-600 dark:text-blue-400">
                                    {step.timeSlot}
                                  </span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                                  {step.courseName} · {step.tip}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Aparência, idioma e acessibilidade
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Personalize o contraste, escala de interface e idioma do painel.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Tema do aplicativo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['light', 'dark'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDraftSettings({ ...draftSettings, theme: mode })}
                        className={`px-4 py-2.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                          draftSettings.theme === mode
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {mode === 'light' ? 'Modo Claro' : 'Modo Escuro'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Idioma do sistema
                  </label>
                  <select
                    value={draftSettings.language}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        language: e.target.value as AppLanguage,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Escala de leitura (ui_scale)
                  </label>
                  <select
                    value={draftSettings.uiScale}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        uiScale: e.target.value as UiScale,
                      })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="compact">Compacta (90%)</option>
                    <option value="default">Padrão (100%)</option>
                    <option value="comfortable">Ampliada · Acessibilidade (110%)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Alto contraste
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Reforça bordas e leitura de textos.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={draftSettings.highContrast}
                    onChange={(e) =>
                      setDraftSettings({ ...draftSettings, highContrast: e.target.checked })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span className="text-sm text-slate-800 dark:text-slate-200">
                    Exibir atividades já concluídas na aba “Pendentes” do Dashboard
                  </span>
                  <input
                    type="checkbox"
                    checked={draftSettings.showCompletedOnDashboard}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        showCompletedOnDashboard: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span className="text-sm text-slate-800 dark:text-slate-200">
                    Lista compacta de atividades no Dashboard
                  </span>
                  <input
                    type="checkbox"
                    checked={draftSettings.compactActivityList}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        compactActivityList: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-blue-600"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Dados cadastrais do estudante
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Informações associadas à sua conta Google sincronizada.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onReopenTutorial}
                  className="px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                >
                  Reabrir tutorial inicial
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <ShieldCheck
                  className={`w-5 h-5 shrink-0 ${
                    draftProfile.isEscolaDomain ? 'text-emerald-600' : 'text-blue-600'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {draftProfile.domainLabel}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {draftProfile.email}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nome da conta
                  </label>
                  <input
                    type="text"
                    value={draftProfile.nomeConta}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, nomeConta: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    value={draftProfile.dataNascimento}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, dataNascimento: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Série / Ano
                  </label>
                  <input
                    type="text"
                    value={draftProfile.serie}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, serie: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nível de ensino
                  </label>
                  <input
                    type="text"
                    value={draftProfile.nivelEnsino}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, nivelEnsino: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Instituição de ensino
                  </label>
                  <input
                    type="text"
                    value={draftProfile.escolaNome}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, escolaNome: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp (opcional)
                  </label>
                  <input
                    type="tel"
                    value={draftProfile.telefone}
                    onChange={(e) =>
                      setDraftProfile({ ...draftProfile, telefone: e.target.value })
                    }
                    placeholder="(41) 99999-0000"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Assinatura e plano estudantil
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Contas institucionais (@escola) possuem acesso completo gratuito ao núcleo do sistema.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div
                  onClick={() =>
                    setDraftSettings({ ...draftSettings, subscriptionPlan: 'free-seed' })
                  }
                  className={`p-5 rounded-xl border cursor-pointer transition-colors ${
                    draftSettings.subscriptionPlan === 'free-seed'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Plano Estudante SEED
                    </h3>
                    <span className="text-xs font-mono font-bold text-emerald-600">
                      Gratuito
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    Para estudantes da rede pública e contas individuais.
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li>· Sincronização ilimitada com Google Classroom</li>
                    <li>· Calendário automático por disciplina</li>
                    <li>· Resumos por IA e até 4 lembretes/dia</li>
                  </ul>
                </div>

                <div
                  onClick={() =>
                    setDraftSettings({ ...draftSettings, subscriptionPlan: 'spa-plus' })
                  }
                  className={`p-5 rounded-xl border cursor-pointer transition-colors ${
                    draftSettings.subscriptionPlan === 'spa-plus'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Plano SPA Plus
                    </h3>
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                      R$ 9,90/mês
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    Para estudantes que desejam rotinas avançadas e múltiplos canais.
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li>· Tudo do plano Estudante SEED</li>
                    <li>· Até 10 lembretes diários personalizados</li>
                    <li>· Análise contínua de horas vagas com IA</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
