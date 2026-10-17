/**
 * Optional shared demo login for evaluators, supplied at build time through VITE_DEMO_EMAIL and
 * VITE_DEMO_PASSWORD so no credential lives in the source code. It belongs to a throwaway account
 * that holds no real data. When either variable is missing, the demo panel is not shown.
 */
const email = import.meta.env.VITE_DEMO_EMAIL;
const password = import.meta.env.VITE_DEMO_PASSWORD;

export const DEMO_ACCOUNT: { readonly email: string; readonly password: string } | null =
  email && password ? { email, password } : null;
