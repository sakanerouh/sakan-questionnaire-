import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";
import { formatAuditPrice } from "./types";

describe("checkout reference copy", () => {
  it("preserves the chosen English copy and punctuation", () => {
    expect(en.auditCheckout.duration).toBe("About 44 minutes · Self-paced");
    expect(en.auditCheckout.benefits[2]).toBe("Practice speaking up when you’d usually go quiet.");
  });
  it("contains complete, correctly encoded Arabic checkout copy", () => {
    expect(Object.keys(ar.auditCheckout).sort()).toEqual(Object.keys(en.auditCheckout).sort());
    expect(ar.auditCheckout.choose).toBe("اختاري طريقة الدفع");
    expect(ar.auditCheckout.cardCta).toBe("المتابعة إلى الدفع بالبطاقة");
    for (const value of Object.values(ar.auditCheckout).flat()) {
      if (value === "SakanBody Audit") continue;
      expect(value).toMatch(/[\u0600-\u06ff]/);
      expect(value).not.toContain("??");
    }
  });
  it("formats the configured price without inventing one", () => {
    expect(formatAuditPrice(null,"en")).toBeNull();
    expect(formatAuditPrice({ amount: 11, currency: "eur" }, "en")).toBe("€11.00");
  });
});
