import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function PendingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, approval_status")
    .eq("id", user.id)
    .single();

  // An approved user landing here directly (e.g. a stale tab) should just
  // go to the real app rather than see a stale "pending" message.
  if (profile?.approval_status === "approved") {
    redirect("/dashboard");
  }

  const rejected = profile?.approval_status === "rejected";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-2">
          {rejected ? "Access not approved" : "Awaiting approval"}
        </h1>
        <p className="text-sm text-gray-500 mb-1">
          {profile?.name ? `Hi ${profile.name} — ` : ""}
          {rejected
            ? "an admin has reviewed and declined this account."
            : "an admin needs to approve your account before you can use Thanh Việt."}
        </p>
        <p className="text-sm text-gray-500 mb-6">{user.email}</p>
        {!rejected && (
          <p className="text-sm text-gray-500 mb-6">
            This usually doesn&apos;t take long. Check back soon, or reach
            out directly if it&apos;s been a while.
          </p>
        )}
        <SignOutButton />
      </div>
    </main>
  );
}
