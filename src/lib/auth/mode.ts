export type AuthMode = "clerk" | "mock";

export interface AuthEnv {
  NODE_ENV: string | undefined;
  AUTH_MODE: string | undefined;
}

/**
 * Resuelve el modo de auth. Gate 🔒: en producción NUNCA hay mock, aunque la
 * flag esté seteada. El mock es exclusivo de desarrollo local con `AUTH_MODE
 * =mock` explícito (ver change dev-auth-mock).
 */
export function resolveAuthMode(env: AuthEnv): AuthMode {
  if (env.NODE_ENV === "production") {
    return "clerk";
  }
  return env.AUTH_MODE === "mock" ? "mock" : "clerk";
}
