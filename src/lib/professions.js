// src/lib/professions.js

function tOrFallback(t, key, fallback, options) {
  return t ? t(key, { defaultValue: fallback, ...options }) : fallback;
}

export const VERTICALS = {
  trades: {
    id: "trades",
    label: "Trade & construction",
    icon: "🔧",
    color: { bg: "#FFF0EB", text: "#E8500A" },
    professions: [
      "Electrician", "Plumber", "Builder", "HVAC Engineer", "Decorator",
      "Roofer", "Carpenter", "Glazier", "Landscaper", "Plasterer", "Tiler", "Welder",
    ],
    // Terminology overrides for this vertical (canonical English — see i18n note above)
    terms: {
      client: "Client",
      booking: "Job",
      bookingPlural: "Jobs",
      credential: "Certification",
      credentialPlural: "Certifications",
      credentialExamples: [
        { name: "18th Edition Wiring Regulations", body: "NICEIC / City & Guilds" },
        { name: "NICEIC Approved Contractor",       body: "NICEIC" },
        { name: "Gas Safe Registered",               body: "Gas Safe Register" },
        { name: "EV Charging Installation (C&G 2919)", body: "City & Guilds" },
        { name: "IPAF Powered Access Licence",       body: "IPAF" },
        { name: "CSCS Card (Electrotechnical)",      body: "CSCS" },
        { name: "Asbestos Awareness",                 body: "UKATA" },
        { name: "First Aid at Work",                  body: "HSE" },
        { name: "Part P Building Regulations",       body: "NAPIT / NICEIC" },
        { name: "BPEC Gas Central Heating",          body: "BPEC" },
      ],
      rateLabel: "Hourly rate",
      serviceLabel: "Job type",
    },
    // Which extra profile fields matter for this vertical
    profileFields: [
      { key: "insurance_provider", label: "Public liability insurer", type: "text", placeholder: "e.g. Simply Business" },
      { key: "insurance_amount",   label: "Cover amount",             type: "text", placeholder: "e.g. €2,000,000" },
      { key: "vat_registered",     label: "VAT registered",           type: "boolean" },
    ],
  },

  beauty: {
    id: "beauty",
    label: "Beauty & wellness",
    icon: "💅",
    color: { bg: "#FDF2F8", text: "#BE185D" },
    professions: [
      "Hairdresser", "Nail Technician", "Spa Therapist", "Massage Therapist",
      "Beautician", "Barber", "Makeup Artist", "Lash Technician", "Personal Trainer",
    ],
    terms: {
      client: "Client",
      booking: "Appointment",
      bookingPlural: "Appointments",
      credential: "Qualification",
      credentialPlural: "Qualifications",
      credentialExamples: [
        { name: "NVQ Level 2 Hairdressing",       body: "City & Guilds" },
        { name: "NVQ Level 3 Hairdressing",       body: "City & Guilds" },
        { name: "CIBTAC Beauty Therapy",          body: "CIBTAC" },
        { name: "Insured Lash Technician",        body: "Public liability insurer" },
        { name: "Level 3 Nail Technology",        body: "VTCT / NVQ" },
        { name: "Level 3 Massage Therapy",        body: "VTCT" },
        { name: "First Aid at Work",              body: "HSE" },
        { name: "Personal Training Level 3",      body: "REPs / CIMSPA" },
      ],
      rateLabel: "Price per service",
      serviceLabel: "Service",
    },
    profileFields: [
      {
        key: "service_menu", label: "Service menu", type: "list",
        itemFields: [
          { key: "name",     label: "Service name", type: "text",   placeholder: "e.g. Gel manicure" },
          { key: "duration", label: "Duration (min)", type: "text", placeholder: "45" },
          { key: "price",    label: "Price (€)",      type: "text", placeholder: "35" },
        ],
      },
      { key: "instagram_handle", label: "Instagram handle", type: "text", placeholder: "@yoursalon" },
    ],
  },

  professional: {
    id: "professional",
    label: "Professional services",
    icon: "⚖️",
    color: { bg: "#EFF6FF", text: "#1D4ED8" },
    professions: [
      "Lawyer", "Notary", "Accountant", "Consultant", "Therapist / Psychologist",
      "Architect", "Financial Advisor", "Tax Advisor", "Surveyor",
    ],
    terms: {
      client: "Client",
      booking: "Consultation",
      bookingPlural: "Consultations",
      credential: "Professional registration",
      credentialPlural: "Professional registrations",
      credentialExamples: [
        { name: "Bar Number — Ordre des Avocats",          body: "Ordre des Avocats" },
        { name: "Chambre des Notaires registration",       body: "Chambre des Notaires" },
        { name: "Professional Indemnity Insurance",        body: "Insurer" },
        { name: "GDPR / Data Protection Certification",    body: "CNIL compliant" },
        { name: "Expert-comptable registration",           body: "Ordre des Experts-Comptables" },
        { name: "Chartered status",                          body: "Professional body" },
      ],
      rateLabel: "Consultation rate",
      serviceLabel: "Consultation type",
    },
    profileFields: [
      { key: "bar_number",       label: "Bar number / registration ID", type: "text", placeholder: "e.g. Ordre des Avocats de Rouen — 12345" },
      { key: "professional_body",label: "Professional body",            type: "text", placeholder: "e.g. Ordre des Avocats" },
      {
        key: "gdpr_accepted", label: "GDPR-compliant client data handling", type: "boolean",
        helpText: "Confirms client information is stored and processed in line with GDPR — shown on your booking page.",
      },
    ],
  },

  other: {
    id: "other",
    label: "Other services",
    color: { bg: "#F2F0EC", text: "#6B6460" },
    professions: ["Other"],
    terms: {
      client: "Client",
      booking: "Booking",
      bookingPlural: "Bookings",
      credential: "Certification",
      credentialPlural: "Certifications",
      credentialExamples: [],
      rateLabel: "Rate",
      serviceLabel: "Service",
    },
    profileFields: [],
  },
};

// Flat list of every profession with its parent vertical attached —
// used for the signup dropdown (one single select, grouped by vertical).
// Values here are canonical (English) and unchanged by i18n — this is what
// gets stored as profile.trade and matched against elsewhere.
export const ALL_PROFESSIONS = Object.values(VERTICALS).flatMap(v =>
  v.professions.map(p => ({ profession: p, vertical: v.id }))
);

// Look up which vertical a given profession string belongs to.
// Falls back to "other" for anything not in the list (so custom/typed
// professions never crash the UI).
export function getVerticalForProfession(profession) {
  if (!profession) return VERTICALS.other;
  const needle = profession.trim().toLowerCase();
  const match = ALL_PROFESSIONS.find(p => p.profession.trim().toLowerCase() === needle);
  return match ? VERTICALS[match.vertical] : VERTICALS.other;
}

// Localized vertical label. Pass `t` (from useTranslation) to translate;
// omit it to get the canonical English label.
// `vertical` can be a vertical id string ("trades") or a VERTICALS[...] object.
export function getVerticalLabel(vertical, t) {
  const v = typeof vertical === "string" ? VERTICALS[vertical] : vertical;
  if (!v) return "";
  return tOrFallback(t, `professions.verticals.${v.id}.label`, v.label);
}

// Localized profession display name (e.g. "Electrician" → "Électricien").
// The underlying `profession` value itself is never changed — only what's
// displayed. Pass `t` to translate; omit it to get the canonical English name.
export function getProfessionLabel(profession, t) {
  if (!profession) return profession;
  return tOrFallback(t, `professions.professionNames.${profession}`, profession);
}

// Convenience: get the terminology object for a profession.
// Pass `t` (from useTranslation) to get localized terms; omit it to get the
// canonical English terms (old behaviour, unchanged).
// credentialExamples are intentionally NOT translated — see i18n note at top.
export function getTerms(profession, t) {
  const vertical = getVerticalForProfession(profession);
  const raw = vertical.terms;
  if (!t) return raw;
  const vId = vertical.id;
  return {
    client:             tOrFallback(t, `professions.terms.${vId}.client`, raw.client),
    booking:            tOrFallback(t, `professions.terms.${vId}.booking`, raw.booking),
    bookingPlural:      tOrFallback(t, `professions.terms.${vId}.bookingPlural`, raw.bookingPlural),
    credential:         tOrFallback(t, `professions.terms.${vId}.credential`, raw.credential),
    credentialPlural:   tOrFallback(t, `professions.terms.${vId}.credentialPlural`, raw.credentialPlural),
    rateLabel:          tOrFallback(t, `professions.terms.${vId}.rateLabel`, raw.rateLabel),
    serviceLabel:       tOrFallback(t, `professions.terms.${vId}.serviceLabel`, raw.serviceLabel),
    credentialExamples: raw.credentialExamples, // not translated, see note at top of file
  };
}

// Convenience: get the badge colour for a profession (used in Marketplace,
// booking page header, sidebar trade label). Colors aren't text, so no t needed.
export function getVerticalColor(profession) {
  return getVerticalForProfession(profession).color;
}

// Recursively translate a profile-field definition (and any nested itemFields,
// e.g. the beauty service_menu's per-row fields).
function translateField(field, keyPath, t) {
  const path = `${keyPath}.${field.key}`;
  const out = {
    ...field,
    label: tOrFallback(t, `professions.fields.${path}.label`, field.label),
  };
  if (field.placeholder) {
    out.placeholder = tOrFallback(t, `professions.fields.${path}.placeholder`, field.placeholder);
  }
  if (field.helpText) {
    out.helpText = tOrFallback(t, `professions.fields.${path}.helpText`, field.helpText);
  }
  if (field.itemFields) {
    out.itemFields = field.itemFields.map(sf => translateField(sf, `${path}.items`, t));
  }
  return out;
}

// Convenience: get the vertical-specific extra profile field definitions for
// a given profession (e.g. service menu for beauty, bar number for law).
// Pass `t` to get localized labels/placeholders/helpText; omit it to get the
// canonical English field defs (old behaviour, unchanged). Field `key` and
// `type` are structural and never translated.
export function getProfileFields(profession, t) {
  const vertical = getVerticalForProfession(profession);
  const raw = vertical.profileFields ?? [];
  if (!t) return raw;
  return raw.map(f => translateField(f, vertical.id, t));
}
