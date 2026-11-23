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


## Entrada do cliente e administração (v1.7.0)
- A primeira tela oferece duas opções: entrar com credenciais existentes ou solicitar cadastro.
- O formulário de cadastro fica acessível também em telas pequenas/celulares.
- O cliente cadastrado acompanha o status aguardando liberação e depois usa o acesso liberado manualmente.
- A página administrativa possui uma tela de entrada própria. **A autenticação visual atual é temporária e client-side; não deve ser considerada proteção de produção.** A validação segura das credenciais administrativas deverá ser feita no backend quando a etapa Cloudflare for configurada.
