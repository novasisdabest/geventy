export default function LiveDisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden cursor-none select-none">
      {children}
    </div>
  );
}
