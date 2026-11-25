import { useEffect, useMemo, useRef, useState } from 'react'
import { fmtDate, fmtMoney, page, PAGE, TOTAL, type Tx } from '../data/transactions'
import { Icon, menuKeys, useDismiss } from '../components/ui'
import { FilterPill } from '../components/Table'

/* Tabela Transakcji 1:1 z wireframe'u (kolumny, akcje, filtry, zaznaczanie, paginacja)
   w stylu głównej tabeli Fieldnote. */

type ColKey = 'client' | 'isin' | 'dir' | 'market' | 'nominal' | 'settle' | 'id' | 'created'
type Col = { key: ColKey; label: string; icon: string; width: string; num?: boolean; sort?: (a: Tx, b: Tx) => number; fixed?: boolean }
const COLS: Col[] = [
  { key: 'client', label: 'Klient', icon: 'user', width: 'minmax(180px,1.3fr)', fixed: true, sort: (a, b) => a.client.localeCompare(b.client, 'pl') },
  { key: 'isin', label: 'Instrument (ISIN)', icon: 'hash', width: 'minmax(140px,0.9fr)' },
  { key: 'dir', label: 'Kierunek', icon: 'repeat', width: 'minmax(108px,0.6fr)' },
  { key: 'market', label: 'Rynek', icon: 'globe', width: 'minmax(100px,0.6fr)' },
  { key: 'nominal', label: 'Wartość nominalna', icon: 'dollar-sign', width: 'minmax(150px,0.9fr)', num: true, sort: (a, b) => a.nominal - b.nominal },
  { key: 'settle', label: 'Data rozliczenia', icon: 'calendar', width: 'minmax(136px,0.8fr)', num: true, sort: (a, b) => a.settle.getTime() - b.settle.getTime() },
  { key: 'id', label: 'ID transakcji', icon: 'file-text', width: 'minmax(150px,0.9fr)' },
  { key: 'created', label: 'Utworzono', icon: 'clock', width: 'minmax(104px,0.6fr)', num: true, sort: (a, b) => a.created.getTime() - b.created.getTime() },
]
const ALL_TOTAL = 1_205_340   // wszystkie transakcje, bez „Tylko moje elementy”
const nf = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')   // 6 730, nie 6730

export function Transakcje() {
  const [p, setP] = useState(0)
  const [mine, setMine] = useState(true)
  const [market, setMarket] = useState<string[]>([])
  const [dir, setDir] = useState<string[]>([])
  const [hidden, setHidden] = useState<Set<ColKey>>(new Set())
  const [sort, setSort] = useState<{ key: ColKey; desc: boolean }>({ key: 'settle', desc: true })
  const [sel, setSel] = useState<Set<string>>(new Set())
  const first = useRef(true)
  useEffect(() => { first.current = false }, [])

  const cols = COLS.filter(c => !hidden.has(c.key))
  const grid = { ['--cols' as string]: '44px ' + cols.map(c => c.width).join(' ') }

  const rows = useMemo(() => {
    const r = page(p).filter(t => (!market.length || market.includes(t.market)) && (!dir.length || dir.includes(t.dir)))
    const c = COLS.find(x => x.key === sort.key)!
    return c.sort ? [...r].sort((a, b) => (sort.desc ? -1 : 1) * c.sort!(a, b)) : r
  }, [p, market, dir, sort])

  // łączna liczba zawężona proporcjonalnie przez filtry
  const base = mine ? TOTAL : ALL_TOTAL
  const total = market.length || dir.length ? Math.round(base * rows.length / PAGE) : base
  const pages = Math.max(1, Math.ceil(total / PAGE))
  const from = total ? p * PAGE + 1 : 0, to = Math.min(total, p * PAGE + rows.length)

  useEffect(() => { setSel(new Set()) }, [p, market, dir, mine])   // zaznaczenie dotyczy bieżącej strony
  const allOn = rows.length > 0 && rows.every(r => sel.has(r.id))
  const toggle = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleAll = () => setSel(allOn ? new Set() : new Set(rows.map(r => r.id)))
  const sortBy = (c: Col) => { if (!c.sort) return; setSort(s => ({ key: c.key, desc: s.key === c.key ? !s.desc : true })) }
  const reset = () => { setMarket([]); setDir([]) }

  const cell = (t: Tx, c: Col) => {
    switch (c.key) {
      case 'client': return <span className="trunc" style={{ color: 'var(--t-strong)' }}>{t.client}</span>
      case 'isin': return <span className="mono">{t.isin}</span>
      case 'dir': return <span className={`dirp ${t.dir === 'Kupno' ? 'buy' : 'sell'}`}><Icon name={t.dir === 'Kupno' ? 'arrow-down-left' : 'arrow-up-right'} size={12} />{t.dir}</span>
      case 'market': return <span className={`mkt mkt-${t.market === 'OTC' ? 'otc' : t.market === 'Catalyst' ? 'cat' : 'wse'}`}><span className="sdot" />{t.market}</span>
      case 'nominal': return <span className="num">{fmtMoney(t.nominal)} <span className="dim">PLN</span></span>
      case 'settle': return <span className="num">{fmtDate(t.settle)}</span>
      case 'id': return <span className="mono dim">{t.id}</span>
      case 'created': return <span className="num" style={{ color: 'var(--t-3)' }}>{fmtDate(t.created)}</span>
    }
  }

  const rowKey = (e: React.KeyboardEvent<HTMLDivElement>, t: Tx) => {
    const el = e.currentTarget
    if (e.key === ' ') { e.preventDefault(); toggle(t.id) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); (el.nextElementSibling as HTMLElement)?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (el.previousElementSibling as HTMLElement)?.focus() }
  }

  return (
    <div className="mtable">
      <header className="mt-head">
        <span className="ph-i"><Icon name="trending-up" /></span>
        <h1>Transakcje</h1>
        <span className="vsep" />
        <span className="muted num" aria-live="polite">{nf(total)} rekordów</span>
        <span className="grow" />
        <button className="btn btn-secondary" ><Icon name="upload" size={14} />Importuj</button>
        <button className="btn btn-primary" ><Icon name="plus" size={14} />Utwórz</button>
      </header>

        <div className="fbar" role="toolbar" aria-label="Filtry">
          {mine
            ? <button className="pill on chip-pill" onClick={() => setMine(false)} aria-pressed="true">Tylko moje elementy<Icon name="x" size={14} /></button>
            : <button className="pill chip-pill" onClick={() => setMine(true)} aria-pressed="false"><Icon name="user" size={14} />Tylko moje elementy</button>}
          <span className="fsep" />
          <FilterPill label="Rynek" multi selected={market} onChange={setMarket}
            opts={(['WSE Cat', 'Catalyst', 'OTC'] as const).map(m => ({ value: m, label: m, n: page(p).filter(t => t.market === m).length }))} />
          <FilterPill label="Kierunek" multi selected={dir} onChange={setDir}
            opts={(['Kupno', 'Sprzedaż'] as const).map(d => ({ value: d, label: d, n: page(p).filter(t => t.dir === d).length }))} />
          <button className="nav-btn" ><Icon name="zap" size={14} />Szybki filtr</button>
          <button className="nav-btn" ><Icon name="sliders" size={14} />Zaawansowany filtr</button>
          {(market.length > 0 || dir.length > 0) && <button className="freset" onClick={reset}><Icon name="x" size={14} />Wyczyść</button>}
          <span className="grow" />
          <ColumnPicker hidden={hidden} setHidden={setHidden} />
        </div>

      <div className="tscroll">
        <div className="ttable" role="table" aria-label="Transakcje" aria-rowcount={total + 1}>
          <div className="tcols thead" role="row" style={grid}>
            <div role="columnheader" className="tchk">
              <button className={`cbx ${allOn ? 'on' : sel.size ? 'mixed' : ''}`} role="checkbox" aria-checked={allOn ? true : sel.size ? 'mixed' : false} aria-label="Zaznacz wszystkie na stronie" onClick={toggleAll}>
                <Icon name={sel.size && !allOn ? 'minus' : 'check'} size={12} /></button>
            </div>
            {cols.map(c => (
              <div key={c.key} role="columnheader" className={c.num ? 'r-num' : ''} aria-sort={sort.key === c.key ? (sort.desc ? 'descending' : 'ascending') : undefined}>
                {c.sort
                  ? <button className={`th-sort ${sort.key === c.key ? 'on' : ''}`} onClick={() => sortBy(c)}><Icon name={c.icon} />{c.label}
                      {sort.key === c.key && <Icon name={sort.desc ? 'arrow-down' : 'arrow-up'} size={12} />}</button>
                  : <><Icon name={c.icon} />{c.label}</>}
              </div>
            ))}
          </div>
          <div role="rowgroup">
            {rows.map((t, i) => (
              <div key={t.id} className={`tcols trow ${sel.has(t.id) ? 'sel' : ''} ${first.current ? 'row-enter' : ''}`} role="row" tabIndex={0} aria-selected={sel.has(t.id)}
                style={{ ...grid, animationDelay: first.current ? `${100 + i * 24}ms` : undefined }}
                onKeyDown={e => rowKey(e, t)}>
                <div role="cell" className="tchk"><button className={`cbx ${sel.has(t.id) ? 'on' : ''}`} role="checkbox" aria-checked={sel.has(t.id)} aria-label={`Zaznacz ${t.id}`} tabIndex={-1} onClick={() => toggle(t.id)}><Icon name="check" size={12} /></button></div>
                {cols.map(c => <div key={c.key} role="cell" className={c.num ? 'r-num' : ''}>{cell(t, c)}</div>)}
              </div>
            ))}
          </div>
          {rows.length === 0 && (
            <div className="f-empty">
              <span className="empty-i"><Icon name="filter" size={18} /></span>
              <b>Żadna transakcja nie pasuje do filtrów</b>
              <span className="muted">Usuń któryś filtr albo przejdź na inną stronę.</span>
              <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={reset}>Wyczyść filtry</button>
            </div>
          )}
        </div>
      </div>

      <BulkBar count={sel.size} onClear={() => setSel(new Set())} />

      <footer className="tfoot">
        <span className="num">{nf(from)}–{nf(to)} z {nf(total)}</span>
        <span className="grow" />
        <nav className="pager" aria-label="Strony">
          <button className="ibtn sm" disabled={p === 0} onClick={() => setP(p - 1)} aria-label="Poprzednia strona"><Icon name="chevron-left" size={14} /></button>
          {pagerItems(p, pages).map((x, i) => x === '…'
            ? <span key={'e' + i} className="pg-gap">…</span>
            : <button key={x} className={`pg ${x === p ? 'on' : ''}`} aria-current={x === p ? 'page' : undefined} onClick={() => setP(x as number)}>{nf((x as number) + 1)}</button>)}
          <button className="ibtn sm" disabled={p >= pages - 1} onClick={() => setP(p + 1)} aria-label="Następna strona"><Icon name="chevron-right" size={14} /></button>
        </nav>
      </footer>
    </div>
  )
}

/* Pływający pasek akcji masowych: pojawia się nad stopką tabeli, gdy coś jest zaznaczone.
   Esc odznacza wszystko. Liczba zostaje widoczna podczas chowania paska. */
function BulkBar({ count, onClear }: { count: number; onClear: () => void }) {
  const [shown, setShown] = useState(count)
  useEffect(() => { if (count) setShown(count) }, [count])
  useEffect(() => {
    if (!count) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.fmenu.open, .dlg.open, .cmd.open')) onClear() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count, onClear])
  const open = count > 0
  return (
    <div className={`fbulk ${open ? 'open' : ''}`} role="toolbar" aria-label="Akcje na zaznaczonych" aria-hidden={!open} {...(open ? {} : { inert: '' })}>
      <span className="fbulk-n"><b className="num">{shown}</b> {shown === 1 ? 'zaznaczona' : shown % 10 >= 2 && shown % 10 <= 4 && (shown % 100 < 12 || shown % 100 > 14) ? 'zaznaczone' : 'zaznaczonych'}</span>
      <button className="fbulk-x" onClick={onClear} aria-label="Odznacz wszystkie (Esc)" title="Odznacz wszystkie · Esc"><Icon name="x" size={14} /></button>
      <span className="fbulk-sep" />
      <button className="fbulk-a"><Icon name="edit-3" size={14} />Masowa aktualizacja</button>
      <button className="fbulk-a"><Icon name="git-merge" size={14} />Połącz duplikaty</button>
      <button className="fbulk-a"><Icon name="download" size={14} />Eksportuj</button>
      <span className="fbulk-sep" />
      <button className="fbulk-a del"><Icon name="trash-2" size={14} />Usuń</button>
    </div>
  )
}

function pagerItems(p: number, pages: number): (number | '…')[] {
  const s = new Set([0, 1, 2, p - 1, p, p + 1, pages - 1].filter(x => x >= 0 && x < pages))
  const arr = [...s].sort((a, b) => a - b), out: (number | '…')[] = []
  arr.forEach((x, i) => { if (i && x - arr[i - 1] > 1) out.push('…'); out.push(x) })
  return out
}

/* „Wybierz kolumny”: lista z checkboxami, Klient zawsze widoczny */
function ColumnPicker({ hidden, setHidden }: { hidden: Set<ColKey>; setHidden: (s: Set<ColKey>) => void }) {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), [btn, pop], btn)
  const openMenu = () => { setOpen(true); requestAnimationFrame(() => pop.current?.querySelector<HTMLElement>('[role=menuitemcheckbox]:not([disabled])')?.focus()) }
  return (
    <div className="fwrap">
      <button ref={btn} className="nav-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={e => { if (e.key === 'ArrowDown') { e.preventDefault(); openMenu() } }}>
        <Icon name="columns" size={14} />Wybierz kolumny{hidden.size > 0 && <span className="cnt">{COLS.length - hidden.size}</span>}
      </button>
      <div ref={pop} className={`fmenu right ${open ? 'open' : ''}`} role="menu" aria-label="Kolumny" onKeyDown={e => menuKeys(e, () => setOpen(false))}>
        <div className="fm-h">Kolumny tabeli</div>
        {COLS.map(c => (
          <button key={c.key} className="fo" role="menuitemcheckbox" aria-checked={!hidden.has(c.key)} disabled={c.fixed} tabIndex={-1}
            onClick={() => { const n = new Set(hidden); n.has(c.key) ? n.delete(c.key) : n.add(c.key); setHidden(n) }}>
            <span className="cb"><Icon name="check" size={12} /></span><Icon name={c.icon} size={14} /><span className="trunc">{c.label}</span>
            {c.fixed && <span className="n">zawsze</span>}
          </button>
        ))}
        <div className="fm-foot"><span>{COLS.length - hidden.size} z {COLS.length}</span><button disabled={!hidden.size} onClick={() => setHidden(new Set())}>Pokaż wszystkie</button></div>
      </div>
    </div>
  )
}
