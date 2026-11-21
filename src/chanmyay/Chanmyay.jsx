import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  CATEGORIES,
  singaporeDate,
  formatDate,
  validateDonor,
  onDate,
  tvPages,
  donorCsv,
  dailyOfferings,
  validDate,
} from "./donors.js";
import "./chanmyay.css";
import { useRegister } from "./useRegister.js";
import TvFitText from "./TvFitText.jsx";
import { AdministratorLogin, DisplaySettings, ImportBrowserRecords } from "./RegisterControls.jsx";

function Icon({ name, ...props }) {
  const paths = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    tv: (
      <>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" />
      </>
    ),
    door: (
      <>
        <path d="M4 21V3h12v18M2 21h18M12 12h1M19 8l3 4-3 4M17 12h5" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 6V4a1 1 0 0 1 1-1h13M16 11h5v5h-5z" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
    download: (
      <>
        <path d="M12 3v12M7 10l5 5 5-5M3 16v5h18v-5" />
      </>
    ),
    search: (
      <>
        <circle cx="10" cy="10" r="7" />
        <path d="m15 15 6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
const futureModules = [
  {
    id: "events",
    name: "Event registration",
    icon: "calendar",
    description: "Participants, confirmations and attendance",
  },
  {
    id: "yogis",
    name: "Yogi registration",
    icon: "people",
    description: "Retreat applications, arrivals and departures",
  },
  {
    id: "visitors",
    name: "Visitor registration",
    icon: "door",
    description: "Visitor details and visit records",
  },
  {
    id: "finance",
    name: "Income & expenses",
    icon: "wallet",
    description: "Donations, receipts, payments and balances",
  },
];
function DonorForm({ donor, onClose, onSave }) {
  const [form, setForm] = useState(
    donor || {
      id: crypto.randomUUID(),
      name: "",
      phone: "",
      dedication: "",
      startDate: singaporeDate(),
      endDate: singaporeDate(),
      categories: [],
      status: "Approved",
    },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState(
    Boolean(donor && donor.startDate !== donor.endDate),
  );
  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);
  const change = (field, value) =>
    setForm((previous) => ({ ...previous, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    const value = {
      ...form,
      name: form.name.trim(),
      phone: form.phone.trim(),
      dedication: form.dedication.trim(),
      endDate: range ? form.endDate : form.startDate,
    };
    const invalid = validateDonor(value);
    if (invalid) { setError(invalid); return; }
    setSaving(true);
    try {
      const message = await onSave(value);
      if (message) setError(message);
      else onClose();
    } catch (error) { setError(error.message); }
    finally { setSaving(false); }
  };
  return (
    <div className="cm-overlay">
      <dialog
        open
        aria-modal="true"
        className="cm-dialog"
        aria-labelledby="donor-form-title"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const elements = [
            ...event.currentTarget.querySelectorAll(
              "button, input, select, textarea",
            ),
          ];
          const first = elements[0],
            last = elements.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="cm-dialog-head">
          <div>
            <span className="cm-eyebrow">DONOR REGISTER</span>
            <h2 id="donor-form-title">
              {donor ? "Edit offering" : "Add an offering"}
            </h2>
            <p>One day or many days. Every offering is appreciated.</p>
          </div>
          <button
            className="cm-icon-button"
            onClick={onClose}
            aria-label="Close form"
          >
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={submit}>
          <label>
            <span className="cm-label-text">Donor display name *</span>
            <input
              autoFocus
              required
              maxLength={160}
              value={form.name}
              onChange={(event) => change("name", event.target.value)}
              placeholder="Individual, family or group name"
            />
          </label>
          <p className="cm-field-help">
            This name appears on the TV. Myanmar and English are welcome.
          </p>
          <fieldset>
            <legend>
              Offering <span>*</span>
            </legend>
            <div className="cm-offering-options">
              {CATEGORIES.map((category) => (
                <label
                  key={category.id}
                  className={
                    form.categories.includes(category.id) ? "selected" : ""
                  }
                >
                  <input
                    type="checkbox"
                    checked={form.categories.includes(category.id)}
                    onChange={(event) =>
                      change(
                        "categories",
                        event.target.checked
                          ? [...form.categories, category.id]
                          : form.categories.filter((id) => id !== category.id),
                      )
                    }
                  />
                  <span>{category.icon}</span>
                  {category.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Offering dates</legend>
            <div className="cm-segment">
              <button
                type="button"
                aria-pressed={!range}
                className={!range ? "active" : ""}
                onClick={() => setRange(false)}
              >
                Single day
              </button>
              <button
                type="button"
                aria-pressed={range}
                className={range ? "active" : ""}
                onClick={() => {
                  setRange(true);
                  if (form.endDate < form.startDate)
                    change("endDate", form.startDate);
                }}
              >
                Date range
              </button>
            </div>
            <div className="cm-form-row">
              <label>
                {range ? "From" : "Date"}
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onInput={(event) => change("startDate", event.target.value)}
                />
              </label>
              {range && (
                <label>
                  Through
                  <input
                    type="date"
                    required
                    min={form.startDate}
                    value={form.endDate}
                    onInput={(event) => change("endDate", event.target.value)}
                  />
                </label>
              )}
            </div>
            {range && (
              <p className="cm-field-help">
                The offering appears every day, including the start and end
                dates.
              </p>
            )}
          </fieldset>
          <label>
            Dedication <small>Optional · shown on TV</small>
            <textarea
              rows="3"
              maxLength={300}
              value={form.dedication}
              onChange={(event) => change("dedication", event.target.value)}
              placeholder="A short dedication or message"
            />
          </label>
          <div className="cm-form-row">
            <label>
              Phone <small>Private</small>
              <input
                type="tel"
                maxLength={40}
                value={form.phone}
                onChange={(event) => change("phone", event.target.value)}
                placeholder="+65"
              />
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => change("status", event.target.value)}
              >
                <option>Pending</option>
                <option>Approved</option>
                <option>Cancelled</option>
              </select>
            </label>
          </div>
          <p className="cm-form-note">
            <Icon name="tv" />
            Only approved offerings appear on the TV for their scheduled dates.
          </p>
          {error && (
            <p role="alert" className="cm-error">
              {error}
            </p>
          )}
          <div className="cm-dialog-actions">
            <button
              type="button"
              className="cm-button secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="cm-button primary" type="submit" disabled={saving}>
              <Icon name="check" />
              {saving ? "Saving…" : "Save offering"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
function TvDisplay({ donors, error, settings, mode, loading, today }) {
  const [index, setIndex] = useState(0);
  const [presenting, setPresenting] = useState(false);
  const [wideScreen, setWideScreen] = useState(() => window.matchMedia("(min-aspect-ratio: 4/3)").matches);
  const fitScreen = presenting || wideScreen;
  useEffect(() => {
    const query = window.matchMedia("(min-aspect-ratio: 4/3)");
    const update = () => setWideScreen(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  function showControls() {
    setPresenting(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    const onKeyDown = (event) => { if (event.key === "Escape") showControls(); };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedDate = searchParams.get("date") || "";
  const displayDate = validDate(requestedDate) ? requestedDate : today;
  const pages = tvPages(donors, displayDate);
  function chooseDate(date) {
    const next = new URLSearchParams(searchParams);
    if (date) next.set("date", date);
    else next.delete("date");
    setSearchParams(next, { replace: true });
    setIndex(0);
  }
  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((value) => value + 1);
    }, 12000);
    return () => clearInterval(timer);
  }, []);
  const page = pages.length ? pages[index % pages.length] : null;
  return (
    <main className={`cm-tv${presenting ? " cm-tv-presenting" : ""}${fitScreen ? " cm-tv-fit-screen" : ""}`}>
      <div className="cm-tv-tools">
        <Link to="/chanmyay">← Staff dashboard</Link>
        <div className="cm-tv-date-controls">
          <label htmlFor="tv-offering-date">Offering date</label>
          <input id="tv-offering-date" type="date" value={displayDate}
            onChange={(event) => { if (validDate(event.target.value)) chooseDate(event.target.value); }} />
          <button onClick={() => chooseDate("")}>Today</button>
        </div>
        <button
          onClick={async () => {
            setPresenting(true);
            try {
              if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
            } catch {
              // Keep the clean presentation layout when native full screen is unavailable.
            }
          }}
        >
          Full screen
        </button>
      </div>
      <header className="cm-donation-header">
        <svg className="cm-tv-emblem" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="32" />
          <circle cx="50" cy="50" r="9" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M50 41V10" transform={`rotate(${i * 45} 50 50)`} />
          ))}
        </svg>
        <TvFitText active={fitScreen} className="cm-tv-title-fit">
          <p className="cm-centre-heading">CHANMYAY YEIKTHA MEDITATION CENTRE (SINGAPORE)</p>
          <h1 lang={settings.eventName ? undefined : "my"}>{settings.eventName || (displayDate === today ? "ယနေ့ အလှူရှင်များ" : "အလှူရှင်များ")}</h1>
          <h2>Daily offerings &amp; dedications</h2>
          <div className="cm-tv-date">
            {formatDate(displayDate, {
              weekday: "long",
              year: "numeric",
              month: "long",
            })}
          </div>
        </TvFitText>
        <svg className="cm-tv-emblem" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="32" />
          <circle cx="50" cy="50" r="9" />
          {Array.from({ length: 8 }, (_, i) => (
            <path key={i} d="M50 41V10" transform={`rotate(${i * 45} 50 50)`} />
          ))}
        </svg>
      </header>
      {loading ? <p role="status">Loading offerings…</p> : error ? (
        <p role="alert" className="cm-error">
          {error}
        </p>
      ) : (
        <section
          className="cm-donation-board"
          aria-label="Donation register for selected date"
        >
          <table className="cm-donation-table">
            <colgroup>
              <col className="cm-offering-column" />
              <col />
            </colgroup>
            <caption className="cm-sr-only">
              Approved donors for {formatDate(displayDate, { year: "numeric" })} in Singapore
            </caption>
            <tbody>
              {page.rows.map(({ category, donors: rowDonors, total }) => (
                <tr key={category.id}>
                  <th scope="row">
                    <TvFitText active={fitScreen}>
                    <span lang="my">
                      {
                        {
                          breakfast: "အရုဏ်ဆွမ်းအလှူ",
                          lunch: "နေ့ဆွမ်းအလှူ",
                          water: "သောက်ရေ / အအေးအလှူ",
                          rental: "ကျောင်းငှားခ / မီးဖိုးအလှူ",
                        }[category.id]
                      }
                    </span>
                    <small>{category.label}</small>
                    </TvFitText>
                  </th>
                  <td>
                    <TvFitText active={fitScreen}>
                    {rowDonors.length ? (
                      rowDonors.map((donor) => (
                        <article key={donor.id}>
                          <h3>{donor.name}</h3>
                          {donor.dedication && <p>{donor.dedication}</p>}
                        </article>
                      ))
                    ) : total ? (
                      <p className="cm-tv-no-donor">—</p>
                    ) : (
                      <article>
                        <h3 lang="my">ချမ်းမြေ့အဖွဲ့ဝင်များ အလှူ</h3>
                      </article>
                    )}
                    </TvFitText>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <footer>
        <p>With gratitude for your generosity and support.</p>
        <span>သာဓု သာဓု သာဓု</span>
        {pages.length > 1 && (
          <div className="cm-tv-progress">
            {(index % pages.length) + 1} / {pages.length} · Rotates every 12
            seconds
          </div>
        )}
        <small>{mode === "shared" ? "Shared display · Updates every 20 seconds" : "Preview · Records from this browser only"} · Singapore time{requestedDate && " · Fixed date selected"}</small>
        {presenting && <button className="cm-tv-exit" onClick={showControls}>Show controls</button>}
      </footer>
    </main>
  );
}
function OfferingNames({ donors, onEdit }) {
  if (!donors.length) return <span className="cm-no-offering">—</span>;
  return <div className="cm-donor-names">{donors.map((donor) =>
    <button key={donor.id} className="cm-donor-entry" onClick={() => onEdit(donor)} aria-label={`Edit offering for ${donor.name}`}>
      <strong>{donor.name}</strong>
      {donor.dedication && <span className="cm-daily-dedication">{donor.dedication}</span>}
      <span className={`cm-status ${donor.status.toLowerCase()}`}>{donor.status}</span>
    </button>
  )}</div>;
}
export default function Chanmyay() {
  const location = useLocation();
  const isTv = location.pathname === "/chanmyay/tv";
  const requestedDate = new URLSearchParams(location.search).get("date") || "";
  const [view, setView] = useState("overview");
  const [editing, setEditing] = useState(undefined);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [dateFilter, setDateFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [datePages, setDatePages] = useState([]);
  const [today, setToday] = useState(singaporeDate());
  const register = useRegister(isTv, validDate(requestedDate) ? requestedDate : today);
  const { donors, error, save, settings, loading, mode } = register;
  useEffect(() => {
    const oldTitle = document.title;
    document.title = "Chanmyay · Centre management";
    const timer = setInterval(() => setToday(singaporeDate()), 30000);
    return () => {
      document.title = oldTitle;
      clearInterval(timer);
    };
  }, []);
  if (isTv) return <TvDisplay donors={donors} error={error} settings={settings} mode={mode} loading={loading} today={today} />;
  if (mode === "shared" && (!register.ready || !register.isAdmin)) return <AdministratorLogin register={register} />;
  const pending = donors.filter((donor) => donor.status === "Pending");
  const filtered = donors
    .filter(
      (donor) =>
        donor.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()) &&
        (status === "All statuses" || donor.status === status) &&
        (dateFilter === "all" ||
          (dateFilter === "today"
            ? onDate(donor, today)
            : donor.endDate >= today)),
    )
    .sort(
      (a, b) =>
        b.startDate.localeCompare(a.startDate) || a.name.localeCompare(b.name),
    );
  const dailyRows = dailyOfferings(filtered, { today, dateFilter, before: datePages.at(-1), limit: 31 });
  const visibleRows = dailyRows.slice(0, 30);
  function resetPages(update) { setDatePages([]); update(); }
  const module = futureModules.find((item) => item.id === view);
  function download() {
    const blob = new Blob([donorCsv(filtered)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chanmyay-donors-${today}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Exported ${filtered.length} offering records.`);
  }
  return (
    <div className="cm-app">
      <aside className="cm-sidebar">
        <Link
          to="/chanmyay"
          className="cm-brand"
          onClick={() => setView("overview")}
        >
          <span className="cm-brand-mark">✳</span>
          <span>
            Chanmyay<small>CENTRE MANAGEMENT</small>
          </span>
        </Link>
        <div className="cm-nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <button
            className={view === "overview" ? "active" : ""}
            onClick={() => setView("overview")}
          >
            <Icon name="grid" />
            Overview
          </button>
          <button
            className={view === "donors" ? "active" : ""}
            onClick={() => setView("donors")}
          >
            <Icon name="heart" />
            Donor register{pending.length > 0 && <b>{pending.length}</b>}
          </button>
          <Link to="/chanmyay/tv" target="_blank" rel="noreferrer">
            <Icon name="tv" />
            TV display<small>↗</small>
          </Link>
          <div className="cm-nav-label">NEXT MODULES</div>
          {futureModules.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={view === item.id ? "active" : ""}
            >
              <Icon name={item.icon} />
              {item.name}
              <span className="cm-nav-dot" />
            </button>
          ))}
        </nav>
        <div className="cm-sidebar-bottom">
          <span className="cm-status-dot" />
          {mode === "shared" ? "Shared centre workspace" : "First release preview"}
          <p>
            A thoughtful space to care for
            <br />
            our centre and community.
          </p>
          <a href="https://chanmyaysin.org" target="_blank" rel="noreferrer">
            Visit centre website ↗
          </a>
        </div>
      </aside>
      <div className="cm-workspace">
        <header className="cm-topbar">
          <div>
            <span>Chanmyay Singapore</span>
            <span className="cm-top-divider">/</span>
            <strong>
              {module?.name ||
                (view === "donors" ? "Donor register" : "Overview")}
            </strong>
          </div>
          <div className="cm-top-right">
            <span className="cm-preview-badge">{mode === "shared" ? "ADMINISTRATOR" : "WORKFLOW PREVIEW"}</span>
            {mode === "shared" && <button className="cm-button secondary" onClick={async () => { const result = await register.signOut(); if (result) setNotice(result); }}>Sign out</button>}
            <span className="cm-avatar">CM</span>
          </div>
        </header>
        <main className="cm-main">
          <div className="cm-storage-notice">
            <span className="cm-status-dot" />
            <span>
              {mode === "shared" ? "Shared database · Administrator access · TV updates every 20 seconds." : "Preview mode · Saved on this browser only. Shared database connection is pending."}
            </span>
          </div>
          {error && (
            <p role="alert" className="cm-error">
              {error}
            </p>
          )}
          {notice && (
            <div className="cm-notice" role="status">
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
          {module ? (
            <>
              <div className="cm-page-heading">
                <div>
                  <span className="cm-eyebrow">GROWING WITH THE CENTRE</span>
                  <h1>{module.name}</h1>
                  <p>{module.description}.</p>
                </div>
              </div>
              <section className="cm-future-panel">
                <div className="cm-feature-icon">
                  <Icon name={module.icon} width="32" height="32" />
                </div>
                <span className="cm-chip">Planned module</span>
                <h2>One connected centre workspace.</h2>
                <p>
                  {module.id === "finance"
                    ? "Donation payments will connect to offering bookings. The cashbook will record income, expenses and opening cash and bank balances, with receipts and reports."
                    : "This module will join the same staff workspace after the donor register and TV display are ready."}
                </p>
                <button
                  className="cm-button primary"
                  onClick={() => setView("donors")}
                >
                  Open donor register
                  <Icon name="arrow" />
                </button>
              </section>
            </>
          ) : (
            <>
              <div className="cm-page-heading">
                <div>
                  <h1>Donor register</h1>
                </div>
                <button
                  className="cm-button primary"
                  disabled={Boolean(error) || loading}
                  onClick={() => setEditing(null)}
                >
                  <Icon name="plus" />
                  Add offering
                </button>
              </div>
              <DisplaySettings settings={settings} onSave={register.saveSettings} disabled={Boolean(error) || loading} />
              {mode === "shared" && <ImportBrowserRecords onImport={register.importLocal} />}
              {loading && <p role="status">Loading offerings…</p>}
              <section className="cm-register">
                <div className="cm-register-heading">
                  <div>
                    <h2>
                      {view === "overview"
                        ? "Offering register"
                        : "All offerings"}
                      <span>{donors.length}</span>
                    </h2>
                    <p>Newest dates first · Select a donor to edit their offering.</p>
                  </div>
                  <div className="cm-register-actions">
                  <button
                    className="cm-button secondary"
                    onClick={download}
                    disabled={!filtered.length}
                  >
                    <Icon name="download" />
                    Export CSV
                  </button>
                    <Link
                      className="cm-button secondary"
                      to="/chanmyay/tv"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon name="tv" />
                      View on TV
                    </Link>
                  </div>
                </div>
                <div className="cm-filters">
                  <label className="cm-search">
                    <Icon name="search" />
                    <input
                      aria-label="Search donor names"
                      placeholder="Search donor names…"
                      value={search}
                      onChange={(event) => resetPages(() => setSearch(event.target.value))}
                    />
                  </label>
                  <select
                    aria-label="Filter by status"
                    value={status}
                    onChange={(event) => resetPages(() => setStatus(event.target.value))}
                  >
                    <option>All statuses</option>
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Cancelled</option>
                  </select>
                  <select
                    aria-label="Filter by offering date"
                    value={dateFilter}
                    onChange={(event) => resetPages(() => setDateFilter(event.target.value))}
                  >
                    <option value="all">All dates</option>
                    <option value="today">Today</option>
                    <option value="upcoming">Today & upcoming</option>
                  </select>
                </div>
                <div className="cm-table-scroll cm-daily-desktop">
                  <table className="cm-daily-table">
                    <caption className="cm-sr-only">Daily offerings, newest dates first</caption>
                    <thead><tr><th scope="col">Date ↓</th>{CATEGORIES.map((category) => <th scope="col" key={category.id}>{category.label}</th>)}</tr></thead>
                    <tbody>{visibleRows.map((row) => <tr key={row.date}>
                      <th scope="row"><time dateTime={row.date}>{formatDate(row.date, { year: "numeric" })}</time></th>
                      {CATEGORIES.map((category) => <td key={category.id}><OfferingNames donors={row.donors.filter((donor) => donor.categories.includes(category.id))} onEdit={setEditing} /></td>)}
                    </tr>)}</tbody>
                  </table>
                </div>
                <div className="cm-daily-mobile">
                  {visibleRows.map((row) => <article className="cm-day-card" key={row.date}>
                    <h3><time dateTime={row.date}>{formatDate(row.date, { weekday: "short", year: "numeric" })}</time></h3>
                    <dl>{CATEGORIES.map((category) => <div key={category.id}>
                      <dt>{category.label}</dt><dd><OfferingNames donors={row.donors.filter((donor) => donor.categories.includes(category.id))} onEdit={setEditing} /></dd>
                    </div>)}</dl>
                  </article>)}
                </div>
                {(datePages.length > 0 || dailyRows.length > 30) && <div className="cm-date-pagination">
                  <button className="cm-button secondary" disabled={!datePages.length} onClick={() => setDatePages((pages) => pages.slice(0, -1))}>← Newer dates</button>
                  <span>Page {datePages.length + 1}</span>
                  <button className="cm-button secondary" disabled={dailyRows.length <= 30} onClick={() => setDatePages((pages) => [...pages, visibleRows.at(-1).date])}>Older dates →</button>
                </div>}
                {!loading && !error && !visibleRows.length && (
                  <div className="cm-empty">
                    <span className="cm-feature-icon">
                      <Icon name="heart" width="28" height="28" />
                    </span>
                    <h3>
                      {donors.length
                        ? "No matching offerings"
                        : "Every offering starts with a name."}
                    </h3>
                    <p>
                      {donors.length
                        ? "Try another name, status or date filter."
                        : "Add your first donor, choose the offering dates and approve it for the TV."}
                    </p>
                    {!donors.length && (
                      <button
                        className="cm-text-button"
                        disabled={Boolean(error) || loading}
                        onClick={() => setEditing(null)}
                      >
                        Add your first offering <Icon name="arrow" />
                      </button>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
          <footer className="cm-footer">
            <span>CHANMYAY YEIKTHA MEDITATION CENTRE · SINGAPORE</span>
            <span>With mindfulness, in every detail.</span>
          </footer>
        </main>
      </div>
      {editing !== undefined && (
        <DonorForm
          key={editing?.id || "new"}
          donor={editing}
          onClose={() => setEditing(undefined)}
          onSave={async (value) => {
            const result = await save(value);
            if (!result)
              setNotice(
                "Offering saved. Approved records appear on the TV on their scheduled dates.",
              );
            return result;
          }}
        />
      )}
    </div>
  );
}
