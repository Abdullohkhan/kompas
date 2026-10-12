"use client";

import { useCallback, useEffect, useState } from "react";
import type { Customer, Report, ReportNameKey, ReportStatus, ReportType, Role, TeamMember, User, PlanKey, CustomerStatus } from "./types";

/** Same-origin `/api/*`; next.config.ts rewrites it to the NestJS backend, so the httpOnly cookie just works. */
const BASE = "/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = { method?: string; body?: unknown; redirectOn401?: boolean };

export async function api<T>(path: string, { method = "GET", body, redirectOn401 = true }: Options = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
  });
  if (res.status === 401 && redirectOn401 && typeof window !== "undefined") {
    window.location.assign("/login");
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = Array.isArray(data.message) ? data.message.join(", ") : (data.message ?? message);
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

/* ---- backend (UPPER_CASE enums, Date strings) -> UI shapes ---- */

type RawUser = Omit<User, "role"> & { role: "ADMIN" | "USER" };
export const toUser = (u: RawUser): User => ({ ...u, role: u.role.toLowerCase() as Role });

type RawCustomer = Omit<Customer, "plan" | "status" | "joined"> & { plan: string; status: string; joinedAt: string };
export const toCustomer = (c: RawCustomer): Customer => ({
  id: c.id,
  name: c.name,
  email: c.email,
  company: c.company,
  phone: c.phone,
  spent: c.spent,
  plan: c.plan.toLowerCase() as PlanKey,
  status: c.status.toLowerCase() as CustomerStatus,
  joined: c.joinedAt.slice(0, 10),
});

type RawReport = { id: string; nameKey: string | null; customName: string | null; type: string; status: string; rows: number; createdAt: string };
export const toReport = (r: RawReport): Report => ({
  id: r.id,
  nameKey: (r.nameKey ?? undefined) as ReportNameKey | undefined,
  customName: r.customName ?? undefined,
  type: r.type.toLowerCase() as ReportType,
  status: r.status.toLowerCase() as ReportStatus,
  rows: r.rows,
  createdAt: r.createdAt.slice(0, 10),
});

type RawMember = { id: string; name: string; email: string; role: "ADMIN" | "USER" };
export const toMember = (m: RawMember): TeamMember => ({ ...m, role: m.role.toLowerCase() as Role });

export const authApi = {
  login: (email: string, password: string) =>
    api<{ user: RawUser }>("/auth/login", { method: "POST", body: { email, password }, redirectOn401: false }).then((r) => toUser(r.user)),
  register: (name: string, email: string, password: string) =>
    api<{ user: RawUser }>("/auth/register", { method: "POST", body: { name, email, password }, redirectOn401: false }).then((r) => toUser(r.user)),
  logout: () => api<void>("/auth/logout", { method: "POST", redirectOn401: false }),
  me: () => api<{ user: RawUser }>("/auth/me").then((r) => toUser(r.user)),
  updateProfile: (data: { name?: string; phone?: string; company?: string }) =>
    api<{ user: RawUser }>("/auth/me", { method: "PATCH", body: data }).then((r) => toUser(r.user)),
};

/**
 * Loads `path` (null = skip). Loading is derived from "the stored result is for another path", so
 * switching pages shows skeletons without a synchronous setState inside the effect.
 */
export function useFetch<T>(path: string | null, map: (raw: never) => T = (raw) => raw as T) {
  const [state, setState] = useState<{ path: string | null; data?: T; error?: ApiError }>({ path: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let current = true;
    api<unknown>(path)
      .then((raw) => current && setState({ path, data: map(raw as never) }))
      .catch((error: ApiError) => current && setState({ path, error }));
    return () => {
      current = false;
    };
    // `map` is a stable module-level function at every call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, version]);

  const fresh = state.path === path;
  const setData = useCallback((updater: (prev: T | undefined) => T) => setState((s) => ({ ...s, data: updater(s.data) })), []);
  return {
    data: fresh ? state.data : undefined,
    error: fresh ? state.error : undefined,
    loading: path !== null && !fresh,
    reload: useCallback(() => setVersion((v) => v + 1), []),
    setData,
  };
}
