import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  approveUser,
  rejectUser,
  promoteToAdmin,
  demoteToMember,
} from "./actions";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: viewer } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Server-side gate, not just "the sidebar link is hidden" — matches the
  // Server Actions' own re-check in actions.ts.
  if (!viewer || (viewer.role !== "admin" && viewer.role !== "ceo")) {
    redirect("/dashboard");
  }

  const isCeo = viewer.role === "ceo";

  const { data: pending } = await supabase
    .from("profiles")
    .select("id, name, email, created_at")
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  // Only fetched for ceo — admins never see other members' role info here.
  const { data: approvedUsers } = isCeo
    ? await supabase
        .from("profiles")
        .select("id, name, email, role")
        .eq("approval_status", "approved")
        .order("name", { ascending: true })
    : { data: null };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">Admin</h1>
      <p className="text-sm text-gray-500 mb-8">
        Signed in as {viewer.role}.
      </p>

      <section className="mb-10">
        <h2 className="text-lg font-medium mb-3">Pending approvals</h2>
        {!pending || pending.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing pending.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((p) => (
              <li
                key={p.id}
                className="border rounded-md p-3 flex items-center justify-between gap-4"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-gray-500">{p.email}</p>
                  <p className="text-xs text-gray-400">
                    Signed up{" "}
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={approveUser.bind(null, p.id)}>
                    <button className="bg-black text-white rounded-md px-3 py-1.5 text-sm">
                      Approve
                    </button>
                  </form>
                  <form action={rejectUser.bind(null, p.id)}>
                    <button className="border rounded-md px-3 py-1.5 text-sm">
                      Reject
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isCeo && (
        <section>
          <h2 className="text-lg font-medium mb-3">Manage roles</h2>
          <p className="text-sm text-gray-500 mb-3">
            Only visible to ceo. Admins can approve/reject signups but can&apos;t
            grant admin access.
          </p>
          {!approvedUsers || approvedUsers.length === 0 ? (
            <p className="text-sm text-gray-500">No approved members yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {approvedUsers.map((u) => (
                <li
                  key={u.id}
                  className="border rounded-md p-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-medium">
                      {u.name}{" "}
                      <span className="text-xs text-gray-400">
                        ({u.role})
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {u.id === user.id ? (
                      <span className="text-xs text-gray-400">you</span>
                    ) : u.role === "admin" ? (
                      <form action={demoteToMember.bind(null, u.id)}>
                        <button className="border rounded-md px-3 py-1.5 text-sm">
                          Demote to member
                        </button>
                      </form>
                    ) : u.role === "member" ? (
                      <form action={promoteToAdmin.bind(null, u.id)}>
                        <button className="border rounded-md px-3 py-1.5 text-sm">
                          Promote to admin
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-gray-400">ceo</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
