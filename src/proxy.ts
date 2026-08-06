import { clerkMiddleware } from "@clerk/nextjs/server";

// En modo mock (dev-auth-mock) no hay sesión de Clerk: el middleware pasa de
// largo y la sesión la resuelve el gateway desde la cookie de desarrollo. El
// gate de producción está en el modo: en prod jamás es mock.
const isMockAuth = process.env.NODE_ENV !== "production" && process.env.AUTH_MODE === "mock";

export default isMockAuth
  ? function passthroughMiddleware() {
      return;
    }
  : clerkMiddleware();

export const config = {
  matcher: [
    // Todo salvo estáticos e internals de Next.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
