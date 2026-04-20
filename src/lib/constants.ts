// Master user email - has unlimited access to everything.
// Decoupled from source code: configured via VITE_MASTER_USER_EMAIL env var.
const MASTER_USER_EMAIL_ENV = (import.meta.env.VITE_MASTER_USER_EMAIL ?? "").toString().toLowerCase();

export const MASTER_USER_EMAIL = MASTER_USER_EMAIL_ENV;

export function isMasterUser(email: string | undefined | null): boolean {
  if (!MASTER_USER_EMAIL_ENV) return false;
  return email?.toLowerCase() === MASTER_USER_EMAIL_ENV;
}
