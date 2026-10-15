import Image from "next/image";
import Link from "next/link";
import { JadeScreen, ToneRow, jadePrimary, jadeSecondary } from "@/components/auth/jade-screen";

/** Signed-out landing (showcase "Welcome" design). */
export default function Home() {
  return (
    <JadeScreen className="pt-[calc(env(safe-area-inset-top)+5rem)]">
      <ToneRow />
      <div className="flex justify-center">
        <div className="flex size-[230px] items-end justify-center overflow-hidden rounded-full bg-[#1c6a5f]">
          <Image src="/mascot/sparrow-main.png" alt="Thanh Việt's sparrow mascot" width={210} height={210} className="h-[210px] w-auto" unoptimized priority />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2.5 text-center">
        <h1 className="text-[44px] leading-[1.05] font-extrabold tracking-[-0.03em]">Thanh Việt</h1>
        <p className="max-w-[300px] text-lg leading-[1.45] text-[#cfe5dd]">Learn Vietnamese by ear, one tone at a time.</p>
      </div>
      <div className="flex-1" />
      <div className="flex flex-col gap-3">
        <Link href="/signup" className={jadePrimary}>
          Get started
        </Link>
        <Link href="/login" className={jadeSecondary}>
          I already have an account
        </Link>
      </div>
    </JadeScreen>
  );
}
