import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { go, useApp } from '../store'
import { findByRoute, itemRoute, NAV, NAV_BOTTOM, visibleNav, type NavSection } from '../data/nav'
import { Avatar, Icon, Wordmark, menuKeys, useDismiss } from './ui'

const NARROW = '(max-width: 900px)'

/* Szkielet 1:1 z wireframe'u: pasek L1 przy krawędzi, panel L2 do środka, treść po prawej */
export function Shell({ children }: { children: ReactNode }) {
  const { route, hidden } = useApp()
  const top = useMemo(() => visibleNav(NAV, hidden), [hidden])
  const bottom = useMemo(() => visibleNav(NAV_BOTTOM, hidden), [hidden])
  const all = [...top, ...bottom]
  const hit = findByRoute(route.path)
  const [sec, setSec] = useState(hit?.sec.id ?? 'start')
  const [open, setOpen] = useState(() => !matchMedia(NARROW).matches)
  const [cmd, setCmd] = useState(false)

  useEffect(() => { if (hit) setSec(hit.sec.id) }, [hit?.sec.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setCmd(c => !c) } }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  const current = all.find(s => s.id === sec) ?? all[0]
  // klik w aktywną ikonę zwija panel, w inną: otwiera jej panel
  const pick = (s: NavSection) => {
    if (s.id === current?.id) setOpen(o => !o)
    else { setSec(s.id); setOpen(true) }
  }

  const [tip, setTip] = useState<{ label: string; top: number } | null>(null)
  const [folded, setFolded] = useState<Set<string>>(() => { try { return new Set(JSON.parse(localStorage.getItem('msos.nav.folded') ?? '[]')) } catch { return new Set() } })
  const fold = (key: string) => setFolded(f => {
    const n = new Set(f); if (n.has(key)) n.delete(key); else n.add(key)
    try { localStorage.setItem('msos.nav.folded', JSON.stringify([...n])) } catch { /* tryb prywatny */ }
    return n
  })
  const showTip = (el: HTMLElement, label: string) => { const r = el.getBoundingClientRect(); setTip({ label, top: r.top + r.height / 2 }) }
  // strzałki góra/dół przechodzą między ikonami paska, w kolejności wizualnej
  const railKeys = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const btns = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('.l1'))
    const i = btns.indexOf(document.activeElement as HTMLElement)
    if (i < 0) return
    e.preventDefault()
    btns[(i + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length].focus()
  }
  const rail = (s: NavSection) => (
    <RailBtn key={s.id} s={s} active={s.id === current?.id} open={open} onClick={() => pick(s)}
      onTip={(el) => showTip(el, s.label)} onTipOff={() => setTip(null)} />
  )

  return (
    <div className={`shell ${open && current ? '' : 'panel-closed'}`}>
      {/* górny pasek na całą szerokość: przełącznik panelu nad paskiem ikon, marka nad panelem.
         Zwijanie panelu nie przesuwa ani logo, ani wyszukiwarki. */}
      <header className="appbar">
        <span className="ab-rail">
          <button className="ibtn" onClick={() => setOpen(o => !o)} aria-label={open ? 'Zwiń panel modułu' : 'Pokaż panel modułu'} aria-expanded={open} title={open ? 'Zwiń panel' : 'Pokaż panel'}><Icon name="sidebar" /></button>
        </span>
        <span className="ab-brand"><Brand /></span>
        <button className="search" onClick={() => setCmd(true)} aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K">
          <Icon name="search" size={14} /><span className="trunc">Szukaj…</span><span className="kbd">⌘K</span>
        </button>
        <span className="grow" />
        <Recent />
        <UserMenu />
      </header>
      <div className="shell-body">
      <nav className="rail" aria-label="Moduły" onKeyDown={railKeys}>
        <div className="rail-list">{top.map(rail)}</div>
        {bottom.length > 0 && <span className="rail-sep" />}
        <div className="rail-list">{bottom.map(rail)}</div>
      </nav>
      {tip && <span className="rail-tip" role="tooltip" style={{ top: tip.top }}>{tip.label}</span>}

      {current && (
        <aside className="panel" aria-label={current.label} aria-hidden={!open} {...(open ? {} : { inert: '' })}>
          <div className="panel-sec">
            <span className="panel-ico"><Icon name={current.icon} size={14} /></span>
            <h2>{current.label}</h2>
          </div>
          <div className="panel-body">
            {current.groups.map((g, gi) => {
              const key = `${current.id}/${gi}`
              const shut = !!g.title && folded.has(key)
              return (
                <div key={key} className="pgrp">
                  {g.title && (
                    <button className="plabel" aria-expanded={!shut} aria-controls={`pg-${key}`} onClick={() => fold(key)}>
                      <span className="trunc">{g.title}</span>
                      <Icon name="chevron-down" size={12} className="plabel-chev" />
                    </button>
                  )}
                  <div className={`pgrp-exp ${shut ? '' : 'open'}`} id={`pg-${key}`}>
                    <ul className="pgrp-in" {...(shut ? { inert: '' } : {})}>
                      {g.items.map(it => {
                        const r = itemRoute(current, it)
                        const on = route.path === r
                        return (
                          <li key={it.label}>
                            <a className={`nav ${on ? 'is-on' : ''}`} href={`#/${r}`} aria-current={on ? 'page' : undefined}
                              onClick={() => { if (matchMedia(NARROW).matches) setOpen(false) }}>
                              <span className="trunc">{it.label}</span>
                            </a>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </aside>
      )}
      {open && current && <div className="panel-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="col">
        <main className="card" id="main">{children}</main>
      </div>
      </div>
      <CommandBar open={cmd} onClose={() => setCmd(false)} sections={all} />
    </div>
  )
}

/* Marka: oryginalne logo Michael / Ström, bez zmian w znaku */
function Brand() {
  return (
    <a className="brand" href="#/pulpit" aria-label="MS DOS, Michael / Ström Dom Maklerski. Przejdź do pulpitu">
      <Wordmark width={104} label="" />
    </a>
  )
}

/* Ikona sekcji: sama ikona + podpowiedź z nazwą (najazd i fokus) */
function RailBtn({ s, active, open, onClick, onTip, onTipOff }: {
  s: NavSection; active: boolean; open: boolean; onClick: () => void; onTip: (el: HTMLElement) => void; onTipOff: () => void
}) {
  return (
    <button className={`l1 ${active ? 'is-on' : ''} ${active && !open ? 'folded' : ''}`} onClick={onClick} aria-pressed={active} aria-label={s.label}
      onMouseEnter={e => onTip(e.currentTarget)} onMouseLeave={onTipOff} onFocus={e => { if (e.currentTarget.matches(':focus-visible')) onTip(e.currentTarget) }} onBlur={onTipOff}>
      <Icon name={s.icon} size={18} />
    </button>
  )
}

/* ---------- menu użytkownika w górnym pasku (według briefu): „Mój profil” i „Wyloguj” ---------- */
function UserMenu() {
  const { user } = useApp()
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), [btn, pop], btn)
  const openMenu = () => { setOpen(true); requestAnimationFrame(() => pop.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus()) }
  const act = (to: string) => { setOpen(false); go(to) }
  return (
    <div className="pop-anchor">
      <button ref={btn} className="me" aria-haspopup="menu" aria-expanded={open} aria-label={`Menu użytkownika: ${user.name}`}
        onClick={() => open ? setOpen(false) : openMenu()} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); openMenu() } }}>
        <Avatar initials={user.initials} color={user.color} size={24} />
        <span className="me-name trunc">{user.name}</span>
        <Icon name="chevron-down" size={14} />
      </button>
      <div ref={pop} className={`pop right ${open ? 'open' : ''}`} role="menu" aria-label="Menu użytkownika" style={{ top: 38, right: 0, width: 248 }}
        onKeyDown={e => menuKeys(e, () => setOpen(false))}>
        <div className="m-card" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar initials={user.initials} color={user.color} size={32} />
          <div style={{ minWidth: 0 }}>
            <div className="trunc" style={{ color: 'var(--t-strong)', fontWeight: 600 }}>{user.name}</div>
            <div className="trunc muted" style={{ fontSize: 12, marginTop: 2 }}>{user.title}</div>
          </div>
        </div>
        <div style={{ height: 4 }} />
        <button className="mi" role="menuitem" tabIndex={-1} onClick={() => act('profil')}><Icon name="user" size={14} />Mój profil</button>
        <div className="m-sep" />
        <button className="mi" role="menuitem" tabIndex={-1} onClick={() => act('logowanie?wylogowano=1')}><Icon name="log-out" size={14} />Wyloguj</button>
      </div>
    </div>
  )
}

/* ---------- „Ostatnio przeglądane” ---------- */
const RECENT = [
  { label: 'Transakcje', meta: 'Sprzedaż', to: 'transakcje' },
  { label: 'Klienci', meta: 'Klient', to: 'm/klienci/klienci' },
  { label: 'Moje dostępy', meta: 'Profil', to: 'moje-dostepy' },
]
function Recent() {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), [btn, pop], btn)
  const openMenu = () => { setOpen(true); requestAnimationFrame(() => pop.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus()) }
  return (
    <div className="pop-anchor">
      <button ref={btn} className="btn btn-secondary tb-recent" aria-haspopup="menu" aria-expanded={open}
        onClick={() => open ? setOpen(false) : openMenu()} onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); openMenu() } }}>
        <span>Ostatnio przeglądane</span><Icon name="chevron-down" size={14} />
      </button>
      <div ref={pop} className={`pop right ${open ? 'open' : ''}`} role="menu" aria-label="Ostatnio przeglądane" style={{ top: 34, right: 0, width: 260 }}
        onKeyDown={e => menuKeys(e, () => setOpen(false))}>
        {RECENT.map(i => (
          <button key={i.to} className="mi" role="menuitem" tabIndex={-1} onClick={() => { setOpen(false); go(i.to) }}>
            <Icon name="clock" size={14} /><span className="trunc">{i.label}</span><span className="tail">{i.meta}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- wyszukiwarka ⌘K ----------
   Pusty stan: ostatnio przeglądane i szybkie akcje. Po wpisaniu: moduły pogrupowane według sekcji menu
   (tylko widoczne w menu) i pasujące akcje. Tab przełącza zakres, strzałki wybierają, Enter otwiera. */
type Hit = { id: string; group: string; label: string; sub?: string; icon: string; to: string; kind: 'modul' | 'akcja' }
type Scope = 'all' | 'modul' | 'akcja'
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l')

const ACTIONS: Hit[] = [
  { id: 'a-dostep', group: 'Szybkie akcje', label: 'Poproś o dostęp', sub: 'Uprawnienia', icon: 'key', to: 'moje-dostepy?nowy=1', kind: 'akcja' },
  { id: 'a-wnioski', group: 'Szybkie akcje', label: 'Moje wnioski o dostęp', sub: 'Uprawnienia', icon: 'file-text', to: 'moje-dostepy/wnioski', kind: 'akcja' },
  { id: 'a-dostepy', group: 'Szybkie akcje', label: 'Moje dostępy', sub: 'Uprawnienia', icon: 'unlock', to: 'moje-dostepy', kind: 'akcja' },
  { id: 'a-profil', group: 'Szybkie akcje', label: 'Mój profil', sub: 'Konto', icon: 'user', to: 'profil', kind: 'akcja' },
  { id: 'a-wyloguj', group: 'Szybkie akcje', label: 'Wyloguj', sub: 'Konto', icon: 'log-out', to: 'logowanie?wylogowano=1', kind: 'akcja' },
]
const RECENT_HITS: Hit[] = [
  { id: 'r-tx', group: 'Ostatnio przeglądane', label: 'Transakcje', sub: 'Sprzedaż · Obrót', icon: 'trending-up', to: 'transakcje', kind: 'modul' },
  { id: 'r-dost', group: 'Ostatnio przeglądane', label: 'Moje dostępy', sub: 'Uprawnienia', icon: 'unlock', to: 'moje-dostepy', kind: 'akcja' },
  { id: 'r-kl', group: 'Ostatnio przeglądane', label: 'Klienci', sub: 'Klient', icon: 'users', to: 'm/klienci/klienci', kind: 'modul' },
]

/* pogrubienie dopasowanego fragmentu (bez polskich znaków w porównaniu) */
function Mark({ text, q }: { text: string; q: string }) {
  const f = fold(q.trim()); if (!f) return <>{text}</>
  const i = fold(text).indexOf(f); if (i < 0) return <>{text}</>
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + f.length)}</mark>{text.slice(i + f.length)}</>
}

function CommandBar({ open, onClose, sections }: { open: boolean; onClose: () => void; sections: NavSection[] }) {
  const [q, setQ] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const back = useRef<HTMLElement | null>(null)

  const modules = useMemo<Hit[]>(() => sections.flatMap(s => s.groups.flatMap(g => g.items.map(i => ({
    id: s.id + i.label, group: s.label, label: i.label, sub: g.title, icon: s.icon, to: itemRoute(s, i), kind: 'modul' as const,
  })))), [sections])

  const f = fold(q.trim())
  const match = (h: Hit) => !f || fold(h.label + ' ' + (h.sub ?? '') + ' ' + h.group).includes(f)
  const mods = modules.filter(match), acts = ACTIONS.filter(match)
  const hits = useMemo(() => {
    if (!f) return scope === 'modul' ? modules.slice(0, 40) : scope === 'akcja' ? ACTIONS : [...RECENT_HITS, ...ACTIONS.filter(x => !RECENT_HITS.some(r => r.to === x.to))]
    return scope === 'modul' ? mods : scope === 'akcja' ? acts : [...acts, ...mods]
  }, [f, scope, modules]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    back.current = document.activeElement as HTMLElement
    setQ(''); setSel(0); setScope('all')
    const t = window.setTimeout(() => input.current?.focus(), 20)
    return () => { window.clearTimeout(t); back.current?.focus?.() }
  }, [open])
  useEffect(() => setSel(0), [q, scope])
  useEffect(() => { document.getElementById(`cmd-o-${sel}`)?.scrollIntoView({ block: 'nearest' }) }, [sel])

  const SCOPES: { v: Scope; l: string; n: number; icon: string }[] = [
    { v: 'all', l: 'Wszystko', n: f ? mods.length + acts.length : modules.length + ACTIONS.length, icon: 'search' },
    { v: 'modul', l: 'Moduły', n: mods.length, icon: 'grid' },
    { v: 'akcja', l: 'Akcje', n: acts.length, icon: 'zap' },
  ]
  const run = (h?: Hit) => { if (!h) return; onClose(); go(h.to) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, hits.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); run(hits[sel]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'Tab') { e.preventDefault(); const i = SCOPES.findIndex(s => s.v === scope); setScope(SCOPES[(i + (e.shiftKey ? -1 : 1) + SCOPES.length) % SCOPES.length].v) }
  }

  let last = ''
  return (
    <>
      <div className={`scrim dlg-scrim ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <div className={`cmd ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Szukaj" aria-hidden={!open} onKeyDown={onKey}>
        <div className="cmd-in">
          <Icon name="search" size={18} />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj modułów i akcji…" role="combobox" aria-expanded="true"
            aria-controls="cmd-list" aria-activedescendant={hits.length ? `cmd-o-${sel}` : undefined} autoComplete="off" spellCheck={false} tabIndex={open ? 0 : -1} />
          {q && <button className="ibtn sm" onClick={() => { setQ(''); input.current?.focus() }} aria-label="Wyczyść" tabIndex={-1}><Icon name="x" size={14} /></button>}
          <span className="kbd">Esc</span>
        </div>
        <div className="cmd-scopes" role="tablist" aria-label="Zakres wyszukiwania">
          {SCOPES.map(s => (
            <button key={s.v} role="tab" aria-selected={scope === s.v} className="scope" tabIndex={-1} onClick={() => { setScope(s.v); input.current?.focus() }}>
              <Icon name={s.icon} size={12} />{s.l}<span className="n">{s.n}</span>
            </button>
          ))}
        </div>
        <div className="cmd-list" id="cmd-list" role="listbox" aria-label="Wyniki">
          {hits.length === 0 && (
            <div className="cmd-empty">
              <span className="cmd-empty-i"><Icon name="search" size={18} /></span>
              <b>Brak wyników dla „{q}”</b>
              <span>Szukamy w modułach widocznych w menu i w szybkich akcjach.</span>
            </div>
          )}
          {hits.map((h, i) => {
            const head = h.group !== last ? (last = h.group) : null
            return (
              <div key={h.id + i}>
                {head && <div className="cmd-g">{head}</div>}
                <div id={`cmd-o-${i}`} className="opt" role="option" aria-selected={i === sel} onMouseMove={() => setSel(i)} onClick={() => run(h)}>
                  <span className={`oi ${h.kind === 'akcja' ? 'act' : ''}`}><Icon name={h.icon} size={14} /></span>
                  <span className="ot"><span className="trunc"><Mark text={h.label} q={q} /></span>{h.sub && <span className="sub trunc">{h.sub}</span>}</span>
                  <span className="go">{h.kind === 'akcja' ? 'Wykonaj' : 'Otwórz'}<span className="kbd">↵</span></span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="cmd-foot">
          <span><span className="kbd">↑</span><span className="kbd">↓</span>Wybierz</span>
          <span><span className="kbd">↵</span>Otwórz</span>
          <span><span className="kbd">Tab</span>Zakres</span>
          <span className="grow" />
          <span className="num">{hits.length} {hits.length === 1 ? 'wynik' : hits.length % 10 >= 2 && hits.length % 10 <= 4 && (hits.length % 100 < 12 || hits.length % 100 > 14) ? 'wyniki' : 'wyników'}</span>
        </div>
      </div>
    </>
  )
}
