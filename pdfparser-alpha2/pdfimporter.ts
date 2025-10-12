// components/PdfImporter.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/webpack";
import type { PDFDocumentProxy } from "pdfjs-dist";

type AbilityScores = {
  strength: number | null;
  dexterity: number | null;
  constitution: number | null;
  intelligence: number | null;
  wisdom: number | null;
  charisma: number | null;
};

// Minimal representation of a Character mapping we let the user produce:
type CharacterPartial = Record<string, any>;

type DetectedSection = {
  id: string;
  title: string;
  pageIndices: number[]; // pages where this header was found
  snippet: string;
  fullText: string;
};

const SCHEMA_FIELD_OPTIONS = [
  "name",
  "race",
  "background",
  "class",
  "classes[0].name",
  "classes[0].level",
  "classes[1].name",
  "classes[1].level",
  "subrace",
  "alignment",
  "abilityScores.strength",
  "abilityScores.dexterity",
  "abilityScores.constitution",
  "abilityScores.intelligence",
  "abilityScores.wisdom",
  "abilityScores.charisma",
  "proficiencyBonus",
  "armorClass",
  "maxHitPoints",
  "currentHitPoints",
  "speed",
  "passivePerception",
  "skills",
  "traits",
  "racialTraits",
  "languages",
  "spellsKnown",
  "cantripsKnown",
  "features",
  "equipment", // maps to items array or inventory later
];

export default function PdfImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>(""); // full extracted text
  const [perPageText, setPerPageText] = useState<string[]>([]);
  const [detectedSections, setDetectedSections] = useState<DetectedSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [parseLog, setParseLog] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle file selection
  async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setFile(f);
    setUploadResult(null);
    // create object url for preview
    const url = URL.createObjectURL(f);
    setPdfBlobUrl(url);
    // extract text
    setParseLog((l) => [...l, `Selected file ${f.name} (${f.size} bytes)`]);
    try {
      const ab = await f.arrayBuffer();
      const { text, perPage } = await extractTextFromPdf(ab);
      setExtractedText(text);
      setPerPageText(perPage);
      setParseLog((l) => [...l, `Extracted text from ${perPage.length} page(s)`]);
      const sections = detectSectionsInText(text, perPage);
      setDetectedSections(sections);
      if (sections.length > 0) {
        setSelectedSectionId(sections[0].id);
        setSelectedText(sections[0].fullText);
      } else {
        // if no sections, set whole text as single selectable block
        const fallback: DetectedSection = {
          id: "entire",
          title: "Entire document",
          pageIndices: perPage.map((_, i) => i),
          snippet: text.slice(0, 300),
          fullText: text,
        };
        setDetectedSections([fallback]);
        setSelectedSectionId(fallback.id);
        setSelectedText(fallback.fullText);
      }
    } catch (err: any) {
      console.error(err);
      setParseLog((l) => [...l, `Error extracting text: ${String(err?.message ?? err)}`]);
    }
  }

  // When the user selects a detected section from the UI
  useEffect(() => {
    if (!selectedSectionId) return;
    const sec = detectedSections.find((s) => s.id === selectedSectionId);
    if (sec) setSelectedText(sec.fullText);
  }, [selectedSectionId, detectedSections]);

  // Upload to server (server route proxies to UploadThing using UPLOADTHING_TOKEN)
  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      setUploadResult(json);
      setParseLog((l) => [...l, `Uploaded file - server returned: ${JSON.stringify(json)}`]);
    } catch (err: any) {
      console.error(err);
      setParseLog((l) => [...l, `Upload error: ${String(err?.message ?? err)}`]);
    } finally {
      setUploading(false);
    }
  }

  // Map selected section text to a schema field
  function handleMapToField(field: string) {
    if (!selectedText) return;
    setMappings((m) => ({ ...m, [field]: selectedText }));
  }

  // Remove mapping
  function removeMapping(field: string) {
    setMappings((m) => {
      const copy = { ...m };
      delete copy[field];
      return copy;
    });
  }

  // Download mapping as JSON
  function downloadMappingJson() {
    const payload: CharacterPartial = {};
    for (const [k, v] of Object.entries(mappings)) {
      // naive: put raw string under the key; if key is nested we just store as dotted key
      // Real import would parse dotted keys into nested objects.
      payload[k] = v;
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "character-mapping.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Simple preview JSON that tries to place dotted keys into nested object
  const previewObject = useMemo(() => {
    const out: any = {};
    for (const [k, v] of Object.entries(mappings)) {
      setDeepValue(out, k, typeof v === "string" ? v.trim() : v);
    }
    return out;
  }, [mappings]);

  return (
    <div style={{ padding: 12, fontFamily: "Inter, Arial, sans-serif" }}>
      <h2>PDF Character Importer</h2>
      <p style={{ marginTop: 0 }}>
        Pick a D&D character sheet PDF (e.g., your darrow.pdf). The uploader sends the file to a server
        route that uses your UPLOADTHING_TOKEN stored on the server.
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 320, flex: "0 0 420px" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handlePickFile}
            style={{ display: "block", marginBottom: 8 }}
          />
          <button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading…" : "Upload to server (UploadThing proxy)"}
          </button>
          <div style={{ marginTop: 12 }}>
            <strong>Upload result</strong>
            <pre style={{ maxHeight: 160, overflow: "auto", background: "#f7f7f7", padding: 8 }}>
              {JSON.stringify(uploadResult ?? { ready: !!file }, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Detected sections</strong>
            <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid #ddd", padding: 8 }}>
              {detectedSections.length === 0 && <div style={{ color: "#666" }}>No sections detected yet</div>}
              {detectedSections.map((s) => (
                <div key={s.id} style={{ marginBottom: 8 }}>
                  <label style={{ display: "block", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="detected"
                      checked={selectedSectionId === s.id}
                      onChange={() => setSelectedSectionId(s.id)}
                      style={{ marginRight: 8 }}
                    />
                    <strong>{s.title}</strong> <em style={{ color: "#666" }}>pages: {s.pageIndices.join(", ")}</em>
                  </label>
                  <div style={{ fontSize: 13, color: "#333", marginLeft: 24 }}>{s.snippet}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Map selected text → Schema field</strong>
            <div style={{ marginTop: 8 }}>
              <select id="schema-target" style={{ width: "100%" }} defaultValue="">
                <option value="">Choose a Character field</option>
                {SCHEMA_FIELD_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => {
                    const sel = (document.getElementById("schema-target") as HTMLSelectElement).value;
                    if (!sel) return alert("Pick a target field first");
                    handleMapToField(sel);
                  }}
                >
                  Map selected text to field
                </button>
                <button
                  onClick={() => {
                    const sel = (document.getElementById("schema-target") as HTMLSelectElement).value;
                    if (!sel) return alert("Pick a target field first");
                    const current = mappings[sel] ?? "";
                    const newVal = prompt("Edit mapped value", current) ?? current;
                    if (newVal !== current) setMappings((m) => ({ ...m, [sel]: newVal }));
                  }}
                >
                  Edit mapping
                </button>
                <button onClick={downloadMappingJson} disabled={Object.keys(mappings).length === 0}>
                  Download mapping JSON
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <strong>Current mappings</strong>
              <div style={{ background: "#f7f7f7", padding: 8, maxHeight: 180, overflow: "auto" }}>
                {Object.keys(mappings).length === 0 && <div style={{ color: "#666" }}>No mappings yet</div>}
                {Object.entries(mappings).map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 8, borderBottom: "1px dashed #ddd", paddingBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <strong>{k}</strong>
                      <div>
                        <button onClick={() => removeMapping(k)} style={{ marginLeft: 8 }}>
                          Remove
                        </button>
                      </div>
                    </div>
                    <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <strong>PDF Preview</strong>
              <div style={{ border: "1px solid #ddd", height: 560, marginTop: 8 }}>
                {pdfBlobUrl ? (
                  <iframe
                    title="pdf-preview"
                    src={pdfBlobUrl}
                    style={{ width: "100%", height: "100%", border: "none" }}
                  />
                ) : (
                  <div style={{ padding: 16, color: "#666" }}>No PDF selected</div>
                )}
              </div>
            </div>

            <div style={{ width: 520 }}>
              <strong>Selected section text</strong>
              <textarea
                value={selectedText}
                onChange={(e) => setSelectedText(e.target.value)}
                style={{ width: "100%", height: 480, marginTop: 8, fontFamily: "monospace" }}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Preview of translated Character (best-effort)</strong>
            <pre style={{ background: "#111", color: "#fff", padding: 12, maxHeight: 220, overflow: "auto" }}>
              {JSON.stringify(previewObject, null, 2)}
            </pre>
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>Parse log</strong>
            <div style={{ background: "#fafafa", padding: 8, maxHeight: 160, overflow: "auto" }}>
              {parseLog.map((l, i) => (
                <div key={i} style={{ fontSize: 13 }}>
                  • {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <hr style={{ marginTop: 18 }} />

      <div>
        <h4>Next steps (recommended)</h4>
        <ol>
          <li>
            Adjust mappings and download JSON or call a protected server endpoint to convert mapping into a real
            Character object and upsert it into Convex.
          </li>
          <li>
            If you want more accurate extraction for columns/tables, I can extend the parser to use pdf.js text item
            coordinates and reconstruct column rows (very useful for equipment tables).
          </li>
          <li>Want me to wire up a server-side Convex import endpoint? I can add that with proper auth checks.</li>
        </ol>
      </div>
    </div>
  );
}

/* ---------- Utilities ---------- */

/**
 * Extract text from PDF using pdf.js (per-page and concatenated text).
 */
async function extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<{ text: string; perPage: string[] }> {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf: PDFDocumentProxy = await loadingTask.promise;
  const numPages = pdf.numPages;
  const pageTexts: string[] = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((it: any) => {
        // item.str is usual; sometimes item has alternative
        return typeof it === "string" ? it : it.str ?? "";
      })
      .join(" ");
    pageTexts.push(strings);
  }
  const text = pageTexts.join("\n---PAGE---\n");
  return { text, perPage: pageTexts };
}

/**
 * Detect logical sections in the extracted text. Returns list of DetectedSection.
 * Heuristics tuned to the darrow.pdf you pasted: headers like "=== ACTIONS ===",
 * "FEATURES & TRAITS", "EQUIPMENT", "CANTRIPS", "1st LEVEL", "SPELLCASTING", "ADDITIONAL EQUIPMENT"
 */
function detectSectionsInText(fullText: string, perPage: string[]): DetectedSection[] {
  const sections: DetectedSection[] = [];

  // Search for header patterns across fullText
  const headerPatterns: { regex: RegExp; canonical: string }[] = [
    { regex: /===\s*ACTIONS\s*===/gi, canonical: "ACTIONS" },
    { regex: /FEATURES\s*&\s*TRAITS/gi, canonical: "FEATURES & TRAITS" },
    { regex: /ADDITIONAL\s+FEATURES\s*&\s*TRAITS/gi, canonical: "ADDITIONAL FEATURES & TRAITS" },
    { regex: /EQUIPMENT/gi, canonical: "EQUIPMENT" },
    { regex: /ADDITIONAL\s+EQUIPMENT/gi, canonical: "ADDITIONAL EQUIPMENT" },
    { regex: /===\s*SPELLCASTING\s*===/gi, canonical: "SPELLCASTING" },
    { regex: /CANTRIPS/gi, canonical: "CANTRIPS" },
    { regex: /\b[0-9]{1,2}(?:st|nd|rd|th)\s+LEVEL\b/gi, canonical: "SPELL LEVEL" },
    { regex: /LANGUAGES/gi, canonical: "LANGUAGES" },
    { regex: /SENSES|DARKVISION|BLINDSIGHT/gi, canonical: "SENSES" },
  ];

  const lowered = fullText;

  for (const pat of headerPatterns) {
    let match: RegExpExecArray | null;
    const idsSeen = new Set<number>();
    while ((match = pat.regex.exec(lowered)) !== null) {
      const idx = match.index;
      if (idsSeen.has(idx)) continue;
      idsSeen.add(idx);

      // capture from the match index up to next header or next 1500 chars (heuristic)
      const nextHeader = findNextHeaderIndex(lowered, pat.regex, idx);
      const sliceEnd = nextHeader !== -1 ? nextHeader : Math.min(lowered.length, idx + 2000);
      const slice = lowered.slice(idx, sliceEnd).trim();

      // find which pages this header occurs on by checking perPage
      const pages: number[] = [];
      perPage.forEach((p, i) => {
        if (p.toLowerCase().includes(match![0].toLowerCase().replace(/\s+/g, " "))) pages.push(i + 1);
      });

      sections.push({
        id: `${pat.canonical}_${idx}`,
        title: pat.canonical,
        pageIndices: pages.length > 0 ? pages : [1],
        snippet: slice.slice(0, 400) + (slice.length > 400 ? "…" : ""),
        fullText: slice,
      });
    }
  }

  // De-duplicate and sort by first page index
  const uniq: Record<string, DetectedSection> = {};
  for (const s of sections) {
    if (!uniq[s.title + s.pageIndices.join(",")]) {
      uniq[s.title + s.pageIndices.join(",")] = s;
    }
  }
  const arr = Object.values(uniq).sort((a, b) => (a.pageIndices[0] - b.pageIndices[0]) || a.title.localeCompare(b.title));

  // If Actions is not found but a block "ACTIONS ===" or "=== ACTIONS" appears weirdly, fallback to scanning for keywords
  if (!arr.find((s) => s.title === "ACTIONS")) {
    const actionsIndex = lowered.search(/\b(Breath Weapon|Attack|Unarmed Strike|Flurry of Blows|Scimitar|Shortsword|Eldritch Blast)\b/i);
    if (actionsIndex !== -1) {
      const slice = lowered.slice(Math.max(0, actionsIndex - 80), Math.min(lowered.length, actionsIndex + 1200));
      arr.unshift({
        id: `ACTIONS_fallback_${actionsIndex}`,
        title: "ACTIONS (fallback)",
        pageIndices: [1],
        snippet: slice.slice(0, 300),
        fullText: slice,
      });
    }
  }

  return arr;
}

function findNextHeaderIndex(text: string, currentRegex: RegExp, fromIndex: number) {
  // Find next "===" block header after fromIndex
  const header = /===\s*[A-Z0-9 &()'\/-]+?\s*===/g;
  header.lastIndex = fromIndex + 1;
  const m = header.exec(text);
  return m ? m.index : -1;
}

/* Utility: set nested dotted property into object (handles arrays like classes[0].name) */
function setDeepValue(obj: any, dottedKey: string, value: any) {
  const parts = dottedKey.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const arrayMatch = part.match(/^([^\[]+)\[(\d+)\]$/);
    if (arrayMatch) {
      const arrKey = arrayMatch[1];
      const arrIdx = parseInt(arrayMatch[2], 10);
      if (!cur[arrKey]) cur[arrKey] = [];
      if (!cur[arrKey][arrIdx]) cur[arrKey][arrIdx] = {};
      if (i === parts.length - 1) {
        cur[arrKey][arrIdx] = value;
      } else {
        cur = cur[arrKey][arrIdx];
      }
    } else {
      if (i === parts.length - 1) {
        cur[part] = value;
      } else {
        if (!cur[part]) cur[part] = {};
        cur = cur[part];
      }
    }
  }
}