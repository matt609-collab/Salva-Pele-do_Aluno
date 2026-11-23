import { GoogleGenAI, Type } from '@google/genai';

export async function POST(request: Request): Promise<Response> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: 'GEMINI_API_KEY não configurada nas variáveis de ambiente do servidor.' },
        { status: 500 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, any>;
    const { pendingActivities, freeHourSlots, avgDailyScreenHours } = body;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
    return Response.json({
      recommendedWindow: parsed.recommendedWindow || '14:30 - 16:30',
      rationale:
        parsed.rationale ||
        'Seus horários livres à tarde oferecem maior concentração para concluir entregas próximas.',
      dailyPlan: Array.isArray(parsed.dailyPlan) ? parsed.dailyPlan : [],
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { error: err?.message || 'Não foi possível analisar a rotina com IA.' },
      { status: 500 }
    );
  }
}
