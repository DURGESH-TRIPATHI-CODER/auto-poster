export const DEMO_USERS = [
  { email: "admin@gmail.com", password: "Gopinath.Govinda@108", role: "admin" },
  { email: "user@gmail.com", password: "SRISRIRADHAGOPINATH", role: "user" }
] as const;

export function validateCredentials(email: string, password: string) {
  const user = DEMO_USERS.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
  return user ?? null;
}
