import { useMemo, useState } from 'react'
import { go, useApp } from '../../store'
import { itemState, person as personOf, STATE_LABEL, type Access } from '../../data/cbu'
import { Avatar, Dialog, Empty, Icon, InsetCard, Status } from '../../components/ui'
import { scopePeople, useCbu } from './Cbu'

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l')

export function People({ onRequest }: { onRequest: (person: string) => void }) {
  const { user: persona, route, accesses } = useApp()
  const { self, base } = useCbu()
  // doradca widzi tylko siebie; ekran IT — pełną ewidencję
  const people = self ? scopePeople().filter(p => p.name === persona.name) : scopePeople()
  const [q, setQ] = useState('')
  const selected = people.find(p => p.name === route.params.get('o'))?.name ?? (people.find(p => p.name === persona.name) ? persona.name : people[0]?.name)
  const list = people.filter(p => !q || fold(p.name + ' ' + p.unit).includes(fold(q)))
  const single = people.length === 1

  return (
    <div className={`page ${single ? '' : 'split'}`}>
      {!single && (
        <InsetCard title="Osoby" count={people.length} className="split-l">
          <label className="well"><Icon name="search" size={14} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Szukaj osoby lub jednostki" aria-label="Szukaj osoby" /></label>
          <div className="rows plist" role="listbox" aria-label="Osoby">
            {list.map(p => {
              const n = accesses.filter(a => a.person === p.name).length
              return (
                <button key={p.name} className={`r ${p.name === selected ? 'sel' : ''}`} role="option" aria-selected={p.name === selected}
                  onClick={() => go(`${base}/osoby?o=` + encodeURIComponent(p.name))}>
                  <Avatar initials={p.initials} color={p.color} size={24} />
                  <span className="two"><span className="trunc">{p.name}{p.name === persona.name && <span className="dim"> · Ty</span>}</span><span className="meta trunc">{p.unit}</span></span>
                  <span className="when num">{n}</span>
                </button>
              )
            })}
            {list.length === 0 && <div className="r muted">Nikt nie pasuje do „{q}”</div>}
          </div>
        </InsetCard>
      )}
      {selected && <PersonDetail key={selected} name={selected} onRequest={onRequest} />}
    </div>
  )
}

function PersonDetail({ name, onRequest }: { name: string; onRequest: (p: string) => void }) {
  const { user: persona, accesses, requests, revoke, notify, execute } = useApp()
  const { self, base } = useCbu()
  const p = personOf(name)!
  const rows = accesses.filter(a => a.person === name)
  const manage = !self   // odbiera uprawniona osoba, nie sam pracownik
  const [open, setOpen] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Access | null>(null)
  const pending = useMemo(() => requests.filter(r => r.person === name && r.items.some(i => {
    const s = itemState(i).s; return s === 'czeka' || s === 'do_wykonania'
  })), [requests, name])

  const doRevoke = () => {
    if (!confirm) return
    // telefon jest częścią danych kontaktowych: po odebraniu edycji zostaje odczyt z roli
    const left = confirm.resource.startsWith('Telefon')
      ? accesses.filter(a => a.person === name && a.resource === 'Dane kontaktowe klienta' && a.sources.some(s => s.kind === 'rola'))
      : []
    revoke(confirm.id)
    notify(confirm.system === 'MS OS'
      ? `Odebrano: ${confirm.resource.toLowerCase()} (${confirm.level.toLowerCase()}).${left.length ? ` Zostaje ${left[0].level.toLowerCase()} z roli ${left[0].sources[0].name}.` : ''}`
      : `Odebranie przekazane do wykonania przez IT`)
    setConfirm(null)
  }

  return (
    <div className="split-r">
      <div className="person-h">
        <Avatar initials={p.initials} color={p.color} size={32} />
        <div style={{ minWidth: 0 }}>
          <h2 className="ent-title">{p.name}</h2>
          <p className="muted trunc" style={{ marginTop: 2 }}>{p.title} · {p.unit}{p.afi && ' · AFI'}</p>
        </div>
        <span className="grow" />
        {/* u doradcy „Poproś o dostęp” jest już w nagłówku strony; tu tylko na ekranie IT (wniosek z wybraną osobą) */}
        {!self && <button className="btn btn-secondary" onClick={() => onRequest(name)}><Icon name="plus" size={14} />{name === persona.name ? 'Poproś o dostęp' : 'Wniosek dla tej osoby'}</button>}
      </div>

      <InsetCard title="Aktualne dostępy" icon="unlock" count={rows.length} id="acc-h">
        {rows.length === 0 ? <Empty icon="lock" title="Brak dostępów" hint="Ta osoba nie ma żadnych nadanych dostępów." /> : (
          <div className="tbl acc" role="table" aria-labelledby="acc-h">
            <div className="tr th" role="row"><span role="columnheader">Zasób</span><span role="columnheader">Poziom</span><span role="columnheader">Zakres</span><span role="columnheader">Źródło nadania</span><span role="columnheader"><span className="sr-only">Szczegóły</span></span></div>
            {rows.map(a => {
              const isOpen = open === a.id
              const src = a.sources.length > 1 ? `${a.sources.length} źródła` : a.sources[0].name
              return (
                <div key={a.id} className={`acc-row ${isOpen ? 'open' : ''}`} role="rowgroup">
                  <button className="tr" role="row" aria-expanded={isOpen} aria-controls={`src-${a.id}`} onClick={() => setOpen(isOpen ? null : a.id)}>
                    <span role="cell" className="two"><span className="trunc" style={{ color: 'var(--t-strong)' }}>{a.resource}</span><span className="meta trunc">{a.system}{a.fields && ` · ${a.fields}`}</span></span>
                    <span role="cell"><span className={`lvl lvl-${a.level === 'Edycja' ? 'e' : 'o'}`}>{a.level}</span></span>
                    <span role="cell" className="trunc">{a.scope}</span>
                    <span role="cell"><span className="chip"><Icon name={a.sources.length > 1 ? 'layers' : a.sources[0].kind === 'rola' ? 'users' : 'user'} size={14} /><span className="trunc">{src}</span></span></span>
                    <span role="cell" className="acc-chev"><Icon name="chevron-down" size={14} /></span>
                  </button>
                  <div className="acc-exp" id={`src-${a.id}`}>
                    <div className="acc-exp-in">
                      <div className="src-list">
                        <span className="dim" style={{ fontSize: 12 }}>Dostęp wynika z:</span>
                        {a.sources.map((s, i) => (
                          <div key={i} className="src">
                            <span className="src-i"><Icon name={s.kind === 'rola' ? 'users' : 'user'} size={14} /></span>
                            <span className="two"><span>{s.kind === 'rola' ? `Rola „${s.name}”` : s.name}</span>
                              <span className="meta">od {s.since} · {s.kind === 'rola' ? 'przydzielił(a)' : 'zatwierdzili'}: {s.by}{s.request && <> · <a className="link" href={`#/${base}/wnioski?w=${s.request}`} tabIndex={isOpen ? 0 : -1}>{s.request}</a></>}</span></span>
                            {s.kind === 'nadanie' && manage && <button className="btn btn-danger btn-sm" tabIndex={isOpen ? 0 : -1} onClick={() => setConfirm(a)}>Odbierz</button>}
                            {s.kind === 'rola' && <span className="dim" style={{ fontSize: 12 }}>Zmiana przez HR</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </InsetCard>

      <InsetCard title="Wnioski w toku" icon="clock" count={pending.length}>
        {pending.length === 0 ? <Empty icon="check" title="Nic nie czeka" hint="Nowe wnioski tej osoby pojawią się tutaj." /> : pending.map(r => (
          <div key={r.id} className="preq">
            <div className="preq-h"><a className="link num" href={`#/${base}/wnioski?w=${r.id}`}>{r.id}</a><span className="dim">złożony {r.createdAt.replace(' 2026', '')}{r.author !== r.person && ` przez ${r.author}`}</span></div>
            {r.items.map(it => {
              const st = itemState(it); const lab = STATE_LABEL(st)
              return (
                <div key={it.id} className="r preq-i">
                  <Icon name={st.s === 'nadano' || st.s === 'odebrano' ? 'check-circle' : st.s === 'do_wykonania' ? 'tool' : st.s === 'odmowa' ? 'x-circle' : 'clock'} size={16} className={`st-ico st-${st.s}`} />
                  <span className="two"><span className="trunc">{it.op === 'odebranie' ? 'Odebranie: ' : ''}{it.what}</span>
                    <span className="meta trunc">{it.level} · {it.scope} · {it.system}</span></span>
                  {st.s === 'czeka' && <span className="muted trunc" style={{ fontSize: 12 }}>{st.step.who}</span>}
                  <Status tone={lab.tone}>{lab.label}</Status>
                  {st.s === 'do_wykonania' && !self && <button className="btn btn-secondary btn-sm" onClick={() => { execute(r.id, it.id); notify(`Potwierdzono wykonanie: ${it.what}`) }}>Potwierdź wykonanie</button>}
                </div>
              )
            })}
          </div>
        ))}
      </InsetCard>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} title={`Odebrać dostęp: ${confirm?.resource ?? ''}?`}
        sub={confirm && <>{name} straci <b style={{ color: 'var(--t)' }}>{confirm.level.toLowerCase()} · {confirm.scope.toLowerCase()}</b> z nadania indywidualnego. Dostępy wynikające z ról zostają bez zmian.</>}
        footer={<><button className="btn btn-ghost" onClick={() => setConfirm(null)}>Anuluj</button><button className="btn btn-primary" onClick={doRevoke}>Odbierz dostęp</button></>}>
        <p className="hint">{confirm?.system === 'MS OS' ? 'MS OS wykona zmianę od razu.' : 'Zmianę wykona IT. Do tego czasu dostęp pozostaje aktywny.'} Odebranie trafi do historii jako wniosek.</p>
      </Dialog>
    </div>
  )
}
