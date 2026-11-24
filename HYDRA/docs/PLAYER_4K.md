# HYDRA Player — diagnóstico e limites 4K

## Implementação presente no pacote

O frontend utiliza:
- HLS.js para streams HLS quando Media Source Extensions são suportadas.
- mpegts.js para MPEG-TS/FLV quando o navegador suporta MSE.
- dash.js para MPEG-DASH.
- elemento HTML5 `<video>` para reprodução nativa dos formatos aceitos pelo WebView.
- detecção de capacidades para H.264, HEVC, AV1, VP9, AC3/EAC3, MKV, HLS nativo e MSE.
- tentativas de recuperação de falhas de rede e mídia e mensagens localizadas.

## Por que ainda pode aparecer “Não suportado”

Resolução 4K não é um codec. A reprodução depende da combinação de container, protocolo, codec, perfil, bit depth, áudio, DRM (se houver), navegador/WebView e decodificador físico do aparelho. Um dispositivo pode suportar 4K H.264 e não suportar HEVC Main10 ou áudio E-AC3.

HLS.js, mpegts.js e dash.js não adicionam codecs ao Android WebView; eles entregam os segmentos ao pipeline de mídia que o dispositivo já oferece. Trocar a extensão de um URL também não converte o vídeo.

## Próxima etapa nativa necessária para máxima compatibilidade Android

Implementar um plugin Capacitor Android com AndroidX Media3/ExoPlayer, incluindo:
- reprodução HLS, DASH, Progressive/MP4 e MPEG-TS conforme suporte do Media3;
- consulta de decodificadores disponíveis no dispositivo;
- seleção de decoder por hardware quando compatível;
- seleção de faixas de áudio e legendas;
- tratamento de erros Media3 com códigos e mensagens úteis;
- callbacks de estado, posição, duração e buffer para a interface React;
- testes em cada modelo de TV/celular alvo.

Não declarar suporte universal a HEVC Main10, AC3/EAC3 ou Dolby Vision sem testes nos aparelhos-alvo. O decoder de hardware e as licenças/recursos do dispositivo determinam parte da compatibilidade.

## Matriz de teste recomendada

Use somente streams de teste autorizados e registre modelo do aparelho, versão Android/WebView, protocolo, container, codec, perfil, resolução, áudio e resultado:

- MP4 H.264 + AAC 1080p;
- MP4 H.264 + AAC 4K;
- HLS H.264;
- HLS HEVC 4K;
- HEVC Main10 4K;
- HEVC + AC3/E-AC3;
- MPEG-TS H.264;
- MPEG-TS HEVC;
- DASH H.264/HEVC.

O diagnóstico deve separar erro de rede/servidor (401, 403, 404, 5xx, timeout) de erro de demux, codec, áudio ou decodificador.
