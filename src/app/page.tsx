import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-3xl font-semibold mb-2">Thanh Việt</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        Learn Vietnamese vocabulary and tones, built for our congregation.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="bg-black text-white rounded-md px-4 py-2"
        >
          Log in
        </Link>
        <Link href="/signup" className="border rounded-md px-4 py-2">
          Sign up
        </Link>
      </div>
    </main>
  );
}
