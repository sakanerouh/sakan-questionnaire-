import { describe, expect, it } from "vitest";
import { adminRequestStatus, requireSameOrigin } from "./request";

describe("admin mutation request protection", () => {
  it("accepts the deployment origin", () => {
    const request = new Request("https://audit.example/api/admin/questionnaire", {
      method: "PUT",
      headers: { origin: "https://audit.example" },
    });

    expect(() => requireSameOrigin(request)).not.toThrow();
  });

  it.each([undefined, "https://attacker.example"])(
    "rejects missing or cross-site origins",
    (origin) => {
      const headers = origin ? { origin } : undefined;
      const request = new Request("https://audit.example/api/admin/questionnaire", {
        method: "PUT",
        headers,
      });

      try {
        requireSameOrigin(request);
        throw new Error("Expected request to be rejected");
      } catch (error) {
        expect(adminRequestStatus(error)).toBe(403);
      }
    },
  );
});
