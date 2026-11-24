# HYDRA — aplicativo e backend

Pacote de continuidade do projeto HYDRA, preservando o frontend React/Vite/Capacitor original e acrescentando uma implementação inicial do backend Cloudflare Workers + D1.

## O que está incluído

- Aplicativo React/Vite/Capacitor original, com telas de boas-vindas, login, solicitação de acesso, pendência, catálogo, filmes, séries, canais, histórico, favoritos, catch-up, rádio e player.
- Fluxo de cadastro manual: cliente solicita acesso; administração aprova e associa credenciais Xtream e servidor.
- Backend `backend/worker.js` com cadastro, consulta de status, login de cliente, login administrativo, clientes e servidores.
- Migração inicial `backend/migrations/001_hydra_schema.sql`.
- Painel HYDRA ADMIN com autenticação remota e gerenciamento básico de servidores.
- Credenciais Xtream criptografadas no D1 por AES-GCM; tokens de sessão assinados por HMAC.
- Endereço do servidor Xtream entregue pela liberação do cliente; o host fixo antigo foi removido do fluxo principal.

## Credenciais administrativas

O usuário inicial esperado é `Adriel123`. A senha inicial informada no projeto é `adriel123@`, mas ela deve ser configurada como segredo `ADMIN_PASSWORD` no Cloudflare Worker. Não está gravada no HTML nem no frontend.

## O que ainda exige ação na conta Cloudflare

O ZIP não consegue publicar um Worker na conta do proprietário nem descobrir um Database ID privado sem autenticação. O arquivo `wrangler.toml` já usa o nome de Worker `hydra-api`, binding `DB` e nome de banco esperado `hydra-player-db`, mas o campo `database_id` precisa conter o ID real do D1 existente. Não crie um segundo D1.

Siga `docs/CLOUDFLARE.md` na ordem indicada. Depois de publicar, defina `VITE_CONTROL_API` com a URL pública do Worker e gere o APK.

## Player e 4K

O projeto mantém HLS.js, mpegts.js, dash.js e reprodução nativa HTML5. O player detecta capacidades do navegador/dispositivo e explica erros de codec/rede. Isso melhora a compatibilidade web, mas não transforma automaticamente o WebView Android em um decodificador HEVC/4K universal. Para suporte mais amplo a HEVC Main10, AC3/EAC3 e perfis 4K específicos, ainda é necessária integração e teste em dispositivo real com Android Media3/ExoPlayer nativo. Consulte `docs/PLAYER_4K.md`.

## Comandos locais

```bash
npm install
npm run check
npm run build
```

Não há geração automática de testes nem integração Sigma. A liberação de acesso permanece manual.
