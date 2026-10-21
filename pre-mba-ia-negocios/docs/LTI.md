# Abertura pelo LTI 1.3 (data de inscrição por aluno)

A página pode ser aberta por uma ferramenta **LTI 1.3**, o backend `xpe-lti-jornada`. Esse backend confere quem é o aluno pelo crachá assinado do D2L e lê a data de inscrição com uma conta de serviço. Depois, abre esta página com o resultado no endereço:

```text
https://.../pre-mba-ia-negocios/#xpe-lti=<base64url de { "v": 1, "status": "...", "enrolledAt": "..." }>
```

| `status`       | O que a página faz                                                           |
| -------------- | ---------------------------------------------------------------------------- |
| `enrolled`     | Usa `enrolledAt` para liberar as aulas com `enrollment_offset`               |
| `not_enrolled` | Sem data: as aulas mostram "Liberação conforme a data da sua inscrição"      |
| `unavailable`  | O backend não conseguiu ler o D2L: mesmo comportamento, com aviso no console |

- O código fica em `src/services/access/LtiAccessProvider.ts` e é escolhido em `src/app/create-app-services.ts`. Quando o endereço tem `#xpe-lti=`, esse caminho tem prioridade sobre o widget (`?d2l=1`).
- A página não recebe nome, e-mail nem ID: só o status e a data do próprio aluno. O que vem depois do `#` não é enviado a nenhum servidor.
- O resultado fica no endereço de propósito: recarregar a página mantém as aulas liberadas.
- A liberação continua visual. Por isso, links de aulas futuras ficam vazios no `course.json` até a data.

## Por que não o widget

O teste no D2L mostrou que o papel de aluno recebe **403** ao ler o próprio histórico de matrícula. Por isso, o widget-ponte (`docs/D2L_WIDGET.md`) não consegue a data para alunos. No LTI, quem lê a data é o backend, com permissão própria.

A instalação e o passo a passo do D2L de teste estão no `README.md` do `xpe-lti-jornada`.
