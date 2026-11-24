# HYDRA — aplicativo e backend

Pacote de continuidade do projeto HYDRA, preservando o frontend React/Vite/Capacitor original e acrescentando uma implementação inicial do backend Cloudflare Workers + D1.

## O que está incluído

- Aplicativo React/Vite/Capacitor original, com telas de boas-vindas, login, solicitação de acesso, pendência, catálogo, filmes, séries, canais, histórico, favoritos, catch-up, rádio e player.
- Fluxo de cadastro manual: cliente solicita acesso; administração aprova o cadastro e define login, senha e validade.
- Backend `backend/worker.js` com cadastro, consulta de status, login de cliente, login administrativo e gestão de clientes.
- Migração inicial `backend/migrations/001_hydra_schema.sql`.
- Painel HYDRA ADMIN com autenticação remota e gerenciamento de clientes, sem gerenciamento de servidores.
- Credenciais Xtream criptografadas no D1 por AES-GCM; tokens de sessão assinados por HMAC.
- Endereço do Alfa Fantasma configurado globalmente no app por `VITE_DEFAULT_XTREAM_SERVER`; credenciais de cliente são definidas pelo painel.

## Credenciais administrativas

Configure `ADMIN_USERNAME` e `ADMIN_PASSWORD` como segredos no Cloudflare Worker. Use uma senha forte e exclusiva; nenhuma senha administrativa é incluída neste pacote.

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


## Separação entre administração e conteúdo

O painel administrativo gerencia somente clientes, credenciais de acesso, situação e vencimento. Ele não cadastra nem escolhe servidores. O endereço do Alfa Fantasma é configurado globalmente no aplicativo pela variável `VITE_DEFAULT_XTREAM_SERVER`; as credenciais liberadas no painel são usadas pelo aplicativo para autenticar nesse servidor. A tabela `servers` pode permanecer no banco por compatibilidade com instalações anteriores, mas não é usada pelo fluxo administrativo atual.

O player inclui carregamento manual de legendas externas `.srt` e `.vtt` no menu **Áudio e legendas**. Arquivos SRT são convertidos para WebVTT em memória no aparelho.

## Configuração necessária antes do build

Preencha `VITE_DEFAULT_XTREAM_SERVER` no arquivo `.env` local com o endereço-base fornecido para o Alfa Fantasma. Esse endereço é configuração global do aplicativo, não é solicitado nem administrado no painel. Configure também `VITE_CONTROL_API` com o endereço do Worker. No Cloudflare, configure os segredos `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_SECRET` e `CREDENTIALS_KEY`, além do binding D1 `DB`. Não coloque esses segredos no ZIP ou no repositório.

O suporte a legendas externas já está no player: durante a reprodução, abra **Áudio e legendas** e escolha **Carregar arquivo (.srt ou .vtt)**. A legenda é carregada localmente no aparelho; não é enviada ao servidor.
