import Link from "next/link";
import Image from "next/image";
import { Gamepad2, Headphones, Keyboard } from "lucide-react";
import playstation from "@/app/assets/images/playstation.png";

export default function HeroSection({ isPreview = false }: { isPreview?: boolean }) {
  return (
    <section aria-label="Игровой магазин GameZone" className="gamezone-hero relative my-6 overflow-hidden rounded-[2rem] bg-slate-950 text-white">
      <div className="relative z-10 grid items-center gap-8 p-7 sm:p-12 lg:grid-cols-2 lg:p-16">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-sm font-medium text-violet-200">
            <Gamepad2 size={18} /> Территория твоей игры
          </p>
          <h1 className="max-w-xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Следующий уровень.<br /><span className="text-violet-300">Твои правила.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-slate-300 sm:text-lg">
            От любимой игры до идеального сетапа. Консоли, точная периферия и аксессуары — всё в GameZone.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={isPreview ? "#" : "/shop"} className="rounded-xl bg-violet-500 px-6 py-3.5 font-semibold text-white transition hover:bg-violet-400">Выбрать своё</Link>
            <Link href={isPreview ? "#" : "/shop?categoryId=gamezone-cat-consoles"} className="rounded-xl border border-white/25 px-6 py-3.5 font-medium transition hover:bg-white/10">Игровые консоли</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-5 text-sm text-slate-300">
            <span className="flex items-center gap-2"><Gamepad2 size={17} /> Игры и консоли</span>
            <span className="flex items-center gap-2"><Keyboard size={17} /> Периферия</span>
            <span className="flex items-center gap-2"><Headphones size={17} /> Звук</span>
          </div>
        </div>
        <div className="relative mx-auto flex min-h-60 w-full max-w-md items-center justify-center lg:min-h-96">
          <div className="absolute inset-8 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="absolute inset-5 rounded-full border border-white/10" />
          <div className="absolute inset-12 rounded-full border border-violet-300/20" />
          <Image src={playstation} alt="Игровая консоль PlayStation" priority className="relative h-64 w-full object-contain drop-shadow-2xl sm:h-80" />
          <span className="absolute bottom-1 right-0 rounded-2xl border border-white/15 bg-slate-900/80 px-5 py-3 text-sm backdrop-blur">
            <span className="block text-xs uppercase tracking-widest text-violet-300">Играй по-своему</span>
            <span className="mt-1 block font-semibold">Твой сетап начинается здесь</span>
          </span>
        </div>
      </div>
    </section>
  );
}
