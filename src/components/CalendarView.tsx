import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Megaphone,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  ClassroomActivity,
  ClassroomAnnouncement,
  ClassroomCourse,
  CustomCalendarEvent,
} from '../types';
import { Translations } from '../lib/i18n';

interface CalendarViewProps {
  courses: ClassroomCourse[];
  activities: ClassroomActivity[];
  announcements: ClassroomAnnouncement[];
  customEvents: CustomCalendarEvent[];
  t: Translations;
  onSelectActivity: (activityId: string) => void;
  onSelectCourse: (courseId: string) => void;
  onAddCustomEvent: (event: CustomCalendarEvent) => void;
  onDeleteCustomEvent: (eventId: string) => void;
}

const WEEKDAYS_PT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function toDateIso(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatSelectedDayLabel(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  courses,
  activities,
  announcements,
  customEvents,
  t,
  onSelectActivity,
  onSelectCourse,
  onAddCustomEvent,
  onDeleteCustomEvent,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayIso = toDateIso(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDateIso, setSelectedDateIso] = useState(todayIso);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('14:00');
  const [newCourseId, setNewCourseId] = useState(courses[0]?.id || '');
  const [newRole, setNewRole] = useState<'aluno' | 'professor'>('aluno');
  const [newNotes, setNewNotes] = useState('');

  // Index items by dateIso
  const itemsByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        activities: ClassroomActivity[];
        announcements: ClassroomAnnouncement[];
        custom: CustomCalendarEvent[];
      }
    >();

    const ensure = (iso: string) => {
      if (!map.has(iso)) {
        map.set(iso, { activities: [], announcements: [], custom: [] });
      }
      return map.get(iso)!;
    };

    for (const act of activities) {
      if (act.dueDateIso) {
        ensure(act.dueDateIso).activities.push(act);
      }
    }
    for (const ann of announcements) {
      if (ann.dateIso) {
        ensure(ann.dateIso).announcements.push(ann);
      }
    }
    for (const ev of customEvents) {
      if (ev.dateIso) {
        ensure(ev.dateIso).custom.push(ev);
      }
    }
    return map;
  }, [activities, announcements, customEvents]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateIso: string | null }> = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ day: null, dateIso: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, dateIso: toDateIso(viewYear, viewMonth, d) });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateIso: null });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateIso(todayIso);
  };

  const selectedDayData = itemsByDate.get(selectedDateIso) || {
    activities: [],
    announcements: [],
    custom: [],
  };

  const handleSaveCustomEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const matchedCourse = courses.find((c) => c.id === newCourseId);
    onAddCustomEvent({
      id: `custom_${Date.now()}`,
      title: newTitle.trim(),
      dateIso: selectedDateIso,
      timeDisplay: newTime,
      courseId: matchedCourse?.id,
      courseName: matchedCourse?.name || 'Lembrete Pessoal',
      colorHex: matchedCourse?.colorHex || '#059669',
      notes: newNotes.trim() || undefined,
      createdByRole: newRole,
    });
    setNewTitle('');
    setNewNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {t.calendarTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cada cor representa uma turma do Google Classroom. Clique em um dia para inspecionar entregas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={goToday}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {t.today}
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar lembrete / evento</span>
          </button>
        </div>
      </div>

      {/* Main Calendar + Day Detail Split (Matching Figma Prototype) */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid */}
        <section className="lg:col-span-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {MONTHS_PT[viewMonth]} {viewYear}
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="Mês anterior"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="Próximo mês"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS_PT.map((wd) => (
              <div
                key={wd}
                className="text-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell.day || !cell.dateIso) {
                return <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-lg bg-slate-50/50 dark:bg-slate-950/30" />;
              }

              const dayItems = itemsByDate.get(cell.dateIso);
              const isSelected = cell.dateIso === selectedDateIso;
              const isToday = cell.dateIso === todayIso;

              const dots: Array<{ color: string; label: string }> = [];
              if (dayItems) {
                for (const a of dayItems.activities) {
                  dots.push({ color: a.courseColor, label: a.title });
                }
                for (const c of dayItems.custom) {
                  dots.push({ color: c.colorHex, label: c.title });
                }
                for (const ann of dayItems.announcements) {
                  dots.push({ color: ann.courseColor, label: ann.courseName });
                }
              }

              return (
                <button
                  key={cell.dateIso}
                  type="button"
                  onClick={() => setSelectedDateIso(cell.dateIso!)}
                  className={`h-16 sm:h-20 p-2 rounded-lg border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono tabular-nums font-semibold ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dots.length > 0 && (
                      <span className="text-[10px] font-mono tabular-nums text-slate-400">
                        {dots.length}
                      </span>
                    )}
                  </div>

                  {dots.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-auto">
                      {dots.slice(0, 4).map((dot, dIdx) => (
                        <span
                          key={dIdx}
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: dot.color }}
                          title={dot.label}
                        />
                      ))}
                      {dots.length > 4 && (
                        <span className="text-[10px] font-mono text-slate-500">
                          +{dots.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Course Color Legend */}
          {courses.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-2">
              {courses.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.colorHex }}
                  />
                  <span className="truncate max-w-[160px]">{c.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Panel: Selected Day Details (Matching Figma) */}
        <aside className="lg:col-span-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                {formatSelectedDayLabel(selectedDateIso)}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {selectedDayData.activities.length +
                  selectedDayData.custom.length +
                  selectedDayData.announcements.length}{' '}
                compromisso(s) neste dia
              </p>
            </div>
          </div>

          <div className="p-5 space-y-4 max-h-[540px] overflow-y-auto spa-scroll">
            {selectedDayData.activities.length === 0 &&
            selectedDayData.custom.length === 0 &&
            selectedDayData.announcements.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nenhuma entrega ou evento marcado para este dia.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                >
                  Adicionar lembrete para esta data
                </button>
              </div>
            ) : (
              <>
                {selectedDayData.activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: act.courseColor }}
                        />
                        {act.courseName}
                      </span>

                      {act.status === 'atrasada' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Atrasada
                        </span>
                      ) : act.status === 'devolvida' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <RotateCcw className="w-3.5 h-3.5" />
                          Devolvida
                        </span>
                      ) : act.status === 'concluida' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Entregue
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          <Clock className="w-3.5 h-3.5" />
                          Encerra neste dia
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {act.title}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        Prazo: {act.dueTimeDisplay || '23:59'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectCourse(act.courseId)}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                        >
                          Ver turma
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectActivity(act.id)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 rounded-md hover:bg-slate-800 dark:hover:bg-blue-700 cursor-pointer"
                        >
                          {t.details}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {selectedDayData.custom.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: ev.colorHex }}
                        />
                        {ev.courseName} ·{' '}
                        {ev.createdByRole === 'professor' ? 'Agendado por professor' : 'Lembrete do aluno'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteCustomEvent(ev.id)}
                        title="Remover lembrete"
                        className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {ev.title}
                    </p>
                    {ev.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">{ev.notes}</p>
                    )}
                    {ev.timeDisplay && (
                      <p className="text-xs font-mono tabular-nums text-slate-500">
                        Horário: {ev.timeDisplay}
                      </p>
                    )}
                  </div>
                ))}

                {selectedDayData.announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                        <Megaphone className="w-3.5 h-3.5 text-blue-600" />
                        Mural · {ann.courseName}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectCourse(ann.courseId)}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                      >
                        Ver turma
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
                      {ann.text}
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Modal: Agendar evento / lembrete (Aluno ou Professor) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Agendar lembrete em {selectedDateIso.split('-').reverse().join('/')}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Título da atividade, prova ou palestra
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Revisão para prova / Palestra no auditório"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Perfil de origem
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as 'aluno' | 'professor')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="aluno">Aluno (Estudo)</option>
                    <option value="professor">Professor (Evento)</option>
                  </select>
                </div>
              </div>

              {courses.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Vincular à turma
                  </label>
                  <select
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  >
                    <option value="">Lembrete geral</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detalhes ou material para levar..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
                >
                  Salvar no calendário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
