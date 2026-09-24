import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./useAuth";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { post: vi.fn() },
}));

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();
  if (loading) return <p>carregando</p>;
  return (
    <div>
      <p>{user ? `logado:${user.email}` : "deslogado"}</p>
      <button onClick={() => login("hospitalA@bloodlink.com", "senha123")}>Entrar</button>
      <button onClick={logout}>Sair</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("AuthProvider / useAuth", () => {
  it("começa deslogado quando não há sessão salva", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(await screen.findByText("deslogado")).toBeInTheDocument();
  });

  it("restaura o usuário do localStorage ao montar", async () => {
    localStorage.setItem(
      "bloodlink_user",
      JSON.stringify({ id: "1", name: "Carlos", email: "hospitalA@bloodlink.com", role: "HOSPITAL", institution: null })
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText("logado:hospitalA@bloodlink.com")).toBeInTheDocument();
  });

  it("login() chama a API, guarda token/usuário e atualiza o estado", async () => {
    (api.post as any).mockResolvedValue({
      data: {
        token: "jwt-fake",
        user: { id: "1", name: "Carlos", email: "hospitalA@bloodlink.com", role: "HOSPITAL", institution: null },
      },
    });

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText("Entrar"));

    await waitFor(() => expect(screen.getByText("logado:hospitalA@bloodlink.com")).toBeInTheDocument());
    expect(localStorage.getItem("bloodlink_token")).toBe("jwt-fake");
    expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "hospitalA@bloodlink.com", password: "senha123" });
  });

  it("logout() limpa o localStorage e o estado do usuário", async () => {
    localStorage.setItem("bloodlink_token", "jwt-fake");
    localStorage.setItem(
      "bloodlink_user",
      JSON.stringify({ id: "1", name: "Carlos", email: "hospitalA@bloodlink.com", role: "HOSPITAL", institution: null })
    );

    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await screen.findByText("logado:hospitalA@bloodlink.com");
    await user.click(screen.getByText("Sair"));

    expect(screen.getByText("deslogado")).toBeInTheDocument();
    expect(localStorage.getItem("bloodlink_token")).toBeNull();
    expect(localStorage.getItem("bloodlink_user")).toBeNull();
  });
});
