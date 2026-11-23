import React, { useState } from 'react';
import {
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface LoginViewProps {
  onLogin: () => Promise<void>;
  isLoggingIn: boolean;
  authError: string | null;
}

const REVIEWS = [
  {
    name: 'Lucas Ferreira',
    role: '3º Ano · Colégio Estadual Dom Pedro I',
    avatar: '/src/assets/images/student_avatar_lucas_1795430656777.jpg',
    quote:
      'Eu sempre esquecia trabalho de Química porque olhava o mural tarde demais. Agora abro o painel e vejo tudo o que vence amanhã logo de cara.',
  },
  {
    name: 'Mariana Oliveira',
    role: '2º Ano · Ensino Médio Regular',
    avatar: '/src/assets/images/student_avatar_mariana_1795430657109.jpg',
    quote:
      'O calendário automático com bolinhas por matéria salvou minha nota no trimestre. Sei exatamente que dia tem prova e atividade devolvida.',
  },
  {
    name: 'Rafael Mendes',
    role: 'Técnico em Desenvolvimento de Sistemas',
    avatar: '/src/assets/images/student_avatar_rafael_1795430656858.jpg',
    quote:
      'O resumo gerado por IA transforma enunciados gigantes em três passos simples. Consigo aproveitar meu tempo livre à tarde sem perder prazo.',
  },
];

const PREVIEW_TASKS = [
  {
    title: 'Lista de Exercícios · Funções Quadráticas',
    course: 'Matemática',
    due: 'Vence amanhã · 23:59',
    status: 'Pendente',
    color: '#DC2626',
  },
  {
    title: 'Redação Dissertativa · Tecnologia na Educação',
    course: 'Língua Portuguesa',
    due: 'Vence em 2 dias · 18:00',
    status: 'Devolvida',
    color: '#7C3AED',
  },
  {
    title: 'Reading Comprehension · Unit 4',
    course: 'Língua Inglesa',
    due: 'Sexta-feira · 23:59',
    status: 'Pendente',
    color: '#2563EB',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  isLoggingIn,
  authError,
}) => {
  const [showWhyGoogle, setShowWhyGoogle] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-30 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="#inicio"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2.5"
          >
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span>SPA · Salva Pele do Aluno</span>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#como-funciona"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Como funciona
            </a>
            <a
              href="#modelo-painel"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Painel
            </a>
            <a
              href="#avaliacoes"
              className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Avaliações
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
            >
              {isLoggingIn ? 'Conectando...' : 'Entrar com Google'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Split */}
        <section
          id="inicio"
          className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-16 lg:pb-20"
        >
          <div className="grid lg:grid-cols-12 gap-10 items-stretch">
            {/* Left Column: Core Login Focal Area */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-3">
                Integração oficial com Google Classroom · Contas @escola e Google
              </p>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.15] text-balance mb-5">
                Suas atividades pendentes do Classroom organizadas antes do prazo vencer.
              </h1>

              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8">
                O SPA conecta-se diretamente ao seu Google Classroom para reunir tarefas não concluídas, atividades devolvidas, contatos dos professores e um calendário automático de entregas em um só lugar.
              </p>

              {/* Official Google Sign-In Button */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                <button
                  type="button"
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="gsi-material-button shadow-sm"
                >
                  <div className="gsi-material-button-state" />
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        style={{ display: 'block' }}
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                        <path fill="none" d="M0 0h48v48H0z" />
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">
                      {isLoggingIn
                        ? 'Conectando ao Google Classroom...'
                        : 'Faça o login com Google'}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setShowWhyGoogle((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  <span>Por que apenas com o Google?</span>
                  {showWhyGoogle ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300"
                >
                  {authError}
                </div>
              )}

              {showWhyGoogle && (
                <div className="mb-6 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <p className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Acesso direto ao Google Classroom sem senha extra
                  </p>
                  <p>
                    Ao entrar com sua conta institucional (@escola) ou conta Google vinculada às suas turmas, o sistema recebe permissão somente de leitura para sincronizar suas atividades pendentes, prazos e avisos automaticamente — sem precisar criar ou guardar uma nova senha.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>Sincronização direta via Google Classroom</span>
                <span aria-hidden="true">·</span>
                <span>Calendário automático de entregas</span>
                <span aria-hidden="true">·</span>
                <span>Resumos por IA</span>
              </div>
            </div>

            {/* Right Column: Editorial Hero Photo */}
            <div className="lg:col-span-6 flex">
              <div className="relative w-full min-h-[300px] lg:min-h-[380px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-200 dark:bg-slate-900">
                <img
                  src="/src/assets/images/spa_study_hero_1795430657151.jpg"
                  alt="Mesa de estudos organizada com caderno de horários e calendário no computador"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs font-medium text-blue-300 mb-1">
                      Organização estudantil sem esforço manual
                    </p>
                    <p className="text-base font-semibold leading-snug">
                      Prazos, turmas e horários livres conectados em uma única rotina.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section
          id="como-funciona"
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-14"
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Do login ao seu calendário pronto em segundos
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Projetado para eliminar o esquecimento de trabalhos, provas e atividades devolvidas.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  01. Leitura real do Classroom
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Importa automaticamente todas as turmas ativas, tarefas não entregues, trabalhos devolvidos pelo professor e contatos da turma.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  02. Calendário por cores e dias
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Cada disciplina ganha uma cor dedicada no calendário mensal, permitindo visualizar prazos e avisos ao clicar em qualquer dia.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-4" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  03. Resumo e rotina inteligente
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sumariza enunciados longos em passos práticos e identifica seus horários vagos para disparar lembretes no momento certo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Preview Model (from Figma: "Dashboard do site principal como exemplo/modelo do site") */}
        <section id="modelo-painel" className="py-16 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  Modelo do painel principal após o login
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Visualização ilustrativa de como suas turmas reais e prazos urgentes aparecem organizados.
                </p>
              </div>
              <button
                type="button"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-blue-600 rounded-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Conectar minha conta agora
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <div className="grid lg:grid-cols-12 gap-6">
                {/* Preview Left: Tarefas perto de vencer */}
                <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pb-6 lg:pb-0 lg:pr-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Tarefas que estão perto de vencer
                    </h3>
                    <span className="text-xs text-slate-500 font-mono tabular-nums">
                      Exemplo
                    </span>
                  </div>
                  <div className="space-y-3">
                    {PREVIEW_TASKS.map((item) => (
                      <div
                        key={item.title}
                        className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                              {item.course}
                            </span>
                            <span className="text-xs text-slate-400" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
                            {item.due}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap shrink-0 mt-1">
                          Ver detalhes
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview Right: Turmas e atalhos */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Turmas sincronizadas do Google Classroom
                    </h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span>Calendário</span>
                      <span aria-hidden="true">·</span>
                      <span>Configurações</span>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Matemática Aplicada', teacher: 'Prof. Ricardo Almeida', pending: 2, color: '#DC2626' },
                      { name: 'Língua Portuguesa e Redação', teacher: 'Profa. Camila Souza', pending: 1, color: '#7C3AED' },
                      { name: 'Desenvolvimento Web', teacher: 'Prof. Henrique Dias', pending: 3, color: '#2563EB' },
                      { name: 'Física Geral', teacher: 'Profa. Beatriz Lima', pending: 0, color: '#059669' },
                    ].map((cls) => (
                      <div
                        key={cls.name}
                        className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="w-2.5 h-2.5 rounded-sm shrink-0"
                              style={{ backgroundColor: cls.color }}
                            />
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {cls.name}
                            </p>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {cls.teacher}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-mono tabular-nums mt-1.5">
                            {cls.pending > 0
                              ? `${cls.pending} pendência(s)`
                              : 'Tudo em dia'}
                          </p>
                        </div>
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${
                            cls.pending === 0
                              ? 'text-emerald-600'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews de Usuários */}
        <section
          id="avaliacoes"
          className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-16"
        >
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Avaliações de estudantes
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
              Relatos de quem usa o SPA para não perder entregas e organizar o tempo livre.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {REVIEWS.map((review) => (
                <article
                  key={review.name}
                  className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col justify-between gap-5"
                >
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    “{review.quote}”
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover bg-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {review.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {review.role}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>SPA · Salva Pele do Aluno</span>
          <span>Colégio Estadual Cívico-Militar Dom Pedro I · Curso Técnico em Desenvolvimento de Sistemas · 2026</span>
        </div>
      </footer>
    </div>
  );
};
