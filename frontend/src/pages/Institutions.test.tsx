import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Institutions from "./Institutions";
import { api } from "../services/api";

vi.mock("../services/api", () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

let mockUser: { role: string } | null = null;
vi.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

function renderPage() {
  (api.get as any).mockResolvedValue({ data: [] });
  return render(<Institutions />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Institutions — formulário de criação (só ADMIN)", () => {
  it("não mostra o botão de criar instituição para HOSPITAL/HEMOCENTRO", async () => {
    mockUser = { role: "HOSPITAL" };
    renderPage();
    await screen.findByText("0 instituição(ões) na rede");
    expect(screen.queryByRole("button", { name: "+ Nova instituição" })).not.toBeInTheDocument();
  });

  it("mostra o botão e o formulário de criação para ADMIN", async () => {
    mockUser = { role: "ADMIN" };
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "+ Nova instituição" }));
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Latitude")).toBeInTheDocument();
  });

  it("valida que latitude/longitude precisam ser números antes de enviar", async () => {
    mockUser = { role: "ADMIN" };
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "+ Nova instituição" }));
    await user.type(screen.getByLabelText("Nome"), "Hospital Teste");
    await user.type(screen.getByLabelText("Cidade"), "Erechim");
    await user.type(screen.getByLabelText("Estado"), "RS");
    await user.type(screen.getByLabelText("Latitude"), "não-é-numero");
    await user.type(screen.getByLabelText("Longitude"), "-52.0");
    await user.click(screen.getByRole("button", { name: "Criar instituição" }));

    expect(screen.getByText("Latitude e longitude precisam ser números válidos.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("envia os dados corretos ao criar uma instituição válida", async () => {
    mockUser = { role: "ADMIN" };
    (api.post as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole("button", { name: "+ Nova instituição" }));
    await user.type(screen.getByLabelText("Nome"), "Hospital Teste");
    await user.selectOptions(screen.getByLabelText("Tipo"), "HEMOCENTRO");
    await user.type(screen.getByLabelText("Cidade"), "Erechim");
    await user.type(screen.getByLabelText("Estado"), "RS");
    await user.type(screen.getByLabelText("Latitude"), "-27.635");
    await user.type(screen.getByLabelText("Longitude"), "-52.274");
    await user.click(screen.getByRole("button", { name: "Criar instituição" }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/institutions", {
        name: "Hospital Teste",
        type: "HEMOCENTRO",
        city: "Erechim",
        state: "RS",
        latitude: -27.635,
        longitude: -52.274,
      })
    );
  });
});
