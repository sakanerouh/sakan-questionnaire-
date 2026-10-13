import { readFileSync } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { describe, expect, it, vi } from "vitest";
import { writePdfText } from "./pdfText";

const arabicFont = readFileSync(path.join(process.cwd(), "public/fonts/NotoSansArabic.ttf"));
const failingText = "يكفِ؟";

function arabicDocument() {
  const doc = new PDFDocument();
  doc.font(arabicFont);
  return doc;
}

describe("Arabic PDF font layout", () => {
  it("reproduces the NULL anchor crash with the bundled font and renderer", () => {
    const doc = arabicDocument();
    expect(() => doc.widthOfString(failingText, { features: ["rtla", "rtlm"] }))
      .toThrow("xCoordinate");
    doc.destroy();
  });

  it("creates a complete PDF with the failing diacritic and punctuation", async () => {
    const doc = arabicDocument();
    const text = `هل يكفِ؟\n${"امنحي نفسك لحظة من الهدوء. ".repeat(100)}\nيكفِ؟`;
    const write = vi.spyOn(doc, "text");
    const pdf = new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    writePdfText(doc, text, "ar", { width: 300, lineGap: 4 }, { x: 54, y: 54 });
    expect(write).toHaveBeenCalledWith(text, 54, 54, expect.objectContaining({
      align: "right",
      width: 300,
      lineGap: 4,
      features: expect.objectContaining({ mark: false, rtla: true, rtlm: true }),
    }));
    // The next paragraph must still use normal mark positioning.
    writePdfText(doc, "رسالة إليكِ", "ar");
    expect(write).toHaveBeenLastCalledWith("رسالة إليكِ", expect.objectContaining({
      features: ["rtla", "rtlm"],
    }));
    doc.end();

    const buffer = await pdf;
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.subarray(-6).toString()).toBe("%%EOF\n");
    expect(buffer.length).toBeGreaterThan(5_000);
  });

  it("keeps normal Arabic shaping when the font can position the marks", () => {
    const doc = arabicDocument();
    const write = vi.spyOn(doc, "text");
    writePdfText(doc, "مرحبًا بكِ", "ar");
    expect(write).toHaveBeenCalledWith("مرحبًا بكِ", {
      align: "right", features: ["rtla", "rtlm"],
    });
    doc.destroy();
  });

  it.each(["en", "fr"] as const)("exports %s without Arabic font options", (locale) => {
    const doc = new PDFDocument();
    const write = vi.spyOn(doc, "text");
    writePdfText(doc, "SakanBody — Réflexion", locale, { lineGap: 3 });
    expect(write).toHaveBeenCalledWith("SakanBody — Réflexion", { lineGap: 3 });
    doc.destroy();
  });

  it("propagates unrelated layout errors", () => {
    const doc = arabicDocument();
    const error = new Error("Unexpected font error");
    vi.spyOn(doc, "widthOfString").mockImplementation(() => { throw error; });
    expect(() => writePdfText(doc, failingText, "ar")).toThrow(error);
    doc.destroy();
  });
});
