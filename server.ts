import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

const COURSE_PALETTE = [
  '#2563EB', // Cobalt Blue
  '#DC2626', // Crimson Red
  '#7C3AED', // Violet
  '#059669', // Emerald
  '#D97706', // Amber
  '#0891B2', // Cyan
  '#DB2777', // Rose
  '#4F46E5', // Indigo
];

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no servidor.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function fetchGoogleJson<T>(url: string, accessToken: string): Promise<{ ok: boolean; status: number; data?: T; errorText?: string }> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    return { ok: false, status: res.status, errorText };
  }

  const data = (await res.json()) as T;
  return { ok: true, status: res.status, data };
}

function formatDueDate(
  dueDate?: { year?: number; month?: number; day?: number },
  dueTime?: { hours?: number; minutes?: number }
): { dueDateIso?: string; dueTimeDisplay?: string; dueTimestamp?: number } {
  if (!dueDate?.year || !dueDate?.month || !dueDate?.day) {
    return {};
  }
  const yyyy = String(dueDate.year).padStart(4, '0');
  const mm = String(dueDate.month).padStart(2, '0');
  const dd = String(dueDate.day).padStart(2, '0');
  const dueDateIso = `${yyyy}-${mm}-${dd}`;

  if (dueTime && (dueTime.hours !== undefined || dueTime.minutes !== undefined)) {
    const utcDate = new Date(
      Date.UTC(
        dueDate.year,
        dueDate.month - 1,
        dueDate.day,
        dueTime.hours ?? 23,
        dueTime.minutes ?? 59
      )
    );
    const localHours = String(utcDate.getHours()).padStart(2, '0');
    const localMinutes = String(utcDate.getMinutes()).padStart(2, '0');
    return {
      dueDateIso,
      dueTimeDisplay: `${localHours}:${localMinutes}`,
      dueTimestamp: utcDate.getTime(),
    };
  }

  const endOfDay = new Date(dueDate.year, dueDate.month - 1, dueDate.day, 23, 59, 59);
  return {
    dueDateIso,
    dueTimeDisplay: '23:59',
    dueTimestamp: endOfDay.getTime(),
  };
}

function extractMaterials(rawMaterials?: any[]): Array<{
  title: string;
  url?: string;
  type: 'link' | 'drive' | 'youtube' | 'form';
}> {
  if (!Array.isArray(rawMaterials)) return [];
  const items: Array<{
    title: string;
    url?: string;
    type: 'link' | 'drive' | 'youtube' | 'form';
  }> = [];

  for (const m of rawMaterials) {
    if (m?.driveFile?.driveFile) {
      items.push({
        title: m.driveFile.driveFile.title || 'Arquivo no Google Drive',
        url: m.driveFile.driveFile.alternateLink,
        type: 'drive',
      });
    } else if (m?.youtubeVideo) {
      items.push({
        title: m.youtubeVideo.title || 'Vídeo do YouTube',
        url: m.youtubeVideo.alternateLink,
        type: 'youtube',
      });
    } else if (m?.link) {
      items.push({
        title: m.link.title || m.link.url || 'Link externo',
        url: m.link.url,
        type: 'link',
      });
    } else if (m?.form) {
      items.push({
        title: m.form.title || 'Formulário Google',
        url: m.form.formUrl,
        type: 'form',
      });
    }
  }
  return items;
}

// Endpoint principal: sincroniza turmas, atividades, submissões, professores, colegas e mural do Google Classroom
app.get('/api/classroom/sync', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token do Google Classroom ausente.' });
    return;
  }

  const accessToken = authHeader.slice(7).trim();
  if (!accessToken) {
    res.status(401).json({ error: 'Token do Google Classroom inválido.' });
    return;
  }

  try {
    // 1. Lista todas as turmas vinculadas à conta (como aluno ou professor, ativas ou recém-criadas)
    const coursesResp = await fetchGoogleJson<{ courses?: any[] }>(
      'https://classroom.googleapis.com/v1/courses?pageSize=50',
      accessToken
    );

    if (coursesResp.status === 401) {
      res.status(401).json({
        error: 'Sua sessão do Google Classroom expirou. Faça login novamente para atualizar.',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    if (!coursesResp.ok) {
      res.status(coursesResp.status).json({
        error: `Erro ao consultar turmas no Google Classroom (${coursesResp.status}).`,
        details: coursesResp.errorText,
      });
      return;
    }

    const rawCourses = (coursesResp.data?.courses ?? []).filter(
      (c) => c.courseState !== 'ARCHIVED' && c.courseState !== 'DECLINED'
    );

    const nowMs = Date.now();
    const allActivities: any[] = [];
    const allAnnouncements: any[] = [];

    const hydratedCourses = await Promise.all(
      rawCourses.map(async (course, index) => {
        const courseId = String(course.id);
        const colorHex = COURSE_PALETTE[index % COURSE_PALETTE.length];

        const [cwRes, subRes, teachRes, studRes, annRes] = await Promise.all([
          fetchGoogleJson<{ courseWork?: any[] }>(
            `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork?orderBy=dueDate%20asc&pageSize=50`,
            accessToken
          ),
          fetchGoogleJson<{ studentSubmissions?: any[] }>(
            `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/courseWork/-/studentSubmissions?userId=me&pageSize=100`,
            accessToken
          ),
          fetchGoogleJson<{ teachers?: any[] }>(
            `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/teachers?pageSize=20`,
            accessToken
          ),
          fetchGoogleJson<{ students?: any[] }>(
            `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/students?pageSize=60`,
            accessToken
          ),
          fetchGoogleJson<{ announcements?: any[] }>(
            `https://classroom.googleapis.com/v1/courses/${encodeURIComponent(courseId)}/announcements?pageSize=15`,
            accessToken
          ),
        ]);

        const teachers = (teachRes.ok ? teachRes.data?.teachers ?? [] : []).map((t) => ({
          userId: String(t.userId || ''),
          name: t.profile?.name?.fullName || 'Professor(a)',
          email: t.profile?.emailAddress,
          photoUrl: t.profile?.photoUrl
            ? t.profile.photoUrl.startsWith('//')
              ? `https:${t.profile.photoUrl}`
              : t.profile.photoUrl
            : undefined,
        }));

        const rosterRestricted = !studRes.ok && (studRes.status === 403 || studRes.status === 404);
        const students = (studRes.ok ? studRes.data?.students ?? [] : []).map((s) => ({
          userId: String(s.userId || ''),
          name: s.profile?.name?.fullName || 'Estudante',
          email: s.profile?.emailAddress,
          photoUrl: s.profile?.photoUrl
            ? s.profile.photoUrl.startsWith('//')
              ? `https:${s.profile.photoUrl}`
              : s.profile.photoUrl
            : undefined,
        }));

        const submissionByWorkId = new Map<string, any>();
        for (const sub of subRes.ok ? subRes.data?.studentSubmissions ?? [] : []) {
          if (sub.courseWorkId) {
            submissionByWorkId.set(String(sub.courseWorkId), sub);
          }
        }

        const primaryTeacher = teachers[0];
        const courseWorkList = cwRes.ok ? cwRes.data?.courseWork ?? [] : [];

        let pendingCount = 0;
        let returnedCount = 0;
        let overdueCount = 0;

        for (const cw of courseWorkList) {
          const cwId = String(cw.id);
          const sub = submissionByWorkId.get(cwId);
          const subState: string = sub?.state || 'NEW';
          const { dueDateIso, dueTimeDisplay, dueTimestamp } = formatDueDate(
            cw.dueDate,
            cw.dueTime
          );

          let status: 'pendente' | 'atrasada' | 'devolvida' | 'concluida' = 'pendente';

          if (subState === 'TURNED_IN') {
            status = 'concluida';
          } else if (subState === 'RETURNED') {
            if (sub?.assignedGrade !== undefined && sub?.assignedGrade !== null) {
              status = 'concluida';
            } else {
              status = 'devolvida';
              returnedCount += 1;
            }
          } else {
            if (dueTimestamp && dueTimestamp < nowMs) {
              status = 'atrasada';
              overdueCount += 1;
            } else {
              status = 'pendente';
              pendingCount += 1;
            }
          }

          allActivities.push({
            id: cwId,
            courseId,
            courseName: course.name || 'Turma sem nome',
            courseColor: colorHex,
            title: cw.title || 'Atividade sem título',
            description: cw.description || '',
            workType: cw.workType || 'ASSIGNMENT',
            state: cw.state,
            dueDateIso,
            dueTimeDisplay,
            dueTimestamp,
            creationTime: cw.creationTime,
            maxPoints: cw.maxPoints,
            assignedGrade: sub?.assignedGrade,
            submissionState: subState,
            late: Boolean(sub?.late),
            status,
            alternateLink: cw.alternateLink,
            materials: extractMaterials(cw.materials),
            teacherEmail: primaryTeacher?.email,
            teacherName: primaryTeacher?.name,
          });
        }

        const announcementsList = annRes.ok ? annRes.data?.announcements ?? [] : [];
        for (const ann of announcementsList) {
          const created = ann.creationTime || new Date().toISOString();
          const dateIso = created.slice(0, 10);
          const creator = teachers.find((t) => t.userId === ann.creatorUserId);
          allAnnouncements.push({
            id: String(ann.id),
            courseId,
            courseName: course.name || 'Turma',
            courseColor: colorHex,
            text: ann.text || '',
            creationTime: created,
            dateIso,
            alternateLink: ann.alternateLink,
            creatorName: creator?.name || primaryTeacher?.name || 'Professor(a)',
          });
        }

        return {
          id: courseId,
          name: course.name || 'Turma sem nome',
          section: course.section || '',
          room: course.room || '',
          descriptionHeading: course.descriptionHeading || '',
          alternateLink: course.alternateLink,
          courseState: course.courseState,
          colorHex,
          teachers,
          students,
          rosterRestricted,
          pendingCount,
          returnedCount,
          overdueCount,
          totalActivities: courseWorkList.length,
        };
      })
    );

    // Ordenar atividades: atrasadas e com prazo próximo primeiro
    allActivities.sort((a, b) => {
      const aDone = a.status === 'concluida' ? 1 : 0;
      const bDone = b.status === 'concluida' ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;
      if (a.dueTimestamp && b.dueTimestamp) return a.dueTimestamp - b.dueTimestamp;
      if (a.dueTimestamp) return -1;
      if (b.dueTimestamp) return 1;
      return 0;
    });

    res.json({
      syncedAt: new Date().toISOString(),
      courses: hydratedCourses,
      activities: allActivities,
      announcements: allAnnouncements,
    });
  } catch (err: any) {
    console.error('Erro na sincronização do Classroom:', err);
    res.status(500).json({
      error: err?.message || 'Falha interna ao sincronizar com o Google Classroom.',
    });
  }
});

// Endpoint Gemini: Sumariza uma atividade do Classroom para o aluno
app.post('/api/gemini/summarize', async (req, res) => {
  const { title, courseName, description, dueDateIso, maxPoints, materialsCount } = req.body ?? {};
  if (!title) {
    res.status(400).json({ error: 'Título da atividade é obrigatório.' });
    return;
  }

  try {
    const ai = getAiClient();
    const prompt = `Você é um assistente acadêmico para estudantes brasileiros do Ensino Médio e Técnico.
Analise os dados desta atividade do Google Classroom e gere um resumo claro, prático e objetivo em Português (BR).

Dados da atividade:
- Turma: ${courseName || 'Não informada'}
- Título: ${title}
- Prazo: ${dueDateIso || 'Sem data de entrega definida'}
- Pontuação máxima: ${maxPoints ?? 'Não informada'}
- Materiais anexados: ${materialsCount ?? 0}
- Descrição original: ${description || 'O professor não adicionou descrição detalhada além do título.'}

Retorne um JSON estruturado com:
- summary: resumo direto em 2 a 3 frases explicando o que o aluno precisa fazer.
- checklist: lista com exatamente 3 passos curtos e práticos para concluir e entregar sem esquecer nada.
- estimatedMinutes: número inteiro estimado de minutos para realizar a tarefa.
- priorityNote: frase curta de orientação sobre urgência ou dica de estudo.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            checklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            estimatedMinutes: { type: Type.INTEGER },
            priorityNote: { type: Type.STRING },
          },
          required: ['summary', 'checklist', 'estimatedMinutes', 'priorityNote'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({
      summary: parsed.summary || 'Revise as instruções no Google Classroom e organize sua entrega.',
      checklist: Array.isArray(parsed.checklist) && parsed.checklist.length > 0
        ? parsed.checklist
        : ['Ler o enunciado completo', 'Separar os materiais necessários', 'Enviar antes do prazo'],
      estimatedMinutes: Number(parsed.estimatedMinutes) || 30,
      priorityNote: parsed.priorityNote || 'Comece com antecedência para evitar imprevistos.',
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Erro ao sumarizar atividade com Gemini:', err);
    res.status(500).json({
      error: err?.message || 'Não foi possível gerar o resumo com IA no momento.',
    });
  }
});

// Endpoint Gemini: Análise de rotina ociosa e plano inteligente de lembretes (Módulo 4B)
app.post('/api/gemini/schedule-insights', async (req, res) => {
  const { pendingActivities, freeHourSlots, avgDailyScreenHours } = req.body ?? {};

  try {
    const ai = getAiClient();
    const compactTasks = Array.isArray(pendingActivities)
      ? pendingActivities.slice(0, 12).map((a: any) => ({
          title: a.title,
          courseName: a.courseName,
          status: a.status,
          dueDateIso: a.dueDateIso || 'Sem prazo',
        }))
      : [];

    const prompt = `Você é o motor de planejamento do SPA (Salva Pele do Aluno).
Com base nas atividades pendentes do Google Classroom e nos horários livres/ociosos informados pelo aluno, defina a melhor janela para enviar lembretes e um plano diário realista em Português (BR).

Dados do aluno:
- Tempo médio de tela diário informado: ${avgDailyScreenHours ?? 4.5} horas
- Horários livres configurados: ${JSON.stringify(freeHourSlots ?? [])}
- Atividades pendentes/atrasadas/devolvidas: ${JSON.stringify(compactTasks)}

Retorne JSON com:
- recommendedWindow: janela de horário ideal para disparar notificações (ex: "14:30 - 16:00").
- rationale: explicação curta (2 frases) baseada na rotina de horários vagos e urgência das entregas.
- dailyPlan: lista de até 4 sugestões práticas ligando um horário livre a uma tarefa real pendente.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedWindow: { type: Type.STRING },
            rationale: { type: Type.STRING },
            dailyPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeSlot: { type: Type.STRING },
                  taskTitle: { type: Type.STRING },
                  courseName: { type: Type.STRING },
                  tip: { type: Type.STRING },
                },
                required: ['timeSlot', 'taskTitle', 'courseName', 'tip'],
              },
            },
          },
          required: ['recommendedWindow', 'rationale', 'dailyPlan'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({
      recommendedWindow: parsed.recommendedWindow || '14:30 - 16:30',
      rationale:
        parsed.rationale ||
        'Seus horários livres à tarde oferecem maior concentração para concluir entregas próximas.',
      dailyPlan: Array.isArray(parsed.dailyPlan) ? parsed.dailyPlan : [],
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Erro ao gerar plano inteligente:', err);
    res.status(500).json({
      error: err?.message || 'Não foi possível analisar a rotina com IA.',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build não encontrado.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SPA - Salva Pele do Aluno server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
