import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { Play, Calendar, Gamepad2, Users } from "lucide-react";

export default function HomePage() {
  return (
    <Shell>
      {/* Hero */}
      <div className="py-12 md:py-24 text-center space-y-8 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-bold uppercase tracking-[0.2em]">
          <Play size={12} fill="currentColor" /> Let&apos;s Party
        </div>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none italic uppercase">
          TVOJE AKCE. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500">
            TVOJE PRAVIDLA.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
          Geventy je platforma pro interaktivni zazitky na oslavach, svatbach a srazech.
          Zapoj hosty pomoci miniher v realnem case.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/event/demo/moderator"
            className="group relative px-8 py-4 bg-white text-black rounded-2xl font-black text-lg hover:scale-105 transition-all active:scale-95 overflow-hidden text-center"
          >
            <span className="relative z-10">VYTVORIT EVENT</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link
            href="/event/demo"
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg border-2 border-slate-800 hover:border-purple-500 transition-all active:scale-95 text-center"
          >
            VSTOUPIT DO HRY
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto py-16">
        {[
          {
            icon: Calendar,
            title: "Vytvor event",
            desc: "Nastav datum, pozvi hosty emailem a sdilej odkaz.",
          },
          {
            icon: Gamepad2,
            title: "Sestav program",
            desc: "Vyber minihry z knihovny - kviz, bingo, ledolamky a dalsi.",
          },
          {
            icon: Users,
            title: "Hraj v realnem case",
            desc: "Hoste se pripoji na mobilu, moderator ridi hru na platne.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3"
          >
            <feature.icon size={24} className="text-purple-400" />
            <h3 className="font-black italic uppercase">{feature.title}</h3>
            <p className="text-sm text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </div>
    </Shell>
  );
}
