import type { SupportedLocale } from "./schemas";

export function writePdfText(
  doc: PDFKit.PDFDocument,
  text: string,
  locale: SupportedLocale,
  options: PDFKit.Mixins.TextOptions = {},
  position?: { x: number; y: number },
) {
  const textOptions: PDFKit.Mixins.TextOptions = locale === "ar"
    ? { align: "right", features: ["rtla", "rtlm"], ...options }
    : { ...options };

  if (locale === "ar") {
    // Preflight before writing: a failed layout can otherwise leave half a
    // paragraph on the page. Fontkit crashes on legal NULL mark anchors in
    // Noto Sans Arabic (https://github.com/foliojs/fontkit/issues/367).
    try {
      doc.widthOfString(text, textOptions);
    } catch (error) {
      if (!(error instanceof TypeError) || !error.message.includes("xCoordinate")) {
        throw error;
      }

      // Keep the text, diacritics and Arabic shaping; disable only mark-to-base
      // positioning for this affected text. PDFKit supports feature objects,
      // although @types/pdfkit currently declares only arrays.
      textOptions.features = {
        rtla: true,
        rtlm: true,
        mark: false,
      } as unknown as PDFKit.Mixins.TextOptions["features"];
    }
  }

  return position
    ? doc.text(text, position.x, position.y, textOptions)
    : doc.text(text, textOptions);
}
