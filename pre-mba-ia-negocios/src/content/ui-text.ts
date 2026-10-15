/**
 * Fixed interface copy (buttons, labels, empty states, accessibility texts) in pt-BR.
 *
 * Course content (titles, dates, links, videos) lives in `course.json`. This file holds the
 * texts that are the same for every lesson, so components never hardcode copy.
 */
import type { LessonButtonLabel } from '../domain/lesson-button-label.ts';
import type { UnlockTrigger, VideoProvider } from '../domain/types.ts';

function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}

const lessonLabel = (order: number) => `Aula ${order}`;

export const uiText = {
  page: {
    skipToContent: 'Pular para o conteúdo principal',
    loading: 'Carregando sua jornada…',
  },

  journey: {
    heading: 'Sua jornada começa aqui',
    subheading: {
      play: 'Dê play no vídeo de uma aula para habilitar a seguinte. Depois, clique em “Liberar aula”.',
      watched:
        'Assista a uma aula até o fim para habilitar a seguinte. Depois, clique em “Liberar aula”.',
    } satisfies Record<UnlockTrigger, string>,
    progressLabel: 'Progresso da jornada',
    lessonListLabel: 'Aulas da jornada',
    progressSummary: (released: number, total: number, completed: number) =>
      `${released} de ${total} ${plural(total, 'aula liberada', 'aulas liberadas')} · ` +
      `${completed} ${plural(completed, 'concluída', 'concluídas')}`,
    progressValueText: (released: number, total: number, completed: number) =>
      `${completed} de ${total} ${plural(total, 'aula concluída', 'aulas concluídas')}; ` +
      `${released} ${plural(released, 'liberada', 'liberadas')}.`,
    legend: { completed: 'Concluída', available: 'Liberada', locked: 'Bloqueada' },
  },

  lessonCard: {
    lessonLabel,
    releaseOn: (date: string) => `Liberação: ${date}`,
    awaitingEnrollment: 'Liberação conforme a data da sua inscrição',
    awaitingPreviousLesson: 'Desbloqueie a aula anterior',
    awaitingTrigger: {
      play: 'Dê play na aula anterior',
      watched: 'Conclua a aula anterior',
    } satisfies Record<UnlockTrigger, string>,
    readyHint: 'Pronta para liberar',
    availableHint: 'Disponível para assistir',
    inProgressHint: 'Em andamento',
    completedHint: 'Aula concluída',
    badge: {
      locked: 'Bloqueado',
      ready: 'Liberar aula',
      unlocked: 'Ver conteúdo',
      viewing: 'Visualizando a aula',
      completed: 'Assistido',
    } satisfies Record<LessonButtonLabel, string>,
  },

  unlock: {
    title: (order: number) => `${lessonLabel(order)} liberada!`,
    chip: (released: number, total: number) =>
      `${released} de ${total} ${plural(total, 'aula liberada', 'aulas liberadas')}`,
    announce: (order: number) => `${lessonLabel(order)} liberada`,
    completedAnnounce: (order: number) => `${lessonLabel(order)} concluída`,
  },

  lessonPanel: {
    tag: (order: number, isCompleted: boolean) =>
      `${lessonLabel(order)} · ${isCompleted ? 'Concluída' : 'Conteúdo liberado'}`,
    expandAll: 'Expandir tudo',
    collapseAll: 'Recolher tudo',
    sections: {
      video: 'Videoaula',
      materials: 'Materiais de apoio ao aluno',
    },
    emptyState: {
      title: 'Sua jornada começa em breve',
      firstReleaseOn: (date: string) => `A primeira aula será liberada em ${date}.`,
      awaitingEnrollment: 'As aulas serão liberadas de acordo com a data da sua inscrição.',
    },
  },

  video: {
    play: (title: string) => `Reproduzir o vídeo: ${title}`,
    releasedBadge: (order: number) => `${lessonLabel(order)} • Liberada`,
    iframeTitle: (title: string) => `Vídeo da aula: ${title}`,
    comingSoonTitle: 'Vídeo em breve',
    comingSoonDescription: 'O vídeo desta aula será publicado aqui assim que estiver disponível.',
    expand: 'Modo expandido',
    shrink: 'Largura padrão',
    minimize: 'Minimizar',
    restore: 'Restaurar',
    close: 'Fechar vídeo',
    miniPlayerRegion: (title: string) => `Mini-player: ${title}`,
    resizeMiniPlayer: (edge: string) => `Redimensionar mini-player pela alça ${edge}`,
    miniPlayerPlaceholder: 'O vídeo continua tocando no mini-player.',
    errorTitle: 'Não foi possível reproduzir o vídeo aqui.',
    errorDescription: 'Você pode assistir diretamente no site do provedor.',
    watchOn: {
      youtube: 'Assistir no YouTube',
      vimeo: 'Assistir no Vimeo',
      mp4: 'Abrir o arquivo de vídeo',
      spalla: 'Assistir na Spalla',
    } satisfies Record<VideoProvider, string>,
    captionsLabel: 'Português',
    simulatePlay: 'Simular reprodução',
  },

  completion: {
    hint: (thresholdPct: number) =>
      `A aula é marcada como assistida automaticamente ao atingir ${thresholdPct}% do vídeo.`,
    markAsWatched: 'Marcar como assistida',
    watched: 'Aula assistida',
    unmark: 'Desmarcar',
    unmarkLabel: 'Desmarcar aula como assistida',
  },

  carousel: {
    regionLabel: 'Aulas e desconto da jornada',
    roleDescription: 'carrossel',
    prev: 'Ver cards anteriores',
    next: 'Ver próximos cards',
    hintArrows: 'Use as setas para ver todos os cards',
    hintTouch: 'Deslize ou use as setas para explorar a jornada',
    position: (from: number, to: number, total: number) =>
      `Mostrando ${from} a ${to} de ${total} cards`,
  },

  materials: {
    comingSoon: 'Em breve',
    opensInNewTab: '(abre em nova aba)',
    visited: 'Material acessado',
    empty: 'Os materiais desta aula serão publicados em breve.',
  },

  community: {
    placeholderTitle: 'Espaço para incorporar o Padlet',
    placeholderDescription: 'O mural interativo aparecerá aqui após a configuração do embed.',
    iframeTitle: (title: string) => `Mural da comunidade: ${title}`,
    openInNewTab: 'Abrir o mural em nova aba',
  },

  dateOverride: {
    message: (date: string) => `Simulação de data ativa: a página considera ${date}.`,
    hint: 'Remova o parâmetro ?today= do endereço para voltar à data real.',
  },

  errors: {
    contentTitle: 'Não foi possível carregar o conteúdo da jornada',
    contentDescription:
      'Encontramos um problema no arquivo de conteúdo (course.json). Corrija os itens abaixo e recarregue a página.',
    contentDetails: 'Itens a corrigir',
    accessTitle: 'Não foi possível verificar o seu acesso',
    accessDescription: 'Verifique sua conexão e tente novamente em alguns instantes.',
    unexpectedTitle: 'Algo não saiu como esperado',
    unexpectedDescription:
      'Recarregue a página. Se o problema continuar, avise a equipe de suporte.',
    retry: 'Tentar novamente',
    reload: 'Recarregar página',
  },
} as const;
