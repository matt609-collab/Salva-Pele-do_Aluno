import React, { useState } from 'react';
import {
  Bell,
  BookCheck,
  Check,
  ChevronRight,
  Clock,
  GraduationCap,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { AppSettings, ClassroomCourse, StudentProfile } from '../types';

interface OnboardingWizardProps {
  profile: StudentProfile;
  settings: AppSettings;
  courses: ClassroomCourse[];
  onComplete: (updatedProfile: StudentProfile, updatedSettings: AppSettings) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  profile,
  settings,
  courses,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<StudentProfile>(profile);
  const [draftSettings, setDraftSettings] = useState<AppSettings>(() => ({
    ...settings,
    enabledCourseIds:
      settings.enabledCourseIds.length > 0
        ? settings.enabledCourseIds
        : courses.map((c) => c.id),
  }));

  const toggleCourse = (courseId: string) => {
    setDraftSettings((prev) => {
      const exists = prev.enabledCourseIds.includes(courseId);
      return {
        ...prev,
        enabledCourseIds: exists
          ? prev.enabledCourseIds.filter((id) => id !== courseId)
          : [...prev.enabledCourseIds, courseId],
      };
    });
  };

  const toggleSlot = (slotId: string) => {
    setDraftSettings((prev) => ({
      ...prev,
      freeHourSlots: prev.freeHourSlots.map((slot) =>
        slot.id === slotId ? { ...slot, enabled: !slot.enabled } : slot
      ),
    }));
  };

  const handleFinish = () => {
    onComplete(
      {
        ...form,
        onboardingCompleted: true,
      },
      draftSettings
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-auto">
        {/* Progress Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Cadastro e Tutorial Inicial
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Passo {step} de 3 · Construindo seu Dashboard e Calendário
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs tabular-nums">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`w-7 h-7 rounded-md flex items-center justify-center font-semibold ${
                  n === step
                    ? 'bg-blue-600 text-white'
                    : n < step
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {n < step ? <Check className="w-3.5 h-3.5" /> : n}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <ShieldCheck
                  className={`w-5 h-5 mt-0.5 shrink-0 ${
                    form.isEscolaDomain ? 'text-emerald-600' : 'text-blue-600'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {form.domainLabel}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    Conta vinculada: {form.email}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Nome completo do estudante
                  </label>
                  <input
                    type="text"
                    value={form.nomeConta}
                    onChange={(e) => setForm({ ...form, nomeConta: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Data de nascimento
                  </label>
                  <input
                    type="date"
                    value={form.dataNascimento}
                    onChange={(e) =>
                      setForm({ ...form, dataNascimento: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Série / Turma
                  </label>
                  <select
                    value={form.serie}
                    onChange={(e) => setForm({ ...form, serie: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="9º Ano - Ensino Fundamental">9º Ano - Ensino Fundamental</option>
                    <option value="1º Ano - Ensino Médio">1º Ano - Ensino Médio</option>
                    <option value="2º Ano - Ensino Médio">2º Ano - Ensino Médio</option>
                    <option value="3º Ano - Ensino Médio">3º Ano - Ensino Médio</option>
                    <option value="Ensino Técnico Integrado">Ensino Técnico Integrado</option>
                    <option value="Ensino Superior">Ensino Superior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Nível de ensino
                  </label>
                  <select
                    value={form.nivelEnsino}
                    onChange={(e) =>
                      setForm({ ...form, nivelEnsino: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Ensino Fundamental II">Ensino Fundamental II</option>
                    <option value="Ensino Médio">Ensino Médio</option>
                    <option value="Ensino Médio / Técnico">Ensino Médio / Técnico</option>
                    <option value="Graduação / Faculdade">Graduação / Faculdade</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Instituição / Colégio
                  </label>
                  <input
                    type="text"
                    value={form.escolaNome}
                    onChange={(e) => setForm({ ...form, escolaNome: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Ex: Colégio Estadual Dom Pedro I"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <BookCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Selecione as turmas para monitorar no Dashboard e Calendário
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Encontramos {courses.length} turma(s) ativa(s) no seu Google Classroom.
                  </p>
                </div>
              </div>

              {courses.length === 0 ? (
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-600 dark:text-slate-400">
                  Nenhuma turma ativa encontrada ainda nesta conta Google. Você poderá sincronizar novamente ou adicionar lembretes manuais diretamente no Calendário.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto spa-scroll space-y-2 pr-1">
                  {courses.map((course) => {
                    const checked =
                      draftSettings.enabledCourseIds.length === 0 ||
                      draftSettings.enabledCourseIds.includes(course.id);
                    return (
                      <label
                        key={course.id}
                        className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:border-blue-400 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleCourse(course.id)}
                            className="w-4 h-4 accent-blue-600 rounded"
                          />
                          <span
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{ backgroundColor: course.colorHex }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {course.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {course.teachers[0]?.name || 'Professor'} ·{' '}
                              {course.pendingCount + course.overdueCount + course.returnedCount}{' '}
                              pendência(s)
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Defina suas horas vagas para lembretes inteligentes
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    O SPA prioriza enviar lembretes nos horários em que você costuma estar livre.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {draftSettings.freeHourSlots.map((slot) => (
                  <label
                    key={slot.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={() => toggleSlot(slot.id)}
                        className="w-4 h-4 accent-blue-600 rounded"
                      />
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {slot.label}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                      Disponibilidade {slot.idleScore}%
                    </span>
                  </label>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Máximo de notificações por dia
                  </label>
                  <select
                    value={draftSettings.maxNotificationsPerDay}
                    onChange={(e) =>
                      setDraftSettings({
                        ...draftSettings,
                        maxNotificationsPerDay: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    {[2, 3, 4, 6, 8].map((n) => (
                      <option key={n} value={n}>
                        Até {n} lembretes/dia
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Antecedência antes do prazo
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
                    <option value={24}>24 horas antes (1 dia)</option>
                    <option value={48}>48 horas antes (2 dias)</option>
                    <option value={72}>72 horas antes (3 dias)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Voltar
            </button>
          ) : (
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              Perfil salvo por conta Google
            </span>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev === 1 ? 2 : 3))}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continuar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Construir meu painel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
