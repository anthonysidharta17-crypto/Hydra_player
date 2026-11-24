# HYDRA — atualização do aplicativo

## Fluxo de acesso definido
1. O cliente abre o HYDRA na TV e informa nome e contato.
2. O perfil é criado com status `pending` e aparece na administração como aguardando liberação.
3. A administração escolhe manualmente o perfil, informa usuário e senha Xtream e seleciona acesso normal ou teste.
4. Ao salvar, o status passa a `active`. O app consulta o próprio cadastro periodicamente e recebe as credenciais para validar no servidor Xtream.
5. Nenhum teste é criado automaticamente. Não existe integração Sigma.

## Arquivos que acompanham a atualização
- `src/`: aplicativo HYDRA.
- `admin/index.html`: portal de administração manual.
- `public/admin/index.html`: cópia do portal incluída no mesmo pacote web do aplicativo.
- `src/core/registration.js`: cadastro e consulta de liberação pelo app.

## Publicação conjunta
O Vite copia `public/` para `dist/`. Assim, o portal fica em `/admin/` no mesmo pacote estático que contém o app web. A administração e o aplicativo usam o mesmo contrato de serviço e a mesma publicação de frontend. A conexão real entre dispositivos depende do serviço remoto e será configurada na etapa posterior de infraestrutura.

## Infraestrutura adiada
Nenhum Worker, banco, migração ou configuração Cloudflare faz parte desta atualização do aplicativo. O app já está preparado para receber `VITE_CONTROL_API` quando a infraestrutura for configurada depois.
