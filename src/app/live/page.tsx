import { LiveCodeEntry } from "./LiveCodeEntry";

export const metadata = {
  title: "Geventy — Projektor",
};

export default function LiveCodePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tight">
            Projektor
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Zadej 6-mistny kod z moderatorske obrazovky
          </p>
        </div>
        <LiveCodeEntry />
      </div>
    </div>
  );
}
