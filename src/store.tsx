import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { USER, type User } from './data/user'
import { ACCESSES, REQUESTS, ROLES, person as personOf, type Access, type Perm, type ReqItem, type Request, type RoleDef, type Step, type StepRole } from './data/cbu'

/* ---------- routing na hashu: #/pulpit, #/uprawnienia/wnioski?w=… ---------- */
export type Route = { path: string; params: URLSearchParams }
const readRoute = (): Route => {
  const raw = location.hash.replace(/^#\/?/, '') || 'logowanie'
  const [path, q = ''] = raw.split('?')
  return { path, params: new URLSearchParams(q) }
}
export const go = (to: string) => { location.hash = '/' + to }

/* ---------- pamięć przeglądarki tylko dla wygody podglądu ---------- */
const load = (k: string) => { try { return localStorage.getItem(k) } catch { return null } }
const save = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* tryb prywatny */ } }

export type Toast = { id: number; msg: string; action?: { label: string; run: () => void } }

const nowLabel = () => {
  const d = new Date()
  return `dziś, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

type Ctx = {
  route: Route
  user: User
  hidden: Set<string>                       // ukryte sekcje i pozycje menu
  setHidden: (key: string, hide: boolean) => void
  resetMenu: () => void
  toast: Toast | null
  notify: (msg: string, action?: Toast['action']) => void
  // CBU
  accesses: Access[]
  requests: Request[]
  roles: RoleDef[]
  decide: (reqId: string, itemId: string, decision: 'ok' | 'no', reason?: string) => void
  execute: (reqId: string, itemId: string) => void
  revoke: (accessId: string) => void
  submit: (r: Omit<Request, 'id' | 'createdAt' | 'author'>) => string
  saveRole: (name: string, perms: Perm[]) => void
}

const C = createContext<Ctx | null>(null)
export const useApp = () => {
  const c = useContext(C)
  if (!c) throw new Error('useApp poza AppProvider')
  return c
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState(readRoute)
  const [hidden, setHiddenState] = useState<Set<string>>(() => new Set(JSON.parse(load('msos.menu.hidden') ?? '[]')))
  const [toast, setToast] = useState<Toast | null>(null)
  const [accesses, setAccesses] = useState(ACCESSES)
  const [requests, setRequests] = useState(REQUESTS)
  const [roles, setRoles] = useState(ROLES)
  const seq = useRef(525)
  const timer = useRef<number>()

  useEffect(() => {
    const on = () => setRoute(readRoute())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const user = USER
  const me = user.name

  const setHidden = useCallback((key: string, hide: boolean) => setHiddenState(prev => {
    const next = new Set(prev); if (hide) next.add(key); else next.delete(key)
    save('msos.menu.hidden', JSON.stringify([...next])); return next
  }), [])
  const resetMenu = useCallback(() => { setHiddenState(new Set()); save('msos.menu.hidden', '[]') }, [])

  const notify = useCallback((msg: string, action?: Toast['action']) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), msg, action })
    timer.current = window.setTimeout(() => setToast(null), action ? 6000 : 3800)
  }, [])

  const patchItem = (reqId: string, itemId: string, fn: (it: ReqItem) => ReqItem) =>
    setRequests(rs => rs.map(r => r.id !== reqId ? r : { ...r, items: r.items.map(i => i.id === itemId ? fn(i) : i) }))

  const grant = (req: Request, it: ReqItem) => {
    if (it.op === 'nadanie' && it.level) {
      setAccesses(a => [...a, { id: `${req.id}-${it.id}`, person: req.person, resource: it.what, system: it.system, level: it.level!, scope: it.scope,
        sources: [{ kind: 'nadanie', name: 'Nadanie indywidualne', since: nowLabel(), by: it.steps.map(s => s.who).join(', '), request: req.id }] }])
    } else if (it.op === 'odebranie') {
      setAccesses(a => a.filter(x => !(x.person === req.person && x.resource === it.what)))
    }
  }

  const decide: Ctx['decide'] = (reqId, itemId, decision, reason) => {
    const req = requests.find(r => r.id === reqId); const it = req?.items.find(i => i.id === itemId)
    if (!req || !it) return
    const at = nowLabel()
    const idx = it.steps.findIndex(s => !s.decision)
    // prototyp bez ról: decyzję zapisujemy w imieniu osoby, na którą czeka krok
    const who = it.steps[idx]?.who ?? me
    const steps = it.steps.map((s, i) => i === idx ? { ...s, decision, at, reason } : s)
    const role = it.steps[idx]?.role.toLowerCase()
    const history = [...it.history, { at, who, text: decision === 'ok' ? `Zatwierdził(a) jako ${role}` : `Odmówił(a) jako ${role}` }]
    const done = decision === 'ok' && steps.every(s => s.decision === 'ok')
    let next: ReqItem = { ...it, steps, history }
    if (done && it.exec === 'auto') {
      next = { ...next, executed: { at, by: 'MS DOS (automatycznie)' }, history: [...history, { at, who: 'MS DOS', text: it.op === 'nadanie' ? 'Nadano automatycznie' : 'Odebrano automatycznie' }] }
      grant(req, next)
    } else if (done) {
      next = { ...next, history: [...history, { at, who: 'MS DOS', text: 'Przekazano do wykonania przez IT' }] }
    }
    patchItem(reqId, itemId, () => next)
  }

  const execute: Ctx['execute'] = (reqId, itemId) => {
    const req = requests.find(r => r.id === reqId); const it = req?.items.find(i => i.id === itemId)
    if (!req || !it) return
    const at = nowLabel()
    const next = { ...it, executed: { at, by: me }, history: [...it.history, { at, who: me, text: 'Potwierdził(a) ręczne wykonanie' }] }
    patchItem(reqId, itemId, () => next)
    grant(req, next)
  }

  const submit: Ctx['submit'] = r => {
    const id = `W-2026-0${++seq.current}`
    const at = nowLabel()
    setRequests(rs => [{ ...r, id, author: me, createdAt: at, items: r.items.map(i => ({ ...i, history: [{ at, who: me, text: i.op === 'odebranie' ? 'Odebrał(a) dostęp' : 'Złożył(a) wniosek' }, ...i.history] })) }, ...rs])
    return id
  }

  const revoke: Ctx['revoke'] = accessId => {
    const a = accesses.find(x => x.id === accessId)
    if (!a) return
    const at = nowLabel()
    const auto = a.system === 'MS DOS'
    const id = `W-2026-0${++seq.current}`
    const item: ReqItem = {
      id: '1', op: 'odebranie', kind: 'uprawnienie', what: a.resource, system: a.system, level: a.level, scope: a.scope,
      exec: auto ? 'auto' : 'it', steps: [],
      executed: auto ? { at, by: 'MS DOS (automatycznie)' } : undefined,
      history: [{ at, who: me, text: 'Odebrał(a) dostęp' }, { at, who: 'MS DOS', text: auto ? 'Odebrano automatycznie' : 'Przekazano do wykonania przez IT' }],
    }
    setRequests(rs => [{ id, person: a.person, author: me, createdAt: at, reason: 'Odebranie przez uprawnioną osobę.', items: [item] }, ...rs])
    if (auto) setAccesses(xs => xs.filter(x => x.id !== accessId))
  }

  const saveRole: Ctx['saveRole'] = (name, perms) => setRoles(rs => rs.map(r => r.name === name ? { ...r, perms } : r))

  const value = useMemo<Ctx>(() => ({
    route, user, hidden, setHidden, resetMenu, toast, notify,
    accesses, requests, roles, decide, execute, revoke, submit, saveRole,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [route, hidden, toast, accesses, requests, roles])

  return <C.Provider value={value}>{children}</C.Provider>
}

/* ---------- ścieżka decyzji dla nowego wniosku (z briefu) ----------
   nadanie: przełożony → właściciel → Compliance (gdy wymagane);
   AFI: pierwszą decyzję podejmuje szef działu sprzedaży;
   członek Zarządu: wniosek zaczyna się u właściciela. */
export function routeFor(personName: string, owner: string, compliance: boolean): Step[] {
  const p = personOf(personName)
  const steps: Step[] = []
  if (p?.afi) steps.push({ role: 'Szef działu sprzedaży' as StepRole, who: 'Anna Sobczak' })
  else if (!p?.board && p?.supervisor) steps.push({ role: 'Przełożony', who: p.supervisor })
  steps.push({ role: 'Właściciel', who: owner })
  if (compliance) steps.push({ role: 'Compliance', who: 'Michał Górski' })
  return steps
}
