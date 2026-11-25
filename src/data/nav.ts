// Nawigacja 1:1 z wireframe'u crm-ms (wireframe/nawigacja.html): pasek L1 + panel L2,
// te same sekcje, grupy, kolejność i nazwy modułów z ERP.
// Elementy menu można ukrywać i pokazywać dynamicznie: patrz `visibleNav` i `hidden` w store.

export type NavItem = { label: string; erp?: string; route?: string }
export type NavGroup = { title?: string; items: NavItem[] }
export type NavSection = { id: string; label: string; icon: string; role?: boolean; groups: NavGroup[] }

const i = (label: string, erp?: string, route?: string): NavItem => ({ label, erp, route })
const W = 'tylko „Wszystko”'

export const NAV: NavSection[] = [
  // według briefu: lewe menu zaczyna się od „Pulpit”
  { id: 'pulpit', label: 'Pulpit', icon: 'home', groups: [{ items: [i('Pulpit', 'IT', 'pulpit'), i('Kalendarz', W)] }] },
  { id: 'klienci', label: 'Klient', icon: 'users', groups: [
    { items: [i('Klienci', 'Klient'), i('Byty powiązane', 'Klient'), i('Sidoma-Rachunki', 'Klient')] },
    { title: 'Dokumenty klienta', items: [i('Notatki Służbowe', 'Klient'), i('Oświadczenia do zleceń i transakcji', 'Klient'), i('Powiadomienia PN', 'Klient'), i('Dokumenty PN', W)] },
  ] },
  { id: 'aktywnosci', label: 'Aktywności', icon: 'calendar', groups: [{ items: [
    i('Historia kontaktów', 'Klient, Compliance'), i('Spotkania', W), i('Rozmowy telefoniczne', W), i('Notatki', W), i('Wiadomości e-mail', 'IT'), i('Załączniki email', W),
  ] }] },
  { id: 'sprzedaz', label: 'Sprzedaż', icon: 'trending-up', groups: [
    { title: 'Zapisy', items: [i('Zapisy na obligacje', 'Klient'), i('Zapisy na FIZ', 'Klient')] },
    { title: 'Obrót', items: [i('Zlecenia', 'Klient'), i('Transakcje', 'Klient', 'transakcje'), i('Transakcje RW CI', 'Klient')] },
    { title: 'Planowanie', items: [i('Prognozy', 'Sprzedaż'), i('Definicje prognoz i zapytań', 'Sprzedaż'), i('Tour Plan', 'Sprzedaż')] },
    { title: 'Raporty', items: [i('Zestawienia danych', 'Klient')] },
  ] },
  { id: 'emisje', label: 'Emisje', icon: 'box', groups: [
    { items: [i('Emisje Obligacji', 'Emisje'), i('Emisje FIZ', 'Emisje'), i('Zdarzenia dla emisji', 'Emisje'), i('Partnerzy', 'Emisje'), i('Produkty', 'Emisje'), i('Instrumenty', W)] },
    { title: 'OTC', items: [i('Oferta OTC', 'Klient'), i('Tabela Ofertowa OTC', 'Emisje'), i('Ewidencja wysłanych ofert OTC', 'Emisje'), i('Dokumenty OTC', W)] },
    { title: 'Słowniki i kalendarze', items: [i('Dane referencyjne', 'Emisje'), i('Tabela Odsetkowa', 'Emisje'), i('Kalendarz płatności', 'Emisje'), i('Kalendarz biznesowy', 'Emisje')] },
  ] },
  { id: 'marketing', label: 'Marketing', icon: 'volume-2', groups: [
    { title: 'Kampanie', items: [i('Kampanie marketingowe', 'Marketing'), i('Getresponse - kampanie mailingowe', 'Marketing'), i('Kampania wg preferowanego kontaktu', 'Marketing')] },
    { title: 'Listy i szablony', items: [i('Mailing', 'Klient'), i('Lista Mailingowa', 'Marketing'), i('Lista mailingowa - raport', 'Marketing'), i('Szablony wiadomości e-mail', W)] },
    { items: [i('Zgody', 'Marketing')] },
  ] },
  { id: 'compliance', label: 'Compliance', icon: 'shield', role: true, groups: [
    { title: 'Kontrola kontaktów', items: [i('Monitoring kontaktów', 'Compliance'), i('Pozycje do kontroli', 'Compliance'), i('Notatka kontrolującego', 'Compliance'), i('Załączniki pokontrolne', W), i('Historia kontaktów niepowiązanych', 'Compliance')] },
    { title: 'Transakcje pracowników', items: [i('Nadzór transakcji', 'Compliance'), i('Prywatne Rachunki Maklerskie', W), i('Zlecenia własne', W), i('Transakcje własne', W), i('Transakcje własne (eksplorator)', 'Kadry'), i('Wnioski o zgodę na transakcję', W)] },
    { title: 'Ograniczenia', items: [i('Restrykcje', W), i('Ind. pozycje Listy Restrykcyjnej', W), i('Naruszenia restrykcji', W)] },
    { title: 'Osoby prawne i AML', items: [i('Wnioski Osoby Prawnej', 'Compliance'), i('Dokumenty do Wniosku Osoby Prawnej', 'Compliance'), i('Beneficjenci rzeczywiści', 'Compliance'), i('IDM Dokumenty', 'Compliance'), i('Instytucje Finansowe - słownik', 'Compliance')] },
    { title: 'Wiedza i oświadczenia', items: [i('Regulacje wewnętrzne', 'Compliance'), i('Eksplorator Regulacji Wewnętrznych', 'Compliance'), i('Foldery', 'Compliance'), i('Oświadczenia i zobowiązania', 'Compliance')] },
  ] },
]

export const NAV_BOTTOM: NavSection[] = [
  { id: 'sinf', label: 'SINF', icon: 'file-text', role: true, groups: [{ items: [i('STIR_PLIK', 'SINF')] }] },
  { id: 'prawny', label: 'Dep. Prawny', icon: 'briefcase', role: true, groups: [
    { items: [i('Zgłoszenia DP', 'Dep. Prawny')] },
    { title: 'Projekty', items: [i('Projekty Prawne', 'Dep. Prawny'), i('Projekt Prawny', W), i('Akcje dla projektu prawnego', W), i('Foldery projektowe', W)] },
    { title: 'Dokumenty', items: [i('Projekty dokumentów prawnych', W), i('Wersje dok. projektów prawnych', W), i('Dokumenty prawne', W), i('Wersje dok. prawnych', W), i('Dokumenty wynikowe', W)] },
    { title: 'Archiwum', items: [i('Repozytorium', 'Dep. Prawny'), i('Foldery repozytorium', W)] },
  ] },
  { id: 'kadry', label: 'Kadry', icon: 'user-check', role: true, groups: [
    { title: 'Obecność', items: [i('Urlopy / nieobecności', 'Kadry'), i('Lista obecności', 'Kadry')] },
    { title: 'Organizacja', items: [i('Osoby', 'Kadry'), i('Jednostki Organizacyjne', 'Kadry'), i('Stanowiska', 'Kadry'), i('Kandydaci do pracy', 'Kadry')] },
    { title: 'Rozwój', items: [i('Szkolenia', 'Kadry'), i('Szkolenia wstępne', 'Kadry'), i('Szkolenia wewnętrzne', 'Kadry'), i('Osoby szkolące', 'Kadry'), i('Rejestr licencji zawodowych', 'Kadry')] },
  ] },
  { id: 'it', label: 'IT', icon: 'settings', role: true, groups: [
    { items: [i('Uprawnienia', 'IT', 'uprawnienia/wnioski'), i('Zgłoszenia IT', 'IT'), i('Rejestr Incydentów ICT', 'IT'), i('Parametry Systemowe', 'IT'), i('Workflow', 'IT')] },
    { title: 'CBU', items: [i('CBU - Konta', 'IT', 'uprawnienia/osoby'), i('CBU - Profile dostępu', 'IT'), i('CBU - Role', 'IT', 'uprawnienia/role'), i('CBU - Systemy', 'IT'), i('CBU - Uprawnienia atomowe', 'IT'), i('CBU - Zasoby', 'IT', 'uprawnienia/zasoby')] },
  ] },
]


export const ALL = [...NAV, ...NAV_BOTTOM]

export const slug = (s: string) => s.toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const itemKey = (sec: NavSection, item: NavItem) => `${sec.id}/${slug(item.label)}`
export const itemRoute = (sec: NavSection, item: NavItem) => item.route ?? `m/${itemKey(sec, item)}`

/* Dynamiczna widoczność: `hidden` zawiera id sekcji („kadry”) albo klucz pozycji („it/workflow”).
   Sekcja bez widocznych pozycji znika z paska razem z panelem. */
export function visibleNav(list: NavSection[], hidden: Set<string>): NavSection[] {
  return list
    .filter(s => !hidden.has(s.id))
    .map(s => ({ ...s, groups: s.groups.map(g => ({ ...g, items: g.items.filter(it => !hidden.has(itemKey(s, it))) })).filter(g => g.items.length) }))
    .filter(s => s.groups.length)
}

export function findByRoute(route: string): { sec: NavSection; item: NavItem } | undefined {
  for (const sec of ALL) for (const g of sec.groups) for (const item of g.items) {
    if (itemRoute(sec, item) === route) return { sec, item }
  }
}
