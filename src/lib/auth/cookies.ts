import { cookies } from "next/headers";

import type { CookieOptions, CookieStore } from "./session";

export async function nextCookieStore(): Promise<CookieStore> {
  const store = await cookies();
  return {
    get: (name) => store.get(name)?.value,
    set: (name, value, options: CookieOptions) => store.set(name, value, options),
    delete: (name, options) => store.delete({ name, ...options }),
  };
}
