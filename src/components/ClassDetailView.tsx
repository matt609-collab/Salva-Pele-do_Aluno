import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  RotateCcw,
  Users,
} from 'lucide-react';
import { ClassroomActivity, ClassroomCourse } from '../types';
import { Translations } from '../lib/i18n';

interface ClassDetailViewProps {
  course: ClassroomCourse;
  activities: ClassroomActivity[];
  t: Translations;
  backLabel: string;
  onBack: () => void;
  onSelectActivity: (activityId: string) => void;
}

export const ClassDetailView: React.FC<ClassDetailViewProps> = ({
  course,
  activities,
  t,
  backLabel,
  onBack,
  onSelectActivity,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const courseActivities = useMemo(() => {
    return activities.filter((a) => {
      if (a.courseId !== course.id) return false;
      if (filter === 'pending') return a.status !== 'concluida';
      if (filter === 'done') return a.status === 'concluida';
      return true;
    });
  }, [activities, course.id, filter]);

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch {
      // ignore clipboard restriction
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{backLabel}</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span
                className="w-3.5 h-3.5 rounded-sm shrink-0"
                style={{ backgroundColor: course.colorHex }}
              />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                {course.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {[course.section, course.room, `${course.totalActivities} atividades no ano`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        {course.alternateLink && (
          <a
            href={course.alternateLink}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>{t.openInClassroom}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Main Content Grid (Matching Figma: Activities list left, Classmates right, Teacher contact bottom) */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Atividades ao longo do ano */}
        <section className="lg:col-span-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t.yearlyActivities}
            </h2>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {(
                [
                  { id: 'all', label: 'Todas' },
                  { id: 'pending', label: 'Pendentes' },
                  { id: 'done', label: 'Concluídas' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    filter === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[440px] overflow-y-auto spa-scroll divide-y divide-slate-200 dark:divide-slate-800">
            {courseActivities.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma atividade encontrada neste filtro.
              </div>
            ) : (
              courseActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      {act.status === 'concluida' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Concluída
                        </span>
                      ) : act.status === 'devolvida' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400">
                          <RotateCcw className="w-3.5 h-3.5" />
                          Devolvida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                          <Clock className="w-3.5 h-3.5" />
                          {act.status === 'atrasada' ? 'Atrasada' : 'Pendente'}
                        </span>
                      )}
                      {act.dueDateIso && (
                        <>
                          <span className="text-slate-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            Prazo: {act.dueDateIso.split('-').reverse().join('/')}
                            {act.dueTimeDisplay ? ` ${act.dueTimeDisplay}` : ''}
                          </span>
                        </>
                      )}
                      {act.assignedGrade !== undefined && (
                        <>
                          <span className="text-slate-400" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
                            Nota: {act.assignedGrade}/{act.maxPoints ?? 100}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {act.title}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectActivity(act.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.viewDetails}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Colegas da turma (Scrollable) */}
        <aside className="lg:col-span-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              {t.classmates}
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {course.students.length}
            </span>
          </div>

          <div className="max-h-[440px] overflow-y-auto spa-scroll divide-y divide-slate-200 dark:divide-slate-800">
            {course.rosterRestricted ? (
              <div className="p-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                A lista completa de colegas é restrita pelas políticas de privacidade do domínio escolar desta turma no Google Classroom.
              </div>
            ) : course.students.length === 0 ? (
              <div className="p-5 text-xs text-slate-500 dark:text-slate-400">
                Nenhum colega visível nesta turma.
              </div>
            ) : (
              course.students.map((student) => (
                <div key={student.userId || student.name} className="p-3.5 flex items-center gap-3">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {student.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {student.name}
                    </p>
                    {student.email && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {student.email}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Professor e meios de contato */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
          {t.teacherContact}
        </h2>
        {course.teachers.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Informações de contato do professor não disponibilizadas pelo Classroom.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.teachers.map((teacher) => (
              <div
                key={teacher.userId || teacher.name}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {teacher.photoUrl ? (
                    <img
                      src={teacher.photoUrl}
                      alt={teacher.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {teacher.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {teacher.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {teacher.email || 'E-mail restrito pelo domínio'}
                    </p>
                  </div>
                </div>

                {teacher.email && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyEmail(teacher.email!)}
                      title="Copiar e-mail"
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {copiedEmail === teacher.email ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`mailto:${teacher.email}`}
                      title="Enviar e-mail"
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
