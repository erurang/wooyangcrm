/**
 * Supabase Client Module
 *
 * This module provides centralized Supabase clients for different environments:
 *
 * ## Browser (Client Components)
 * ```typescript
 * import { supabase } from "@/lib/supabase";
 * // or
 * import { supabase } from "@/lib/supabase/browser";
 * ```
 *
 * ## Server (API Routes, Server Components)
 * ```typescript
 * import { createSupabaseServer } from "@/lib/supabase";
 * // or
 * import { createSupabaseServer } from "@/lib/supabase/server";
 * const supabase = await createSupabaseServer();
 * ```
 *
 * ## Middleware
 * ```typescript
 * import { updateSession } from "@/lib/supabase/middleware";
 * ```
 *
 * ---
 *
 * Note: For backwards compatibility, `@/lib/supabaseClient` still works
 * and exports the same browser client.
 */

// Browser client exports
export { supabase, createBrowserSupabaseClient } from "./browser";

// Server client exports
export { createSupabaseServer } from "./server";

// Middleware exports
export { updateSession } from "./middleware";
