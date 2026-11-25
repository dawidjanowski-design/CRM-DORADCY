import { useMemo, useState } from 'react'
import { go, useApp } from '../../store'
import { itemState, person as personOf, STATE_LABEL, type ReqItem, type Request } from '../../data/cbu'
import { Avatar, Dialog, Empty, Icon, InsetCard, Segmented, Status } from '../../components/ui'
import { pending } from './Cbu'

type Filter = 'mnie' | 'moje' | 'wszystkie'

function overall(r: Request) {
  const st = r.items.map(itemState)
  if (st.every(s => s.s === 'nadano' || s.s === 'odebrano')) return { label: 'Zakończony', tone: 'ok' as const }
  if (st.every(s => s.s === 'odmowa')) return { label: 'Odmowa', tone: 'danger' as const }
  const done = st.filter(s => s.s === 'nadano' || s.s === 'odebrano').length
  if (done) return { label: `${done} z ${st.length} gotowe`, tone: 'warn' as const }
  if (st.some(s => s.s === 'do_wykonania')) return { label: 'Czeka na IT', tone: 'warn' as const }
  return { label: 'W toku', tone: 'info' as const }
}

export function Requests() {
  const { user: persona, requests, route } = useApp()
  const mineWaiting = pending(requests)
  const visible = requests
  const [filter, setFilter] = useState<Filter>(mineWaiting.length ? 'mnie' : 'moje')
  const list = filter === 'mnie' ? mineWaiting : filter === 'moje' ? visible.filter(r => r.person === persona.name || r.author === persona.name) : visible
  const wanted = route.params.get('w')
  const selected = visible.find(r => r.id === wanted) ?? list[0]

  const opts = [
    { value: 'mnie' as const, label: <>W toku{mineWaiting.length > 0 && <span className="count">{mineWaiting.length}</span>}</> },
    { value: 'moje' as const, label: 'Moje' },
    { value: 'wszystkie' as const, label: 'Wszystkie' },
  ]

  return (
    <div className="page split wide">
      <InsetCard className="split-l" title={<Segmented label="Filtr wniosków" value={filter} onChange={f => { setFilter(f); go('uprawnienia/wnioski') }} options={opts} />}>
        {list.length === 0
          ? <Empty icon="check" title={filter === 'mnie' ? 'Nic nie czeka na decyzję ani wykonanie' : 'Brak wniosków'} hint={filter === 'moje' ? 'Złożone wnioski i ich status zobaczysz tutaj.' : undefined} />
          : <div className="rows plist" role="listbox" aria-label="Wnioski">
              {list.map(r => {
                const o = overall(r); const p = personOf(r.person)
                return (
                  <button key={r.id} className={`r ${r.id === selected?.id ? 'sel' : ''}`} role="option" aria-selected={r.id === selected?.id} onClick={() => go(`uprawnienia/wnioski?w=${r.id}`)}>
                    {p && <Avatar initials={p.initials} color={p.color} size={24} />}
                    <span className="two"><span className="trunc">{r.person}<span className="dim num"> · {r.id}</span></span>
                      <span className="meta trunc">{r.items[0].op === 'odebranie' ? 'Odebranie: ' : ''}{r.items.map(i => i.what).join(', ')}</span></span>
                    <Status tone={o.tone}>{o.label}</Status>
                  </button>
                )
              })}
            </div>}
      </InsetCard>
      {selected ? <RequestDetail key={selected.id} r={selected} /> : <div className="split-r" />}
    </div>
  )
}

function RequestDetail({ r }: { r: Request }) {
  const p = personOf(r.person)
  return (
    <div className="split-r">
      <div className="person-h">
        {p && <Avatar initials={p.initials} color={p.color} size={32} />}
        <div style={{ minWidth: 0 }}>
          <h2 className="ent-title"><span className="num">{r.id}</span> · {r.person}</h2>
          <p className="muted trunc" style={{ marginTop: 2 }}>Złożony {r.createdAt}{r.author !== r.person && ` przez ${r.author}`} · {r.items.length} {r.items.length === 1 ? 'pozycja' : 'pozycje'}</p>
        </div>
      </div>
      <div className="quote"><span className="dim" style={{ fontSize: 12 }}>Uzasadnienie</span><p>{r.reason}</p></div>
      {r.items.map(it => <ItemCard key={it.id} r={r} it={it} />)}
    </div>
  )
}

function ItemCard({ r, it }: { r: Request; it: ReqItem }) {
  const { decide, execute, notify } = useApp()
  const st = itemState(it); const lab = STATE_LABEL(st)
  const [refuse, setRefuse] = useState(false)
  const [why, setWhy] = useState('')
  const [tried, setTried] = useState(false)
  const [hist, setHist] = useState(false)
  // bez ról: osoba decydująca widzi „Zatwierdź” i „Odmów” przy bieżącym kroku
  const myTurn = st.s === 'czeka'
  const itTurn = st.s === 'do_wykonania'
  const waitingFor = st.s === 'czeka' ? `${st.step.who} (${st.step.role.toLowerCase()})` : st.s === 'do_wykonania' ? 'IT: ręczne wykonanie' : null

  const steps = useMemo(() => [
    ...it.steps.map(s => ({ label: s.role, who: s.who, state: s.decision === 'ok' ? 'ok' : s.decision === 'no' ? 'no' : (st.s === 'czeka' && st.step === s ? 'now' : 'todo'), at: s.at })),
    { label: 'Wykonanie', who: it.exec === 'auto' ? 'MS OS automatycznie' : 'IT ręcznie', state: it.executed ? 'ok' : st.s === 'do_wykonania' ? 'now' : 'todo', at: it.executed?.at },
  ], [it, st])

  // po decyzji wniosek zostaje otwarty, choć znika z filtra „Czeka na mnie”
  const keep = () => go(`uprawnienia/wnioski?w=${r.id}`)
  const approve = () => { decide(r.id, it.id, 'ok'); keep(); notify(`Zatwierdzono: ${it.what}. Teraz decyduje kolejna osoba.`) }
  const doRefuse = () => {
    setTried(true)
    if (why.trim().length < 5) return
    decide(r.id, it.id, 'no', why.trim()); setRefuse(false); keep(); notify(`Odmówiono: ${it.what}. Wnioskujący zobaczy powód.`)
  }

  return (
    <InsetCard title={<span className="trunc">{it.op === 'odebranie' ? 'Odebranie' : 'Nadanie'} · pozycja {it.id}</span>} right={<Status tone={lab.tone}>{lab.label}</Status>}>
      <div className="item">
        <div className="item-top">
          <span className="tile"><Icon name={it.system === 'MS OS' ? (it.kind === 'rola' ? 'users' : 'unlock') : 'folder'} size={14} /></span>
          <span className="two"><span style={{ color: 'var(--t-strong)' }}>{it.what}</span>
            <span className="meta">{[it.level, it.scope, it.system].filter(Boolean).join(' · ')}</span></span>
        </div>
        <ol className="track" aria-label="Ścieżka decyzji">
          {steps.map((s, i) => (
            <li key={i} className={`t-${s.state}`}>
              <span className="t-dot">{s.state === 'ok' ? <Icon name="check" size={12} /> : s.state === 'no' ? <Icon name="x" size={12} /> : <span className="num">{i + 1}</span>}</span>
              <span className="two"><span>{s.label}</span><span className="meta trunc">{s.who}{s.at && ` · ${s.at}`}</span></span>
            </li>
          ))}
        </ol>
        {st.s === 'odmowa' && st.step.reason && <div className="refusal"><Icon name="x-circle" size={14} /><div><b>{st.step.who} odmówił(a)</b><p>{st.step.reason}</p></div></div>}
        {waitingFor && !myTurn && !itTurn && <p className="muted">Czeka na: <span style={{ color: 'var(--t)' }}>{waitingFor}</span></p>}
        {(myTurn || itTurn) && (
          <div className="decide">
            <span className="udot" /><span>{myTurn && st.s === 'czeka' ? <>Decyzja: <b>{st.step.who}</b> ({st.step.role.toLowerCase()})</> : 'IT wykonuje zmianę ręcznie i potwierdza ją tutaj'}</span>
            <span className="grow" />
            {myTurn && <><button className="btn btn-secondary" onClick={() => { setRefuse(true); setWhy(''); setTried(false) }}>Odmów</button>
              <button className="btn btn-primary" onClick={approve}><Icon name="check" size={14} />Zatwierdź</button></>}
            {itTurn && <button className="btn btn-primary" onClick={() => { execute(r.id, it.id); keep(); notify(`Potwierdzono wykonanie: ${it.what}`) }}><Icon name="check" size={14} />Potwierdź wykonanie</button>}
          </div>
        )}
        <button className="btn btn-ghost btn-sm hist-t" aria-expanded={hist} onClick={() => setHist(h => !h)}>
          <Icon name={hist ? 'chevron-down' : 'chevron-right'} size={14} />Historia pozycji<span className="count">{it.history.length}</span></button>
        {hist && <ul className="hist">{it.history.map((h, i) => <li key={i}><span className="when num">{h.at}</span><span><b>{h.who}</b> {h.text.charAt(0).toLowerCase() + h.text.slice(1)}</span></li>)}</ul>}
      </div>
      <Dialog open={refuse} onClose={() => setRefuse(false)} title={`Odmówić: ${it.what}?`} sub={`${r.person} zobaczy powód odmowy przy tej pozycji. Pozostałe pozycje wniosku nie zmienią się.`}
        footer={<><button className="btn btn-ghost" onClick={() => setRefuse(false)}>Anuluj</button><button className="btn btn-primary" onClick={doRefuse}>Odmów</button></>}>
        <div className="field">
          <label htmlFor={`why-${r.id}-${it.id}`}>Powód odmowy</label>
          <textarea id={`why-${r.id}-${it.id}`} className="textarea" value={why} onChange={e => setWhy(e.target.value)} aria-invalid={tried && why.trim().length < 5} placeholder="Np. dostęp nie jest potrzebny na tym stanowisku" />
          {tried && why.trim().length < 5 && <p className="err"><Icon name="alert-circle" size={14} />Podaj powód. Wnioskujący musi wiedzieć, dlaczego odmówiono.</p>}
        </div>
      </Dialog>
    </InsetCard>
  )
}
