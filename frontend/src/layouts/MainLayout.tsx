import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const linkBase = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const linkActive = "bg-brand-600 text-white";
const linkInactive = "text-slate-600 hover:bg-slate-100";

function SectionTitle({ children }: { children: string }) {
  return <p className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{children}</p>;
}

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function NavItem({ to, label }: { to: string; label: string }) {
    return (
      <NavLink
        to={to}
        onClick={() => setMobileOpen(false)}
        className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}
      >
        {label}
      </NavLink>
    );
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const navigation = (
    <>
      <nav className="flex flex-col gap-0.5">
        <NavItem to="/" label="Dashboard" />

        <SectionTitle>Gestão</SectionTitle>
        <NavItem to="/blood-bags" label="Bolsas" />
        <NavItem to="/scan" label="Escanear QR Code" />
        <NavItem to="/stock" label="Estoque" />
        <NavItem to="/demands" label="Demandas" />
        <NavItem to="/transfers" label="Transferências" />

        <SectionTitle>Rede</SectionTitle>
        <NavItem to="/institutions" label="Instituições" />
        <NavItem to="/map" label="Mapa" />

        <SectionTitle>Auditoria</SectionTitle>
        <NavItem to="/blockchain" label="Blockchain" />
        <NavItem to="/audit" label="Logs" />
        <NavItem to="/alerts" label="Alertas" />

        {user?.role === "ADMIN" && (
          <>
            <SectionTitle>Administração</SectionTitle>
            <NavItem to="/users" label="Usuários" />
            <NavItem to="/settings" label="Configurações" />
          </>
        )}
      </nav>

      <div className="mt-8 border-t border-slate-200 px-3 pt-4">
        <p className="text-sm font-medium text-slate-700">{user?.name}</p>
        <p className="text-xs text-slate-400">
          {user?.role} {user?.institution ? `• ${user.institution.name}` : ""}
        </p>
        <button onClick={handleLogout} className="mt-3 text-xs font-medium text-brand-600 hover:underline">
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Barra superior — visível apenas em telas pequenas (mobile) */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <h1 className="text-lg font-bold text-brand-700">BloodLink</h1>
        <button
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-lg border border-slate-200 p-2 text-slate-600"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Sidebar — sempre visível em telas médias/grandes; em mobile, alterna com o menu */}
      <aside
        className={`${mobileOpen ? "block" : "hidden"} w-full shrink-0 border-r border-slate-200 bg-white px-3 py-5 md:block md:w-64`}
      >
        <div className="mb-6 hidden px-3 md:block">
          <h1 className="text-lg font-bold text-brand-700">BloodLink</h1>
          <p className="text-xs text-slate-400">Rastreabilidade de bolsas de sangue</p>
        </div>
        {navigation}
      </aside>

      <main className="flex-1 overflow-x-hidden bg-slate-50 p-6">
        <Outlet />
      </main>
    </div>
  );
}
