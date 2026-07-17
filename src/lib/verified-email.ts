import type { User } from "@clerk/nextjs/server";

/**
 * 🔒 Email VERIFICADO del usuario autenticado, o cadena vacía si no tiene
 * ninguno. Todo el modelo de amenaza de la vinculación por email (política
 * RLS member_email_self_link_update) exige que `app.current_user_email` sea
 * un email verificado por el proveedor de auth: este gate debe vivir en
 * código, no depender de la configuración del dashboard de Clerk.
 * Prefiere el email primario; si no está verificado, el primero que sí.
 */
export function verifiedEmail(user: User): string {
  const primary = user.primaryEmailAddress;
  if (primary?.verification?.status === "verified") {
    return primary.emailAddress;
  }
  const anyVerified = user.emailAddresses.find(
    (address) => address.verification?.status === "verified",
  );
  return anyVerified?.emailAddress ?? "";
}
