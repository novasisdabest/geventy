/**
 * Supabase v2 with PostgREST v14+ infers `never` for INSERT/UPDATE/DELETE/RPC/SELECT
 * on tables with RLS policies. This helper bypasses that inference while keeping
 * row-level type safety via TablesInsert/TablesUpdate at call sites.
 *
 * Usage:
 *   import { from, rpc } from "@/lib/supabase/typed";
 *   const { data, error } = await from(supabase, "events").insert(row).select("id").single();
 */

import type { Database } from "@/lib/database.types";

type TableName = keyof Database["public"]["Tables"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function from(supabase: { from: (table: string) => any }, table: TableName) {
  return supabase.from(table);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rpc(supabase: { rpc: (...args: any[]) => any }, fn: string, args: Record<string, unknown>) {
  return supabase.rpc(fn, args);
}
