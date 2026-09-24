import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet } from "react-router-dom";
import App from "./App";

// Stub de cada página com um marcador de texto simples — o objetivo aqui é
// testar SÓ a lógica de roteamento/guards do App.tsx, não o conteúdo de
// cada página (que já tem seus próprios testes específicos).
vi.mock("./pages/Login", () => ({ default: () => <div>PAGINA_LOGIN</div> }));
vi.mock("./pages/Dashboard", () => ({ default: () => <div>PAGINA_DASHBOARD</div> }));
vi.mock("./pages/BloodBags", () => ({ default: () => <div>PAGINA_BOLSAS</div> }));
vi.mock("./pages/CreateBloodBag", () => ({ default: () => <div>PAGINA_CADASTRAR_BOLSA</div> }));
vi.mock("./pages/BloodBagDetail", () => ({ default: () => <div>PAGINA_DETALHE_BOLSA</div> }));
vi.mock("./pages/Stock", () => ({ default: () => <div>PAGINA_ESTOQUE</div> }));
vi.mock("./pages/Demands", () => ({ default: () => <div>PAGINA_DEMANDAS</div> }));
vi.mock("./pages/DemandDetail", () => ({ default: () => <div>PAGINA_DETALHE_DEMANDA</div> }));
vi.mock("./pages/Transfers", () => ({ default: () => <div>PAGINA_TRANSFERENCIAS</div> }));
vi.mock("./pages/Institutions", () => ({ default: () => <div>PAGINA_INSTITUICOES</div> }));
vi.mock("./pages/NetworkMap", () => ({ default: () => <div>PAGINA_MAPA</div> }));
vi.mock("./pages/Audit", () => ({ default: () => <div>PAGINA_AUDITORIA</div> }));
vi.mock("./pages/Blockchain", () => ({ default: () => <div>PAGINA_BLOCKCHAIN</div> }));
vi.mock("./pages/Alerts", () => ({ default: () => <div>PAGINA_ALERTAS</div> }));
vi.mock("./pages/ScanQrCode", () => ({ default: () => <div>PAGINA_SCAN</div> }));
vi.mock("./pages/Users", () => ({ default: () => <div>PAGINA_USUARIOS</div> }));
vi.mock("./pages/Settings", () => ({ default: () => <div>PAGINA_CONFIGURACOES</div> }));
vi.mock("./layouts/MainLayout", () => ({
  default: () => <Outlet />,
}));

let mockUser: { role: string } | null = { role: "HOSPITAL" };
let mockLoading = false;
vi.mock("./hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser, loading: mockLoading, login: vi.fn(), logout: vi.fn() }),
}));

function renderAppAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe("App — PrivateRoute", () => {
  it("redireciona para /login quando não há usuário autenticado", () => {
    mockUser = null;
    renderAppAt("/");
    expect(screen.getByText("PAGINA_LOGIN")).toBeInTheDocument();
  });

  it("mostra a página quando o usuário está autenticado", () => {
    mockUser = { role: "HOSPITAL" };
    renderAppAt("/blood-bags");
    expect(screen.getByText("PAGINA_BOLSAS")).toBeInTheDocument();
  });
});

describe("App — RoleRoute (/users e /settings são só para ADMIN)", () => {
  it("redireciona um usuário HOSPITAL para o Dashboard ao tentar acessar /users diretamente", () => {
    mockUser = { role: "HOSPITAL" };
    renderAppAt("/users");
    expect(screen.getByText("PAGINA_DASHBOARD")).toBeInTheDocument();
    expect(screen.queryByText("PAGINA_USUARIOS")).not.toBeInTheDocument();
  });

  it("redireciona um usuário HEMOCENTRO para o Dashboard ao tentar acessar /settings diretamente", () => {
    mockUser = { role: "HEMOCENTRO" };
    renderAppAt("/settings");
    expect(screen.getByText("PAGINA_DASHBOARD")).toBeInTheDocument();
    expect(screen.queryByText("PAGINA_CONFIGURACOES")).not.toBeInTheDocument();
  });

  it("permite que um usuário ADMIN acesse /users e /settings normalmente", () => {
    mockUser = { role: "ADMIN" };
    renderAppAt("/users");
    expect(screen.getByText("PAGINA_USUARIOS")).toBeInTheDocument();
  });
});
