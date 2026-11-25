import { useEffect } from 'react'
import { AppProvider, useApp } from './store'
import { Shell } from './components/Shell'
import { ToastView } from './components/ui'
import { Login } from './screens/Login'
import { Cbu, type View } from './screens/cbu/Cbu'
import { Profil } from './screens/Profil'
import { Home, ModulePage } from './screens/Placeholder'
import { Transakcje } from './screens/Transakcje'

function Screen() {
  const { route } = useApp()
  const [a, b] = route.path.split('/')
  if (a === 'pulpit') return <Home />
  // ekrany IT (pod modułami CBU w sekcji IT) i widok pracownika „Moje dostępy”
  if (a === 'uprawnienia') return <Cbu key="it" view={(['osoby', 'role', 'zasoby', 'wnioski'].includes(b) ? b : 'osoby') as View} />
  if (a === 'moje-dostepy') return <Cbu key="self" self view={b === 'wnioski' ? 'wnioski' : 'osoby'} />
  if (a === 'profil') return <Profil />
  if (a === 'transakcje') return <Transakcje />
  return <ModulePage path={route.path} />
}

function Root() {
  const { route } = useApp()
  const login = route.path === 'logowanie'
  useEffect(() => {
    document.title = login ? 'Zaloguj się · MS OS' : 'MS OS'
    document.getElementById('main')?.scrollTo(0, 0)
  }, [route.path, login])
  return (
    <>
      {login ? <Login /> : <Shell><Screen /></Shell>}
      <ToastView />
    </>
  )
}

export default function App() {
  return <AppProvider><Root /></AppProvider>
}
