import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Demands from "./Demands";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

let mockUser: { role: string; institution: { id: string; name: string } | null } | null = null;
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const institutions = [
  { id: "inst-hosp-a", name: "Hospital São Lucas" },
  { id: "inst-hosp-b", name: "Hospital Municipal" },
];

function renderPage() {
  (api.get as any).mockImplementation((url: string) => {
    if (url === "/institutions") return Promise.resolve({ data: institutions });
    return Promise.resolve({ data: [] });
  });
  return render(
    <MemoryRouter>
      <Demands />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Demands — campo de hospital solicitante", () => {
  it("mostra o seletor de hospital ao abrir o formulário, populado a partir da API", async () => {
    mockUser = { role: "HOSPITAL", institution: null };
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "+ Nova demanda" }));

    expect(await screen.findByRole("option", { name: "Hospital São Lucas" })).toBeInTheDocument();
  });

  it("pré-seleciona o hospital do usuário logado", async () => {
    mockUser = { role: "HOSPITAL", institution: { id: "inst-hosp-a", name: "Hospital São Lucas" } };
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "+ Nova demanda" }));
    await screen.findByRole("option", { name: "Hospital São Lucas" });

    expect(screen.getByLabelText("Hospital solicitante")).toHaveValue("inst-hosp-a");
  });

  it("para um ADMIN (sem instituição), exige a seleção explícita do hospital antes de enviar", async () => {
    mockUser = { role: "ADMIN", institution: null };
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "+ Nova demanda" }));
    await screen.findByRole("option", { name: "Hospital São Lucas" });
    await user.click(screen.getByRole("button", { name: "Criar demanda" }));

    expect(screen.getByText("Selecione o hospital solicitante.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("envia hospitalId no corpo da requisição ao criar a demanda", async () => {
    mockUser = { role: "HOSPITAL", institution: { id: "inst-hosp-a", name: "Hospital São Lucas" } };
    (api.post as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "+ Nova demanda" }));
    await screen.findByRole("option", { name: "Hospital São Lucas" });
    await user.click(screen.getByRole("button", { name: "Criar demanda" }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/demands", expect.objectContaining({ hospitalId: "inst-hosp-a" }))
    );
  });
});
