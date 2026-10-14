# Como contribuir

## Preparação

```bash
nvm use        # Node 22
npm ci
npm run dev
```

Antes de abrir um Pull Request: `npm run check && npm run build`. O CI roda os mesmos comandos.

## Fluxo

1. Crie uma branch a partir da `main`: `feat/mini-player-legendas`, `fix/data-aula-3`, `content/aula-6`.
2. Commits pequenos, no padrão **Conventional Commits**.
3. Abra o PR; o merge na `main` publica automaticamente no GitHub Pages.

### Conventional Commits

```text
<tipo>(escopo opcional): descrição no imperativo
```

| Tipo         | Quando usar                               | Exemplo                                         |
| ------------ | ----------------------------------------- | ----------------------------------------------- |
| `feat`       | Nova funcionalidade                       | `feat(video): add captions to mp4 player`       |
| `fix`        | Correção de bug                           | `fix(progress): keep selection after unmarking` |
| `content`    | Mudança só no `course.json`/textos        | `content: release lesson 3 materials`           |
| `refactor`   | Mudança interna sem alterar comportamento | `refactor(domain): extract lesson selection`    |
| `test`       | Testes                                    | `test(schema): cover duplicated material ids`   |
| `docs`       | Documentação                              | `docs: explain padlet embed`                    |
| `chore`/`ci` | Build, dependências, workflows            | `ci: cache npm in deploy workflow`              |

## Convenções

- **Idioma**: textos da interface em pt-BR (em `src/content/ui-text.ts`); código, pastas e comentários técnicos em inglês.
- **Arquivos**: componentes React, classes e interfaces principais em `PascalCase.tsx/.ts` (`LessonCard.tsx`, `StaticAccessProvider.ts`); hooks em `useCamelCase.ts`; demais módulos em `kebab-case.ts` (`lesson-status.ts`).
- **Nomes**: funções com verbo (`resolveLessonStatus`, `computeJourneyProgress`); booleanos com `is/has/should` (`isLocked`, `hasPlaybackError`).
- **Imports**: sempre com extensão; `@/` nas camadas de UI e serviços; relativos em `domain/`, `content/` e `lib/` (veja [ARCHITECTURE.md](docs/ARCHITECTURE.md#regras-de-import)). A ordem é organizada automaticamente (`npm run lint:fix`).
- **Comentários**: só para explicar o _porquê_.
- **Proibido** (o lint bloqueia): `any`, `@ts-ignore`, `new Date()` fora do Clock, `localStorage` fora do repositório, cores literais, textos de interface dentro de componentes.

## Criando um componente

1. Escolha a pasta pelo assunto: `layout/`, `journey/`, `lesson/`, `feedback/` (estados de carregamento/erro) ou `ui/` (primitivos shadcn).
2. Um componente por arquivo, idealmente com menos de 120 linhas. Props `readonly`, sem regra de negócio (ela fica em `domain/`).
3. Textos em `ui-text.ts`; cores somente pelas classes dos tokens (`bg-brand-50`, `text-ink-950`...); ícones do `lucide-react` com `aria-hidden="true"`.
4. Acessibilidade: elementos interativos nativos (`<button>`, `<a>`), nome acessível, foco visível e funcionamento por teclado.

```tsx
import { Sparkles } from 'lucide-react';

import { uiText } from '@/content/ui-text.ts';

interface NewBadgeProps {
  readonly isVisible: boolean;
}

export function NewBadge({ isVisible }: NewBadgeProps) {
  if (!isVisible) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
      <Sparkles aria-hidden="true" className="size-3" />
      {uiText.lessonCard.newBadge}
    </span>
  );
}
```

(No exemplo, a chave `newBadge` precisaria ser criada em `uiText.lessonCard`.)

Para adicionar um primitivo do shadcn/ui: `npx shadcn@latest add <componente>` (configuração em `components.json`) e troque as cores pelos tokens.

## Testes

```bash
npm test            # uma vez
npm run test:watch  # modo observação
```

- Testes ficam ao lado do arquivo testado: `lesson-status.ts` → `lesson-status.test.ts`.
- Regras de data **sempre** com datas explícitas (helpers em `src/test/fixtures.ts`), nunca com o relógio real:

```ts
import { at, createContext, createLesson, SAO_PAULO } from '../test/fixtures.ts';

const state = resolveLessonStatus({
  lesson: createLesson({ release: { type: 'fixed_date', date: at('2026-10-20') } }),
  context: createContext({ now: at('2026-10-19T23:59:59-03:00') }),
  completedLessonIds: new Set(),
  timeZone: SAO_PAULO,
});
expect(state.status).toBe('locked');
```

- Componentes: use `// @vitest-environment jsdom` no topo do arquivo e Testing Library (exemplo em `LessonCard.test.tsx`).
- Toda regra nova em `domain/` precisa de teste: antes, no limite exato e depois da data.
