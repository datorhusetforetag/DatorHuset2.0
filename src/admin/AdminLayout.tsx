import { useMemo, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ClipboardList, LayoutGrid, LogIn, LogOut, Menu, ScrollText, ShieldCheck } from "lucide-react";
import { useAdminAccess } from "./useAdminAccess";

const navItems = [
  { to: "/produkter", label: "Produkter & Lager", icon: LayoutGrid },
  { to: "/bestallningar", label: "Beställningar", icon: ClipboardList },
  { to: "/logs", label: "Loggar", icon: ScrollText },
];

export const AdminLayout = () => {
  const access = useAdminAccess();
  const { user, role, signInWithGoogle, signOut } = access;
  const [navOpen, setNavOpen] = useState(false);

  const displayName = useMemo(() => {
    if (!user) return "Ej inloggad";
    const metadata = user.user_metadata || {};
    return metadata.full_name || metadata.username || user.email?.split("@")[0] || "Admin";
  }, [user]);

  return (
    <div className="min-h-screen bg-[#0f1824] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#0f1824]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60 p-2 text-slate-200 hover:border-[#11667b] hover:text-[#11667b] lg:hidden"
              aria-label="Öppna meny"
            >
              <Menu className="h-5 w-5" />
            </button>
            <img src="/datorhuset.jpg" alt="DatorHuset" className="h-10 w-10 rounded-full border border-slate-700/60" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">DatorHuset</p>
              <h1 className="text-lg font-semibold text-white">Adminportal</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="hidden items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1 lg:flex">
              <ShieldCheck className="h-4 w-4 text-[#11667b]" />
              <span>{displayName}</span>
              {role ? <span className="text-[10px] uppercase tracking-[0.15em] text-slate-400">({role})</span> : null}
            </div>
            {user ? (
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-3 py-2 text-xs font-semibold hover:border-[#11667b] hover:text-[#11667b]"
              >
                <LogOut className="h-4 w-4" />
                Logga ut
              </button>
            ) : (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Logga in
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1800px] gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <nav className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-500">Administration</p>
            <div className="space-y-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#11667b]/20 text-[#9dd4e0]"
                        : "text-slate-200 hover:bg-slate-800/70 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
        </aside>

        <main className="flex-1">
          <Outlet context={access} />
        </main>
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/60"
            aria-label="Stäng meny"
          />
          <aside className="relative z-10 h-full w-72 border-r border-slate-800 bg-[#0f1824] px-4 py-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/datorhuset.jpg" alt="DatorHuset" className="h-9 w-9 rounded-full border border-slate-700/60" />
                <span className="text-sm font-semibold">Adminportal</span>
              </div>
              <button type="button" onClick={() => setNavOpen(false)} className="text-slate-400 hover:text-white">
                Stäng
              </button>
            </div>
            <nav className="space-y-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setNavOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#11667b]/20 text-[#9dd4e0]"
                        : "text-slate-200 hover:bg-slate-800/70 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
};
