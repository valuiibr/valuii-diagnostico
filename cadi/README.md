# Diagnóstico CADI Integridade — Valuii

## Implantação

Página em **cadi/index.html** do repositório **valuiibr/valuii-diagnostico**. A pasta /cadi/ não altera o diagnóstico empresarial que já existe na raiz.

URL esperada, quando GitHub Pages e domínio estiverem ativos: https://diagnostico.valuii.com.br/cadi/

**Situação técnica:** aplicação estática publicada no GitHub; envio automático ao e-mail **contato@valuii.com.br** preparado, mas **desativado** até configurar e testar o backend Cloudflare Worker e os segredos. Sem o backend, o botão de envio oferece encaminhamento manual, com PDF anexado pelo respondente. Não exponha credenciais em GitHub Pages.

## Público e alinhamento pedagógico

Alta direção, coordenação e responsáveis administrativos do CADI Fazenda Rio Grande/PR.

O questionário cobre 35 perguntas em 7 dimensões:
1. Estrutura de governança: direção, estatuto, órgãos, alçadas e deliberações.
2. Estratégia e sustentabilidade: planejamento, continuidade, projetos e recursos.
3. Integridade e ética: conduta, conflitos de interesses e tratamento de relatos.
4. Gestão de riscos: identificação, impacto, priorização, responsáveis e monitoramento.
5. Controles internos: compras, pagamentos, conciliações, segregação e documentação.
6. Transparência e prestação de contas: relatórios, comprovação de gastos, dados e accountability.
7. Pessoas, cultura e conformidade: capacitação, responsabilidades, proteção de dados e obrigações legais/contratuais aplicáveis.

Reflete as três aulas do programa (28/10, 11/11 e 25/11), as videoaulas e o diagnóstico preliminar. Não substitui entrevistas ou validação documental.

## Escala e método

Respostas de **0 a 4** ou **N/A**, com campo facultativo para indicar evidências. Cada dimensão recebe a média normalizada de suas respostas aplicáveis (0 a 100). O índice global é a média simples das dimensões com respostas pontuadas; portanto, trata-se de instrumento preliminar de autoavaliação, **não** do ICG-T cientificamente validado, nem de um parecer formal de conformidade.

A seleção de N/A deve ser justificada pela efetiva não aplicabilidade, e uma elevada quantidade de N/A limita a interpretação. Recomendações até 90 dias são propostas iniciais, não determinações técnicas.

A aplicação gera síntese por dimensão, prioridades por item, relatório para impressão/salvamento em PDF, botão de download direto de PDF, exportação JSON e modo de simulação fictícia. O rascunho é salvo localmente somente mediante opção expressa.

## Envio automático — preparar backend seguro

GitHub Pages não executa servidor para envio de e-mail e **não** deve conter chaves Resend/SMTP.

### Pré-requisitos

- Conta Cloudflare Workers e domínio de envio verificado no **Resend**.
- Cloudflare Turnstile (chave pública + chave privada).
- Acesso autorizado à configuração de DNS/domínios e ao provedor de e-mail.
- Regras de privacidade, retenção, acesso e tratamento de dados pessoais definidas pela Valuii.
- Idealmente Cloudflare WAF/rate-limiting para mitigar spam e abuso.

### Passos

1. Criar projeto Cloudflare Worker usando **cadi/api-worker.mjs**. Não publicá-lo como uma página GitHub Pages; ele precisa ser implantado separadamente no Cloudflare.
2. Configurar segredos do Worker: **RESEND_API_KEY** e **TURNSTILE_SECRET**; definir **MAIL_FROM** com remetente de domínio verificado (ex. \`CADI Integridade <relatorios@valuii.com.br>\`).
3. Publicar o Worker, verificar HTTPS e a configuração de CORS. Validar o destinatário **contato@valuii.com.br**.
4. Em \`cadi/index.html\`, configurar o objeto \`CONFIG\` com \`envioEndpoint: 'https://SEU-WORKER.workers.dev'\` e \`turnstileSiteKey: 'CHAVE-PÚBLICA'\`. **Nunca inserir segredos nessa página.**
5. Testar com dados fictícios: avaliação, geração do PDF, CAPTCHA, e-mail recebido com PDF anexo, sem propagação de dados reais na fase de testes.
6. Realizar homologação funcional e de privacidade antes de abrir o questionário às unidades.

### Limites e salvaguardas

A autoavaliação é declaratória e não gera selo, certificação ou comprovação jurídica de conformidade. Os dados individuais não devem ser divulgados ou reutilizados sem base legal apropriada. Relatórios agregados para o CADI Nacional somente de forma devidamente anonimizada e autorizada. Nenhum dado é transmitido automaticamente ao iniciar o questionário; somente ao acionar o envio após autorização explícita.

## Arquivos

- \`cadi/index.html\`: frontend de avaliação e PDF.
- \`cadi/api-worker.mjs\`: endpoint Cloudflare Worker que valida Turnstile e encaminha o PDF por Resend.
- \`cadi/README.md\`: orientação de operação e publicação.
