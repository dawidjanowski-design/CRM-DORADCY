// Transakcje: dane z wireframe'u (wireframe/nawigacja.html, ROWS). Daty po polsku (dd.mm.rrrr);
// w wireframe'ie zapis 08/12/2026 to 12 sierpnia (rozliczenie T+1 po utworzeniu 08/11).
// Kolejne strony powstają z tego samego wzoru, żeby paginacja działała na realistycznej skali.

export type Tx = {
  id: string
  client: string
  isin: string
  market: 'WSE Cat' | 'Catalyst' | 'OTC'
  dir: 'Kupno' | 'Sprzedaż'
  nominal: number        // PLN
  settle: Date           // data rozliczenia
  created: Date          // utworzono
}

const BASE: [string, Tx['market'], string, Tx['dir'], number][] = [
  ['PLBEST000424', 'WSE Cat', 'Jan Kolasa', 'Sprzedaż', 103.74],
  ['PLBEST000416', 'WSE Cat', 'Anna Wójcik', 'Kupno', 1012.5],
  ['PLGHLLT00184', 'Catalyst', 'Piotr Nowak', 'Kupno', 5080],
  ['PLBEST000424', 'WSE Cat', 'Maria Zielińska', 'Kupno', 10374],
  ['PLKRDOC00092', 'OTC', 'Tomasz Lewandowski', 'Sprzedaż', 2015.3],
  ['PLBEST000390', 'WSE Cat', 'Ewa Kamińska', 'Kupno', 498.9],
  ['PLGHLLT00184', 'Catalyst', 'Krzysztof Dąbrowski', 'Sprzedaż', 1016],
  ['PLBEST000416', 'WSE Cat', 'Agnieszka Szymańska', 'Kupno', 20250],
  ['PLKRDOC00092', 'OTC', 'Jan Kolasa', 'Kupno', 4031.6],
  ['PLBEST000424', 'WSE Cat', 'Marek Woźniak', 'Sprzedaż', 207.48],
]
// godziny utworzenia z wireframe'u
const TIMES: [number, number][] = [[0, 10], [0, 10], [18, 42], [16, 5], [12, 31], [9, 14], [17, 50], [11, 2], [15, 27], [10, 40]]
// w wireframe'ie co dwa wiersze rozliczenie cofa się o dzień
const DAY_OFFSET = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]

export const TOTAL = 134_588
export const PAGE = 20
const START = new Date(2026, 7, 12)        // 12.08.2026
const LAST_ID = 622200000000010

/* Strona p (od 0): 20 wierszy, kolejne transakcje coraz starsze */
export function page(p: number): Tx[] {
  return Array.from({ length: PAGE }, (_, k) => {
    const n = p * PAGE + k                  // numer transakcji od najnowszej
    const b = BASE[n % 10]
    const cycle = Math.floor(n / 10)
    const settle = new Date(START); settle.setDate(START.getDate() - DAY_OFFSET[n % 10] - cycle * 5)
    const created = new Date(settle); created.setDate(settle.getDate() - 1); created.setHours(...TIMES[n % 10])
    // od drugiej dziesiątki kwoty lekko się różnią, żeby strony nie były kopią
    const nominal = cycle === 0 ? b[4] : Math.round(b[4] * (0.6 + ((n * 37) % 90) / 100) * 100) / 100
    return { id: String(LAST_ID - n), isin: b[0], market: b[1], client: b[2], dir: b[3], nominal, settle, created }
  })
}

export const pad = (n: number) => String(n).padStart(2, '0')
export const fmtDate = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
// grupowanie tysięcy także dla liczb czterocyfrowych (1 012,50), jak w wireframe'ie
export const fmtMoney = (n: number) => {
  const [i, d] = n.toFixed(2).split('.')
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + ',' + d
}
