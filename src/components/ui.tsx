import { WORDMARK } from '../data/brand'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useApp } from '../store'
export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'plain'

/* ---------- ikony Feather: pliki SVG z feather-main (src/assets/feather, licencja MIT) ----------
   Kreska skalowana tak, żeby po wyrenderowaniu miała ~1,75 px obok tekstu 13/500. */
const FEATHER = import.meta.glob<string>('../assets/feather/*.svg', { query: '?raw', import: 'default', eager: true })
const SVG: Record<string, string> = Object.fromEntries(
  Object.entries(FEATHER).map(([path, svg]) => [path.split('/').pop()!.replace('.svg', ''), svg]))

export function Icon({ name, size = 16, className, stroke = 1.75 }: { name: string; size?: number; className?: string; stroke?: number }) {
  const html = useMemo(() => {
    const src = SVG[name]
    if (!src) { console.warn('Brak ikony Feather:', name); return '' }
    return src
      .replace('width="24" height="24"', `width="${size}" height="${size}" aria-hidden="true" focusable="false" class="ico${className ? ' ' + className : ''}"`)
      .replace(/stroke-width="[\d.]+"/, `stroke-width="${Math.round(stroke * 24 / size * 100) / 100}"`)
  }, [name, size, className, stroke])
  return <span style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />
}

export function MicrosoftMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="ico">
      <rect x="0" y="0" width="7.5" height="7.5" fill="#F25022" /><rect x="8.5" y="0" width="7.5" height="7.5" fill="#7FBA00" />
      <rect x="0" y="8.5" width="7.5" height="7.5" fill="#00A4EF" /><rect x="8.5" y="8.5" width="7.5" height="7.5" fill="#FFB900" />
    </svg>
  )
}

/* Znak MS DOS: kafelek aplikacji z miękkim gradientem i geometrycznym glifem na siatce 16 */
/* Logo słowne Michael / Ström Dom Maklerski (112 × 17); kolor dziedziczy z tekstu */
export function Wordmark({ width = 112, label = 'Michael / Ström Dom Maklerski' }: { width?: number; label?: string }) {
  return (
    <svg className="wordmark" width={width} height={width * 17 / 112} viewBox="0 0 112 17" role="img" aria-label={label}>
      {WORDMARK.map((d, i) => <path key={i} d={d} fill="currentColor" />)}
    </svg>
  )
}

export function Avatar({ initials, color = 0, size = 28 }: { initials: string; color?: number; size?: 20 | 24 | 28 | 32 | 56 }) {
  return <span className={`av av-${size} av-c${color % 6}`} aria-hidden="true">{initials}</span>
}

export function Status({ tone = 'plain', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>
}

/* ---------- inset card ---------- */
export function InsetCard({ title, icon, count, right, children, className, pad, id }: {
  title?: ReactNode; icon?: string; count?: number | string; right?: ReactNode; children: ReactNode; className?: string; pad?: boolean; id?: string
}) {
  return (
    <section className={`ic ${className ?? ''}`} aria-labelledby={id}>
      {title !== undefined && (
        <div className="ic-h">
          {icon && <Icon name={icon} />}
          <h2 id={id} style={{ font: 'inherit', color: 'inherit' }}>{title}</h2>
          {count !== undefined && <span className="count">{count}</span>}
          <span className="grow" />
          {right}
        </div>
      )}
      <div className={`ic-b ${pad ? 'ic-pad' : ''}`}>{children}</div>
    </section>
  )
}

/* ---------- segmentowy przełącznik z przesuwanym wskaźnikiem ---------- */
export function Segmented<T extends string>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode; icon?: string }[]; label: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ x: number; w: number; y: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')
      // wskaźnik bierze pozycję i rozmiar z aktywnego przycisku (także wysokość), żeby tekst był w nim na środku
      if (el) setPill(p => (p && p.x === el.offsetLeft && p.w === el.offsetWidth && p.y === el.offsetTop && p.h === el.offsetHeight) ? p
        : { x: el.offsetLeft, w: el.offsetWidth, y: el.offsetTop, h: el.offsetHeight })
    }
    measure()
    // szerokości zmieniają się po załadowaniu fontu i przy zmianie stylów: mierzymy ponownie
    const ro = new ResizeObserver(measure)
    ref.current?.querySelectorAll('button').forEach(b => ro.observe(b))
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [value, options.length])
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const i = options.findIndex(o => o.value === value)
    const n = options[(i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length]
    onChange(n.value)
    requestAnimationFrame(() => ref.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus())
  }
  return (
    <div className="vsw" role="group" aria-label={label} ref={ref} onKeyDown={onKey}>
      {pill && <i className="vsw-pill" aria-hidden="true" style={{ translate: `${pill.x}px 0`, width: pill.w, left: 0, top: pill.y, height: pill.h }} />}
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={o.value === value} tabIndex={o.value === value ? 0 : -1} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={14} />}{o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- zamykanie: klik poza i Esc, fokus wraca do wyzwalacza ---------- */
export function useDismiss(open: boolean, close: () => void, refs: RefObject<HTMLElement>[], returnTo?: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => { if (!refs.some(r => r.current?.contains(e.target as Node))) close() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close(); returnTo?.current?.focus() } }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey, true) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
}

/* Strzałki w menu, w kolejności wizualnej; Tab zamyka */
export function menuKeys(e: React.KeyboardEvent<HTMLElement>, close: () => void) {
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])'))
  const i = items.indexOf(document.activeElement as HTMLElement)
  if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus() }
  else if (e.key === 'Home') { e.preventDefault(); items[0]?.focus() }
  else if (e.key === 'End') { e.preventDefault(); items[items.length - 1]?.focus() }
  else if (e.key === 'Tab') close()
}

/* ---------- modal: blokuje tło (inert), łapie Tab, Esc zamyka tylko górną warstwę ---------- */
function useModal(open: boolean, onClose: () => void, ref: RefObject<HTMLElement>) {
  const back = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!open) return
    back.current = document.activeElement as HTMLElement
    const root = document.getElementById('root')!
    const wasInert = root.inert
    root.inert = true
    const t = window.setTimeout(() => {
      const el = ref.current
      const first = el?.querySelector<HTMLElement>('[data-autofocus]')
        ?? el?.querySelector<HTMLElement>('.dw-body input:not([disabled]), .dw-body select:not([disabled]), .dw-body textarea, .dlg-b input:not([disabled]), .dlg-b textarea')
        ?? el?.querySelector<HTMLElement>('.dlg-f button, .dw-body button:not([disabled]), button:not([disabled])')
      first?.focus()
    }, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key === 'Tab' && ref.current) {
        const f = Array.from(ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea, select, [tabindex="0"]'))
        if (!f.length) return
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', onKey, true); root.inert = wasInert; back.current?.focus?.() }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
}

export function Dialog({ open, onClose, title, sub, children, footer, width }: {
  open: boolean; onClose: () => void; title: string; sub?: ReactNode; children: ReactNode; footer: ReactNode; width?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  useModal(open, onClose, ref)
  return createPortal(
    <>
      <div className={`scrim dlg-scrim ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <div ref={ref} className={`dlg ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={title} aria-hidden={!open} style={width ? { width: `min(${width}px, calc(100vw - 16px))` } : undefined}>
        {open && <>
          <div className="dlg-h"><h2>{title}</h2>{sub && <p className="muted" style={{ lineHeight: '20px' }}>{sub}</p>}</div>
          <div className="dlg-b">{children}</div>
          <div className="dlg-f">{footer}</div>
        </>}
      </div>
    </>, document.body)
}

export function Drawer({ open, onClose, title, icon, children, footer }: {
  open: boolean; onClose: () => void; title: string; icon?: string; children: ReactNode; footer?: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  useModal(open, onClose, ref)
  return createPortal(
    <>
      <div className={`scrim ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <section ref={ref} className={`drawer ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label={title} aria-hidden={!open}>
        {open && <>
          <div className="dw-head">{icon && <Icon name={icon} />}<span style={{ color: 'var(--t)' }}>{title}</span><span className="grow" />
            <button className="ibtn" onClick={onClose} aria-label="Zamknij"><Icon name="x" /></button></div>
          <div className="dw-body">{children}</div>
          {footer && <div className="dw-foot">{footer}</div>}
        </>}
      </section>
    </>, document.body)
}

export function ToastView() {
  const { toast } = useApp()
  const [last, setLast] = useState(toast)
  useEffect(() => { if (toast) setLast(toast) }, [toast])
  return (
    <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
      {last && <>
        <span className="t-ico"><Icon name="check-circle" size={16} /></span>
        <span className="t-msg">{last.msg}</span>
        {last.action && <button onClick={last.action.run}>{last.action.label}</button>}
      </>}
    </div>
  )
}

export function Empty({ icon, title, hint, action, danger }: { icon: string; title: string; hint?: ReactNode; action?: ReactNode; danger?: boolean }) {
  return (
    <div className="empty">
      <span className={`empty-i ${danger ? 'danger' : ''}`}><Icon name={icon} size={18} /></span>
      <b>{title}</b>
      {hint && <span className="muted">{hint}</span>}
      {action}
    </div>
  )
}

export function PageHead({ icon, title, meta, children }: { icon: string; title: string; meta?: ReactNode; children?: ReactNode }) {
  return (
    <header className="ph">
      <span className="ph-i"><Icon name={icon} /></span>
      <h1>{title}</h1>
      {meta && <><span className="vsep" /><span className="ph-meta">{meta}</span></>}
      <span className="grow" />
      <div className="ph-act">{children}</div>
    </header>
  )
}
