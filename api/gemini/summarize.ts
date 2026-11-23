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
    const { title, courseName, description, dueDateIso, maxPoints, materialsCount } = body;

    if (!title) {
      return Response.json({ error: 'Título da atividade é obrigatório.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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
    return Response.json({
      summary: parsed.summary || 'Revise as instruções no Google Classroom e organize sua entrega.',
      checklist:
        Array.isArray(parsed.checklist) && parsed.checklist.length > 0
          ? parsed.checklist
          : ['Ler o enunciado completo', 'Separar os materiais necessários', 'Enviar antes do prazo'],
      estimatedMinutes: Number(parsed.estimatedMinutes) || 30,
      priorityNote: parsed.priorityNote || 'Comece com antecedência para evitar imprevistos.',
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return Response.json(
      { error: err?.message || 'Não foi possível gerar o resumo com IA no momento.' },
      { status: 500 }
    );
  }
}
