import { useState } from 'react'
import { useApp } from '../store'
import { Avatar, Dialog, Icon, InsetCard, PageHead } from '../components/ui'

export function Profil() {
  const { user: persona, notify } = useApp()
  const [about, setAbout] = useState<Record<string, string | undefined>>({})
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState('')
  const desc = 'me' in about ? about.me : persona.about

  const copy = (v: string) => { navigator.clipboard?.writeText(v).catch(() => {}); notify('Skopiowano adres e-mail') }

  return (
    <>
      <PageHead icon="user" title="Mój profil" />
      <div className="page narrow">
        <div className="prof-h enter">
          <Avatar initials={persona.initials} color={persona.color} size={56} />
          <div className="prof-id">
            <h2 className="prof-name">{persona.name}</h2>
            <p className="muted">{persona.title} · {persona.unit}</p>
            {desc && <p className="prof-about">{desc}</p>}
          </div>
          {persona.canEditProfile && (
            <button className="btn btn-secondary prof-edit" onClick={() => { setDraft(desc ?? ''); setEdit(true) }}><Icon name="edit-3" size={14} />Edytuj profil</button>
          )}
        </div>

        <InsetCard title="Kontakt służbowy" icon="mail">
          <dl className="kvt">
            <div><dt>E-mail</dt><dd><span className="trunc">{persona.email}</span>
              <button className="ibtn sm" onClick={() => copy(persona.email)} aria-label="Kopiuj adres e-mail" title="Kopiuj"><Icon name="copy" size={14} /></button></dd></div>
            {persona.phone && <div><dt>Telefon służbowy</dt><dd className="num">{persona.phone}</dd></div>}
          </dl>
          <p className="kvt-foot"><Icon name="info" size={14} />Zmianę danych kontaktowych zgłoś do IT</p>
        </InsetCard>

        <InsetCard title="Miejsce w firmie" icon="briefcase">
          <dl className="kvt">
            <div><dt>Stanowisko</dt><dd>{persona.title}</dd></div>
            <div><dt>Dział lub jednostka</dt><dd>{persona.unit}</dd></div>
            {!persona.afi && persona.supervisor && <div><dt>Bezpośredni przełożony</dt><dd>{persona.supervisor}</dd></div>}
            {persona.pok && <div><dt>Punkt obsługi klienta (POK)</dt><dd>{persona.pok}</dd></div>}
          </dl>
          <p className="kvt-foot"><Icon name="info" size={14} />Korektę danych kadrowych zgłoś do HR</p>
        </InsetCard>

        <InsetCard title="Role w MS OS" icon="layers" count={persona.msRoles.length}
          right={<a className="btn btn-ghost btn-sm" href="#/uprawnienia/osoby">Moje dostępy<Icon name="arrow-right" size={14} /></a>}>
          <div className="ic-pad prof-roles">{persona.msRoles.map(r => <span key={r} className="chip"><Icon name="users" size={14} />{r}</span>)}</div>
        </InsetCard>
      </div>

      <Dialog open={edit} onClose={() => setEdit(false)} title="Edytuj profil" sub="Zdjęcie i opis widzą inni pracownicy. Pozostałe dane pochodzą z HR i IT."
        footer={<><button className="btn btn-ghost" onClick={() => setEdit(false)}>Anuluj</button>
          <button className="btn btn-primary" onClick={() => { setAbout(a => ({ ...a, me: draft.trim() || undefined })); setEdit(false); notify('Zapisano profil') }}>Zapisz</button></>}>
        <div className="field">
          <span className="flabel">Zdjęcie</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials={persona.initials} color={persona.color} size={32} />
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
