import { useMemo } from 'react'
import MediaGrid from '../components/MediaGrid'
import { useApp } from '../context/AppContext'
import { TYPE_LABEL } from '../core/catalog'
export default function MyList() {
  const { favorites } = useApp()
  const groups = useMemo(() => ['movie','series','live'].map(type=>[type,favorites.filter(f=>f.type===type)]).filter(([,list])=>list.length),[favorites])
  if (!favorites.length) return <p className="empty-note">Sua lista está vazia. Toque no coração de um título para guardá-lo aqui.</p>
  return <div>{groups.map(([type,list])=><section key={type} className="result-block"><div className="section-head"><h2>{TYPE_LABEL[type]}</h2><small>{list.length}</small></div><MediaGrid items={list}/></section>)}</div>
}
