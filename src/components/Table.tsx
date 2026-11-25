import { useRef, useState, type ReactNode } from 'react'
import { Icon, useDismiss } from './ui'

/* Główna tabela modułu (wzór: Fieldnote „Accounts”): nagłówek 52, pasek filtrów,
   siatka kolumn z liniami pionowymi, wiersze 44, wspólna lewa krawędź 20 px. */

export type Col = { key: string; label: string; icon: string; width: string }

export function TableHead({ cols }: { cols: Col[] }) {
  return (
    <div className="tcols thead" role="row" style={{ ['--cols' as string]: cols.map(c => c.width).join(' ') }}>
      {cols.map(c => <div key={c.key} role="columnheader"><Icon name={c.icon} />{c.label}</div>)}
    </div>
  )
}

export const gridStyle = (cols: Col[]) => ({ ['--cols' as string]: cols.map(c => c.width).join(' ') })

/* ---------- pigułka filtra „Etykieta | Wartość ⌄” z menu ---------- */
export type Opt = { value: string; label: string; n?: number; dot?: string; lead?: ReactNode }

export function FilterPill({ label, opts, selected, onChange, multi, allLabel, sort }: {
  label: string; opts: Opt[]; selected: string[]; onChange: (v: string[]) => void; multi?: boolean; allLabel?: string; sort?: boolean
}) {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), [btn, pop], btn)
  const active = !sort && selected.length > 0
  const value = selected.length === 0 ? (allLabel ?? 'Dowolny')
    : selected.length === 1 ? opts.find(o => o.value === selected[0])?.label ?? selected[0]
    : `${selected.length} wybrane`

  const focusFirst = () => requestAnimationFrame(() => (pop.current?.querySelector<HTMLElement>('[aria-checked="true"]') ?? pop.current?.querySelector<HTMLElement>('[role^=menuitem]'))?.focus())
  const toggle = () => { if (open) setOpen(false); else { setOpen(true); focusFirst() } }
  const pick = (v: string) => {
    if (!multi) { onChange([v]); setOpen(false); btn.current?.focus(); return }
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])   // menu zostaje otwarte
  }
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]'))
    const i = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus() }
    else if (e.key === 'Tab') setOpen(false)
  }

  return (
    <div className="fwrap">
      <button ref={btn} className={`pill ${active ? 'on' : ''}`} aria-haspopup="menu" aria-expanded={open} onClick={toggle}
        onKeyDown={e => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); focusFirst() } }}>
        <span className="pl">{label}</span>
        <span className="pv">{value}{sort && <Icon name="arrow-down" size={14} />}{multi && selected.length > 1 && <span className="cnt">{selected.length}</span>}<Icon name="chevron-down" size={14} /></span>
      </button>
      <div ref={pop} className={`fmenu ${open ? 'open' : ''}`} role="menu" aria-label={label} onKeyDown={onKey}>
        <div className="fm-h">{label}</div>
        <div className="fm-list">
          {opts.map(o => (
            <button key={o.value} className="fo" role={multi ? 'menuitemcheckbox' : 'menuitemradio'} aria-checked={selected.includes(o.value)} tabIndex={-1} onClick={() => pick(o.value)}>
              {multi ? <span className="cb"><Icon name="check" size={12} /></span> : <span className="rd" />}
              {o.dot && <span className="sdot" style={{ background: o.dot }} />}{o.lead}
              <span className="trunc">{o.label}</span>
              {o.n !== undefined && <span className="n">{o.n}</span>}
            </button>
          ))}
        </div>
        {multi && (
          <div className="fm-foot"><span>{selected.length ? `Wybrano: ${selected.length}` : 'Wszystkie'}</span>
            <button disabled={!selected.length} onClick={() => onChange([])}>Wyczyść</button></div>
        )}
      </div>
    </div>
  )
}
