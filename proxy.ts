import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require the user to be signed in.
// /seller(.*) and /admin(.*) are dashboard areas.
// User-specific pages like cart, orders, address also require a session.
const isProtectedRoute = createRouteMatcher([
  '/seller(.*)',
  '/admin(.*)',
  '/cart(.*)',
  '/my-orders(.*)',
  '/add-address(.*)',
  '/order-placed(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // auth.protect() redirects unauthenticated users to Clerk's sign-in page.
  // Role checks (seller vs admin) are enforced separately in each API route.
  if (isProtectedRoute(req)) await auth.protect()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};