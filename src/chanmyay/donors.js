export const STORAGE_KEY = "chanmyay.donors.v1";
export const CATEGORIES = [
  { id: "breakfast", label: "Breakfast", myanmar: "နံနက်ဆွမ်း", icon: "☀" },
  { id: "lunch", label: "Lunch", myanmar: "နေ့ဆွမ်း", icon: "◒" },
  { id: "water", label: "Water/Drink", myanmar: "သောက်ရေ / အအေး", icon: "◇" },
  { id: "rental", label: "Rental/Electric", myanmar: "ကျောင်းငှားခ / မီးဖိုး", icon: "⌂" },
];
export function singaporeDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    ...options,
    timeZone: "Asia/Singapore",
  }).format(new Date(`${date}T12:00:00+08:00`));
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function validateDonor(donor) {
  if (!donor.name.trim() || donor.name.length > 160)
    return "Enter a donor display name of up to 160 characters.";
  if (!validDate(donor.startDate) || !validDate(donor.endDate))
    return "Choose valid offering dates.";
  if (donor.endDate < donor.startDate)
    return "The end date must be on or after the start date.";
  if (
    !donor.categories.length ||
    donor.categories.some(
      (id) => !CATEGORIES.some((category) => category.id === id),
    )
  )
    return "Select at least one offering.";
  if (!["Pending", "Approved", "Cancelled"].includes(donor.status))
    return "Select a valid status.";
  if (donor.dedication.length > 300 || donor.phone.length > 40)
    return "The dedication or phone number is too long.";
  return "";
}
export function onDate(donor, date) {
  return donor.startDate <= date && donor.endDate >= date;
}
export function tvPages(donors, date) {
  const groups = CATEGORIES.map((category) => ({
    category,
    donors: donors.filter(
      (donor) =>
        donor.status === "Approved" &&
        onDate(donor, date) &&
        donor.categories.includes(category.id),
    ),
  }));
  const pageCount = Math.max(
    1,
    ...groups.map((group) => Math.ceil(group.donors.length / 2)),
  );
  return Array.from({ length: pageCount }, (_, index) => ({
    rows: groups.map((group) => ({
      category: group.category,
      donors: group.donors.slice(index * 2, index * 2 + 2),
      total: group.donors.length,
    })),
  }));
}
export function readDonors() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  const donors = Array.isArray(parsed) ? parsed.map((donor) =>
    donor && Array.isArray(donor.categories)
      ? { ...donor, categories: [...new Set(donor.categories.map((id) => id === "drinks" ? "water" : id))] }
      : donor
  ) : parsed;
  if (
    !Array.isArray(donors) ||
    donors.some(
      (donor) =>
        !donor ||
        typeof donor.id !== "string" ||
        typeof donor.name !== "string" ||
        typeof donor.phone !== "string" ||
        typeof donor.dedication !== "string" ||
        !Array.isArray(donor.categories) ||
        validateDonor(donor),
    )
  )
    throw new Error(
      "Saved records could not be read. Please recover them before adding more.",
    );
  return donors;
}
export function donorCsv(donors) {
  const cell = (value) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      [
        "Donor",
        "Start date",
        "End date",
        "Offerings",
        "Dedication",
        "Phone",
        "Status",
        "Updated",
      ],
      ...donors.map((donor) => [
        donor.name,
        donor.startDate,
        donor.endDate,
        donor.categories
          .map((id) => CATEGORIES.find((category) => category.id === id).label)
          .join(", "),
        donor.dedication,
        donor.phone,
        donor.status,
        donor.updatedAt,
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n")
  );
}

// Generate a bounded page of donation dates, skipping gaps between bookings.
export function dailyOfferings(donors, { today, dateFilter = "all", before, limit = 30 } = {}) {
  const previousDate = (date) => {
    const value = new Date(`${date}T12:00:00Z`);
    value.setUTCDate(value.getUTCDate() - 1);
    return value.toISOString().slice(0, 10);
  };
  const ranges = donors.map((donor) => ({
    donor,
    start: dateFilter === "all" ? donor.startDate : donor.startDate > today ? donor.startDate : today,
    end: dateFilter === "today" && donor.endDate > today ? today : donor.endDate,
  })).filter(({ start, end }) => start <= end);
  const rows = [];
  let ceiling = before ? previousDate(before) : "9999-12-31";
  while (rows.length < limit) {
    const candidates = ranges.filter(({ start }) => start <= ceiling);
    if (!candidates.length) break;
    const date = candidates.reduce((latest, { end }) => {
      const value = end < ceiling ? end : ceiling;
      return value > latest ? value : latest;
    }, "");
    rows.push({ date, donors: ranges.filter(({ start, end }) => start <= date && end >= date).map(({ donor }) => donor) });
    ceiling = previousDate(date);
  }
  return rows;
}
