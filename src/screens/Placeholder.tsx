import { useEffect, useRef, useState } from 'react'
import { findByRoute } from '../data/nav'
import { ACTIVITY, DAYS, EVENT, TASKS, TICKETS } from '../data/pulpit'
import { useApp } from '../store'
import { Avatar, Empty, Icon, InsetCard, PageHead, Status } from '../components/ui'
import { gridStyle, TableHead, type Col } from '../components/Table'

/* Pulpit doradcy (brief, punkt 2): u góry „Pulpit” i „Odśwież”; w głównej kolumnie lista pracy z roli
   („Ostatnia aktywność moich klientów”), obok dwie stałe sekcje: „Moje otwarte zadania” i „Moje zgłoszenia”.
   Kilka pierwszych wierszy + „Zobacz wszystkie”. Stany listy do podglądu: ?stan=pusty, ?stan=blad. */
const now = () => new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

export function Home() {
  const { route, notify, user } = useApp()
  const stan = route.params.get('stan')
  const [busy, setBusy] = useState(true)
  const [at, setAt] = useState(now)
  const [failed, setFailed] = useState(stan === 'blad')
  const [done, setDone] = useState<Set<string>>(new Set())
  const t = useRef<number>()

  // dane odświeżają się przy wejściu i na żądanie
  const load = (fail = false) => {
    setBusy(true); window.clearTimeout(t.current)
    t.current = window.setTimeout(() => { setBusy(false); setFailed(fail); setAt(now()) }, 650)
  }
  useEffect(() => { load(stan === 'blad'); return () => window.clearTimeout(t.current) }, [stan]) // eslint-disable-line react-hooks/exhaustive-deps

  const activity = stan === 'pusty' ? [] : ACTIVITY
  const open = TASKS.filter(x => !done.has(x.id))
  const todayN = open.filter(x => x.tone === 'today' || x.tone === 'late').length
  const lateN = open.filter(x => x.tone === 'late').length
  const newN = activity.filter(a => a.day === 'd0').length
  const date = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
  const hello = new Date().getHours() >= 18 ? 'Dobry wieczór' : 'Dzień dobry'
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const toggle = (id: string, title: string) => {
    setDone(s => { const n = new Set(s); n.add(id); return n })
    notify(`Wykonano: ${title}`, { label: 'Cofnij', run: () => setDone(s => { const n = new Set(s); n.delete(id); return n }) })
  }

  return (
    <>
      <PageHead icon="home" title="Pulpit" meta={<span className="num">Zaktualizowano {at}</span>}>
        <button className="btn btn-secondary" onClick={() => load(false)} disabled={busy} aria-busy={busy}>
          <Icon name="refresh-cw" size={14} className={busy ? 'spin' : undefined} />Odśwież
        </button>
      </PageHead>
      <div className="page dash">
        {/* ---------- dzień w skrócie: karta z gradientem jak w Moim profilu ---------- */}
        <header className="dash-hero">
          <p className="dash-date">{date.charAt(0).toUpperCase() + date.slice(1)}</p>
          <h2 className="dash-hi">{hello}, {user.name.split(' ')[0]}</h2>
          <p className="dash-where">{user.title}{user.pok && <> · {user.pok}</>}</p>
          <div className="dash-stats">
            <button className="dash-stat" onClick={() => jump('dash-tasks')} disabled={busy}>
              <span className="dash-stat-n num">{busy ? '–' : todayN}</span><span className="dash-stat-l">{todayN === 1 ? 'zadanie' : 'zadania'} na dziś</span>
            </button>
            <button className={`dash-stat ${lateN ? 'late' : ''}`} onClick={() => jump('dash-tasks')} disabled={busy}>
              <span className="dash-stat-n num">{busy ? '–' : lateN}</span><span className="dash-stat-l">po terminie</span>
            </button>
            <button className="dash-stat" onClick={() => jump('dash-act')} disabled={busy || failed}>
              <span className="dash-stat-n num">{busy || failed ? '–' : newN}</span><span className="dash-stat-l">{newN === 1 ? 'nowe zdarzenie' : 'nowe zdarzenia'} klientów dziś</span>
            </button>
          </div>
        </header>

        <div className="dash-cols">
          {/* ---------- lista pracy doradcy ---------- */}
          <InsetCard className="dash-main" icon="activity" title="Ostatnia aktywność moich klientów" id="dash-act"
            count={busy || failed ? undefined : activity.length}
            right={!busy && !failed && activity.length > 0 && <a className="btn btn-ghost btn-sm" href="#/m/aktywnosci/historia-kontaktow" aria-label="Zobacz całą aktywność klientów">Zobacz wszystkie<Icon name="arrow-right" size={14} /></a>}>
          {busy ? <Skeleton rows={6} />
            : failed ? <Empty danger icon="alert-circle" title="Nie udało się pobrać aktywności" hint="Sprawdź połączenie i spróbuj jeszcze raz."
                action={<button className="btn btn-secondary" onClick={() => load(false)}><Icon name="refresh-cw" size={14} />Spróbuj ponownie</button>} />
            : activity.length === 0 ? <Empty icon="inbox" title="Brak nowej aktywności klientów" hint="Nowe formularze, zapisy i przydziały pojawią się tutaj." />
            : Object.keys(DAYS).map(d => {
                const rows = activity.filter(a => a.day === d)
                if (!rows.length) return null
                return (
                  <div key={d} className="dash-day" role="group" aria-label={DAYS[d]}>
                    <div className="dash-day-h">{DAYS[d]}</div>
                    {rows.map(a => (
                      <a key={a.id} className="dash-ev" href="#/m/klienci/klienci">
                        <span className="dash-time num">{a.time}</span>
                        <Avatar initials={a.initials} color={a.color} size={24} />
                        <span className="two"><span className="trunc">{a.client}</span><span className="meta trunc">{a.what}</span></span>
                        <span className={`evt evt-${a.kind}`}><Icon name={EVENT[a.kind].icon} size={12} />{EVENT[a.kind].label}</span>
                        <Icon name="chevron-right" size={14} className="dash-go" />
                      </a>
                    ))}
                  </div>
                )
              })}
        
          </InsetCard>

          <div className="dash-side">
            <InsetCard icon="check-square" title="Moje otwarte zadania" id="dash-tasks" count={busy ? undefined : open.length}
              right={!busy && <a className="btn btn-ghost btn-sm dash-more" href="#/m/aktywnosci/spotkania" aria-label="Zobacz wszystkie zadania" title="Zobacz wszystkie"><Icon name="arrow-right" size={14} /></a>}>
          {busy ? <Skeleton rows={3} compact />
            : open.length === 0 ? <Empty icon="check" title="Wszystko zrobione" hint="Nowe zadania pojawią się tutaj." />
            : <ul className="dash-list">
                {open.map(x => (
                  <li key={x.id} className="dash-task">
                    <button className="dash-check" onClick={() => toggle(x.id, x.title)} aria-label={`Oznacz jako wykonane: ${x.title}`}><Icon name="check" size={12} /></button>
                    <span className="two"><span className="trunc">{x.title}</span>{x.client && <span className="meta trunc">{x.client}</span>}</span>
                    <span className={`due due-${x.tone}`} title={x.tone === 'late' ? 'Po terminie' : 'Termin'}><Icon name={x.tone === 'late' ? 'alert-circle' : 'calendar'} size={12} />{x.due}{x.tone === 'late' && <span className="sr-only"> (po terminie)</span>}</span>
                  </li>
                ))}
              </ul>}
        
            </InsetCard>
            <InsetCard icon="inbox" title="Moje zgłoszenia" id="dash-tickets" count={busy ? undefined : TICKETS.length}>
          {busy ? <Skeleton rows={3} compact />
            : <ul className="dash-list">
                {TICKETS.map(x => (
                  <li key={x.id}>
                    <a className="dash-ticket" href={x.id.startsWith('W-') ? `#/moje-dostepy/wnioski?w=${x.id}` : '#/m/it/zgloszenia-it'}>
                      <span className="two"><span className="trunc">{x.title}</span><span className="meta trunc"><span className="num">{x.id}</span> · {x.when}</span></span>
                      <Status tone={x.tone}>{x.status}</Status>
                    </a>
                  </li>
                ))}
              </ul>}
        
            </InsetCard>
          </div>
        </div>
      </div>
    </>
  )
}

function Skeleton({ rows, compact }: { rows: number; compact?: boolean }) {
  return (
    <div className="dash-sk" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`dash-sk-r ${compact ? 'c' : ''}`}>
          {!compact && <span className="sk" style={{ width: 34 }} />}
          {!compact && <span className="sk" style={{ width: 24, height: 24, borderRadius: 12 }} />}
          <span className="dash-sk-t"><span className="sk" style={{ width: `${55 - (i % 3) * 10}%` }} /><span className="sk" style={{ width: `${80 - (i % 2) * 20}%`, height: 8 }} /></span>
        </div>
      ))}
    </div>
  )
}

const W = [[150, 110], [120, 90], [70, 50], [90, 70], [100, 80], [80, 110], [110, 70]]
const SK_COLS: Col[] = W.map((_, i) => ({ key: 'k' + i, label: `Kolumna ${i + 1}`, icon: 'minus', width: i === 0 ? 'minmax(200px,1.4fr)' : 'minmax(120px,1fr)' }))

/* Moduły bez zaprojektowanej treści: ten sam szkielet głównej tabeli co Transakcje, z szarymi wierszami */
export function ModulePage({ path }: { path: string }) {
  const hit = findByRoute(path)
  if (!hit) return <NotFound />
  return (
    <div className="mtable">
      <header className="mt-head">
        <span className="ph-i"><Icon name={hit.sec.icon} /></span>
        <h1>{hit.item.label}</h1>
        <span className="vsep" />
        <span className="muted">— rekordów</span>
        <span className="grow" />
        <button className="btn btn-secondary" disabled><Icon name="upload" size={14} />Importuj</button>
        <button className="btn btn-primary" disabled><Icon name="plus" size={14} />Utwórz</button>
      </header>
      <div className="fbar">
        <span className="pill on chip-pill" aria-disabled="true">Tylko moje elementy<Icon name="x" size={14} /></span>
        <span className="fsep" />
        <span className="nav-btn" aria-disabled="true"><Icon name="zap" size={14} />Szybki filtr</span>
        <span className="nav-btn" aria-disabled="true"><Icon name="sliders" size={14} />Zaawansowany filtr</span>
      </div>
      <div className="tscroll">
        <div className="ttable" aria-hidden="true">
          <TableHead cols={SK_COLS} />
          {Array.from({ length: 12 }, (_, r) => (
            <div key={r} className="tcols trow" style={gridStyle(SK_COLS)}>{W.map((x, i) => <div key={i}><span className="sk" style={{ width: x[r % 2] }} /></div>)}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function NotFound() {
  return (
    <>
      <PageHead icon="alert-circle" title="Nie znaleziono" />
      <div className="page"><Empty icon="compass" title="Tej strony nie ma" hint="Adres mógł się zmienić albo moduł jest ukryty w menu."
        action={<a className="btn btn-secondary" href="#/pulpit">Pulpit</a>} /></div>
    </>
  )
}
