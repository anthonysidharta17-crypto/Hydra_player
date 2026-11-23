import { Home, Search, Tv, Radio, Film, MonitorPlay, History, Heart, UserRound, Settings, Headset } from 'lucide-react'
export const ROUTES = [
  { id: 'inicio', label: 'Início', icon: Home }, { id: 'pesquisar', label: 'Pesquisar', icon: Search },
  { id: 'tv', label: 'TV ao vivo', icon: Tv }, { id: 'radio', label: 'Rádio', icon: Radio },
  { id: 'filmes', label: 'Filmes', icon: Film }, { id: 'series', label: 'Séries', icon: MonitorPlay },
  { id: 'catchup', label: 'Catch-up', icon: History }, { id: 'historico', label: 'Histórico', icon: History },
  { id: 'minha-lista', label: 'Minha lista', icon: Heart }, { id: 'conta', label: 'Minha conta', icon: UserRound },
  { id: 'ajuda', label: 'Ajuda Hydra', icon: Headset }, { id: 'configuracoes', label: 'Configurações', icon: Settings }
]
