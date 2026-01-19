// Master user email - has unlimited access to everything
export const MASTER_USER_EMAIL = "digitalmastermkt@gmail.com";

export function isMasterUser(email: string | undefined | null): boolean {
  return email?.toLowerCase() === MASTER_USER_EMAIL.toLowerCase();
}
