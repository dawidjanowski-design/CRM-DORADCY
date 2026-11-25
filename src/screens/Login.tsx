import { useEffect, useRef, useState } from 'react'
import { go, useApp } from '../store'
import { Icon, MicrosoftMark, MsMark } from '../components/ui'

type Mode = 'wybor' | 'ms' | 'sms' | 'blokada' | 'blokada-it' | 'pomoc'
const IT_PHONE = '22 455 10 99'
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const clock = (addMin: number) => {
  const d = new Date(Date.now() + addMin * 60000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function Login() {
  const { route, notify, user } = useApp()
  const stan = route.params.get('stan')
  const expired = route.params.get('wygasla') === '1'
  const loggedOut = route.params.get('wylogowano') === '1'

  const [mode, setMode] = useState<Mode>('wybor')
  const [pwOpen, setPwOpen] = useState(false)
  const [login, setLogin] = useState('')
  const [pw, setPw] = useState('')
  const [pwErr, setPwErr] = useState<string | null>(null)
  const [fails, setFails] = useState(0)

  // stany ekranu dostępne też z adresu (?stan=…)
  useEffect(() => {
    setPwErr(null)
    if (stan === 'haslo') { setMode('wybor'); setPwOpen(true) }
    else if (stan === 'blad-hasla') { setMode('wybor'); setPwOpen(true); setLogin(user.login); setPwErr('Nieprawidłowy login lub hasło. Zostały 2 próby, potem logowanie zablokuje się na 15 minut.') }
    else if (stan === 'sms' || stan === 'kod-wygasl' || stan === 'limit') setMode('sms')
    else if (stan === 'blokada') setMode('blokada')
    else if (stan === 'blokada-it') setMode('blokada-it')
    else if (stan === 'pomoc') setMode('pomoc')
    else { setMode('wybor'); setPwOpen(false) }
  }, [stan]) // eslint-disable-line react-hooks/exhaustive-deps

  const pwRef = useRef<HTMLInputElement>(null), loginRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (pwOpen && stan !== 'blad-hasla') loginRef.current?.focus() }, [pwOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const signInMs = () => {
    setMode('ms')
    window.setTimeout(() => { notify('Zalogowano kontem Microsoft'); go('pulpit') }, 1400)
  }
  const signInPw = (e: React.FormEvent) => {
    e.preventDefault()
    if (!login.trim()) { setPwErr('Wpisz firmowy e-mail lub login.'); loginRef.current?.focus(); return }
    if (!pw) { setPwErr('Wpisz hasło firmowe.'); pwRef.current?.focus(); return }
    if (pw.length < 6) {
      const f = fails + 1; setFails(f)
      if (f >= 3) { setMode('blokada'); return }
      setPwErr(`Nieprawidłowy login lub hasło. Zostały ${3 - f} ${3 - f === 1 ? 'próba' : 'próby'}, potem logowanie zablokuje się na 15 minut.`)
      setPw(''); pwRef.current?.focus(); return
    }
    setPwErr(null); setMode('sms')
  }

  return (
    <div className="auth2">
      <div className="auth-col enter">
        <div className="auth-brand"><MsMark size={28} /><span>MS OS</span></div>

        {mode === 'wybor' && (
          <div className="auth-card">
            {expired && <div className="auth-note" role="status"><Icon name="clock" size={14} /><span>Sesja wygasła po 30 minutach bezczynności. Zaloguj się ponownie, a wrócisz do pracy.</span></div>}
            {loggedOut && !expired && <div className="auth-note ok" role="status"><Icon name="check-circle" size={14} /><span>Wylogowano. Do zobaczenia.</span></div>}
            <h1 className="auth-h">Zaloguj się</h1>
            <button className="btn btn-primary btn-lg btn-block" onClick={signInMs} autoFocus>
              <MicrosoftMark />Zaloguj kontem Microsoft
            </button>
            <p className="auth-hint">Użyj tego samego konta co w Teams</p>

            <div className="auth-or"><span>lub</span></div>

            <button className="btn btn-secondary btn-lg btn-block" aria-expanded={pwOpen} aria-controls="pw-form" onClick={() => setPwOpen(o => !o)}>
              <Icon name="key" size={14} />Użyj loginu i hasła
              <span className="auth-chev"><Icon name="chevron-down" size={14} /></span>
            </button>
            <div className={`auth-exp ${pwOpen ? 'open' : ''}`} id="pw-form">
              <div className="auth-exp-in">
                <form className="auth-form" onSubmit={signInPw} noValidate {...(pwOpen ? {} : { inert: '' })}>
                  <div className="field">
                    <label htmlFor="login">Firmowy e-mail lub login</label>
                    <input ref={loginRef} id="login" className="input input-lg" value={login} onChange={e => { setLogin(e.target.value); setPwErr(null) }}
                      autoComplete="username" spellCheck={false} placeholder="np. jan.kowalski@ms-dm.pl" aria-invalid={!!pwErr && !login} />
                  </div>
                  <div className="field">
                    <label htmlFor="pw">Hasło</label>
                    <input ref={pwRef} id="pw" type="password" className="input input-lg" value={pw} onChange={e => { setPw(e.target.value); setPwErr(null) }}
                      autoComplete="current-password" aria-invalid={!!pwErr && !!login} aria-describedby="pw-msg" />
                    <div id="pw-msg" aria-live="polite">
                      {pwErr
                        ? <p className="err"><Icon name="alert-circle" size={14} />{pwErr}</p>
                        : <p className="hint">Obowiązuje hasło firmowe. Problemy z hasłem obsługuje IT.</p>}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-lg btn-block" type="submit">Zaloguj się</button>
                </form>
              </div>
            </div>
          </div>
        )}

        {mode === 'ms' && (
          <div className="auth-card auth-center" role="status" aria-live="polite">
            <span className="auth-tile"><MicrosoftMark size={18} /></span>
            <h1 className="auth-h" style={{ marginBottom: 4 }}>Przekierowujemy do Microsoft</h1>
            <p className="muted">Po potwierdzeniu konta wrócisz do MS OS.</p>
            <span className="auth-spin"><Icon name="loader" size={16} className="spin" /></span>
            <button className="btn btn-ghost" onClick={() => setMode('wybor')}>Anuluj</button>
          </div>
        )}

        {mode === 'sms' && <Sms key={stan ?? 'sms'} initial={stan} onBack={() => { setMode('wybor'); go('logowanie') }} onDone={() => { notify('Zalogowano. Potwierdzenie SMS ważne do końca dnia w tej przeglądarce.'); go('pulpit') }} />}

        {mode === 'pomoc' && <HelpForm initialLogin={login} onBack={() => { setMode('wybor'); go('logowanie') }} />}

        {(mode === 'blokada' || mode === 'blokada-it') && (
          <div className="auth-card auth-center" role="alert">
            <span className="auth-tile warn"><Icon name="lock" size={18} /></span>
            <h1 className="auth-h" style={{ marginBottom: 4 }}>Logowanie zablokowane</h1>
            {mode === 'blokada'
              ? <p className="muted">Za dużo nieudanych prób. Spróbuj ponownie o <b className="num" style={{ color: 'var(--t)' }}>{clock(15)}</b>.</p>
              : <p className="muted">Konto zablokowano ze względów bezpieczeństwa. Zadzwoń do IT: <b className="num" style={{ color: 'var(--t)' }}>{IT_PHONE}</b>.</p>}
            <button className="btn btn-secondary" onClick={() => { setFails(0); setMode('wybor'); setPwOpen(false); go('logowanie') }}>
              <Icon name="arrow-left" size={14} />Wróć do wyboru metody
            </button>
          </div>
        )}

        {mode !== 'pomoc' && (
          <div className="auth-help">
            <button className="link" onClick={() => setMode('pomoc')}>Problem z logowaniem?</button>
            <span className="dim">Bez VPN? Zadzwoń do IT: <span className="num">{IT_PHONE}</span></span>
          </div>
        )}
        <p className="auth-foot">Dom Maklerski · system wewnętrzny dla pracowników</p>
      </div>
      <BrandPanel />
    </div>
  )
}

/* ---------- panel marki: grafit, miękkie światło, znak MS OS z modułami na orbitach ----------
   Ikony to sekcje menu głównego; orbity obracają się bardzo wolno (statyczne przy ograniczonym ruchu). */
const INNER = ['home', 'users', 'calendar', 'trending-up', 'box']
const OUTER = ['volume-2', 'shield', 'file-text', 'briefcase', 'user-check', 'settings']

function Orbit({ icons, r, cls }: { icons: string[]; r: number; cls: string }) {
  return (
    <div className={`orb ${cls}`} style={{ width: r * 2, height: r * 2 }}>
      {icons.map((ic, i) => {
        const a = (i / icons.length) * Math.PI * 2 - Math.PI / 2
        return <span key={ic} className="orb-i" style={{ left: r + Math.cos(a) * r, top: r + Math.sin(a) * r }}><span className="orb-c"><Icon name={ic} size={16} /></span></span>
      })}
    </div>
  )
}

function BrandPanel() {
  return (
    <aside className="auth-panel" aria-hidden="true">
      <div className="ap-glow" />
      <div className="ap-stage">
        <div className="am">
          <span className="am-ring r1" /><span className="am-ring r2" />
          <Orbit icons={INNER} r={110} cls="o1" />
          <Orbit icons={OUTER} r={190} cls="o2" />
          <span className="am-core"><MsMark size={64} /></span>
        </div>
      </div>
      <div className="ap-copy">
        <h2>Wszystkie moduły pod jednym logowaniem</h2>
        <p>Klient, sprzedaż, emisje, compliance i kadry. Widzisz te, do których masz dostęp.</p>
      </div>
    </aside>
  )
}

/* ---------- formularz IT pod linkiem „Problem z logowaniem?” ----------
   Działa bez logowania w sieci firmy lub po VPN (brief). Bez VPN: telefon do IT. */
const ISSUES: [string, string, string][] = [
  ['haslo', 'Nie pamiętam hasła', 'key'],
  ['sms', 'Nie dostaję kodu SMS', 'message-square'],
  ['blokada', 'Konto jest zablokowane', 'lock'],
  ['microsoft', 'Nie działa logowanie kontem Microsoft', 'log-in'],
  ['inny', 'Inny problem', 'help-circle'],
]

function HelpForm({ initialLogin, onBack }: { initialLogin: string; onBack: () => void }) {
  const [issue, setIssue] = useState('')
  const [who, setWho] = useState(initialLogin)
  const [desc, setDesc] = useState('')
  const [tried, setTried] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const first = useRef<HTMLInputElement>(null)
  useEffect(() => { first.current?.focus() }, [])

  const needDesc = issue === 'inny'
  const errs = { issue: !issue, who: !who.trim(), desc: needDesc && desc.trim().length < 10 }
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setTried(true)
    if (errs.issue || errs.who || errs.desc) return
    setBusy(true); window.setTimeout(() => { setBusy(false); setSent('ZG-1049') }, 600)
  }

  if (sent) return (
    <div className="auth-card auth-center" role="status">
      <span className="auth-tile ok"><Icon name="check" size={18} /></span>
      <h1 className="auth-h" style={{ marginBottom: 4 }}>Zgłoszenie przyjęte</h1>
      <p className="muted">Numer zgłoszenia: <b className="num" style={{ color: 'var(--t)' }}>{sent}</b>. IT odpowie na adres służbowy w godzinach pracy działu, pon.–pt. 7:30–18:00.</p>
      <button className="btn btn-secondary" onClick={onBack}><Icon name="arrow-left" size={14} />Wróć do logowania</button>
    </div>
  )

  return (
    <div className="auth-card">
      <button className="btn btn-ghost auth-back" onClick={onBack}><Icon name="arrow-left" size={14} />Wróć do logowania</button>
      <h1 className="auth-h" style={{ marginBottom: 6 }}>Zgłoś problem do IT</h1>
      <p className="auth-net"><Icon name="wifi" size={14} /><span>Formularz działa bez logowania w sieci firmy lub po VPN. Bez dostępu do VPN zadzwoń do IT: <b className="num">{IT_PHONE}</b>.</span></p>
      <form className="auth-form" onSubmit={submit} noValidate>
        <fieldset className="issues" aria-describedby="issue-msg">
          <legend className="flabel">Czego dotyczy problem?</legend>
          {ISSUES.map(([k, l, ic], i) => (
            <label key={k} className={`issue ${issue === k ? 'on' : ''}`}>
              <input ref={i === 0 ? first : undefined} type="radio" name="issue" value={k} checked={issue === k} onChange={() => setIssue(k)} />
              <span className="issue-i"><Icon name={ic} size={14} /></span><span className="grow">{l}</span><span className="rd" />
            </label>
          ))}
          <div id="issue-msg">{tried && errs.issue && <p className="err"><Icon name="alert-circle" size={14} />Wybierz, czego dotyczy problem.</p>}</div>
        </fieldset>
        <div className="field">
          <label htmlFor="h-who">Firmowy e-mail lub login</label>
          <input id="h-who" className="input input-lg" value={who} onChange={e => setWho(e.target.value)} autoComplete="username" spellCheck={false}
            placeholder="np. jan.kowalski@ms-dm.pl" aria-invalid={tried && errs.who} aria-describedby="h-who-msg" />
          <div id="h-who-msg">{tried && errs.who ? <p className="err"><Icon name="alert-circle" size={14} />Podaj e-mail lub login, żeby IT znalazło Twoje konto.</p>
            : <p className="hint">Na ten adres przyjdzie odpowiedź z IT.</p>}</div>
        </div>
        <div className="field">
          <label htmlFor="h-desc">Opis problemu{!needDesc && <span className="dim"> (opcjonalnie)</span>}</label>
          <textarea id="h-desc" className="textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Co się dzieje i od kiedy? Np. treść komunikatu na ekranie"
            aria-invalid={tried && errs.desc} />
          {tried && errs.desc && <p className="err"><Icon name="alert-circle" size={14} />Opisz krótko problem (min. 10 znaków).</p>}
        </div>
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
          {busy ? <><Icon name="loader" size={14} className="spin" />Wysyłamy…</> : <><Icon name="send" size={14} />Wyślij zgłoszenie</>}
        </button>
      </form>
    </div>
  )
}

/* ---------- kod SMS: jedno pole, wklejanie, licznik, limit 5/h ---------- */
function Sms({ initial, onBack, onDone }: { initial: string | null; onBack: () => void; onDone: () => void }) {
  const [smsNo, setSmsNo] = useState(12)
  const [sent, setSent] = useState(initial === 'limit' ? 5 : 2)          // SMS-y w tej godzinie
  const [resendIn, setResendIn] = useState(initial === 'kod-wygasl' || initial === 'limit' ? 0 : 60)
  const [validFor, setValidFor] = useState(initial === 'kod-wygasl' ? 0 : 300)
  const [code, setCode] = useState('')
  const [err, setErr] = useState<string | null>(initial === 'kod-wygasl' ? 'expired' : null)
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const limitAt = useRef(clock(41))

  useEffect(() => {
    const t = window.setInterval(() => {
      setResendIn(s => Math.max(0, s - 1))
      setValidFor(s => { if (s === 1) setErr('expired'); return Math.max(0, s - 1) })
    }, 1000)
    return () => window.clearInterval(t)
  }, [])
  useEffect(() => { input.current?.focus() }, [smsNo])

  const limit = sent >= 5
  const resend = () => {
    setSmsNo(n => n + 1); setSent(s => s + 1); setResendIn(60); setValidFor(300); setCode(''); setErr(null)
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validFor === 0) { setErr('expired'); return }
    if (code.length !== 6) { setErr('short'); input.current?.focus(); return }
    if (code === '000000') { setErr('wrong'); setCode(''); input.current?.focus(); return }
    setBusy(true); window.setTimeout(onDone, 500)
  }

  const msg = err === 'expired'
    ? <p className="err"><Icon name="alert-circle" size={14} /><span>Kod wygasł. {limit ? 'Limit SMS-ów na tę godzinę jest wykorzystany.' : resendIn ? `Nowy SMS zamówisz za ${fmt(resendIn)}.` : <>Zamów nowy SMS.</>}</span></p>
    : err === 'wrong'
      ? <p className="err"><Icon name="alert-circle" size={14} /><span>Kod nie pasuje. Sprawdź, czy to SMS nr {smsNo}, i wpisz go ponownie.</span></p>
      : err === 'short'
        ? <p className="err"><Icon name="alert-circle" size={14} /><span>Kod ma 6 cyfr.</span></p>
        : <p className="hint">Kod jest ważny 5 minut. Nowy SMS unieważnia poprzedni kod.</p>

  return (
    <div className="auth-card">
      <button className="btn btn-ghost auth-back" onClick={onBack}><Icon name="arrow-left" size={14} />Inna metoda</button>
      <h1 className="auth-h">Wpisz kod z SMS-a nr <span className="num">{smsNo}</span></h1>
      <p className="muted" style={{ marginTop: -12, marginBottom: 20, lineHeight: '20px' }}>Wysłaliśmy go na numer podany IT, kończący się na <span className="num" style={{ color: 'var(--t)' }}>•• 482</span>.</p>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="code">Kod z SMS-a</label>
          <input ref={input} id="code" className="input input-lg otp" value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000"
            aria-invalid={!!err} aria-describedby="code-msg" disabled={busy}
            onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); if (err !== 'expired') setErr(null) }}
            onPaste={e => { e.preventDefault(); setCode(e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)); if (err !== 'expired') setErr(null) }} />
          <div id="code-msg" aria-live="polite">{msg}</div>
        </div>
        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy || (err === 'expired')}>
          {busy ? <><Icon name="loader" size={14} className="spin" />Sprawdzamy kod…</> : 'Potwierdź'}
        </button>
      </form>
      <div className="auth-resend">
        {limit
          ? <span className="muted">Wykorzystano limit 5 SMS-ów na godzinę. Kolejny zamówisz o <span className="num">{limitAt.current}</span>.</span>
          : resendIn > 0
            ? <span className="muted">Nowy SMS za <span className="num">{fmt(resendIn)}</span></span>
            : <button className="link" onClick={resend}>Wyślij nowy SMS</button>}
        <span className="dim num">{Math.min(sent, 5)} z 5 w tej godzinie</span>
      </div>
    </div>
  )
}
