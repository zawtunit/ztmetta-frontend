import { useCallback, useEffect, useRef, useState } from "react";
import { readDonors, STORAGE_KEY, validateDonor } from "./donors.js";
import { cloud, SETTINGS_KEY, readSettings, fromRow, toRow, loadShared } from "./shared.js";

export function useRegister(isTv, displayDate) {
  const [state, setState] = useState({ donors: [], settings: { eventName: "", version: 0 }, loading: true, error: "" });
  const [auth, setAuth] = useState({ ready: !cloud, user: null, isAdmin: false, error: "" });
  const sequence = useRef(0);
  const reload = useCallback(async () => {
    const request = ++sequence.current;
    try {
      const result = cloud ? await loadShared(isTv, displayDate) : { donors: readDonors(), settings: readSettings() };
      if (request === sequence.current) setState({ ...result, loading: false, error: "" });
    } catch (error) {
      if (request === sequence.current) setState((previous) => ({ ...previous, loading: false, error: error.message }));
    }
  }, [isTv, displayDate]);
  useEffect(() => {
    if (!cloud) return;
    let active = true;
    let authVersion = 0;
    async function update(session) {
      const version = ++authVersion;
      setAuth({ ready: false, user: session?.user || null, isAdmin: false, error: "" });
      setState({ donors: [], settings: { eventName: "", version: 0 }, loading: true, error: "" });
      let isAdmin = false, message = "";
      if (session) {
        try {
          const { data, error } = await cloud.rpc("cm_is_admin");
          if (error) throw error;
          isAdmin = Boolean(data);
          if (!isAdmin) message = "This account is not the centre administrator.";
        } catch (error) { message = error.message; }
      }
      if (active && version === authVersion) setAuth({ ready: true, user: session?.user || null, isAdmin, error: message });
    }
    cloud.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuth({ ready: true, user: null, isAdmin: false, error: error.message });
      else update(data.session);
    });
    const { data } = cloud.auth.onAuthStateChange((_event, session) => {
      // Run database calls after the auth callback releases the auth client lock.
      setTimeout(() => { if (active) update(session); }, 0);
    });
    return () => { active = false; authVersion++; data.subscription.unsubscribe(); sequence.current++; };
  }, []);
  useEffect(() => {
    if (cloud && !isTv && (!auth.ready || !auth.isAdmin)) return;
    reload();
    const timer = setInterval(reload, 20000);
    const storage = (event) => {
      if (!cloud && (event.key === STORAGE_KEY || event.key === SETTINGS_KEY || event.key === null)) reload();
    };
    window.addEventListener("storage", storage);
    const focus = () => { if (document.visibilityState === "visible") reload(); };
    document.addEventListener("visibilitychange", focus);
    return () => { clearInterval(timer); sequence.current++; window.removeEventListener("storage", storage); document.removeEventListener("visibilitychange", focus); };
  }, [reload, isTv, auth.ready, auth.isAdmin]);

  async function save(donor) {
    try {
      const invalid = validateDonor(donor);
      if (invalid) return invalid;
      if (cloud) {
        if (!auth.isAdmin) return "Administrator login is required.";
        const { error } = await cloud.rpc("cm_save_offering", { p_donor: toRow(donor), p_expected_version: donor.version ?? null });
        if (error) throw error;
      } else {
        const current = readDonors(), previous = current.find((item) => item.id === donor.id);
        if (donor.updatedAt && previous?.updatedAt !== donor.updatedAt)
          return "This record changed in another tab. Close this form and reopen the record.";
        const updated = { ...donor, updatedAt: new Date().toISOString(), createdAt: previous?.createdAt || new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(previous ? current.map((item) => item.id === donor.id ? updated : item) : [...current, updated]));
      }
      await reload();
      return "";
    } catch (error) { return `Could not save. ${error.message}`; }
  }
  async function saveSettings(eventName, expectedVersion = state.settings.version) {
    try {
      const title = eventName.trim();
      if (title.length > 160) return "Use up to 160 characters for the event name.";
      if (cloud) {
        const { error } = await cloud.rpc("cm_save_display_settings", { p_event_name: title, p_expected_version: expectedVersion });
        if (error) throw error;
      } else {
        const current = readSettings();
        if (current.version !== expectedVersion) { await reload(); return "TV settings changed in another tab. Review the latest heading before saving again."; }
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ eventName: title, version: current.version + 1 }));
      }
      await reload();
      return "";
    } catch (error) { return `Could not save the TV heading. ${error.message}`; }
  }
  async function signIn(email, password) {
    const { error } = await cloud.auth.signInWithPassword({ email, password });
    return error?.message || "";
  }
  async function signOut() {
    const { error } = await cloud.auth.signOut({ scope: "local" });
    return error?.message || "";
  }
  async function importLocal(records) {
    try {
      if (!cloud || !auth.isAdmin) return "Administrator login is required.";
      if (records.some((donor) => validateDonor(donor))) return "Some browser records are invalid. Export them for review first.";
      const { error } = await cloud.rpc("cm_import_offerings", { p_donors: records.map(toRow) });
      if (error) throw error;
      await reload();
      return "";
    } catch (error) { return `Could not import browser records. ${error.message}`; }
  }
  return { ...state, ...auth, authError: auth.error, error: state.error, mode: cloud ? "shared" : "local", save, saveSettings, signIn, signOut, importLocal };
}
