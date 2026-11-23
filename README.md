# Hydra Player — pacote de projeto

Projeto React + Vite para reprodução de conteúdos fornecidos por um servidor Xtream autorizado. O aplicativo não fornece canais, filmes ou séries.

## Recursos incluídos neste pacote
- Login Xtream e armazenamento local de sessão conforme preferência.
- Catálogo de TV ao vivo, filmes e séries, categorias, pesquisa e favoritos.
- Detalhes de filmes/séries, temporadas e episódios.
- Player com tentativas de formatos HLS, MPEG-TS/FLV, DASH e reprodução nativa conforme suporte do navegador/aparelho.
- Controles de reprodução, áudio/legendas quando expostos pelo stream, legenda externa SRT/VTT, tela cheia e suporte a teclado/controle remoto.
- Histórico e retomada de reprodução, preferências do player.
- Telas de Rádio (com favoritos), Catch-up, Minha conta (atualiza os dados do servidor), suporte Hydra e histórico, com disponibilidade condicionada ao que o provedor Xtream oferece.
- Botão Voltar do Android volta à página anterior; na tela Início pergunta se quer sair.
- Continuar assistindo (Início e menu), aba Assistidos, marcação de episódios vistos e retomada de onde parou.
- Formato da imagem no player (Ajustar, Preencher, Esticar) e tela sempre ligada durante o vídeo.
- Configurações de reprodução ligadas ao player (áudio, legenda, retomar, salto, próximo episódio).
- Splash com três cabeças da Hidra animadas. O arquivo original `public/logo.svg` foi preservado.

## Instalar e executar
Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
npm run build
```

## Gerar o APK (pelo celular)
1. GitHub → Actions → **Gerar APK** → Run workflow.
2. Quando terminar, o APK aparece em **Releases** (`Hydra-Player.apk`).
3. O APK usa a chave fixa `signing/hydra-debug.keystore` (de debug, não é segredo). Por isso um APK novo instala por cima do anterior, sem desinstalar. Só o primeiro APK desta versão exige desinstalar o antigo.

O site (GitHub Pages) só publica se você rodar **Publicar site** manualmente; o app é o APK.

## Configuração
Confira `src/config.js` para o endereço do servidor configurado. As credenciais são informadas pelo usuário no login. Não coloque senhas nem chaves privadas no código.

## Ainda não incluído
Abrir em VLC/MX Player por intent nativo, importar listas M3U, backup/restauração e atualização de EPG.

## Limitações importantes
- Rádio depende de streams de rádio presentes no provedor. A tela não cria estações que o servidor não forneça.
- Catch-up depende de `tv_archive` e suporte de timeshift compatível no servidor; nem todos os provedores implementam o mesmo formato.
- Sinopses vêm dos metadados entregues pelo servidor. Integração externa TMDB/API e chave de servidor não estão configuradas neste pacote; títulos sem sinopse podem continuar sem sinopse.
- O suporte Hydra presente é um assistente local baseado em regras/diagnóstico, não um serviço de IA remoto com backend.
- Reprodução varia por codec, CORS, protocolo, dispositivo e permissões do provedor. Build web/APK bem-sucedido não garante reprodução de todos os streams.
- O projeto é uma aplicação web empacotada para Android; navegação em Android TV/TV Box precisa ser validada em hardware real.

## Testes
`npm run build` valida compilação e resolução de módulos. Teste de reprodução real exige credenciais válidas e streams autorizados de teste.
