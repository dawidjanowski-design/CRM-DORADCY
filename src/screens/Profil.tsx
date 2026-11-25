import { useState } from 'react'
import { useApp } from '../store'
import { itemState, person as personOf, ROLES } from '../data/cbu'
import { Avatar, Dialog, Icon, InsetCard, PageHead } from '../components/ui'

/* Mój profil zalogowanej osoby (brief, punkt 4).
   Nagłówek z pasem tła i dużym awatarem, chipy z najważniejszymi danymi,
   po lewej kontakt i miejsce w firmie, po prawej role MS OS i skrót do własnych dostępów. */

const ROLE_DESC: Record<string, string> = {
  'Pracownik MS': 'Podstawowy dostęp każdego pracownika: kalendarz, regulacje, zgłoszenia.',
}

export function Profil() {
  const { user, notify, accesses, requests } = useApp()
  const [about, setAbout] = useState<string | undefined>(user.about)
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState('')

  const boss = !user.afi && user.supervisor ? personOf(user.supervisor) : undefined
  const myAccess = accesses.filter(a => a.person === user.name).length
  const myPending = requests.filter(r => (r.person === user.name || r.author === user.name)
    && r.items.some(i => { const s = itemState(i).s; return s === 'czeka' || s === 'do_wykonania' })).length
  const copy = (v: string, what: string) => { navigator.clipboard?.writeText(v).catch(() => {}); notify(`Skopiowano ${what}`) }

  return (
    <>
      <PageHead icon="user" title="Mój profil" />
      <div className="page prof">
        {/* ---------- nagłówek: wyśrodkowana kolumna, jak strona aplikacji w Fieldnote ---------- */}
        <header className="prof-head enter">
          <span className="prof-av"><Avatar initials={user.initials} color={user.color} size={56} /></span>
          <div className="prof-name-row">
            <h2 className="prof-name">{user.name}</h2>
            {user.canEditProfile && <button className="btn btn-secondary btn-sm" onClick={() => { setDraft(about ?? ''); setEdit(true) }}><Icon name="edit-3" size={14} />Edytuj profil</button>}
          </div>
          <p className="prof-title">{user.title} · {user.unit}</p>
          {about && <p className="prof-about">{about}</p>}
          <div className="prof-meta">
            <button className="pm" onClick={() => copy(user.email, 'adres e-mail')} title="Kopiuj adres e-mail">
              <Icon name="mail" size={14} /><span className="trunc">{user.email}</span><Icon name="copy" size={12} className="pm-end" />
            </button>
            {user.pok && <><span className="pm-dot" /><span className="pm"><Icon name="map-pin" size={14} />{user.pok}</span></>}
            {boss && <><span className="pm-dot" /><span className="pm"><Avatar initials={boss.initials} color={boss.color} size={20} />Przełożony: {boss.name}</span></>}
          </div>
        </header>

        {/* ---------- sekcje jedna pod drugą: tytuł i opis nad kartą ---------- */}
        <section className="prof-sec">
          <div className="prof-sec-h"><div><h3>Kontakt służbowy</h3><p>Zmianę danych kontaktowych zgłoś do IT.</p></div></div>
          <InsetCard>
            <dl className="kvi">
              <Row icon="mail" label="E-mail">
                <span className="trunc">{user.email}</span>
                <button className="ibtn sm" onClick={() => copy(user.email, 'adres e-mail')} aria-label="Kopiuj adres e-mail" title="Kopiuj"><Icon name="copy" size={14} /></button>
              </Row>
              {user.phone && <Row icon="phone" label="Telefon służbowy"><span className="num">{user.phone}</span></Row>}
            </dl>
          </InsetCard>
        </section>

        <section className="prof-sec">
          <div className="prof-sec-h"><div><h3>Miejsce w firmie</h3><p>Korektę danych kadrowych zgłoś do HR.</p></div></div>
          <InsetCard>
            <dl className="kvi">
              <Row icon="award" label="Stanowisko">{user.title}</Row>
              <Row icon="layers" label="Dział lub jednostka">{user.unit}</Row>
              {boss && <Row icon="user" label="Bezpośredni przełożony"><Avatar initials={boss.initials} color={boss.color} size={20} />{boss.name}<span className="dim">· {boss.title}</span></Row>}
              {user.pok && <Row icon="map-pin" label="Punkt obsługi klienta (POK)">{user.pok}</Row>}
            </dl>
          </InsetCard>
        </section>

        <section className="prof-sec">
          <div className="prof-sec-h">
            <div><h3>Role w MS OS</h3><p><span className="num">{myAccess}</span> aktywnych dostępów{myPending > 0 && <> · <span className="num">{myPending}</span> {myPending === 1 ? 'wniosek' : 'wnioski'} w toku</>}</p></div>
            <a className="btn btn-ghost btn-sm" href="#/moje-dostepy">Moje dostępy<Icon name="arrow-right" size={14} /></a>
          </div>
          <InsetCard>
            <ul className="prof-roles">
              {user.msRoles.map(r => (
                <li key={r}>
                  <span className="tile"><Icon name="users" size={14} /></span>
                  <span className="two"><span>{r}</span><span className="meta">{ROLES.find(x => x.name === r)?.desc ?? ROLE_DESC[r] ?? ''}</span></span>
                </li>
              ))}
            </ul>
          </InsetCard>
        </section>
      </div>

      <Dialog open={edit} onClose={() => setEdit(false)} title="Edytuj profil" sub="Zdjęcie i opis widzą inni pracownicy. Pozostałe dane pochodzą z HR i IT."
        footer={<><button className="btn btn-ghost" onClick={() => setEdit(false)}>Anuluj</button>
          <button className="btn btn-primary" onClick={() => { setAbout(draft.trim() || undefined); setEdit(false); notify('Zapisano profil') }}>Zapisz</button></>}>
        <div className="field">
          <span className="flabel">Zdjęcie</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials={user.initials} color={user.color} size={32} />
            <button className="btn btn-secondary" onClick={() => notify('Wybór zdjęcia otworzy okno systemowe')}><Icon name="upload" size={14} />Wybierz zdjęcie</button>
            <span className="hint">JPG lub PNG, do 2 MB</span>
          </div>
        </div>
        <div className="field">
          <label htmlFor="about">Opis</label>
          <textarea id="about" className="textarea" maxLength={300} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Czym się zajmujesz, w czym możesz pomóc" />
          <p className="hint num" style={{ textAlign: 'right' }}>{draft.length} / 300</p>
        </div>
      </Dialog>
    </>
  )
}

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt><Icon name={icon} size={14} />{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
