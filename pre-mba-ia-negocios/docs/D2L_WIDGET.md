# Widget-ponte do D2L (data de inscrição por aluno)

A página da jornada fica no GitHub Pages e é aberta dentro de um **widget** na página inicial da oferta no D2L. O widget tem um script pequeno que roda **dentro do D2L, com a sessão do aluno logado**: ele lê a data de inscrição do aluno naquela oferta e envia só essa informação para a página. A página usa a data para liberar as aulas com `enrollment_offset`.

```text
D2L · página inicial da oferta (sessão do aluno)
 └─ widget-ponte (docs/d2l-widget.html)
     ├─ GET /d2l/api/lp/1.61/users/whoami                                  → quem está logado
     ├─ GET /d2l/api/lp/1.61/users/{id}/enrollmentlogs/?orgUnitId={oferta} → data da inscrição
     └─ postMessage → iframe (GitHub Pages, página aberta com ?d2l=1)
                        └─ libera as aulas: inscrição + "days" de cada aula
```

## Como instalar

1. Abra `docs/d2l-widget.html` e confira as duas linhas marcadas com **AJUSTE**: o `src` do iframe e o `PAGE_ORIGIN` precisam ser do mesmo site.
2. No D2L, na oferta, crie um widget personalizado. No editor HTML, abra o modo **código-fonte** e cole o arquivo inteiro.
3. Salve, reabra o código-fonte e confira se o `<script>` continua lá (alguns ambientes removem scripts).
4. Adicione o widget à página inicial da oferta. Como o `{OrgUnitId}` muda sozinho, o mesmo widget serve para qualquer oferta.

Endereços em uso:

| Ambiente                    | `src` do iframe                                                                | `PAGE_ORIGIN`                     |
| --------------------------- | ------------------------------------------------------------------------------ | --------------------------------- |
| Teste (repositório pessoal) | `https://danillo-vidal.github.io/new-landing-pages/pre-mba-ia-negocios/?d2l=1` | `https://danillo-vidal.github.io` |
| Produção (XPE)              | `https://xp-educacao.github.io/xpe-landing-pages/pre-mba-ia-negocios/?d2l=1`   | `https://xp-educacao.github.io`   |

Do lado da página, só o endereço do D2L em `VITE_D2L_ORIGIN` pode responder (padrão: `https://ava.xpeducacao.com.br`).

## Liberação em fases no `course.json`

```json
"release": { "type": "enrollment_offset", "days": 7 }
```

A aula abre à 00:00 (horário de Brasília) do dia da inscrição + `days`. Com a página aberta fora do widget, ou sem inscrição na oferta, a aula aparece como "Liberação conforme a data da sua inscrição".

## Como verificar

A linha de status embaixo do iframe mostra o resultado da consulta ao D2L:

| Status                                | Significado                                                              |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Inscrição encontrada nesta oferta.    | Tudo certo: a página recebeu a data                                      |
| Nenhuma inscrição ativa nesta oferta. | O usuário não está matriculado (ou o último evento foi uma desmatrícula) |
| … `/users/whoami respondeu 403`       | O papel não pode ler os próprios dados                                   |
| … `/enrollmentlogs/ respondeu 403`    | O papel não pode ler o histórico de matrícula: avaliar LTI 1.3           |
| … `oferta não identificada`           | O widget não está na página inicial de uma oferta                        |

Teste com uma **conta de aluno de teste**: um administrador tem permissão para tudo, então o teste com ele não prova nada.

## Segurança

- Nenhum token ou segredo no código: as chamadas usam a sessão de quem está logado.
- O widget só envia dados para `PAGE_ORIGIN`, e a página só aceita mensagens de `VITE_D2L_ORIGIN` vindas da janela que a abriu.
- A página usa o horário do servidor do D2L (cabeçalho `Date`), e não o do computador.
- Cada aluno recebe só a própria data. Quem souber mexer no navegador consegue alterar a própria data e adiantar as aulas para si mesmo: a liberação é visual. Por isso, links de aulas futuras continuam vazios até a liberação.
