import { formatInTimeZone } from "date-fns-tz"

import { DetailsForm } from "@/features/booking/details-form"
import { ServiceCatalog } from "@/features/booking/service-catalog"
import { ServiceDetail } from "@/features/booking/service-detail"
import { SlotPicker } from "@/features/booking/slot-picker"

const locale = "cs"
const tenantSlug = "barber"
const today = formatInTimeZone(new Date(), "Europe/Prague", "yyyy-MM-dd")
const startAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

const catalogT = {
  searchPlaceholder: "Hledat službu",
  loading: "Načítání",
  empty: "Žádné služby",
  openService: "Vybrat",
  categoryLabel: "Kategorie",
  durationUnit: "min",
}

const detailT = {
  loading: "Načítání",
  notFound: "Nenalezeno",
  backToCatalog: "Zpět",
  chooseVariant: "Varianta",
  chooseStaff: "Personál",
  anyStaff: "Kdokoliv",
  continueToSlots: "Pokračovat",
  photosPlaceholder: "Foto placeholder",
  durationUnit: "min",
}

const slotT = {
  loading: "Načítání",
  noSlots: "Bez slotů",
  back: "Zpět",
  title: "Výběr slotu",
  description: "Vyberte termín",
  chooseDate: "Datum",
  selectedVariant: "Varianta",
  durationUnit: "min",
  continue: "Pokračovat",
  busy: "Obsazeno",
  manageBanner: "Režim změny",
  originalSlot: "Původní termín",
  manageContinue: "Vybrat",
}

const detailsT = {
  back: "Zpět",
  title: "Kontaktní údaje",
  description: "Vyplňte údaje",
  name: "Jméno",
  email: "E-mail",
  phone: "Telefon",
  submit: "Rezervovat",
  slotConflict: "Slot je obsazen",
  slotConflictAction: "Zpět na sloty",
  submitError: "Chyba odeslání",
  requiredField: "Povinné pole",
  customFieldPrefix: "Pole",
  durationUnit: "min",
  summaryTitle: "Shrnutí",
  summaryService: "Služba",
  summaryVariant: "Varianta",
  summaryStaff: "Personál",
  summaryDate: "Datum",
  submitting: "Odesílám",
  noStaff: "Kdokoliv",
}

const meta = {
  title: "Booking/Components",
}

export default meta

export const ServiceCatalogStory = {
  render: () => <ServiceCatalog locale={locale} tenantSlug={tenantSlug} t={catalogT} />,
}

export const ServiceDetailStory = {
  render: () => (
    <ServiceDetail
      locale={locale}
      tenantSlug={tenantSlug}
      serviceId="svc-cut"
      initialVariant={60}
      t={detailT}
    />
  ),
}

export const SlotPickerStory = {
  render: () => (
    <SlotPicker
      locale={locale}
      tenantSlug={tenantSlug}
      serviceId="svc-cut"
      variant={60}
      initialDate={today}
      t={slotT}
    />
  ),
}

export const DetailsFormStory = {
  render: () => (
    <DetailsForm
      locale={locale}
      tenantSlug={tenantSlug}
      serviceId="svc-cut"
      variant={60}
      startAt={startAt}
      date={today}
      t={detailsT}
    />
  ),
}
