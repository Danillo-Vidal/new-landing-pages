# Guia de conteúdo

Tudo o que muda semana a semana fica em **um único arquivo: `src/content/course.json`**. Não é preciso mexer em componentes.

## Como editar (sem instalar nada)

1. No GitHub, abra `src/content/course.json` e clique no lápis (**Edit this file**).
2. Faça a alteração seguindo os exemplos abaixo.
3. Clique em **Commit changes** (direto na `main`, ou abra um Pull Request se a equipe preferir revisão).
4. Acompanhe a aba **Actions**. Em ~2 minutos a página é atualizada.

Se algo estiver errado, o deploy falha com uma mensagem como a abaixo e **o site continua com a versão anterior**:

```text
[course.json] Conteúdo inválido (1 problema(s)):
  • lessons[2] (aula-3) › release.date — Data inválida. Use "AAAA-MM-DD" (...)
```

Quem roda o projeto localmente (`npm run dev`) vê a mesma lista de erros na própria página.

## Mapa: o que cada campo controla

![Mapa do conteúdo](images/mapa-do-conteudo.jpg)

| Nº  | Na página                        | Campo no `course.json`                                    |
| --- | -------------------------------- | --------------------------------------------------------- |
| 1   | Topo escuro (hero)               | `journey.eyebrow`, `journey.title`, `journey.description` |
| 2   | Card da aula e data de liberação | `lessons[].order`, `lessons[].title`, `lessons[].release` |
| 3   | Barra de progresso e selo        | Calculados automaticamente (não editar)                   |
| 4   | Título e subtítulo da aula       | `lessons[].title`, `lessons[].subtitle`                   |
| 5   | Vídeo                            | `lessons[].video`                                         |
| 6   | Descrição                        | `lessons[].description`                                   |
| 7   | Materiais de apoio               | `lessons[].materials[]`                                   |
| 8   | Comunidade (Padlet)              | `lessons[].community`                                     |

Regras de JSON que mais causam erro: textos sempre entre **aspas duplas**; **vírgula** entre itens, mas nunca depois do último; `""` (vazio) significa "em breve".

---

## a) Adicionar uma aula

Copie o bloco de uma aula existente, cole depois do último `}` da lista `lessons` (lembre da vírgula) e ajuste:

```json
{
  "id": "aula-6",
  "order": 6,
  "title": "Projeto final: IA aplicada ao seu negócio",
  "subtitle": "Estruture um caso real com o que você aprendeu.",
  "description": "Nesta aula bônus, você aplica o método da jornada a um desafio da sua empresa.",
  "release": { "type": "fixed_date", "date": "2026-11-17" },
  "video": { "provider": "youtube", "videoId": "", "thumbnail": "" },
  "materials": [{ "id": "roteiro", "label": "Roteiro do Projeto", "icon": "exercise", "url": "" }],
  "community": {
    "title": "Comunidade e interações",
    "description": "Compartilhe o rascunho do seu projeto.",
    "embedUrl": ""
  }
}
```

- `id`: único, só minúsculas, números e hífens (`aula-6`). Não altere o `id` de aulas já publicadas: o progresso dos alunos é salvo por ele.
- `order`: número único; define a posição do card (a ordem no arquivo não importa).
- A barra de progresso ganha um segmento novo automaticamente.

## b) Liberação sequencial (padrão) e duração do vídeo

Por padrão, cada aula usa `"release": { "type": "sequential" }`: a Aula 1 já nasce aberta e as seguintes são liberadas pelo próprio aluno, no botão **"Liberar aula"**, quando a aula anterior atinge o gatilho definido no topo do arquivo:

```json
"progression": { "unlockNextOn": "play" },
"features": { "allowManualComplete": false },
"sound": { "enabledByDefault": true, "volume": 0.12 },
"animation": { "unlockOverlayMs": 2200 }
```

| Campo                          | O que faz                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------- |
| `progression.unlockNextOn`     | `"play"`: a próxima aula fica pronta quando o aluno dá play. `"watched"`: só após concluir a aula |
| `features.allowManualComplete` | `true` mostra "Marcar como assistida" / "Desmarcar"                                               |
| `sound`                        | Som da conquista ao liberar (o aluno pode desligar no botão "Som das conquistas")                 |
| `animation.unlockOverlayMs`    | Duração da animação "Aula liberada!" (1600 a 10000 ms)                                            |

A aula vira **"Assistido"** sozinha quando o tempo assistido chega a `duration × journey.completionThreshold` (ex.: 90%). Esse tempo é contado internamente e **não aparece na tela**. Informe a duração real de cada vídeo em `video.duration`, no formato `"mm:ss"` ou `"h:mm:ss"`:

```json
"video": { "provider": "youtube", "videoId": "XXXXXXXXXXX", "thumbnail": "", "duration": "12:30" }
```

- YouTube, Vimeo e MP4: conta só o tempo em reprodução (pausa não conta).
- Spalla (sem eventos do player): conta o tempo corrido desde o play.
- Sem `duration`: vale a posição informada pelo player (YouTube/Vimeo/MP4) ou o botão manual.

Para testar sem esperar o vídeo: `npm run dev` e abra `http://localhost:5173/?speed=60` (1 segundo real = 1 minuto). Em desenvolvimento, aulas sem vídeo mostram **"Simular reprodução"**.

> O desbloqueio é experiência de uso: o progresso fica no navegador e pode ser burlado. Bloqueio real depende da API da fase 2.

## b2) Liberação por data (opcional)

Para voltar a liberar uma aula por data, troque o `release` dela. A aula é liberada **à 00:00 do dia, no fuso `journey.timezone` (America/Sao_Paulo)**, independentemente do fuso do aluno.

```json
"release": { "type": "fixed_date", "date": "2026-10-27" }
```

Formatos aceitos:

| Formato                       | Significado                                    |
| ----------------------------- | ---------------------------------------------- |
| `"2026-10-27"`                | 27/10/2026 à meia-noite (fuso da jornada)      |
| `"2026-10-27T00:00:00-03:00"` | Instante exato (o fuso `-03:00` é obrigatório) |
| `"2026-10-27T14:30:00-03:00"` | 27/10/2026 às 14h30 (horário de Brasília)      |

Para conferir antes de publicar: `npm run dev` e abra `http://localhost:5173/?today=2026-10-27`.

**Liberação pela data de inscrição (fase 2):** quando a API estiver ativa, use:

```json
"release": { "type": "enrollment_offset", "days": 10 }
```

A aula abre 10 dias após a inscrição do aluno (à 00:00). Enquanto a fase 2 não estiver ativa, essas aulas aparecem bloqueadas com "Liberação conforme a data da sua inscrição".

## c) Subir o link de um material

```json
{
  "id": "slides",
  "label": "Apresentação de Slides",
  "icon": "slides",
  "url": "https://exemplo.com/slides.pdf"
}
```

- `url` vazio (`""`) mostra o botão desabilitado com **Em breve**.
- Links precisam começar com `https://`. Também é possível hospedar o arquivo aqui: coloque-o em `public/materiais/aula-1/slides.pdf` e use `"url": "materiais/aula-1/slides.pdf"`.
- Até 8 materiais por aula. Links abrem em nova aba.
- `id` único dentro da aula; `label` é o texto do botão.

Ícones disponíveis em `icon`:

| Chave         | Uso sugerido       | Chave      | Uso sugerido        |
| ------------- | ------------------ | ---------- | ------------------- |
| `text`        | Texto de apoio     | `link`     | Link externo        |
| `guide`       | Guia, glossário    | `download` | Arquivo para baixar |
| `slides`      | Apresentação       | `exercise` | Exercício, roteiro  |
| `spreadsheet` | Planilha, matriz   | `template` | Modelo, canvas      |
| `video`       | Vídeo complementar | `tip`      | Dica, insight       |
| `audio`       | Podcast, áudio     |            |                     |

Precisa de outro ícone? Peça ao time técnico (é uma linha em `src/lib/material-icons.ts`).

### Material com conteúdo na própria página (ex.: Guia de Abertura)

Em vez de `url`, use `page` com o nome de um arquivo da pasta `src/content/pages/`. O botão passa a **expandir** o conteúdo logo abaixo dos materiais (um de cada vez):

```json
{ "id": "guia", "label": "Guia de Abertura", "icon": "guide", "page": "guia-de-abertura" }
```

O conteúdo fica em `src/content/pages/guia-de-abertura.json`. Para criar outro, copie `src/content/pages/exemplo-todos-os-blocos.json` (traz todos os blocos), renomeie e aponte o `page` para ele.

```json
{
  "intro": "Texto de abertura (opcional).",
  "tone": "brand",
  "blocks": [
    { "type": "heading", "text": "Título" },
    { "type": "text", "text": "Parágrafo com **negrito** e [link](https://exemplo.com)." }
  ]
}
```

| Bloco     | Campos                                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `heading` | `text`; `level`: `2` (título, padrão) ou `3` (subtítulo)                                                                                       |
| `text`    | `text` — aceita `**negrito**` e `[texto](link)`                                                                                                |
| `list`    | `items` (lista de textos); `style`: `bullet` (padrão), `number` ou `check`                                                                     |
| `image`   | `src` (https ou arquivo em `public/`), `alt` (obrigatório, para acessibilidade), `caption`, `size`: `full`/`medium`                            |
| `video`   | `title` e `video` no mesmo formato do vídeo da aula (YouTube, Vimeo, Spalla ou MP4)                                                            |
| `buttons` | `items`: até 6 botões com `label`, `url`, `icon` (mesmos ícones dos materiais), `style`: `primary`/`secondary`, `download`: `true` para baixar |
| `callout` | `text`, `title` (opcional), `tone`: `info`, `tip` (dica) ou `warning` (atenção)                                                                |
| `divider` | linha separadora                                                                                                                               |

- `tone` da página: `brand` (verde suave, padrão), `neutral` (cinza) ou `plain` (branco).
- Arquivos para baixar: coloque em `public/materiais/...` e use `"url": "materiais/arquivo.pdf", "download": true`.
- Vídeos dentro da página são complementares: **não contam** como tempo assistido da aula.
- Erros apontam o arquivo e o bloco, ex.: `lessons[0] (aula-1) › materials[1].page — pages/guia-de-abertura.json › blocks[3].src — Link inválido`.
- Visual (cores, espaçamentos, tamanhos): tudo em `src/components/content/content-styles.ts`.

## d) Trocar o vídeo

**YouTube** (cole o ID ou o link completo; os dois funcionam):

```json
"video": { "provider": "youtube", "videoId": "https://www.youtube.com/watch?v=XXXXXXXXXXX", "thumbnail": "" }
```

**Vimeo** (inclusive vídeos não listados, com o hash no link):

```json
"video": { "provider": "vimeo", "videoId": "https://vimeo.com/123456789/abcdef1234", "thumbnail": "" }
```

**Arquivo MP4** (CDN ou pasta `public/`), com legenda opcional em WebVTT:

```json
"video": { "provider": "mp4", "url": "videos/aula-1.mp4", "thumbnail": "thumbnails/aula-1.jpg", "captionsUrl": "videos/aula-1.vtt" }
```

- **Spalla** (use a URL do player, não um endereço de arquivo MP4):

```json
"video": {
  "provider": "spalla",
  "embedUrl": "https://beyond.spalla.io/player/?video=ID_DO_VIDEO;&subtitleLanguage=null"
}
```

- `videoId`/`url` vazio mostra **Vídeo em breve**.
- `thumbnail` é opcional nos provedores que a aceitam; o YouTube usa a capa do vídeo automaticamente. Spalla usa a própria capa do player e não aceita `thumbnail`.
- YouTube, Vimeo e MP4 informam o progresso do vídeo. Em players Spalla, use **Marcar como assistida** para registrar a conclusão.

## e) Configurar o Padlet

1. No Padlet, abra o mural › **Compartilhar** › **Incorporar no seu blog ou site**.
2. Do código copiado, pegue **apenas** o endereço dentro de `src="..."` (algo como `https://padlet.com/embed/abc123xyz`).
3. Cole em `embedUrl`:

```json
"community": {
  "title": "Comunidade e interações",
  "description": "Compartilhe suas reflexões, dúvidas e aplicações com outros alunos.",
  "embedUrl": "https://padlet.com/embed/abc123xyz"
}
```

Com `embedUrl` vazio, a página mostra o espaço tracejado "Espaço para incorporar o Padlet". Qualquer outro serviço com embed `https://` (Google Forms, Miro, Mentimeter...) também funciona.

---

## Outros ajustes

- **Topo e cabeçalho:** `journey.eyebrow`, `journey.title`, `journey.description` e `journey.header` (`brandName`, `label` e `logoUrl`; para usar o logo oficial, coloque o arquivo em `public/marca/logo.svg` e use `"logoUrl": "marca/logo.svg"`). Remova `header` para ocultar a barra superior.
- **Textos fixos da interface** ("Marcar como assistida", "Em breve", avisos...) ficam em `src/content/ui-text.ts`.

## Erros comuns

| Mensagem                         | Como resolver                                                         |
| -------------------------------- | --------------------------------------------------------------------- |
| `O arquivo não é um JSON válido` | Falta/sobra vírgula ou aspas. Cole o arquivo em um validador de JSON. |
| `Campo obrigatório ausente.`     | O campo indicado foi apagado. Copie de outra aula.                    |
| `Campo desconhecido: "subtitel"` | Erro de digitação no nome do campo.                                   |
| `Data inválida...`               | Use `"AAAA-MM-DD"` (ex.: `"2026-10-27"`).                             |
| `Link inválido...`               | O link precisa começar com `https://`.                                |
| `O id "aula-2" está repetido...` | Cada aula (e cada material dentro da aula) precisa de `id` único.     |
