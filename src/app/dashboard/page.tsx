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

  // Proves the read path works for real content, not just the profiles row:
  // units + their chunks (Section 1a's primary teaching unit, not raw word
  // pairs), through the same RLS-scoped client. Requires approval_status =
  // 'approved' per the 0002 migration — reaching this far at all already
  // implies that (the proxy would have redirected to /pending otherwise),
  // but the policy is what actually enforces it here.
  const { data: units } = await supabase
    .from("units")
    .select(
      "id, title, order, source_reference, chunks(id, vietnamese_text, english_text, structural_concept, display_order)"
    )
    .order("order", { ascending: true })
    .order("display_order", { referencedTable: "chunks", ascending: true });

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-sm mx-auto text-center mb-10">
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

      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-medium mb-4">Lessons</h2>
        {!units || units.length === 0 ? (
          <p className="text-sm text-gray-500">
            No units yet — add one with{" "}
            <code className="text-xs">npm run seed -- &lt;file&gt;</code>.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {units.map((unit) => (
              <li key={unit.id} className="border rounded-md p-4">
                <p className="font-medium">{unit.title}</p>
                {unit.source_reference && (
                  <p className="text-xs text-gray-400 mb-3">
                    {unit.source_reference}
                  </p>
                )}
                {unit.chunks.length === 0 ? (
                  <p className="text-sm text-gray-500">No chunks yet.</p>
                ) : (
                  <ul className="flex flex-col gap-2 mt-2">
                    {unit.chunks
                      .slice()
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((chunk) => (
                        <li key={chunk.id} className="text-sm">
                          <div className="flex justify-between gap-4">
                            <span>{chunk.vietnamese_text}</span>
                            <span className="text-gray-500">
                              {chunk.english_text}
                            </span>
                          </div>
                          {chunk.structural_concept !== "none" && (
                            <span className="text-xs text-gray-400">
                              {chunk.structural_concept}
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
