import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Mail,
  Megaphone,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  AppSettings,
  ClassroomActivity,
  ClassroomAnnouncement,
  ClassroomCourse,
} from '../types';
import { Translations } from '../lib/i18n';

interface DashboardViewProps {
  courses: ClassroomCourse[];
  activities: ClassroomActivity[];
  announcements: ClassroomAnnouncement[];
  settings: AppSettings;
  isLoading: boolean;
  t: Translations;
  onSelectCourse: (courseId: string) => void;
  onSelectActivity: (activityId: string) => void;
  onGoCalendar: () => void;
  onSync: () => void;
}

type TaskFilter = 'pending' | 'returned' | 'all';

function formatRelativeDue(activity: ClassroomActivity): string {
  if (!activity.dueDateIso) return 'Sem prazo definido';
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const [y, m, d] = activity.dueDateIso.split('-');
  const timeSuffix = activity.dueTimeDisplay ? ` · ${activity.dueTimeDisplay}` : '';

  if (activity.dueDateIso === todayIso) return `Vence hoje${timeSuffix}`;
  if (activity.dueDateIso === tomorrowIso) return `Vence amanhã${timeSuffix}`;
  return `${d}/${m}/${y}${timeSuffix}`;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  courses,
  activities,
  announcements,
  settings,
  isLoading,
  t,
  onSelectCourse,
  onSelectActivity,
  onGoCalendar,
  onSync,
}) => {
  const [filter, setFilter] = useState<TaskFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [mainTab, setMainTab] = useState<'courses' | 'timeline'>('courses');

  const enabledCourseSet = useMemo(() => {
    if (!settings.enabledCourseIds || settings.enabledCourseIds.length === 0) {
      return null;
    }
    return new Set(settings.enabledCourseIds);
  }, [settings.enabledCourseIds]);

  const visibleCourses = useMemo(() => {
    if (!enabledCourseSet) return courses;
    const filtered = courses.filter((c) => enabledCourseSet.has(c.id));
    return filtered.length > 0 ? filtered : courses;
  }, [courses, enabledCourseSet]);

  const counts = useMemo(() => {
    let pending = 0;
    let overdue = 0;
    let returned = 0;
    let completed = 0;

    for (const a of activities) {
      if (a.status === 'pendente') pending += 1;
      else if (a.status === 'atrasada') overdue += 1;
      else if (a.status === 'devolvida') returned += 1;
      else if (a.status === 'concluida') completed += 1;
    }

    return { pending, overdue, returned, completed };
  }, [activities]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activities.filter((act) => {
      if (enabledCourseSet && !enabledCourseSet.has(act.courseId)) {
        // Keep overdue/returned visible, or filter softly if user customized courses
      }
      if (filter === 'pending') {
        if (act.status === 'concluida' && !settings.showCompletedOnDashboard) {
          return false;
        }
        if (act.status !== 'pendente' && act.status !== 'atrasada' && act.status !== 'devolvida') {
          if (!settings.showCompletedOnDashboard) return false;
        }
      } else if (filter === 'returned') {
        if (act.status !== 'devolvida') return false;
      }

      if (q) {
        const hay = `${act.title} ${act.courseName} ${act.teacherName || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [activities, filter, searchQuery, settings.showCompletedOnDashboard, enabledCourseSet]);

  const renderStatusMeta = (status: ClassroomActivity['status']) => {
    switch (status) {
      case 'atrasada':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Atrasada
          </span>
        );
      case 'devolvida':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <RotateCcw className="w-3.5 h-3.5" />
            Devolvida
          </span>
        );
      case 'concluida':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Entregue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Clock className="w-3.5 h-3.5" />
            Não concluída
          </span>
        );
    }
  };

  if (isLoading && courses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse p-5"
            />
          ))}
        </div>
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
          <div className="lg:col-span-7 h-96 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview Strip */}
      <section aria-label="Resumo acadêmico" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Pendentes no prazo
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {counts.pending}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Atrasadas
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
            {counts.overdue}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Devolvidas p/ revisão
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {counts.returned}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Turmas ativas
          </p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {courses.length}
          </p>
        </div>
      </section>

      {/* Main Two-Column Figma Workspace */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tarefas que estão perto de vencer */}
        <section className="lg:col-span-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t.pendingTasksTitle}
              </h2>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {filteredTasks.length} item(ns)
              </span>
            </div>

            {/* Segmented Filter Controls */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {(
                [
                  { id: 'pending', label: 'Pendentes' },
                  { id: 'returned', label: 'Devolvidas' },
                  { id: 'all', label: 'Todas' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    filter === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por atividade ou matéria..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="max-h-[540px] overflow-y-auto spa-scroll divide-y divide-slate-200 dark:divide-slate-800">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t.noPendingTasks}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Você pode alternar o filtro para “Todas” ou sincronizar novamente com o Google Classroom.
                </p>
                <button
                  type="button"
                  onClick={onSync}
                  className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                >
                  Atualizar agora
                </button>
              </div>
            ) : (
              filteredTasks.map((act) => (
                <div
                  key={`${act.courseId}-${act.id}`}
                  className={`${
                    settings.compactActivityList ? 'p-3.5' : 'p-4'
                  } hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-3`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: act.courseColor }}
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[160px]">
                        {act.courseName}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                        ·
                      </span>
                      {renderStatusMeta(act.status)}
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectActivity(act.id)}
                      className="text-left text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer"
                    >
                      {act.title}
                    </button>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-1">
                      {formatRelativeDue(act)}
                      {act.maxPoints !== undefined && ` · ${act.maxPoints} pts`}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectActivity(act.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.viewDetails}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right/Center Column: Turmas e Cronograma */}
        <section className="lg:col-span-7 space-y-6">
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.coursesTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clique em “Detalhes” para ver atividades do ano, colegas e contato do professor.
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMainTab('courses')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    mainTab === 'courses'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Turmas ({visibleCourses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMainTab('timeline')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    mainTab === 'timeline'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Mural & Cronograma ({announcements.length})
                </button>
              </div>
            </div>

            {mainTab === 'courses' ? (
              visibleCourses.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nenhuma turma ativa encontrada nesta conta do Google Classroom.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Verifique se você entrou com a conta escolar (@escola) ou conta Google em que está matriculado nas disciplinas.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {visibleCourses.map((course) => {
                    const totalPending =
                      course.pendingCount + course.overdueCount + course.returnedCount;
                    const primaryTeacher = course.teachers[0];

                    return (
                      <div
                        key={course.id}
                        className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-sm shrink-0"
                              style={{ backgroundColor: course.colorHex }}
                            />
                            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                              {course.name}
                            </h3>
                            {course.section && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                · {course.section}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <span>
                              Professor(a):{' '}
                              <strong className="font-medium text-slate-800 dark:text-slate-200">
                                {primaryTeacher?.name || 'Não informado'}
                              </strong>
                            </span>
                            {primaryTeacher?.email && (
                              <>
                                <span aria-hidden="true">·</span>
                                <a
                                  href={`mailto:${primaryTeacher.email}`}
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <Mail className="w-3 h-3" />
                                  {primaryTeacher.email}
                                </a>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono tabular-nums pt-0.5">
                            <span
                              className={
                                totalPending > 0
                                  ? 'text-amber-700 dark:text-amber-400 font-semibold'
                                  : 'text-emerald-700 dark:text-emerald-400 font-medium'
                              }
                            >
                              {totalPending > 0
                                ? `${totalPending} pendência(s)`
                                : 'Sem pendências'}
                            </span>
                            <span className="text-slate-400" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {course.totalActivities} atividade(s) no ano
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {course.alternateLink && (
                            <a
                              href={course.alternateLink}
                              target="_blank"
                              rel="noreferrer"
                              title="Abrir turma no Google Classroom"
                              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => onSelectCourse(course.id)}
                            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                          >
                            <span>{t.details}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[480px] overflow-y-auto spa-scroll">
                {announcements.length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhum aviso recente publicado no mural das suas turmas.
                  </div>
                ) : (
                  announcements.map((ann) => (
                    <div key={ann.id} className="p-5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Megaphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          {ann.courseName}
                        </span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {ann.dateIso.split('-').reverse().join('/')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {ann.text || 'Aviso sem texto.'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Publicado por {ann.creatorName || 'Professor(a)'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Jump to Calendar */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Visualizar entregas no Calendário
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Veja todas as datas de entrega marcadas automaticamente por cor de disciplina.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoCalendar}
              className="px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Abrir {t.navCalendar}</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
