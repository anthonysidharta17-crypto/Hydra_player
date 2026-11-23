import { existsSync } from 'node:fs'
const required = [
  'index.html','package.json','src/App.jsx','src/config.js','src/core/xtream.js',
  'src/player/Player.jsx','src/player/engine.js','src/components/Splash.jsx',
  'src/screens/Radio.jsx','src/screens/Catchup.jsx','src/screens/Account.jsx',
  'src/screens/Support.jsx','public/logo.svg'
]
const missing = required.filter(path => !existsSync(path))
if (missing.length) {
  console.error('Arquivos obrigatórios ausentes:', missing.join(', '))
  process.exit(1)
}
console.log(`Estrutura conferida: ${required.length} arquivos essenciais encontrados.`)
