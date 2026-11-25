# MS OS · CRM doradcy

Klikalny prototyp UI: **logowanie**, **strona główna z menu**, **zarządzanie uprawnieniami (CBU)** i **profil użytkownika**. Treść ekranów według briefu UX (24.11.2026).
Stylistyka: Fieldnote (Inter 13/500, skala szarości, karta treści na tle `#F9F9F9`, czarny przycisk główny, ikony Feather). Tokeny są w `src/styles/tokens.css`.
Nawigacja 1:1 z wireframe'u crm-ms (pasek L1 + panel L2, awatar z menu na dole paska). Pierwotny wireframe leży w `wireframe/nawigacja.html`.

```bash
npm install
npm run dev
```

## Ekrany

| Ekran | Trasa | Co pokazuje |
|---|---|---|
| Logowanie | `#/logowanie` | Konto Microsoft, rozwijany login i hasło, kod SMS (numer SMS-a, licznik 60 s, limit 5/h), blokada, wygasła sesja, pomoc IT |
| Strona główna | `#/strona-glowna` | Na razie bez treści, ale w pełnym szkielecie z menu głównym |
| Moje dostępy (doradca) | `#/moje-dostepy`, `/wnioski` | Wejście z profilu: „Moje dostępy”. Własne dostępy ze źródłem (rola albo nadanie), własne wnioski ze statusem każdej pozycji i informacją, na kogo czeka, prośba o pojedyncze uprawnienie |
| Uprawnienia (ekrany IT) | `#/uprawnienia/wnioski`, `/osoby`, `/role`, `/zasoby` | Sekcja IT: Uprawnienia, CBU - Konta, CBU - Role, CBU - Zasoby. Pełna ewidencja, odebranie, edycja ról (dane i pola, poziom, zakres, czynności) z podglądem zmian, potwierdzenie ręcznego wykonania przez IT. Decyzje „Zatwierdź/Odmów” należą do osób decydujących, więc tu widać tylko, na kogo czeka pozycja |
| Mój profil | `#/profil` | Wejście z menu awatara: Profil. Kontakt służbowy, miejsce w firmie, role MS OS, skrót do dostępów |

Nie ma widoków per rola. Jest jeden zalogowany użytkownik (`src/data/user.ts`).

## Menu: pokazywanie i ukrywanie

Struktura menu jest w `src/data/nav.ts`. Elementy ukrywa się przez zbiór `hidden` w store (`setHidden(klucz, true)`):
id sekcji (np. `kadry`) albo klucz pozycji (np. `it/workflow`). Sekcja bez widocznych pozycji znika z paska.

Ekran logowania ma stany dostępne z adresu: `#/logowanie?stan=haslo|blad-hasla|sms|kod-wygasl|limit|blokada|blokada-it|pomoc` oraz `#/logowanie?wygasla=1`.
Kod SMS `000000` jest błędny, każdy inny przechodzi.

## Tabele

Główna tabela modułu (wzór: Fieldnote) jest na **Sprzedaż → Transakcje** (`#/transakcje`), z danymi z wireframe'u.
Pozostałe moduły mają ten sam szkielet tabeli z szarymi wierszami.

## Struktura

```
src/
  data/        nawigacja, zalogowany użytkownik, dane CBU (wszystko fikcyjne)
  store.tsx    routing na hashu, widoczność menu, stan CBU, toast
  components/  szkielet (L1/L2, topbar, ⌘K), elementy UI, tabela i filtry
  screens/     Login, Transakcje, cbu/*, Profil, Placeholder (strona główna i moduły)
  styles/      tokens.css, base.css (komponenty), app.css (układ i ekrany), table.css
```
