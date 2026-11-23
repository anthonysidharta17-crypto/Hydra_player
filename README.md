# Hydra Player

Projeto do aplicativo Hydra Player com catálogo Xtream, player, histórico, favoritos, catch-up, rádio, configurações e fluxo de cadastro com liberação manual.

## Fluxo de acesso
- O cliente faz o cadastro no aplicativo da TV com nome e contato.
- O perfil fica aguardando liberação.
- Na administração, você informa manualmente usuário e senha Xtream, escolhe acesso normal ou teste e libera.
- O aplicativo consulta o status e, após a liberação, recebe as credenciais e valida o acesso.
- Não há geração automática de testes nem integração Sigma.

## Administração
O portal visual está em `admin/index.html` e também em `public/admin/index.html`, para acompanhar o mesmo pacote de frontend em `/admin/`.

## Configuração futura
A URL do serviço remoto será definida posteriormente pela variável `VITE_CONTROL_API`. A configuração da infraestrutura/Cloudflare foi deixada fora desta atualização, conforme solicitado.

Consulte `docs/APP_UPDATE.md` para o fluxo completo.
