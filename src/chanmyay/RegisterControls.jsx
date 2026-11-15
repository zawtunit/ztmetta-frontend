import { useState } from "react";
import { formatDate, readDonors } from "./donors.js";

export function AdministratorLogin({ register }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <main className="cm-app cm-login-page"><section className="cm-login-card">
    <span className="cm-eyebrow">CHANMYAY SINGAPORE</span>
    <h1>Administrator login</h1>
    <p>Manage offerings and the event name shown on the TV.</p>
    {!register.ready ? <p role="status">Checking your login…</p> : register.user ? <>
      <p role="alert" className="cm-error">{register.authError || "This account is not the centre administrator."}</p>
      <button className="cm-button secondary" onClick={async () => { setError(await register.signOut()); }}>Sign out</button>
    </> : <form onSubmit={async (event) => {
      event.preventDefault(); setBusy(true); setError("");
      try { setError(await register.signIn(email.trim(), password)); }
      catch (error) { setError(error.message); }
      finally { setBusy(false); }
    }}>
      <label>Email<input autoComplete="username" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Password<input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <button className="cm-button primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>}
    {error && <p role="alert" className="cm-error">{error}</p>}
    <a className="cm-text-button" href="/chanmyay/tv">View TV display →</a>
  </section></main>;
}

export function DisplaySettings({ settings, onSave, disabled }) {
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return <section className="cm-display-settings" aria-labelledby="tv-heading-label">
    <form onSubmit={async (event) => {
      event.preventDefault(); setBusy(true); setMessage(""); setError("");
      try {
        const result = await onSave(draft?.eventName ?? settings.eventName, draft?.version ?? settings.version);
        if (result) setError(result);
        else { setDraft(null); setMessage("TV heading saved."); }
      } catch (error) { setError(error.message); }
      finally { setBusy(false); }
    }}>
      <label htmlFor="cm-event-name" id="tv-heading-label">Event name / TV heading</label>
      <div className="cm-display-settings-row"><input id="cm-event-name" maxLength={160}
        value={draft?.eventName ?? settings.eventName} onChange={(event) => { setDraft((previous) => ({ eventName: event.target.value, version: previous?.version ?? settings.version })); setMessage(""); }}
        placeholder="Enter event name in Myanmar or English" />
        <button className="cm-button secondary" disabled={busy || disabled}>{busy ? "Saving…" : "Save heading"}</button></div>
      <p>Replaces “အလှူရှင်များ” on the TV. Leave blank to use the usual donor heading.</p>
      {message && <p className="cm-settings-success" role="status">{message}</p>}
      {error && <p className="cm-error" role="alert">{error}</p>}
    </form>
  </section>;
}

export function ImportBrowserRecords({ onImport }) {
  const [local] = useState(() => { try { return { records: readDonors(), error: "" }; } catch (error) { return { records: [], error: error.message }; } });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  if (local.error) return <p role="alert" className="cm-error">Browser records could not be read: {local.error}</p>;
  if (!local.records.length || done) return null;
  return <section className="cm-import-records">
    <p>{local.records.length} offering records are saved in this browser. Import them to share with the TV.</p>
    <button className="cm-button secondary" onClick={() => setOpen(true)}>Review browser records</button>
    {open && <div className="cm-overlay"><dialog open aria-modal="true" aria-labelledby="cm-import-title" className="cm-dialog">
      <h2 id="cm-import-title">Import {local.records.length} offerings?</h2>
      <p>These browser records, including private phone details, will be saved to your centre’s shared database. Existing matching IDs will be skipped. The browser copy will be kept.</p>
      <ul>{local.records.slice(0, 5).map((donor) => <li key={donor.id}>{donor.name} · {formatDate(donor.startDate, { year: "numeric" })}</li>)}</ul>
      {local.records.length > 5 && <p>Plus {local.records.length - 5} more records.</p>}
      {error && <p className="cm-error" role="alert">{error}</p>}
      <div className="cm-dialog-actions"><button className="cm-button secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</button>
        <button className="cm-button primary" disabled={busy} onClick={async () => {
          setBusy(true); setError("");
          try { const result = await onImport(local.records); if (result) setError(result); else { setDone(true); setOpen(false); } }
          catch (error) { setError(error.message); }
          finally { setBusy(false); }
        }}>{busy ? "Importing…" : "Import to shared database"}</button></div>
    </dialog></div>}
  </section>;
}
