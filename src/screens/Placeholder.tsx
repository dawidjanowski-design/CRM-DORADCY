import { findByRoute, USER_MENU, slug } from '../data/nav'
import { Empty, Icon, PageHead } from '../components/ui'
import { gridStyle, TableHead, type Col } from '../components/Table'

/* Strona główna: na razie bez treści, ale już w pełnym szkielecie z menu */
export function Home() {
  return (
    <>
      <PageHead icon="home" title="Strona Główna" />
      <div className="page" />
    </>
  )
}

const W = [[150, 110], [120, 90], [70, 50], [90, 70], [100, 80], [80, 110], [110, 70]]
const SK_COLS: Col[] = W.map((_, i) => ({ key: 'k' + i, label: `Kolumna ${i + 1}`, icon: 'minus', width: i === 0 ? 'minmax(200px,1.4fr)' : 'minmax(120px,1fr)' }))

/* Moduły bez zaprojektowanej treści: ten sam szkielet głównej tabeli co Transakcje, z szarymi wierszami */
export function ModulePage({ path }: { path: string }) {
  const hit = findByRoute(path)
  if (!hit) return <NotFound />
  return (
    <div className="mtable">
      <header className="mt-head">
        <span className="ph-i"><Icon name={hit.sec.icon} /></span>
        <h1>{hit.item.label}</h1>
        <span className="vsep" />
        <span className="muted">— rekordów</span>
        <span className="grow" />
        <button className="btn btn-secondary" disabled><Icon name="upload" size={14} />Importuj</button>
        <button className="btn btn-primary" disabled><Icon name="plus" size={14} />Utwórz</button>
      </header>
      <div className="fbar">
        <span className="pill on chip-pill" aria-disabled="true">Tylko moje elementy<Icon name="x" size={14} /></span>
        <span className="fsep" />
        <span className="nav-btn" aria-disabled="true"><Icon name="zap" size={14} />Szybki filtr</span>
        <span className="nav-btn" aria-disabled="true"><Icon name="sliders" size={14} />Zaawansowany filtr</span>
      </div>
      <div className="tscroll">
        <div className="ttable" aria-hidden="true">
          <TableHead cols={SK_COLS} />
          {Array.from({ length: 12 }, (_, r) => (
            <div key={r} className="tcols trow" style={gridStyle(SK_COLS)}>{W.map((x, i) => <div key={i}><span className="sk" style={{ width: x[r % 2] }} /></div>)}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* Pozycje menu użytkownika poza Profilem i Wyloguj */
export function UserMenuPage({ id }: { id: string }) {
  const label = USER_MENU.find(l => slug(l) === id) ?? 'Strona'
  return (
    <>
      <PageHead icon="user" title={label} />
      <div className="page" />
    </>
  )
}

export function NotFound() {
  return (
    <>
      <PageHead icon="alert-circle" title="Nie znaleziono" />
      <div className="page"><Empty icon="compass" title="Tej strony nie ma" hint="Adres mógł się zmienić albo moduł jest ukryty w menu."
        action={<a className="btn btn-secondary" href="#/strona-glowna">Strona Główna</a>} /></div>
    </>
  )
}
