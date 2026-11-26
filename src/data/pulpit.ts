// Pulpit doradcy (brief, punkt 2): „Ostatnia aktywność moich klientów”,
// „Moje otwarte zadania” i „Moje zgłoszenia”. Dane fikcyjne, dziś = śr 25 lis 2026.

export type EventKind = 'formularz' | 'zapis' | 'przydzial' | 'transakcja' | 'oswiadczenie'

export const EVENT: Record<EventKind, { label: string; icon: string }> = {
  formularz: { label: 'Nowy formularz', icon: 'file-plus' },
  zapis: { label: 'Zapis na emisję', icon: 'edit-3' },
  przydzial: { label: 'Przydział papierów', icon: 'award' },
  transakcja: { label: 'Transakcja', icon: 'repeat' },
  oswiadczenie: { label: 'Oświadczenie', icon: 'file-text' },
}

export type Activity = { id: string; day: string; time: string; client: string; initials: string; color: number; kind: EventKind; what: string }

export const DAYS: Record<string, string> = { d0: 'Dziś', d1: 'Wczoraj', d2: 'Poniedziałek, 23 lis' }

export const ACTIVITY: Activity[] = [
  { id: 'a1', day: 'd0', time: '14:32', client: 'Anna Wójcik', initials: 'AW', color: 1, kind: 'zapis', what: 'Obligacje BEST S.A. seria R2 · 50 000 PLN' },
  { id: 'a2', day: 'd0', time: '11:08', client: 'Piotr Nowak', initials: 'PN', color: 2, kind: 'formularz', what: 'Ankieta MiFID: aktualizacja profilu inwestycyjnego' },
  { id: 'a3', day: 'd0', time: '09:41', client: 'Jan Kolasa', initials: 'JK', color: 0, kind: 'przydzial', what: 'Ghelamco Invest GN22 · przydzielono 120 z 150 obligacji' },
  { id: 'a4', day: 'd1', time: '16:55', client: 'Maria Zielińska', initials: 'MZ', color: 3, kind: 'transakcja', what: 'Kupno PLBEST000424 · 10 374,00 PLN' },
  { id: 'a5', day: 'd1', time: '13:20', client: 'Ewa Kamińska', initials: 'EK', color: 4, kind: 'oswiadczenie', what: 'Oświadczenie o odpowiedniości do zlecenia Z-88412' },
  { id: 'a6', day: 'd1', time: '10:02', client: 'Tomasz Lewandowski', initials: 'TL', color: 5, kind: 'zapis', what: 'Certyfikaty FIZ Kredyt Plus · 25 000 PLN' },
  { id: 'a7', day: 'd2', time: '15:47', client: 'Agnieszka Szymańska', initials: 'AS', color: 1, kind: 'formularz', what: 'Wniosek o otwarcie rachunku maklerskiego' },
  { id: 'a8', day: 'd2', time: '12:15', client: 'Krzysztof Dąbrowski', initials: 'KD', color: 0, kind: 'przydzial', what: 'Kruk S.A. AO3 · przydzielono 40 z 40 obligacji' },
]

export type Task = { id: string; title: string; client?: string; due: string; tone: 'late' | 'today' | 'soon' | 'later' }

export const TASKS: Task[] = [
  { id: 't1', title: 'Oddzwonić w sprawie zapisu na R2', client: 'Anna Wójcik', due: '21 lis', tone: 'late' },
  { id: 't2', title: 'Uzupełnić ankietę MiFID z klientem', client: 'Piotr Nowak', due: 'Dziś', tone: 'today' },
  { id: 't3', title: 'Spotkanie: przegląd portfela', client: 'Maria Zielińska', due: 'Jutro', tone: 'soon' },
  { id: 't4', title: 'Szkolenie okresowe AML', due: '2 gru', tone: 'later' },
]

export type Ticket = { id: string; title: string; when: string; status: string; tone: 'info' | 'warn' | 'ok' }

export const TICKETS: Ticket[] = [
  { id: 'ZG-1049', title: 'Nie dostaję kodu SMS', when: 'dziś, 08:12', status: 'Nowe', tone: 'info' },
  { id: 'W-2026-0518', title: 'Dostęp: raport POK i folder emisji', when: '21 lis', status: '1 z 2 gotowe', tone: 'warn' },
  { id: 'ZG-1012', title: 'Drukarka w POK nie drukuje', when: '18 lis', status: 'Rozwiązane', tone: 'ok' },
]
