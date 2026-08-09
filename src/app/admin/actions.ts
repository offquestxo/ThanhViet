"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import type { ProfileRole } from "@/lib/supabase/types";

/**
 * Re-derives the caller's identity and role from their own session/DB row
 * on every call — never trust a role passed from the client, and never
 * assume the UI already hid the button that led here (a curious member can
 * always call a Server Action directly). This is the server-side half of
 * the authorization; supabase/migrations/0002_roles_and_approval.sql's
 * enforce_profile_field_permissions trigger is the database-level backstop
 * if this check is ever wrong.
 */
async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !(["admin", "ceo"] as ProfileRole[]).includes(profile.role)) {
    throw new Error("Not authorized.");
  }

  return { callerId: user.id, callerRole: profile.role };
}

async function requireCeo() {
  const { callerId, callerRole } = await requireStaff();
  if (callerRole !== "ceo") {
    throw new Error("Only ceo can change a user's role.");
  }
  return { callerId };
}

export async function approveUser(targetUserId: string) {
  await requireStaff();

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ approval_status: "approved" })
    .eq("id", targetUserId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function rejectUser(targetUserId: string) {
  await requireStaff();

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ approval_status: "rejected" })
    .eq("id", targetUserId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function promoteToAdmin(targetUserId: string) {
  const { callerId } = await requireCeo();
  if (targetUserId === callerId) {
    throw new Error("Can't change your own role.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", targetUserId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function demoteToMember(targetUserId: string) {
  const { callerId } = await requireCeo();
  if (targetUserId === callerId) {
    throw new Error("Can't change your own role.");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: "member" })
    .eq("id", targetUserId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
