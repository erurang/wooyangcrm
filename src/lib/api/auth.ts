import { createSupabaseServer } from "@/lib/supabase";
import { NextResponse } from "next/server";

export interface AuthResult {
  userId: string;
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
}

export async function requireApiUser(): Promise<AuthResult | NextResponse> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return {
    userId: user.id,
    supabase,
  };
}
