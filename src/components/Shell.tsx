import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { go, useApp } from '../store'
import { findByRoute, itemRoute, NAV, NAV_BOTTOM, slug, USER_MENU, visibleNav, type NavSection } from '../data/nav'
import { Avatar, Icon, MsMark, menuKeys, useDismiss } from './ui'

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
      <nav className="rail" aria-label="Moduły" onKeyDown={railKeys}>
        <a className="rail-logo" href="#/strona-glowna" aria-label="MS OS, strona główna"
          onMouseEnter={e => showTip(e.currentTarget, 'Strona Główna')} onMouseLeave={() => setTip(null)}><MsMark size={28} /></a>
        <div className="rail-list">{top.map(rail)}</div>
        {bottom.length > 0 && <span className="rail-sep" />}
        <div className="rail-list">{bottom.map(rail)}</div>
        <span className="grow" />
        <UserMenu />
      </nav>
      {tip && <span className="rail-tip" role="tooltip" style={{ top: tip.top }}>{tip.label}</span>}

      {current && (
        <aside className="panel" aria-label={current.label} aria-hidden={!open} {...(open ? {} : { inert: '' })}>
          <div className="panel-head">
            <span className="panel-ico"><Icon name={current.icon} size={14} /></span>
            <h2>{current.label}</h2>
            <span className="grow" />
            <button className="ibtn" onClick={() => setOpen(false)} aria-label="Zwiń panel" title="Zwiń panel"><Icon name="sidebar" /></button>
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
        <header className="topbar">
          <button className={`ibtn tb-menu ${open ? '' : 'show'}`} onClick={() => setOpen(o => !o)} aria-label="Pokaż panel modułu" aria-expanded={open} title="Pokaż panel"><Icon name="sidebar" /></button>
          <button className="search" onClick={() => setCmd(true)} aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K">
            <Icon name="search" size={14} /><span className="trunc">Szukaj…</span><span className="kbd">⌘K</span>
          </button>
          <span className="grow" />
          <Recent />
        </header>
        <main className="card" id="main">{children}</main>
      </div>
      <CommandBar open={cmd} onClose={() => setCmd(false)} sections={all} />
    </div>
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

/* ---------- menu użytkownika pod awatarem (na dole paska L1) ---------- */
function UserMenu() {
  const { user } = useApp()
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), [btn, pop], btn)
  const openMenu = () => { setOpen(true); requestAnimationFrame(() => pop.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus()) }
  const act = (label: string) => {
    setOpen(false)
    if (label === 'Profil') go('profil')
    else if (label === 'Wyloguj') go('logowanie?wylogowano=1')
    else go('menu/' + slug(label))
  }
  return (
    <div className="pop-anchor rail-me">
      <button ref={btn} className="avatar-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`Menu użytkownika: ${user.name}`} title={user.name}
        onClick={() => open ? setOpen(false) : openMenu()} onKeyDown={e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); openMenu() } }}>
        <Avatar initials={user.initials} color={user.color} size={32} />
      </button>
      <div ref={pop} className={`pop up ${open ? 'open' : ''}`} role="menu" aria-label="Menu użytkownika" onKeyDown={e => menuKeys(e, () => setOpen(false))}>
        <div className="m-card" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar initials={user.initials} color={user.color} size={32} />
          <div style={{ minWidth: 0 }}>
            <div className="trunc" style={{ color: 'var(--t-strong)', fontWeight: 600 }}>{user.name}</div>
            <div className="trunc muted" style={{ fontSize: 12, marginTop: 2 }}>{user.title}</div>
          </div>
        </div>
        <div style={{ height: 4 }} />
        {USER_MENU.map(l => (
          <div key={l}>
            {l === 'Wyloguj' && <div className="m-sep" />}
            <button className="mi" role="menuitem" tabIndex={-1} onClick={() => act(l)}>
              <Icon name={ICON[l]} size={14} />{l}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
const ICON: Record<string, string> = { Profil: 'user', Pracownicy: 'users', Administrator: 'settings', 'Forum wsparcia': 'message-circle', 'O programie': 'info', Wyloguj: 'log-out' }

/* ---------- „Ostatnio przeglądane” ---------- */
const RECENT = [
  { label: 'Transakcje', meta: 'Sprzedaż', to: 'transakcje' },
  { label: 'Klienci', meta: 'Klient', to: 'm/klienci/klienci' },
  { label: 'Uprawnienia', meta: 'IT', to: 'uprawnienia/osoby' },
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

/* ---------- wyszukiwarka ⌘K: tylko widoczne moduły ---------- */
type Hit = { id: string; label: string; sub: string; icon: string; to: string }
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l')

function CommandBar({ open, onClose, sections }: { open: boolean; onClose: () => void; sections: NavSection[] }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const back = useRef<HTMLElement | null>(null)
  const all = useMemo<Hit[]>(() => sections.flatMap(s => s.groups.flatMap(g => g.items.map(i => ({
    id: s.id + i.label, label: i.label, sub: g.title ? `${s.label} · ${g.title}` : s.label, icon: s.icon, to: itemRoute(s, i),
  })))), [sections])
  const hits = useMemo(() => { const f = fold(q.trim()); return (f ? all.filter(h => fold(h.label + ' ' + h.sub).includes(f)) : all).slice(0, 50) }, [q, all])

  useEffect(() => {
    if (!open) return
    back.current = document.activeElement as HTMLElement
    setQ(''); setSel(0)
    const t = window.setTimeout(() => input.current?.focus(), 20)
    return () => { window.clearTimeout(t); back.current?.focus?.() }
  }, [open])
  useEffect(() => setSel(0), [q])
  useEffect(() => { document.getElementById(`cmd-o-${sel}`)?.scrollIntoView({ block: 'nearest' }) }, [sel])

  const run = (h?: Hit) => { if (!h) return; onClose(); go(h.to) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, hits.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); run(hits[sel]) }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'Tab') e.preventDefault()
  }

  return (
    <>
      <div className={`scrim dlg-scrim ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <div className={`cmd ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Szukaj" aria-hidden={!open} onKeyDown={onKey}>
        <div className="cmd-in">
          <Icon name="search" />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj modułu…" role="combobox" aria-expanded="true"
            aria-controls="cmd-list" aria-activedescendant={hits.length ? `cmd-o-${sel}` : undefined} autoComplete="off" spellCheck={false} tabIndex={open ? 0 : -1} />
          <span className="kbd">Esc</span>
        </div>
        <div className="cmd-list" id="cmd-list" role="listbox" aria-label="Wyniki">
          {hits.length === 0 && <div className="cmd-empty"><b>Brak wyników</b>Szukamy w modułach widocznych w menu.</div>}
          {hits.map((h, i) => (
            <div key={h.id} id={`cmd-o-${i}`} className="opt" role="option" aria-selected={i === sel} onMouseMove={() => setSel(i)} onClick={() => run(h)}>
              <span className="oi"><Icon name={h.icon} /></span>
              <span className="ot"><span className="trunc">{h.label}</span><span className="sub trunc">{h.sub}</span></span>
              <span className="go">Otwórz <Icon name="corner-down-left" size={14} /></span>
            </div>
          ))}
        </div>
        <div className="cmd-foot">
          <span className="trunc">{all.length} modułów w menu</span><span className="grow" />
          <span><span className="kbd">↑</span><span className="kbd">↓</span> Wybierz</span>
          <span><span className="kbd">↵</span> Otwórz</span>
        </div>
      </div>
    </>
  )
}
