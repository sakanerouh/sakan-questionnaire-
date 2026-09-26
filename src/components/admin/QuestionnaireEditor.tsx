"use client";

import { useEffect, useMemo, useState } from "react";
import type { Screen } from "@/lib/questionnaire";
import type {
  QuestionnairePayload,
  QuestionnaireScreenCopy,
  QuestionnaireSnapshot,
} from "@/lib/questionnaireSnapshot";
import type { QuestionnaireVersionSummary } from "@/lib/admin/questionnaire";

type EditorLocale = "en" | "fr" | "ar";

const editorLocales: EditorLocale[] = ["en", "fr", "ar"];
const editorLocaleLabels: Record<EditorLocale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

const clone = <T,>(value: T): T => structuredClone(value);

const move = <T,>(items: T[], index: number, direction: -1 | 1) => {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export function QuestionnaireEditor({
  initialDraft,
  initialVersions,
}: {
  initialDraft: QuestionnaireSnapshot;
  initialVersions: QuestionnaireVersionSummary[];
}) {
  const [draftId, setDraftId] = useState(initialDraft.id);
  const [payload, setPayload] = useState<QuestionnairePayload>(() => clone(initialDraft));
  const [versions, setVersions] = useState(initialVersions);
  const [selectedId, setSelectedId] = useState(initialDraft.screens[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [changeSummary, setChangeSummary] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<EditorLocale>("en");
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const selectedIndex = payload.screens.findIndex((screen) => screen.id === selectedId);
  const selected = payload.screens[selectedIndex] ?? payload.screens[0];
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return payload.screens;
    return payload.screens.filter((screen) => {
      const en = payload.translations.en.screens[screen.id];
      const fr = payload.translations.fr.screens[screen.id];
      const ar = payload.translations.ar.screens[screen.id];
      return [screen.id, screen.sectionId, en?.prompt, en?.title, fr?.prompt, fr?.title, ar?.prompt, ar?.title]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [payload, search]);
  const filteredGroups = useMemo(() => {
    const sections = new Map<string, Map<Screen["type"], Screen[]>>();
    for (const screen of filtered) {
      const types = sections.get(screen.sectionId) ?? new Map<Screen["type"], Screen[]>();
      const screens = types.get(screen.type) ?? [];
      screens.push(screen);
      types.set(screen.type, screens);
      sections.set(screen.sectionId, types);
    }
    return [...sections.entries()];
  }, [filtered]);

  const updatePayload = (updater: (current: QuestionnairePayload) => QuestionnairePayload) => {
    setPayload((current) => updater(current));
    setDirty(true);
    setMessage(null);
  };

  const updateCopy = (
    locale: EditorLocale,
    screenId: string,
    patch: Partial<QuestionnaireScreenCopy>,
  ) => {
    updatePayload((current) => {
      const next = clone(current);
      next.translations[locale].screens[screenId] = {
        ...next.translations[locale].screens[screenId],
        ...patch,
      };
      return next;
    });
  };

  const updateOptionLabel = (
    locale: EditorLocale,
    screenId: string,
    optionId: string,
    value: string,
  ) => {
    const copy = payload.translations[locale].screens[screenId] ?? {};
    updateCopy(locale, screenId, { options: { ...copy.options, [optionId]: value } });
  };

  const updateSectionLabel = (locale: EditorLocale, sectionId: string, value: string) => {
    updatePayload((current) => {
      const next = clone(current);
      next.translations[locale].sections[sectionId] = value;
      return next;
    });
  };

  const refresh = async () => {
    const response = await fetch("/api/admin/questionnaire", { cache: "no-store" });
    const data = (await response.json()) as {
      ok: boolean;
      draft?: QuestionnaireSnapshot;
      versions?: QuestionnaireVersionSummary[];
      error?: string;
    };
    if (!response.ok || !data.draft || !data.versions) throw new Error(data.error ?? "Refresh failed.");
    setDraftId(data.draft.id);
    setPayload(clone(data.draft));
    setVersions(data.versions);
    setDirty(false);
  };

  const save = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/questionnaire", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      });
      const data = (await response.json()) as { ok: boolean; draft?: QuestionnaireSnapshot; error?: string };
      if (!response.ok || !data.draft) throw new Error(data.error ?? "Save failed.");
      setDraftId(data.draft.id);
      setPayload(clone(data.draft));
      setDirty(false);
      setMessage("Draft saved. Public participants are still using the published version.");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!window.confirm("Publish this validated draft for all new participant sessions?")) return;
    setBusy(true);
    setMessage(null);
    try {
      if (dirty) {
        const response = await fetch("/api/admin/questionnaire", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload }),
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Save failed.");
      }
      const response = await fetch("/api/admin/questionnaire/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeSummary }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Publish failed.");
      await refresh();
      setChangeSummary("");
      setMessage("Published successfully. Existing participants remain pinned to their previous version.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setBusy(false);
    }
  };

  const rollback = async (version: QuestionnaireVersionSummary) => {
    if (!window.confirm(`Restore version ${version.versionNumber} and publish it as a new version?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/questionnaire/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: version.id }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Rollback failed.");
      await refresh();
      setMessage(`Version ${version.versionNumber} was restored as a new published version.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rollback failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!selected) return null;
  const previewScreen = payload.screens[previewIndex] ?? payload.screens[0];
  const previewCopy = payload.translations[previewLocale].screens[previewScreen.id] ?? {};

  return (
    <>
      <div className="mt-6 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8] p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
          <label className="text-xs font-bold uppercase tracking-wide text-[#82542A]">Search screens</label>
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 w-full rounded-lg border border-[#C6C7BD] bg-white px-3 py-2 text-sm" placeholder="ID, section, or wording" />
          <p className="mt-3 text-xs text-[#76786F]">{payload.screens.length} screens · {payload.screens.filter((item) => item.type === "question").length} questions</p>
          <div className="mt-4 space-y-2">
            {filteredGroups.map(([sectionId, types]) => <section key={sectionId} className="pt-2"><h2 className="sticky top-0 z-10 bg-[#FBF9F8] py-2 text-xs font-bold uppercase tracking-wide text-[#28301C]">{payload.translations.en.sections[sectionId] ?? sectionId}</h2>{[...types.entries()].map(([type, screens]) => <div key={type} className="mb-3 space-y-2"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#82542A]">{type}</p>{screens.map((screen) => {
              const label = payload.translations.en.screens[screen.id]?.prompt ?? payload.translations.en.screens[screen.id]?.title ?? screen.id;
              return <button key={screen.id} type="button" onClick={() => setSelectedId(screen.id)} className={`w-full rounded-xl border p-3 text-left ${selected.id === screen.id ? "border-[#3E4631] bg-[#E4E2E2]" : "border-[#E4E2E2] bg-white hover:border-[#ABB499]"}`}><span className="block text-[10px] font-bold uppercase tracking-wide text-[#82542A]">{screen.id}</span><span className="mt-1 block line-clamp-2 text-sm">{label}</span></button>;
            })}</div>)}</section>)}
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8] p-4">
            <div><p className="text-xs font-bold uppercase tracking-wide text-[#82542A]">Protected identity</p><p className="mt-1 font-mono text-sm">{selected.id} · {selected.type} · {selected.sectionId}</p></div>
            <div className="flex gap-2"><button type="button" disabled={selectedIndex <= 0} onClick={() => updatePayload((current) => ({ ...current, screens: move(current.screens, selectedIndex, -1) }))} className="rounded-lg border border-[#C6C7BD] px-3 py-2 text-sm disabled:opacity-40">Move up</button><button type="button" disabled={selectedIndex >= payload.screens.length - 1} onClick={() => updatePayload((current) => ({ ...current, screens: move(current.screens, selectedIndex, 1) }))} className="rounded-lg border border-[#C6C7BD] px-3 py-2 text-sm disabled:opacity-40">Move down</button></div>
          </div>

          {selected.type === "question" && <label className="flex items-center gap-3 rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8] p-4 text-sm font-semibold"><input type="checkbox" checked={Boolean(selected.optional)} onChange={(event) => updatePayload((current) => ({ ...current, screens: current.screens.map((screen) => screen.id === selected.id && screen.type === "question" ? { ...screen, optional: event.target.checked || undefined } : screen) }))} />This question is optional</label>}

          <div className="grid gap-5 xl:grid-cols-3">
            {editorLocales.map((locale) => {
              const copy = payload.translations[locale].screens[selected.id] ?? {};
              const direction = locale === "ar" ? "rtl" : "ltr";
              const field = (key: "eyebrow" | "title" | "body" | "prompt" | "helper" | "placeholder", label: string, rows = 2) => <label className="block text-xs font-semibold text-[#464840]">{label}<textarea dir={direction} rows={rows} value={copy[key] ?? ""} onChange={(event) => updateCopy(locale, selected.id, { [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-[#C6C7BD] bg-white p-3 text-sm font-normal leading-6 text-[#28301C]" /></label>;
              return <article key={locale} className="rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8] p-5"><h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#82542A]">{editorLocaleLabels[locale]}</h2><div className="mt-4 space-y-4"><label className="block text-xs font-semibold text-[#464840]">Section label<input dir={direction} value={payload.translations[locale].sections[selected.sectionId] ?? ""} onChange={(event) => updateSectionLabel(locale, selected.sectionId, event.target.value)} className="mt-1 w-full rounded-lg border border-[#C6C7BD] bg-white p-3 text-sm font-normal text-[#28301C]" /></label>{selected.type === "question" ? <>{field("prompt", "Question prompt", 3)}{field("helper", "Helper text")}{selected.questionType === "text" && field("placeholder", "Placeholder")}</> : <>{field("eyebrow", "Eyebrow")}{field("title", "Title", 2)}{field("body", "Body", 5)}</>}</div></article>;
            })}
          </div>

          {selected.type === "question" && selected.options?.length ? <section className="rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8] p-5"><h2 className="font-serif text-2xl">Existing choices</h2><p className="mt-1 text-xs text-[#76786F]">Labels and order are editable. IDs and scoring weights are protected.</p><div className="mt-4 space-y-3">{selected.options.map((option, optionIndex) => <div key={option.id} className="grid gap-3 rounded-xl border border-[#E4E2E2] bg-white p-4 lg:grid-cols-[180px_repeat(3,minmax(0,1fr))_auto]"><div><p className="font-mono text-xs">{option.id}</p><p className="mt-1 text-[10px] text-[#76786F]">{JSON.stringify(option.weights ?? {})}</p></div>{editorLocales.map((locale) => <label key={locale} className="text-[10px] font-bold uppercase tracking-wide text-[#82542A]">{locale}<input dir={locale === "ar" ? "rtl" : "ltr"} value={payload.translations[locale].screens[selected.id]?.options?.[option.id] ?? ""} onChange={(event) => updateOptionLabel(locale, selected.id, option.id, event.target.value)} className="mt-1 w-full rounded-lg border border-[#C6C7BD] px-3 py-2 text-sm font-normal normal-case text-[#28301C]" /></label>)}<div className="flex gap-1"><button type="button" disabled={optionIndex === 0} onClick={() => updatePayload((current) => ({ ...current, screens: current.screens.map((screen): Screen => screen.id === selected.id && screen.type === "question" ? { ...screen, options: move(screen.options ?? [], optionIndex, -1) } : screen) }))} className="rounded border px-2 disabled:opacity-30" aria-label={`Move ${option.id} up`}>↑</button><button type="button" disabled={optionIndex === selected.options!.length - 1} onClick={() => updatePayload((current) => ({ ...current, screens: current.screens.map((screen): Screen => screen.id === selected.id && screen.type === "question" ? { ...screen, options: move(screen.options ?? [], optionIndex, 1) } : screen) }))} className="rounded border px-2 disabled:opacity-30" aria-label={`Move ${option.id} down`}>↓</button></div></div>)}</div></section> : null}

          <section className="rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8] p-5"><div className="flex flex-wrap gap-3"><button type="button" disabled={busy || !dirty} onClick={() => void save()} className="rounded-xl bg-[#3E4631] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Save draft</button><button type="button" onClick={() => { setPreviewIndex(Math.max(selectedIndex, 0)); setPreviewOpen(true); }} className="rounded-xl border border-[#3E4631] px-5 py-3 text-sm font-semibold">Preview flow</button></div><div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]"><label className="text-xs font-semibold">Publication summary<input value={changeSummary} onChange={(event) => setChangeSummary(event.target.value)} placeholder="What changed in this version?" className="mt-1 w-full rounded-lg border border-[#C6C7BD] bg-white px-3 py-2 text-sm font-normal" /></label><button type="button" disabled={busy} onClick={() => void publish()} className="self-end rounded-xl bg-[#82542A] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">Save and publish</button></div>{message && <p role="status" className="mt-4 rounded-lg bg-[#EAE8E7] p-3 text-sm text-[#464840]">{message}</p>}<p className="mt-3 text-xs text-[#76786F]">Draft ID: {draftId}</p></section>

          <section className="rounded-2xl border border-[#C6C7BD] bg-[#FBF9F8] p-5"><h2 className="font-serif text-2xl">Version history</h2><div className="mt-4 divide-y divide-[#E4E2E2]">{versions.map((version) => <div key={version.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-semibold">Version {version.versionNumber} <span className="ml-2 rounded-full bg-[#E4E2E2] px-2 py-1 text-[10px] uppercase">{version.status}</span></p><p className="mt-1 text-sm text-[#464840]">{version.changeSummary ?? "No summary"}</p><p className="mt-1 text-xs text-[#76786F]">{version.author} · {version.publishedAt ? new Date(version.publishedAt).toLocaleString() : "Not published"}</p></div><button type="button" disabled={busy || version.status === "published"} onClick={() => void rollback(version)} className="rounded-lg border border-[#C6C7BD] px-3 py-2 text-xs font-semibold disabled:opacity-40">Restore as new version</button></div>)}</div></section>
        </section>
      </div>

      {previewOpen && <div className="fixed inset-0 z-[100] overflow-auto bg-[#28301C]/70 p-4"><div className="mx-auto my-5 max-w-4xl rounded-3xl bg-[#FBF9F8] p-6 shadow-2xl"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#C6C7BD] pb-4"><div><p className="text-xs font-bold uppercase tracking-wide text-[#82542A]">Draft preview · {previewIndex + 1}/{payload.screens.length}</p><p className="font-mono text-xs">{previewScreen.id}</p></div><div className="flex gap-2">{editorLocales.map((locale) => <button key={locale} type="button" onClick={() => setPreviewLocale(locale)} className={`rounded-lg px-3 py-2 text-xs ${previewLocale === locale ? "bg-[#28301C] text-white" : "border"}`}>{locale.toUpperCase()}</button>)}<button type="button" onClick={() => setPreviewOpen(false)} className="rounded-lg border px-3 py-2 text-xs">Close</button></div></div><div dir={previewLocale === "ar" ? "rtl" : "ltr"} className="mx-auto min-h-[420px] max-w-2xl py-12"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#82542A]">{payload.translations[previewLocale].sections[previewScreen.sectionId]}</p>{previewScreen.type === "question" ? <><h2 className="mt-4 font-serif text-4xl leading-tight">{previewCopy.prompt}</h2>{previewCopy.helper && <p className="mt-4 leading-7 text-[#464840]">{previewCopy.helper}</p>}{previewScreen.questionType === "text" ? <div className="mt-8 min-h-40 rounded-xl border border-[#C6C7BD] bg-white p-4 text-[#76786F]">{previewCopy.placeholder}</div> : <div className="mt-8 grid gap-3">{previewScreen.options?.map((option) => <div key={option.id} className="rounded-xl border border-[#C6C7BD] bg-white p-4">{previewCopy.options?.[option.id]}</div>)}</div>}</> : <div className="text-center"><h2 className="mt-4 font-serif text-5xl leading-tight">{previewCopy.title}</h2><p className="mt-6 text-lg leading-8 text-[#464840]">{previewCopy.body}</p></div>}</div><div className="flex justify-between border-t border-[#C6C7BD] pt-4"><button type="button" disabled={previewIndex === 0} onClick={() => setPreviewIndex((index) => Math.max(index - 1, 0))} className="rounded-lg border px-4 py-2 disabled:opacity-30">Back</button><button type="button" disabled={previewIndex === payload.screens.length - 1} onClick={() => setPreviewIndex((index) => Math.min(index + 1, payload.screens.length - 1))} className="rounded-lg bg-[#28301C] px-4 py-2 text-white disabled:opacity-30">Next</button></div></div></div>}
    </>
  );
}
