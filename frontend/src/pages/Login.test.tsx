import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import { AuthProvider } from "../hooks/useAuth";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { post: vi.fn() },
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("Login", () => {
  it("renderiza o formulário com os campos de e-mail e senha preenchidos por padrão", () => {
    renderLogin();
    expect(screen.getByLabelText("E-mail")).toHaveValue("hospitalA@bloodlink.com");
    expect(screen.getByLabelText("Senha")).toHaveValue("senha123");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("lista os usuários de demonstração na tela", () => {
    renderLogin();
    expect(screen.getByText(/admin@bloodlink.com/)).toBeInTheDocument();
    expect(screen.getByText(/auditor@bloodlink.com/)).toBeInTheDocument();
  });

  it("mostra uma mensagem de erro quando o login falha", async () => {
    (api.post as any).mockRejectedValue({ response: { data: { error: "Credenciais inválidas." } } });

    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("E-mail ou senha inválidos.")).toBeInTheDocument();
  });

  it("chama a API de login com os dados do formulário ao submeter", async () => {
    (api.post as any).mockResolvedValue({
      data: { token: "jwt-fake", user: { id: "1", name: "Carlos", email: "hospitalA@bloodlink.com", role: "HOSPITAL", institution: null } },
    });

    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "hospitalA@bloodlink.com", password: "senha123" })
    );
  });
});
