// Centralna Baza Uprawnień: dostępy, role, zasoby i wnioski (dane przykładowe).
export type Level = 'Brak' | 'Odczyt' | 'Edycja'

export type Source = { kind: 'rola' | 'nadanie'; name: string; since: string; by: string; request?: string }
export type Access = {
  id: string; person: string
  resource: string; system: string; fields?: string
  level: Exclude<Level, 'Brak'>; scope: string
  sources: Source[]
}

export type StepRole = 'Przełożony' | 'Szef działu sprzedaży' | 'Właściciel' | 'Compliance'
export type Step = { role: StepRole; who: string; decision?: 'ok' | 'no'; at?: string; reason?: string }
export type HistoryEntry = { at: string; who: string; text: string }
export type ReqItem = {
  id: string
  op: 'nadanie' | 'odebranie'
  kind: 'uprawnienie' | 'rola'
  what: string; system: string; level?: Exclude<Level, 'Brak'>; scope: string
  exec: 'auto' | 'it'      // MS OS wykonuje sam, zasoby zewnętrzne ręcznie IT
  steps: Step[]
  executed?: { at: string; by: string }
  history: HistoryEntry[]
}
export type Request = { id: string; person: string; author: string; createdAt: string; reason: string; items: ReqItem[] }

export type ItemState =
  | { s: 'czeka'; step: Step }
  | { s: 'do_wykonania' } | { s: 'nadano' } | { s: 'odebrano' } | { s: 'odmowa'; step: Step }

export function itemState(it: ReqItem): ItemState {
  const no = it.steps.find(s => s.decision === 'no')
  if (no) return { s: 'odmowa', step: no }
  const next = it.steps.find(s => !s.decision)
  if (next) return { s: 'czeka', step: next }
  if (!it.executed) return { s: 'do_wykonania' }
  return it.op === 'odebranie' ? { s: 'odebrano' } : { s: 'nadano' }
}

export const STATE_LABEL = (st: ItemState) => {
  switch (st.s) {
    case 'czeka': return { label: `Czeka na decyzję: ${st.step.role.toLowerCase()}`, tone: 'info' as const }
    case 'do_wykonania': return { label: 'Czeka na wykonanie przez IT', tone: 'warn' as const }
    case 'nadano': return { label: 'Nadano', tone: 'ok' as const }
    case 'odebrano': return { label: 'Odebrano', tone: 'ok' as const }
    case 'odmowa': return { label: 'Odmowa', tone: 'danger' as const }
  }
}

export const SCOPES = ['Własni klienci', 'Klienci POK', 'Wszyscy klienci', 'Własny zespół', 'Cała firma', 'Bez zakresu']

// ---------- osoby w ewidencji ----------
export type Person = { name: string; initials: string; color: number; unit: string; title: string; supervisor?: string; afi?: boolean; board?: boolean }
export const PEOPLE: Person[] = [
  { name: 'Marta Wilczek', initials: 'MW', color: 1, unit: 'POK Kraków', title: 'Doradca klienta', supervisor: 'Tomasz Rybak' },
  { name: 'Jan Ostrowski', initials: 'JO', color: 0, unit: 'POK Kraków', title: 'Doradca klienta', supervisor: 'Tomasz Rybak' },
  { name: 'Ola Pietrzak', initials: 'OP', color: 3, unit: 'POK Kraków', title: 'Doradca klienta', supervisor: 'Tomasz Rybak' },
  { name: 'Tomasz Rybak', initials: 'TR', color: 2, unit: 'POK Kraków', title: 'Kierownik POK', supervisor: 'Anna Sobczak' },
  { name: 'Krzysztof Bielecki', initials: 'KB', color: 0, unit: 'Sieć agentów', title: 'Agent firmy inwestycyjnej', afi: true },
  { name: 'Anna Sobczak', initials: 'AS', color: 4, unit: 'Departament Sprzedaży', title: 'Dyrektor sprzedaży', supervisor: 'Jerzy Malinowski' },
  { name: 'Natalia Kowal', initials: 'NK', color: 1, unit: 'Biuro Zarządu', title: 'Specjalista ds. administracji', supervisor: 'Jerzy Malinowski' },
  { name: 'Jerzy Malinowski', initials: 'JM', color: 5, unit: 'Zarząd', title: 'Członek Zarządu', board: true },
  { name: 'Paweł Szulc', initials: 'PS', color: 5, unit: 'Departament IT', title: 'Administrator systemów', supervisor: 'Ireneusz Kot' },
  { name: 'Karolina Mazur', initials: 'KM', color: 3, unit: 'Departament Operacji', title: 'Specjalista ds. operacji', supervisor: 'Lech Wójcik' },
  { name: 'Joanna Lis', initials: 'JL', color: 4, unit: 'Dział HR', title: 'Specjalista ds. kadr', supervisor: 'Beata Kruk' },
  { name: 'Michał Górski', initials: 'MG', color: 2, unit: 'Departament Compliance', title: 'Inspektor nadzoru', supervisor: 'Ewa Pawlak' },
  { name: 'Piotr Zając', initials: 'PZ', color: 5, unit: 'Dział Emisji', title: 'Specjalista ds. obsługi emisji', supervisor: 'Maria Czarnecka' },
]
export const person = (name: string) => PEOPLE.find(p => p.name === name)

// ---------- aktualne dostępy ----------
const role = (name: string, since = '3 mar 2024', by = 'Joanna Lis (HR)'): Source => ({ kind: 'rola', name, since, by })

function doradcaBase(p: string, pfx: string): Access[] {
  return [
    { id: pfx + '1', person: p, resource: 'Karta klienta', system: 'MS OS', fields: 'Dane podstawowe, rachunki', level: 'Odczyt', scope: 'Własni klienci', sources: [role('Doradca POK')] },
    { id: pfx + '2', person: p, resource: 'Dane kontaktowe klienta', system: 'MS OS', fields: 'E-mail, telefon, adres', level: 'Odczyt', scope: 'Klienci POK', sources: [role('Doradca POK')] },
    { id: pfx + '3', person: p, resource: 'Zapisy na obligacje', system: 'MS OS', fields: 'Wszystkie pola', level: 'Edycja', scope: 'Własni klienci', sources: [role('Doradca POK')] },
    { id: pfx + '4', person: p, resource: 'Historia kontaktów', system: 'MS OS', level: 'Edycja', scope: 'Własni klienci', sources: [role('Doradca POK')] },
    { id: pfx + '5', person: p, resource: 'Kalendarz biznesowy', system: 'MS OS', level: 'Odczyt', scope: 'Cała firma', sources: [role('Doradca POK'), role('Pracownik MS', '3 mar 2024', 'automatycznie')] },
    { id: pfx + '6', person: p, resource: 'Folder \\\\ms-fs\\POK-Krakow', system: 'Folder sieciowy', level: 'Edycja', scope: 'Bez zakresu', sources: [role('Doradca POK')] },
  ]
}

export const ACCESSES: Access[] = [
  ...doradcaBase('Marta Wilczek', 'mw'),
  // Przykład z briefu: osobne nadanie pozwala zmieniać telefon tylko własnych klientów.
  { id: 'mw7', person: 'Marta Wilczek', resource: 'Telefon klienta', system: 'MS OS', fields: 'Numer telefonu', level: 'Edycja', scope: 'Własni klienci',
    sources: [{ kind: 'nadanie', name: 'Nadanie indywidualne', since: '14 paź 2026', by: 'Tomasz Rybak, Dorota Wrona', request: 'W-2026-0461' }] },
  { id: 'mw8', person: 'Marta Wilczek', resource: 'Raport „Sprzedaż obligacji POK”', system: 'MS OS', level: 'Odczyt', scope: 'Klienci POK',
    sources: [{ kind: 'nadanie', name: 'Nadanie indywidualne', since: '24 lis 2026', by: 'Tomasz Rybak, Dorota Wrona', request: 'W-2026-0518' }] },
  ...doradcaBase('Jan Ostrowski', 'jo'),
  { id: 'jo7', person: 'Jan Ostrowski', resource: 'Folder \\\\ms-fs\\POK-Krakow\\archiwum', system: 'Folder sieciowy', level: 'Odczyt', scope: 'Bez zakresu',
    sources: [{ kind: 'nadanie', name: 'Nadanie indywidualne', since: '2 lut 2025', by: 'Tomasz Rybak', request: 'W-2025-0102' }] },
  ...doradcaBase('Ola Pietrzak', 'op'),
  ...doradcaBase('Tomasz Rybak', 'tr'),
  { id: 'tr7', person: 'Tomasz Rybak', resource: 'Wnioski o dostęp zespołu', system: 'MS OS', level: 'Edycja', scope: 'Własny zespół', sources: [role('Kierownik POK', '1 wrz 2019')] },
  { id: 'tr8', person: 'Tomasz Rybak', resource: 'Raport „Aktywność klientów POK”', system: 'MS OS', level: 'Odczyt', scope: 'Klienci POK', sources: [role('Kierownik POK', '1 wrz 2019')] },
  { id: 'kb1', person: 'Krzysztof Bielecki', resource: 'Karta klienta', system: 'MS OS', fields: 'Dane podstawowe', level: 'Odczyt', scope: 'Własni klienci', sources: [role('Agent firmy inwestycyjnej', '10 sty 2025', 'Joanna Lis (HR)')] },
  { id: 'kb2', person: 'Krzysztof Bielecki', resource: 'Zapisy na obligacje', system: 'MS OS', level: 'Edycja', scope: 'Własni klienci', sources: [role('Agent firmy inwestycyjnej', '10 sty 2025', 'Joanna Lis (HR)')] },
  { id: 'nk1', person: 'Natalia Kowal', resource: 'Kalendarz biznesowy', system: 'MS OS', level: 'Odczyt', scope: 'Cała firma', sources: [role('Pracownik MS', '2 sty 2023', 'automatycznie')] },
  { id: 'nk2', person: 'Natalia Kowal', resource: 'Regulacje wewnętrzne', system: 'MS OS', level: 'Odczyt', scope: 'Cała firma', sources: [role('Pracownik MS', '2 sty 2023', 'automatycznie')] },
  { id: 'ps1', person: 'Paweł Szulc', resource: 'Centralna Baza Uprawnień', system: 'MS OS', level: 'Edycja', scope: 'Cała firma', sources: [role('Administrator CBU', '5 maj 2022', 'Ireneusz Kot')] },
  { id: 'ps2', person: 'Paweł Szulc', resource: 'Zgłoszenia IT', system: 'MS OS', level: 'Edycja', scope: 'Cała firma', sources: [role('Wsparcie IT', '5 maj 2022', 'Ireneusz Kot')] },
  { id: 'as1', person: 'Anna Sobczak', resource: 'Raport „Sprzedaż sieci”', system: 'MS OS', level: 'Odczyt', scope: 'Cała firma', sources: [role('Dyrektor sprzedaży', '1 lut 2021')] },
  { id: 'as2', person: 'Anna Sobczak', resource: 'Wnioski o dostęp zespołu i AFI', system: 'MS OS', level: 'Edycja', scope: 'Własny zespół', sources: [role('Dyrektor sprzedaży', '1 lut 2021')] },
]

// ---------- wnioski ----------
const h = (at: string, who: string, text: string): HistoryEntry => ({ at, who, text })

export const REQUESTS: Request[] = [
  {
    id: 'W-2026-0518', person: 'Marta Wilczek', author: 'Marta Wilczek', createdAt: '21 lis 2026',
    reason: 'Prowadzę klientów zapisujących się na emisje 2026 i potrzebuję wglądu w wyniki POK oraz w dokumenty emisyjne.',
    items: [
      { id: '1', op: 'nadanie', kind: 'uprawnienie', what: 'Raport „Sprzedaż obligacji POK”', system: 'MS OS', level: 'Odczyt', scope: 'Klienci POK', exec: 'auto',
        steps: [{ role: 'Przełożony', who: 'Tomasz Rybak', decision: 'ok', at: '22 lis, 09:14' }, { role: 'Właściciel', who: 'Dorota Wrona', decision: 'ok', at: '24 lis, 11:02' }],
        executed: { at: '24 lis, 11:02', by: 'MS OS (automatycznie)' },
        history: [h('21 lis, 16:40', 'Marta Wilczek', 'Złożyła wniosek'), h('22 lis, 09:14', 'Tomasz Rybak', 'Zatwierdził jako przełożony'), h('24 lis, 11:02', 'Dorota Wrona', 'Zatwierdziła jako właściciel'), h('24 lis, 11:02', 'MS OS', 'Nadano automatycznie')] },
      { id: '2', op: 'nadanie', kind: 'uprawnienie', what: 'Folder \\\\ms-fs\\Emisje\\2026', system: 'Folder sieciowy', level: 'Odczyt', scope: 'Bez zakresu', exec: 'it',
        steps: [{ role: 'Przełożony', who: 'Tomasz Rybak', decision: 'ok', at: '22 lis, 09:14' }, { role: 'Właściciel', who: 'Maria Czarnecka', decision: 'ok', at: '24 lis, 14:30' }],
        history: [h('21 lis, 16:40', 'Marta Wilczek', 'Złożyła wniosek'), h('22 lis, 09:14', 'Tomasz Rybak', 'Zatwierdził jako przełożony'), h('24 lis, 14:30', 'Maria Czarnecka', 'Zatwierdziła jako właściciel'), h('24 lis, 14:31', 'MS OS', 'Przekazano do wykonania przez IT (ZG-1046)')] },
    ],
  },
  {
    id: 'W-2026-0521', person: 'Jan Ostrowski', author: 'Jan Ostrowski', createdAt: '24 lis 2026',
    reason: 'Przygotowuję zestawienie klientów do akcji przypominającej o ankiecie adekwatności.',
    items: [
      { id: '1', op: 'nadanie', kind: 'uprawnienie', what: 'Eksport listy klientów', system: 'MS OS', level: 'Odczyt', scope: 'Klienci POK', exec: 'auto',
        steps: [{ role: 'Przełożony', who: 'Tomasz Rybak' }, { role: 'Właściciel', who: 'Anna Sobczak' }, { role: 'Compliance', who: 'Michał Górski' }],
        history: [h('24 lis, 10:05', 'Jan Ostrowski', 'Złożył wniosek')] },
    ],
  },
  {
    id: 'W-2026-0522', person: 'Krzysztof Bielecki', author: 'Krzysztof Bielecki', createdAt: '24 lis 2026',
    reason: 'Obsługuję klientów, którzy zapisują się na emisję K14 i potrzebuję podglądu ich danych kontaktowych.',
    items: [
      { id: '1', op: 'nadanie', kind: 'uprawnienie', what: 'Dane kontaktowe klienta', system: 'MS OS', level: 'Odczyt', scope: 'Własni klienci', exec: 'auto',
        steps: [{ role: 'Szef działu sprzedaży', who: 'Anna Sobczak' }, { role: 'Właściciel', who: 'Dorota Wrona' }],
        history: [h('24 lis, 13:20', 'Krzysztof Bielecki', 'Złożył wniosek')] },
    ],
  },
  {
    id: 'W-2026-0515', person: 'Ola Pietrzak', author: 'Ola Pietrzak', createdAt: '20 lis 2026',
    reason: 'Klienci POK często proszą mnie o korektę adresu podczas wizyty.',
    items: [
      { id: '1', op: 'nadanie', kind: 'uprawnienie', what: 'Dane kontaktowe klienta', system: 'MS OS', level: 'Edycja', scope: 'Klienci POK', exec: 'auto',
        steps: [{ role: 'Przełożony', who: 'Tomasz Rybak', decision: 'ok', at: '21 lis, 08:50' }, { role: 'Właściciel', who: 'Dorota Wrona', decision: 'ok', at: '23 lis, 12:11' }, { role: 'Compliance', who: 'Michał Górski' }],
        history: [h('20 lis, 15:02', 'Ola Pietrzak', 'Złożyła wniosek'), h('21 lis, 08:50', 'Tomasz Rybak', 'Zatwierdził jako przełożony'), h('23 lis, 12:11', 'Dorota Wrona', 'Zatwierdziła jako właściciel')] },
    ],
  },
  {
    id: 'W-2026-0524', person: 'Jan Ostrowski', author: 'Tomasz Rybak', createdAt: '25 lis 2026',
    reason: 'Archiwum POK przeniesiono do nowego folderu. Stary dostęp nie jest już potrzebny.',
    items: [
      { id: '1', op: 'odebranie', kind: 'uprawnienie', what: 'Folder \\\\ms-fs\\POK-Krakow\\archiwum', system: 'Folder sieciowy', level: 'Odczyt', scope: 'Bez zakresu', exec: 'it',
        steps: [],
        history: [h('25 lis, 08:12', 'Tomasz Rybak', 'Odebrał dostęp jako przełożony'), h('25 lis, 08:12', 'MS OS', 'Przekazano do wykonania przez IT (ZG-1048)')] },
    ],
  },
  {
    id: 'W-2026-0509', person: 'Natalia Kowal', author: 'Natalia Kowal', createdAt: '14 lis 2026',
    reason: 'Chcę śledzić terminy płatności emisji na potrzeby kalendarza Zarządu.',
    items: [
      { id: '1', op: 'nadanie', kind: 'uprawnienie', what: 'Kalendarz płatności emisji', system: 'MS OS', level: 'Odczyt', scope: 'Cała firma', exec: 'auto',
        steps: [{ role: 'Przełożony', who: 'Jerzy Malinowski', decision: 'ok', at: '15 lis, 10:00' }, { role: 'Właściciel', who: 'Maria Czarnecka', decision: 'no', at: '17 lis, 09:31', reason: 'Zarząd dostaje cotygodniowe zestawienie płatności od Działu Emisji. Bezpośredni dostęp nie jest potrzebny.' }],
        history: [h('14 lis, 12:44', 'Natalia Kowal', 'Złożyła wniosek'), h('15 lis, 10:00', 'Jerzy Malinowski', 'Zatwierdził jako przełożony'), h('17 lis, 09:31', 'Maria Czarnecka', 'Odmówiła jako właściciel')] },
    ],
  },
]

// ---------- role i zasoby ----------
export type Perm = { id: string; name: string; fields: string; level: Level; scope: string; actions: { eksport: boolean; druk: boolean } }
export type RoleDef = { name: string; owner: string; deputy: string; compliance: boolean; holders: string[]; holderCount: number; desc: string; perms: Perm[] }

export const PREDEFINED: { name: string; fields: string }[] = [
  { name: 'Karta klienta', fields: 'Dane podstawowe, rachunki' },
  { name: 'Dane kontaktowe klienta', fields: 'E-mail, telefon, adres' },
  { name: 'Telefon klienta', fields: 'Numer telefonu' },
  { name: 'Zapisy na obligacje', fields: 'Wszystkie pola' },
  { name: 'Zapisy na FIZ', fields: 'Wszystkie pola' },
  { name: 'Historia kontaktów', fields: 'Notatki, spotkania, rozmowy' },
  { name: 'Transakcje', fields: 'Wszystkie pola' },
  { name: 'Zlecenia', fields: 'Wszystkie pola' },
  { name: 'Raport „Aktywność klientów POK”', fields: 'Cały raport' },
  { name: 'Raport „Sprzedaż obligacji POK”', fields: 'Cały raport' },
  { name: 'Kalendarz płatności emisji', fields: 'Daty, kwoty' },
  { name: 'Lista klientów', fields: 'Imię, nazwisko, doradca, POK' },
]

let n = 0
const perm = (name: string, fields: string, level: Level, scope: string, eksport = false, druk = false): Perm =>
  ({ id: 'p' + (++n), name, fields, level, scope, actions: { eksport, druk } })

export const ROLES: RoleDef[] = [
  { name: 'Doradca POK', owner: 'Anna Sobczak', deputy: 'Tomasz Rybak', compliance: true, holderCount: 14,
    holders: ['Marta Wilczek', 'Jan Ostrowski', 'Ola Pietrzak', 'Tomasz Rybak'],
    desc: 'Obsługa własnych klientów w punkcie obsługi klienta.',
    perms: [
      perm('Karta klienta', 'Dane podstawowe, rachunki', 'Odczyt', 'Własni klienci', false, true),
      perm('Dane kontaktowe klienta', 'E-mail, telefon, adres', 'Odczyt', 'Klienci POK'),
      perm('Zapisy na obligacje', 'Wszystkie pola', 'Edycja', 'Własni klienci', false, true),
      perm('Historia kontaktów', 'Notatki, spotkania, rozmowy', 'Edycja', 'Własni klienci'),
      perm('Transakcje', 'Wszystkie pola', 'Odczyt', 'Własni klienci'),
      perm('Lista klientów', 'Imię, nazwisko, doradca, POK', 'Odczyt', 'Klienci POK', false),
    ] },
  { name: 'Kierownik POK', owner: 'Anna Sobczak', deputy: 'Lech Wójcik', compliance: true, holderCount: 6,
    holders: ['Tomasz Rybak'], desc: 'Nadzór nad zespołem POK i decyzje o dostępach zespołu.',
    perms: [
      perm('Raport „Aktywność klientów POK”', 'Cały raport', 'Odczyt', 'Klienci POK', true),
      perm('Lista klientów', 'Imię, nazwisko, doradca, POK', 'Odczyt', 'Klienci POK', true),
      perm('Historia kontaktów', 'Notatki, spotkania, rozmowy', 'Odczyt', 'Klienci POK'),
    ] },
  { name: 'Agent firmy inwestycyjnej', owner: 'Anna Sobczak', deputy: 'Tomasz Rybak', compliance: true, holderCount: 9,
    holders: ['Krzysztof Bielecki'], desc: 'Obsługa klientów przypisanych agentowi.',
    perms: [
      perm('Karta klienta', 'Dane podstawowe', 'Odczyt', 'Własni klienci'),
      perm('Zapisy na obligacje', 'Wszystkie pola', 'Edycja', 'Własni klienci'),
    ] },
  { name: 'Operacje — przypisania', owner: 'Lech Wójcik', deputy: 'Karolina Mazur', compliance: false, holderCount: 4,
    holders: ['Karolina Mazur'], desc: 'Przypisywanie klientów i leadów do doradców.',
    perms: [
      perm('Lista klientów', 'Imię, nazwisko, doradca, POK', 'Edycja', 'Wszyscy klienci', true),
      perm('Karta klienta', 'Dane podstawowe, rachunki', 'Odczyt', 'Wszyscy klienci'),
    ] },
  { name: 'Administrator CBU', owner: 'Ireneusz Kot', deputy: 'Paweł Szulc', compliance: true, holderCount: 2,
    holders: ['Paweł Szulc'], desc: 'Edycja składu ról i wykonywanie zmian w dostępach.',
    perms: [perm('Karta klienta', 'Dane podstawowe', 'Brak', 'Bez zakresu')] },
]

export type ResourceDef = { name: string; system: string; owner: string; exec: 'auto' | 'it'; holders: number; desc: string }
export const RESOURCES: ResourceDef[] = [
  { name: 'Folder \\\\ms-fs\\Emisje\\2026', system: 'Folder sieciowy', owner: 'Maria Czarnecka', exec: 'it', holders: 11, desc: 'Dokumenty emisyjne z 2026 r.' },
  { name: 'Folder \\\\ms-fs\\POK-Krakow', system: 'Folder sieciowy', owner: 'Tomasz Rybak', exec: 'it', holders: 5, desc: 'Dokumenty POK Kraków.' },
  { name: 'Raport „Sprzedaż obligacji POK”', system: 'MS OS', owner: 'Dorota Wrona', exec: 'auto', holders: 22, desc: 'Sprzedaż obligacji w podziale na POK.' },
  { name: 'Raport „Aktywność klientów POK”', system: 'MS OS', owner: 'Anna Sobczak', exec: 'auto', holders: 8, desc: 'Zdarzenia klientów w POK.' },
  { name: 'Kalendarz płatności emisji', system: 'MS OS', owner: 'Maria Czarnecka', exec: 'auto', holders: 15, desc: 'Daty i kwoty płatności dla emisji.' },
]
