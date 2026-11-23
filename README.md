# Hydra Player

Player de IPTV em português do Brasil para **conteúdo autorizado** (não fornece canais, filmes nem séries). Entra com usuário e senha de um servidor Xtream Codes.

**Estado: etapa 1 de 5** (estrutura e login). As demais telas aparecem no menu como "chega na etapa N".

## Como rodar pelo celular (GitHub)
1. Suba o conteúdo desta pasta na raiz do repositório (branch `main`).
2. **Site:** em Settings → Pages, escolha "GitHub Actions". O workflow *Publicar site* roda a cada push.
3. **APK:** aba Actions → *Gerar APK (Android)* → Run workflow. O APK aparece em Releases.

## Servidor
Fica numa constante em `src/config.js` (`SERVER`). Troque só essa linha.

## Regras do login
- Usuário e senha ficam gravados no aparelho até a pessoa trocar ou esquecer (Configurações).
- "Sair" não apaga o acesso: os campos voltam preenchidos e o app não entra sozinho.
- Nenhum erro (rede, senha recusada, assinatura vencida) apaga o acesso salvo.
- Desmarcar "Manter meu acesso salvo" faz o app não gravar a senha.
- URLs do Xtream (que carregam usuário e senha) nunca são gravadas.

## Estrutura
```
src/
  config.js        servidor e versão
  routes.js        itens do menu
  core/            storage.js, xtream.js (e, nas próximas etapas, m3u, epg, ia…)
  hooks/           useAuth, usePrefs, useRoute, useDpad (setas/controle remoto)
  components/      Logo, Splash, Shell
  screens/         Login, Settings, Placeholder (uma tela por arquivo)
  styles/          base.css, auth.css, shell.css
```
