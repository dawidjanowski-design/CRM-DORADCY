import { createContext, useContext, useEffect, useState } from 'react'
import { go, routeFor, useApp } from '../../store'
import { itemState, PEOPLE, PREDEFINED, RESOURCES, ROLES, SCOPES, type ReqItem, type Level } from '../../data/cbu'
import { Drawer, Icon, PageHead, Segmented } from '../../components/ui'
import { People } from './People'
import { Roles } from './Roles'
import { Requests } from './Requests'

export type View = 'osoby' | 'role' | 'zasoby' | 'wnioski'

/* Dwie perspektywy tych samych ekranów:
   · self: zalogowany pracownik (doradca) widzi własne dostępy i wnioski, prosi o pojedyncze uprawnienie;
   · admin: ekrany IT (ewidencja, role i zasoby, decyzje i wykonanie) pod modułami CBU w sekcji IT. */
export const CbuCtx = createContext<{ self: boolean; base: string }>({ self: false, base: 'uprawnienia' })
export const useCbu = () => useContext(CbuCtx)

export const scopePeople = () => PEOPLE

/* Wnioski z pozycją czekającą na decyzję albo na wykonanie przez IT */
export function pending(requests: ReturnType<typeof useApp>['requests']) {
  return requests.filter(r => r.items.some(it => { const s = itemState(it).s; return s === 'czeka' || s === 'do_wykonania' }))
}

export function Cbu({ view, self = false }: { view: View; self?: boolean }) {
  const { requests, user } = useApp()
  const { route } = useApp()
  const [drawer, setDrawer] = useState<{ person?: string } | null>(() => route.params.get('nowy') === '1' ? {} : null)
  const base = self ? 'moje-dostepy' : 'uprawnienia'
  // akcja „Poproś o dostęp” z wyszukiwarki ⌘K: otwórz formularz i wyczyść parametr
  useEffect(() => { if (route.params.get('nowy') === '1') { setDrawer({}); go(self ? base : `${base}/${view}`) } }, [route.params.get('nowy')]) // eslint-disable-line react-hooks/exhaustive-deps
  const open = pending(self ? requests.filter(r => r.person === user.name || r.author === user.name) : requests).length
  const v: View = self && (view === 'role' || view === 'zasoby') ? 'osoby' : view
  const tab = v === 'zasoby' ? 'role' : v

  return (
    <CbuCtx.Provider value={{ self, base }}>
      {self
        ? <PageHead icon="unlock" title="Moje dostępy" meta="Centralna Baza Uprawnień">
            <button className="btn btn-primary" onClick={() => setDrawer({})}><Icon name="plus" size={14} />Poproś o dostęp</button>
          </PageHead>
        : <PageHead icon="key" title="Uprawnienia" meta="Centralna Baza Uprawnień">
            <button className="btn btn-primary" onClick={() => setDrawer({})}><Icon name="plus" size={14} />Nowy wniosek</button>
          </PageHead>}
      <div className="fbar">
        <Segmented label="Widok" value={tab} onChange={x => go(x === 'osoby' && self ? base : `${base}/${x}`)} options={self ? [
          { value: 'osoby', label: 'Dostępy', icon: 'unlock' },
          { value: 'wnioski', label: <>Moje wnioski{open > 0 && <span className="count">{open}</span>}</>, icon: 'file-text' },
        ] : [
          { value: 'osoby', label: 'Osoby i dostępy', icon: 'users' },
          { value: 'role', label: 'Role i zasoby', icon: 'layers' },
          { value: 'wnioski', label: <>Wnioski i decyzje{open > 0 && <span className="count">{open}</span>}</>, icon: 'check-square' },
        ]} />
      </div>
      {v === 'osoby' && <People onRequest={person => setDrawer({ person })} />}
      {(v === 'role' || v === 'zasoby') && <Roles key={v} initialTab={v === 'zasoby' ? 'zasoby' : 'role'} />}
      {v === 'wnioski' && <Requests />}
      <RequestDrawer open={!!drawer} person={drawer?.person} onClose={() => setDrawer(null)} />
    </CbuCtx.Provider>
  )
}


/* ---------- formularz wniosku ---------- */
type Draft = { key: number; what: string; level: Exclude<Level, 'Brak'>; scope: string }
const OPTIONS = [...PREDEFINED.map(p => ({ name: p.name, system: 'MS OS' })), ...RESOURCES.filter(r => r.system !== 'MS OS').map(r => ({ name: r.name, system: r.system }))]
const ownerOf = (name: string) => RESOURCES.find(r => r.name === name)?.owner ?? 'Dorota Wrona'
const needsCompliance = (name: string, level: string) => level === 'Edycja' || /kontaktowe|Eksport|Lista klientów/.test(name)

function RequestDrawer({ open, person, onClose }: { open: boolean; person?: string; onClose: () => void }) {
  const { user, submit, notify } = useApp()
  const { self, base } = useCbu()
  const people = scopePeople()
  const [who, setWho] = useState(person ?? user.name)
  const [op, setOp] = useState<'nadanie' | 'odebranie'>('nadanie')
  const [kind, setKind] = useState<'uprawnienie' | 'rola'>('uprawnienie')
  const [role, setRole] = useState(ROLES[0].name)
  const [items, setItems] = useState<Draft[]>([{ key: 1, what: '', level: 'Odczyt', scope: 'Własni klienci' }])
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const [lastOpen, setLastOpen] = useState(false)

  if (open !== lastOpen) {          // reset przy każdym otwarciu
    setLastOpen(open)
    if (open) { setWho(person ?? user.name); setOp('nadanie'); setKind('uprawnienie'); setItems([{ key: 1, what: '', level: 'Odczyt', scope: 'Własni klienci' }]); setReason(''); setTried(false) }
  }

  // pracownik prosi tylko o pojedyncze uprawnienie dla siebie; odebranie i całą rolę obsługują uprawnione osoby i HR
  const canRevoke = !self  // odebranie przez uprawnioną osobę przechodzi od razu do wykonania
  const hr = !self         // przydzielenie całej roli inicjuje HR
  const upd = (k: number, patch: Partial<Draft>) => setItems(xs => xs.map(x => x.key === k ? { ...x, ...patch } : x))
  const valid = (kind === 'rola' || items.every(i => i.what)) && reason.trim().length >= 10

  const save = () => {
    setTried(true)
    if (!valid) return
    const reqItems: ReqItem[] = kind === 'rola'
      ? [(() => { const r = ROLES.find(x => x.name === role)!; return { id: '1', op, kind: 'rola' as const, what: `Rola „${r.name}”`, system: 'MS OS', scope: 'Według roli', exec: 'auto' as const, steps: op === 'odebranie' && canRevoke ? [] : routeFor(who, r.owner, r.compliance), history: [] } })()]
      : items.map((d, i) => {
        const sys = OPTIONS.find(o => o.name === d.what)!.system
        return {
          id: String(i + 1), op, kind: 'uprawnienie' as const, what: d.what, system: sys, level: d.level, scope: sys === 'MS OS' ? d.scope : 'Bez zakresu',
          exec: sys === 'MS OS' ? 'auto' as const : 'it' as const,
          steps: op === 'odebranie' && canRevoke ? [] : routeFor(who, ownerOf(d.what), needsCompliance(d.what, d.level)), history: [],
        }
      })
    const id = submit({ person: who, reason: reason.trim(), items: reqItems })
    onClose()
    notify(op === 'odebranie' && canRevoke ? `Odebranie ${id} przekazane do wykonania` : `Złożono wniosek ${id}`, { label: 'Otwórz', run: () => go(`${base}/wnioski?w=${id}`) })
  }

  const steps = routeFor(who, items[0]?.what ? ownerOf(items[0].what) : 'właściciel zasobu', needsCompliance(items[0]?.what ?? '', items[0]?.level ?? 'Odczyt'))

  return (
    <Drawer open={open} onClose={onClose} title={self ? 'Poproś o dostęp' : 'Nowy wniosek o dostęp'} icon="key"
      footer={<><span className="muted" style={{ paddingLeft: 8 }}>{kind === 'uprawnienie' ? `${items.length} ${items.length === 1 ? 'pozycja' : 'pozycje'}` : '1 rola'}</span><span className="grow" />
        <button className="btn btn-ghost" onClick={onClose}>Anuluj</button>
        <button className="btn btn-primary" onClick={save}><Icon name="send" size={14} />{op === 'odebranie' && canRevoke ? 'Odbierz dostęp' : 'Złóż wniosek'}</button></>}>
      <div className="dw-sec">
        <div className="field">
          <label htmlFor="rq-who">Osoba</label>
          {self
            ? <div className="ro" id="rq-who">{user.name}<span className="muted">&nbsp;· {user.title}</span></div>
            : <select id="rq-who" className="select" value={who} onChange={e => setWho(e.target.value)}>{people.map(p => <option key={p.name}>{p.name}</option>)}</select>}
        </div>
        {self ? (
          <p className="hint">Prosisz o pojedyncze uprawnienie. Całą rolę przydziela HR.</p>
        ) : <>
          <div className="field">
            <span className="flabel">Operacja</span>
            <Segmented label="Operacja" value={op} onChange={setOp} options={[{ value: 'nadanie', label: 'Nadanie' }, { value: 'odebranie', label: 'Odebranie' }]} />
          </div>
          <div className="field">
            <span className="flabel">Czego dotyczy</span>
            <Segmented label="Rodzaj" value={kind} onChange={k => (k === 'rola' && !hr) ? undefined : setKind(k)}
              options={[{ value: 'uprawnienie', label: 'Pojedyncze uprawnienie' }, { value: 'rola', label: 'Cała rola' }]} />
            {kind === 'rola' && <p className="hint">Przydzielenie całej roli inicjuje HR.</p>}
          </div>
        </>}
      </div>

      <div className="dw-sec">
        {kind === 'rola'
          ? <div className="field"><label htmlFor="rq-role">Rola</label>
              <select id="rq-role" className="select" value={role} onChange={e => setRole(e.target.value)}>{ROLES.map(r => <option key={r.name}>{r.name}</option>)}</select></div>
          : items.map((d, i) => (
            <div key={d.key} className="rq-item">
              <div className="rq-item-h"><span className="dim">Pozycja {i + 1}</span><span className="grow" />
                {items.length > 1 && <button className="ibtn" aria-label={`Usuń pozycję ${i + 1}`} onClick={() => setItems(xs => xs.filter(x => x.key !== d.key))}><Icon name="x" size={14} /></button>}</div>
              <div className="field">
                <label htmlFor={`rq-w-${d.key}`}>Uprawnienie lub zasób</label>
                <select id={`rq-w-${d.key}`} className="select" value={d.what} onChange={e => upd(d.key, { what: e.target.value })} aria-invalid={tried && !d.what}>
                  <option value="">Wybierz…</option>
                  <optgroup label="Uprawnienia MS OS">{PREDEFINED.map(p => <option key={p.name}>{p.name}</option>)}</optgroup>
                  <optgroup label="Zasoby poza MS OS">{RESOURCES.filter(r => r.system !== 'MS OS').map(r => <option key={r.name} value={r.name}>{r.name}</option>)}</optgroup>
                </select>
                {tried && !d.what && <p className="err"><Icon name="alert-circle" size={14} />Wybierz, do czego potrzebny jest dostęp.</p>}
              </div>
              <div className="rq-two">
                <div className="field"><span className="flabel">Poziom</span>
                  <Segmented label="Poziom" value={d.level} onChange={level => upd(d.key, { level })} options={[{ value: 'Odczyt', label: 'Odczyt' }, { value: 'Edycja', label: 'Edycja' }]} /></div>
                <div className="field"><label htmlFor={`rq-s-${d.key}`}>Zakres</label>
                  <select id={`rq-s-${d.key}`} className="select" value={d.scope} onChange={e => upd(d.key, { scope: e.target.value })} disabled={OPTIONS.find(o => o.name === d.what)?.system !== undefined && OPTIONS.find(o => o.name === d.what)?.system !== 'MS OS'}>
                    {SCOPES.map(s => <option key={s}>{s}</option>)}</select></div>
              </div>
            </div>
          ))}
        {kind === 'uprawnienie' && <button className="btn btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setItems(xs => [...xs, { key: Date.now(), what: '', level: 'Odczyt', scope: 'Własni klienci' }])}><Icon name="plus" size={14} />Dodaj kolejną pozycję</button>}
      </div>

      <div className="dw-sec">
        <div className="field">
          <label htmlFor="rq-why">Uzasadnienie</label>
          <textarea id="rq-why" className="textarea" value={reason} onChange={e => setReason(e.target.value)} placeholder="Do czego potrzebny jest dostęp?" aria-invalid={tried && reason.trim().length < 10} />
          {tried && reason.trim().length < 10 ? <p className="err"><Icon name="alert-circle" size={14} />Napisz krótko, do czego potrzebny jest dostęp (min. 10 znaków).</p>
            : <p className="hint">Uzasadnienie zobaczą wszystkie osoby decydujące.</p>}
        </div>
        <div className="field">
          <span className="flabel">Kto zdecyduje</span>
          {op === 'odebranie' && canRevoke
            ? <p className="hint">Odebranie przez uprawnioną osobę przechodzi od razu do wykonania.</p>
            : <ol className="path">{steps.map((s, i) => <li key={i}><span className="path-n num">{i + 1}</span><span>{s.role}</span><span className="muted trunc">{s.who}</span></li>)}
                <li><span className="path-n"><Icon name="zap" size={12} /></span><span>Wykonanie</span><span className="muted">MS OS automatycznie, zasoby zewnętrzne IT</span></li></ol>}
        </div>
      </div>
    </Drawer>
  )
}
