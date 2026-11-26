// Zalogowany użytkownik (dane fikcyjne). Wariant z briefu do makiety profilu:
// doradca z przypisanym POK, inicjały zamiast zdjęcia, w sekcji kontaktowej sam e-mail.
export type User = {
  name: string
  initials: string
  color: number
  title: string            // stanowisko
  unit: string             // dział lub jednostka
  pok?: string             // punkt obsługi klienta (u doradcy)
  supervisor?: string      // bezpośredni przełożony (u AFI ukryty)
  afi?: boolean
  email: string
  phone?: string           // telefon służbowy, jeśli przypisany
  login: string
  about?: string           // opis pracownika, jeśli zapisano
  msRoles: string[]        // nazwy przypisanych ról MS DOS
  canEditProfile?: boolean // „Edytuj profil” tylko z odpowiednim uprawnieniem
}

export const USER: User = {
  name: 'Marta Wilczek',
  initials: 'MW',
  color: 1,
  title: 'Doradca klienta',
  unit: 'Sieć sprzedaży',
  pok: 'POK Kraków, ul. Lubicz',
  supervisor: 'Tomasz Rybak',
  email: 'marta.wilczek@ms-dm.pl',
  login: 'mwilczek',
  msRoles: ['Doradca POK', 'Pracownik MS'],
  canEditProfile: false,
}
