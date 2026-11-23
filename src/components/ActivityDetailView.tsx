import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Link2,
  Mail,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { AiActivitySummary, ClassroomActivity } from '../types';
import { loadCachedSummary, saveCachedSummary } from '../lib/storage';
import { Translations } from '../lib/i18n';

interface ActivityDetailViewProps {
  activity: ClassroomActivity;
  t: Translations;
  backLabel: string;
  onBack: () => void;
  onOpenCourse: (courseId: string) => void;
}

export const ActivityDetailView: React.FC<ActivityDetailViewProps> = ({
  activity,
  t,
  backLabel,
  onBack,
  onOpenCourse,
}) => {
  const [summary, setSummary] = useState<AiActivitySummary | null>(() =>
    loadCachedSummary(activity.id)
  );
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const generateSummary = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activity.title,
          courseName: activity.courseName,
          description: activity.description,
          dueDateIso: activity.dueDateIso,
          maxPoints: activity.maxPoints,
          materialsCount: activity.materials.length,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar resumo.');
      }
      saveCachedSummary(activity.id, data);
      setSummary(data);
    } catch (err: any) {
      setAiError(err.message || 'Falha ao consultar resumo inteligente.');
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    const cached = loadCachedSummary(activity.id);
    setSummary(cached);
    setCheckedSteps({});
    setAiError(null);
    if (!cached) {
      generateSummary();
    }
  }, [activity.id]);

  const statusBadge = () => {
    switch (activity.status) {
      case 'atrasada':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
            Atrasada
          </span>
        );
      case 'devolvida':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <RotateCcw className="w-4 h-4" />
            Devolvida pelo professor
          </span>
        );
      case 'concluida':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            Concluída / Entregue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Clock className="w-4 h-4" />
            Pendente / Não concluída
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mb-1">
              <button
                type="button"
                onClick={() => onOpenCourse(activity.courseId)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: activity.courseColor }}
                />
                {activity.courseName}
              </button>
              <span className="text-slate-400" aria-hidden="true">
                ·
              </span>
              {statusBadge()}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {activity.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-1">
              {activity.dueDateIso
                ? `Entrega até ${activity.dueDateIso.split('-').reverse().join('/')} às ${
                    activity.dueTimeDisplay || '23:59'
                  }`
                : 'Sem data limite definida'}
              {activity.maxPoints !== undefined && ` · Vale ${activity.maxPoints} pontos`}
            </p>
          </div>
        </div>

        {activity.alternateLink && (
          <a
            href={activity.alternateLink}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>{t.openInClassroom}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* AI Summary Card (Figma: "Descrição da atividade gerada por uma ia que sumariza ela") */}
        <section className="lg:col-span-7 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {t.aiSummaryTitle}
            </h2>
            <button
              type="button"
              onClick={generateSummary}
              disabled={loadingAi}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loadingAi ? 'Gerando...' : 'Atualizar resumo'}
            </button>
          </div>

          {loadingAi && !summary && (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-4/6" />
              <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded-lg mt-4" />
            </div>
          )}

          {aiError && (
            <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300">
              {aiError}
            </div>
          )}

          {summary && (
            <div className="space-y-5">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {summary.summary}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Plano prático em 3 passos
                  </span>
                  <span className="font-mono tabular-nums">
                    Tempo estimado: ~{summary.estimatedMinutes} min
                  </span>
                </div>
                <div className="space-y-2">
                  {summary.checklist.map((step, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(checkedSteps[idx])}
                        onChange={() =>
                          setCheckedSteps((prev) => ({
                            ...prev,
                            [idx]: !prev[idx],
                          }))
                        }
                        className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
                      />
                      <span
                        className={`text-sm ${
                          checkedSteps[idx]
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {step}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                Orientação de prioridade: {summary.priorityNote}
              </p>
            </div>
          )}
        </section>

        {/* Original Instructions, Materials & Teacher Contact */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Instruções originais do professor
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {activity.description?.trim() ||
                'O professor não adicionou texto descritivo além do título da atividade no Google Classroom.'}
            </p>

            {activity.materials.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Materiais anexados ({activity.materials.length})
                </p>
                <div className="space-y-2">
                  {activity.materials.map((mat, i) => (
                    <a
                      key={i}
                      href={mat.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs text-blue-600 dark:text-blue-400"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Link2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{mat.title}</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.teacherContact}
            </h2>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {activity.teacherName || 'Professor responsável'}
            </p>
            {activity.teacherEmail ? (
              <a
                href={`mailto:${activity.teacherEmail}`}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Mail className="w-3.5 h-3.5" />
                {activity.teacherEmail}
              </a>
            ) : (
              <p className="text-xs text-slate-500">
                E-mail não disponibilizado pelo domínio escolar.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
