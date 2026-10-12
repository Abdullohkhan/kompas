import type { Role } from "../generated/prisma/client";

export type AuthUser = { id: string; email: string; role: Role };
export const AUTH_COOKIE = "pulse_token";
