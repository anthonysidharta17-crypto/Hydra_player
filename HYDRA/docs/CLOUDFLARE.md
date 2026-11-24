# Publicação HYDRA API no Cloudflare

Este pacote reutiliza o D1 já criado. Não crie outro banco.

## 1. Preparar a referência ao D1 existente

1. Abra `wrangler.toml`.
2. Confirme que `database_name` corresponde ao nome exato do D1 existente. O pacote está preenchido com `hydra-player-db` como nome de referência; se o banco existente tiver outro nome, substitua somente esse nome.
3. No Cloudflare, abra D1 > banco existente > visão geral e copie o Database ID.
4. Substitua `PREENCHER_COM_O_ID_DO_D1_EXISTENTE` em `database_id` pelo ID real. Não compartilhe esse ID publicamente.
5. Confirme que `binding = "DB"` permanece igual.

## 2. Instalar e autenticar Wrangler

Na pasta do projeto:

```bash
npm install
npx wrangler login
npx wrangler d1 list
```

Confira que o banco listado é o mesmo D1 já existente.

## 3. Aplicar a migração

Faça backup do D1 antes de qualquer alteração. Depois:

```bash
npx wrangler d1 migrations apply hydra-player-db --remote
```

Se o nome real do banco for diferente, use o nome real. A migração cria as tabelas `customers`, `servers` e `audit_logs` caso ainda não existam. Se o banco já possuir tabelas com esses nomes e estrutura diferente, pare e faça uma migração de compatibilidade; não apague dados nem use DROP TABLE.

## 4. Configurar os segredos

Configure um usuário e uma senha administrativos fortes e exclusivos como segredos `ADMIN_USERNAME` e `ADMIN_PASSWORD`. Não use senha padrão compartilhada.

```bash
npx wrangler secret put ADMIN_USERNAME
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler secret put CREDENTIALS_KEY
```

- `ADMIN_USERNAME` e `ADMIN_PASSWORD`: credenciais privadas do painel administrativo.
- `SESSION_SECRET`: valor aleatório longo, exclusivo do projeto.
- `CREDENTIALS_KEY`: outro valor aleatório longo, exclusivo do projeto; não reutilize `SESSION_SECRET`.

Não coloque esses valores em arquivos do frontend, Git ou mensagens públicas.

## 5. Publicar Worker

```bash
npx wrangler deploy
```

O Worker será publicado como `hydra-api`. Copie a URL `https://hydra-api.<seu-subdominio>.workers.dev` exibida pelo Wrangler.

Teste:

```bash
curl https://hydra-api.<seu-subdominio>.workers.dev/health
```

A resposta deve conter `"ok":true`.

## 6. Configurar o aplicativo

Crie `.env.production` na raiz com:

```env
VITE_CONTROL_API=https://hydra-api.<seu-subdominio>.workers.dev
```

Depois gere o build:

```bash
npm run check
npm run build
```

Para gerar/atualizar a plataforma Android com Capacitor, use o projeto Android configurado no ambiente de desenvolvimento. Este ZIP não inclui um diretório `android/` gerado.

## 7. Primeiro acesso ao painel

Abra `/admin/` na publicação do frontend. Use:

- Usuário e senha: valores privados definidos nos segredos `ADMIN_USERNAME` e `ADMIN_PASSWORD`.

O painel libera login, senha e validade para cada cliente. O host Alfa Fantasma é configurado globalmente no app pela variável `VITE_DEFAULT_XTREAM_SERVER`; não cadastre servidores no painel.

## Observações importantes

- O painel e o aplicativo usam o mesmo Worker.
- O cliente só recebe credenciais após aprovação manual.
- Credenciais Xtream são armazenadas criptografadas no D1.
- O host do Alfa Fantasma é uma configuração global do aplicativo, independente do painel administrativo.
- O Worker não configura a conta Cloudflare sozinho: login, ID do D1, segredos e publicação precisam ocorrer na conta do proprietário.


## Configuração do Alfa Fantasma

Defina `VITE_DEFAULT_XTREAM_SERVER` no ambiente de build do frontend com o endereço-base autorizado do Alfa Fantasma. O painel não armazena nem altera esse endereço.
