import { vi } from "vitest";

export function queryResult(data: unknown, error: unknown = null) {
  const result = { data, error };
  const chain: Record<string, unknown> = { then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve) };
  for (const method of ["select", "insert", "upsert", "update", "delete", "eq", "gt", "order", "limit", "maybeSingle", "single"]) {
    chain[method] = vi.fn(() => chain);
  }
  return chain;
}
