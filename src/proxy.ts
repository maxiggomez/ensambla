import { clerkMiddleware } from "@clerk/nextjs/server";

// Auth por request (foundation fase 4): Clerk resuelve la sesión; el mapeo
// usuario → Member/tenant lo hace shared/tenancy (withTenantForUser) en los
// handlers. Las rutas quedan públicas por defecto; el gating por rol llega
// con la capability identity-org (fase 5).
export default clerkMiddleware();

export const config = {
  matcher: [
    // Todo salvo estáticos e internals de Next.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
