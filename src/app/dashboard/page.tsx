import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Proves RLS is wired correctly: this reads the caller's own profile row
  // through the anon-key client, scoped by the "profiles visible to self,
  // approved members, and staff" policy — no service_role needed.
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, total_points, accent_pref, role")
    .eq("id", user.id)
    .single();

  const isStaff = profile?.role === "admin" || profile?.role === "ceo";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold mb-1">
          Chào mừng{profile?.name ? `, ${profile.name}` : ""}!
        </h1>
        <p className="text-sm text-gray-500 mb-1">{user.email}</p>
        <p className="text-sm text-gray-500 mb-6">
          {profile?.total_points ?? 0} points · {profile?.accent_pref} accent
        </p>
        {isStaff && (
          <p className="mb-4">
            <Link href="/admin" className="text-sm underline">
              Admin
            </Link>
          </p>
        )}
        <SignOutButton />
      </div>
    </main>
  );
}
