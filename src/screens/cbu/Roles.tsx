import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../store'
import { catalog, fieldsLabel, person as personOf, PREDEFINED, RESOURCES, SCOPES, type Level, type Perm, type RoleDef } from '../../data/cbu'
import { Avatar, Dialog, Icon, InsetCard, menuKeys, Segmented, useDismiss } from '../../components/ui'

export function Roles() {
  const { roles } = useApp()
  const [tab, setTab] = useState<'role' | 'zasoby'>('role')
  const mine = roles
  const res = RESOURCES
  const [sel, setSel] = useState(mine[0]?.name)
  const [selRes, setSelRes] = useState(res[0]?.name)
  const role = mine.find(r => r.name === sel) ?? mine[0]
  const resource = res.find(r => r.name === selRes) ?? res[0]

  return (
    <div className="page split">
      <InsetCard className="split-l" title={<Segmented label="Lista" value={tab} onChange={setTab} options={[{ value: 'role', label: 'Role' }, { value: 'zasoby', label: 'Zasoby' }]} />}>
        <div className="rows plist" role="listbox" aria-label={tab === 'role' ? 'Role' : 'Zasoby'}>
          {tab === 'role' && mine.map(r => (
            <button key={r.name} className={`r ${r.name === role?.name ? 'sel' : ''}`} role="option" aria-selected={r.name === role?.name} onClick={() => setSel(r.name)}>
              <span className="tile"><Icon name="users" size={14} /></span>
              <span className="two"><span className="trunc">{r.name}</span><span className="meta trunc">właściciel: {r.owner}</span></span>
              <span className="when num">{r.holderCount}</span>
            </button>
          ))}
          {tab === 'zasoby' && (res.length ? res.map(r => (
            <button key={r.name} className={`r ${r.name === resource?.name ? 'sel' : ''}`} role="option" aria-selected={r.name === resource?.name} onClick={() => setSelRes(r.name)}>
              <span className="tile"><Icon name={r.system === 'MS OS' ? 'bar-chart-2' : 'folder'} size={14} /></span>
              <span className="two"><span className="trunc">{r.name}</span><span className="meta trunc">{r.system}</span></span>
            </button>
          )) : <div className="r muted">Nie jesteś właścicielem żadnego zasobu.</div>)}
        </div>
      </InsetCard>
      {tab === 'role' && role && <RoleDetail key={role.name} role={role} />}
      {tab === 'zasoby' && resource && (
        <div className="split-r">
          <div className="person-h"><span className="tile lg"><Icon name={resource.system === 'MS OS' ? 'bar-chart-2' : 'folder'} /></span>
            <div style={{ minWidth: 0 }}><h2 className="ent-title trunc">{resource.name}</h2><p className="muted" style={{ marginTop: 2 }}>{resource.desc}</p></div></div>
          <div className="stats">
            <div><span className="k">System</span><span className="v sm">{resource.system}</span></div>
            <div><span className="k">Właściciel</span><span className="v sm">{resource.owner}</span></div>
            <div><span className="k">Wykonanie zmian</span><span className="v sm">{resource.exec === 'auto' ? 'Automatycznie w MS OS' : 'Ręcznie przez IT'}</span></div>
            <div><span className="k">Osoby z dostępem</span><span className="v num">{resource.holders}</span></div>
          </div>
          <p className="hint">{resource.exec === 'it' ? 'Po zatwierdzeniu wniosku pozycja czeka, aż IT potwierdzi ręczne wykonanie zmiany.' : 'Po ostatniej decyzji MS OS nadaje dostęp sam.'}</p>
        </div>
      )}
    </div>
  )
}

const LEVELS: Level[] = ['Brak', 'Odczyt', 'Edycja']
const sameFields = (a: string[], b: string[]) => a.length === b.length && a.every(f => b.includes(f))
const same = (a: Perm, b?: Perm) => !!b && a.level === b.level && a.scope === b.scope && sameFields(a.fields, b.fields) && a.actions.eksport === b.actions.eksport && a.actions.druk === b.actions.druk

function RoleDetail({ role }: { role: RoleDef }) {
  const { saveRole, notify } = useApp()
  const edit = true   // skład roli edytuje administrator
  const [draft, setDraft] = useState<Perm[]>(role.perms)
  const [review, setReview] = useState(false)
  useEffect(() => setDraft(role.perms), [role.perms])

  const changes = useMemo(() => {
    const out: { kind: 'add' | 'del' | 'mod'; p: Perm; before?: Perm }[] = []
    for (const p of draft) { const b = role.perms.find(x => x.id === p.id); if (!b) out.push({ kind: 'add', p }); else if (!same(p, b)) out.push({ kind: 'mod', p, before: b }) }
    for (const b of role.perms) if (!draft.some(p => p.id === b.id)) out.push({ kind: 'del', p: b })
    return out
  }, [draft, role.perms])

  const upd = (id: string, patch: Partial<Perm>) => setDraft(d => d.map(p => p.id === id ? { ...p, ...patch } : p))
  const save = () => { saveRole(role.name, draft); setReview(false); notify(`Zapisano rolę „${role.name}”. Zmiana objęła ${role.holderCount} posiadaczy.`) }
  const owner = false
  const invalid = draft.some(p => p.level !== 'Brak' && !p.fields.length)

  return (
    <div className="split-r">
      <div className="person-h">
        <span className="tile lg"><Icon name="users" /></span>
        <div style={{ minWidth: 0 }}><h2 className="ent-title">{role.name}</h2><p className="muted" style={{ marginTop: 2 }}>{role.desc}</p></div>
      </div>
      <div className="stats">
        <div><span className="k">Właściciel</span><span className="v sm">{role.owner}{owner && <span className="dim"> · Ty</span>}</span></div>
        <div><span className="k">Zastępca</span><span className="v sm">{role.deputy}</span></div>
        <div><span className="k">Zgoda Compliance</span><span className="v sm">{role.compliance ? 'Wymagana' : 'Nie jest wymagana'}</span></div>
        <div><span className="k">Posiadacze</span><span className="v holders"><span className="num">{role.holderCount}</span>
          <span className="stack">{role.holders.slice(0, 4).map(n => { const p = personOf(n); return p && <span key={n} title={n}><Avatar initials={p.initials} color={p.color} size={20} /></span> })}</span></span></div>
      </div>

      <InsetCard title="Zestaw uprawnień" icon="sliders" count={draft.filter(p => p.level !== 'Brak').length}
        right={edit ? <AddPerm existing={draft.map(p => p.name)} onAdd={(name, fields) => setDraft(d => [...d, { id: 'n' + Date.now(), name, fields: [...fields], level: 'Odczyt', scope: 'Własni klienci', actions: { eksport: false, druk: false } }])} />
          : <span className="dim" style={{ fontSize: 12, paddingRight: 4 }}>Tylko do odczytu</span>}>
        <div className="tbl perms" role="table" aria-label={`Uprawnienia roli ${role.name}`}>
          <div className="tr th" role="row"><span role="columnheader">Uprawnienie MS OS</span><span role="columnheader">Dane i pola</span><span role="columnheader">Poziom</span><span role="columnheader">Zakres</span><span role="columnheader">Czynności</span><span role="columnheader"><span className="sr-only">Usuń</span></span></div>
          {draft.map(p => {
            const b = role.perms.find(x => x.id === p.id)
            const dirty = !same(p, b)
            return (
              <div key={p.id} className={`tr ${dirty ? 'dirty' : ''} ${p.level === 'Brak' ? 'off' : ''}`} role="row">
                <span role="cell"><span className="trunc" style={{ color: 'var(--t-strong)' }} title={p.name}>{p.name}</span></span>
                <span role="cell" className="two">
                  <FieldPicker perm={p} disabled={p.level === 'Brak'} onChange={fields => upd(p.id, { fields })} />
                  {!p.fields.length && p.level !== 'Brak' && <span className="err" style={{ marginTop: 4 }}>Wybierz co najmniej jedno pole</span>}
                </span>
                <span role="cell">{edit ? <Segmented label={`Poziom: ${p.name}`} value={p.level} onChange={level => upd(p.id, { level })} options={LEVELS.map(l => ({ value: l, label: l }))} />
                  : <span className={`lvl lvl-${p.level === 'Edycja' ? 'e' : p.level === 'Odczyt' ? 'o' : 'n'}`}>{p.level}</span>}</span>
                <span role="cell">{edit ? <select className="select sm" aria-label={`Zakres: ${p.name}`} value={p.scope} onChange={e => upd(p.id, { scope: e.target.value })} disabled={p.level === 'Brak'}>{SCOPES.map(s => <option key={s}>{s}</option>)}</select>
                  : <span className="trunc">{p.scope}</span>}</span>
                <span role="cell" className="acts">
                  {(['eksport', 'druk'] as const).map(k => edit
                    ? <button key={k} className={`tog ${p.actions[k] ? 'on' : ''}`} aria-pressed={p.actions[k]} disabled={p.level === 'Brak'} onClick={() => upd(p.id, { actions: { ...p.actions, [k]: !p.actions[k] } })}>
                        <Icon name={p.actions[k] ? 'check' : 'plus'} size={12} />{k === 'eksport' ? 'Eksport' : 'Druk'}</button>
                    : p.actions[k] && <span key={k} className="chip">{k === 'eksport' ? 'Eksport' : 'Druk'}</span>)}
                  {!edit && !p.actions.eksport && !p.actions.druk && <span className="dim">—</span>}
                </span>
                <span role="cell">{edit && <button className="ibtn" aria-label={`Usuń ${p.name} z roli`} onClick={() => setDraft(d => d.filter(x => x.id !== p.id))}><Icon name="trash-2" size={14} /></button>}</span>
              </div>
            )
          })}
        </div>
        {edit && changes.length > 0 && (
          <div className="savebar" role="region" aria-label="Niezapisane zmiany">
            <span className="udot" /><span><b className="num">{changes.length}</b> {changes.length === 1 ? 'zmiana' : 'zmiany'} · obejmie <b className="num">{role.holderCount}</b> posiadaczy roli</span>
            <span className="grow" />
            <button className="btn btn-ghost" onClick={() => setDraft(role.perms)}>Odrzuć</button>
            <button className="btn btn-primary" onClick={() => setReview(true)} disabled={invalid}>Przejrzyj i zapisz</button>
          </div>
        )}
      </InsetCard>
      {!edit && <p className="hint">{owner ? 'Jesteś właścicielem tej roli: decydujesz o wnioskach o nią. Skład roli zmienia administrator CBU.' : 'Skład roli zmienia administrator CBU.'}</p>}

      <Dialog open={review} onClose={() => setReview(false)} width={520} title={`Zapisać zmiany w roli „${role.name}”?`}
        sub={<>Zmiana obejmie od razu <b style={{ color: 'var(--t)' }} className="num">{role.holderCount}</b> posiadaczy roli.{role.compliance && ' Rola wymaga zgody Compliance, więc zmiana trafi też do jej rejestru.'}</>}
        footer={<><button className="btn btn-ghost" onClick={() => setReview(false)}>Wróć do edycji</button><button className="btn btn-primary" onClick={save}>Zapisz zmiany</button></>}>
        <ul className="diff">
          {changes.map((c, i) => (
            <li key={i}>
              <span className={`diff-k ${c.kind}`}>{c.kind === 'add' ? 'Dodano' : c.kind === 'del' ? 'Usunięto' : 'Zmieniono'}</span>
              <span className="two"><span>{c.p.name}</span>
                <span className="meta">{c.kind === 'mod' && c.before ? diffText(c.before, c.p) : `${c.p.level} · ${c.p.scope}`}</span></span>
            </li>
          ))}
        </ul>
      </Dialog>
    </div>
  )
}

function diffText(a: Perm, b: Perm) {
  const out: string[] = []
  if (!sameFields(a.fields, b.fields)) out.push(`pola: ${fieldsLabel(a.name, a.fields)} → ${fieldsLabel(b.name, b.fields)}`)
  if (a.level !== b.level) out.push(`poziom: ${a.level} → ${b.level}`)
  if (a.scope !== b.scope) out.push(`zakres: ${a.scope} → ${b.scope}`)
  if (a.actions.eksport !== b.actions.eksport) out.push(`eksport: ${b.actions.eksport ? 'włączony' : 'wyłączony'}`)
  if (a.actions.druk !== b.actions.druk) out.push(`druk: ${b.actions.druk ? 'włączony' : 'wyłączony'}`)
  return out.join(' · ')
}

function AddPerm({ existing, onAdd }: { existing: string[]; onAdd: (name: string, fields: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), [btn, pop], btn)
  const left = PREDEFINED.filter(p => !existing.includes(p.name))
  const openMenu = () => { setOpen(true); requestAnimationFrame(() => pop.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus()) }
  return (
    <div className="pop-anchor">
      <button ref={btn} className="btn btn-ghost btn-sm" aria-haspopup="menu" aria-expanded={open} onClick={() => open ? setOpen(false) : openMenu()} disabled={!left.length}>
        <Icon name="plus" size={14} />Dodaj uprawnienie</button>
      <div ref={pop} className={`pop right ${open ? 'open' : ''}`} role="menu" aria-label="Predefiniowane uprawnienia" style={{ top: 30, right: 0, width: 300 }} onKeyDown={e => menuKeys(e, () => setOpen(false))}>
        <div className="m-h">Predefiniowane uprawnienia MS OS</div>
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {left.map(p => (
            <button key={p.name} className="mi" role="menuitem" tabIndex={-1} style={{ height: 44 }} onClick={() => { onAdd(p.name, p.fields); setOpen(false); btn.current?.focus() }}>
              <span className="two" style={{ padding: 0 }}><span className="trunc">{p.name}</span><span className="meta trunc" style={{ fontSize: 12, color: 'var(--t-4)' }}>{p.fields.join(', ')}</span></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Wybór danych i pól, których dotyczy uprawnienie (katalog z PREDEFINED).
   Menu jest fixed, bo karta tabeli przycina przepełnienie. */
function FieldPicker({ perm, disabled, onChange }: { perm: Perm; disabled?: boolean; onChange: (f: string[]) => void }) {
  const all = catalog(perm.name)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), [btn, pop], btn)
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (!pop.current?.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('scroll', close, true); window.addEventListener('resize', close)
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close) }
  }, [open])
  const show = () => {
    const r = btn.current!.getBoundingClientRect()
    setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 248) }); setOpen(true)
    requestAnimationFrame(() => pop.current?.querySelector<HTMLElement>('[role=menuitemcheckbox]')?.focus())
  }
  const toggle = (f: string) => onChange(perm.fields.includes(f) ? perm.fields.filter(x => x !== f) : all.filter(x => x === f || perm.fields.includes(x)))
  const label = fieldsLabel(perm.name, perm.fields)
  return (
    <>
      <button ref={btn} className={`fpick ${!perm.fields.length ? 'empty' : ''}`} disabled={disabled} aria-haspopup="menu" aria-expanded={open}
        aria-label={`Dane i pola: ${perm.name}. Wybrane: ${label}`} onClick={() => open ? setOpen(false) : show()}
        onKeyDown={e => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); show() } }}>
        {/* częściowy wybór: pierwsze pole + licznik reszty, pełna lista w podpowiedzi */}
        <span className="trunc" title={label}>{perm.fields.length > 0 && perm.fields.length < all.length ? perm.fields[0] : label}</span>
        {perm.fields.length > 1 && perm.fields.length < all.length && <span className="fpick-n num">+{perm.fields.length - 1}</span>}
        <Icon name="chevron-down" size={14} />
      </button>
      <div ref={pop} className={`fmenu fixed ${open ? 'open' : ''}`} role="menu" aria-label={`Dane i pola: ${perm.name}`}
        style={pos ? { top: pos.top, left: pos.left, minWidth: pos.width } : undefined} onKeyDown={e => menuKeys(e, () => setOpen(false))}>
        <div className="fm-h">Dane i pola · {perm.name}</div>
        <div className="fm-list">
          {all.map(f => (
            <button key={f} className="fo" role="menuitemcheckbox" aria-checked={perm.fields.includes(f)} tabIndex={-1} onClick={() => toggle(f)}>
              <span className="cb"><Icon name="check" size={12} /></span><span className="trunc">{f}</span>
            </button>
          ))}
        </div>
        <div className="fm-foot"><span>{perm.fields.length} z {all.length}</span>
          {perm.fields.length < all.length
            ? <button onClick={() => onChange([...all])}>Zaznacz wszystkie</button>
            : <button onClick={() => onChange([])}>Wyczyść</button>}
        </div>
      </div>
    </>
  )
}
