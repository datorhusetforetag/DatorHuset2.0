import { PropsWithChildren } from "react";

export const AdminLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">DatorHuset</p>
            <h1 className="text-xl font-semibold">Adminportal</h1>
          </div>
          <span className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300">
            Endast behöriga
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
};
