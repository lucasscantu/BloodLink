import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ScanQrCode from "./ScanQrCode";

const renderMock = vi.fn();
const clearMock = vi.fn().mockResolvedValue(undefined);
let capturedOnScanSuccess: ((decodedText: string) => void) | null = null;

vi.mock("html5-qrcode", () => ({
  Html5QrcodeScanner: vi.fn().mockImplementation(function (this: any) {
    this.render = (onScanSuccess: (text: string) => void) => {
      capturedOnScanSuccess = onScanSuccess;
      renderMock();
    };
    this.clear = clearMock;
  }),
  Html5QrcodeSupportedFormats: { QR_CODE: "QR_CODE" },
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <ScanQrCode />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedOnScanSuccess = null;
  Object.defineProperty(window.navigator, "mediaDevices", {
    value: { getUserMedia: vi.fn() },
    configurable: true,
  });
});

describe("ScanQrCode", () => {
  it("inicializa o scanner de câmera ao montar", () => {
    renderPage();
    expect(renderMock).toHaveBeenCalled();
    expect(screen.getByTestId("qr-reader")).toBeInTheDocument();
  });

  it("navega para a página da bolsa quando um QR Code (URL completa) é lido com sucesso", async () => {
    renderPage();
    expect(capturedOnScanSuccess).not.toBeNull();

    capturedOnScanSuccess!("https://app.bloodlink.com/blood-bags/O--2026-00001");

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/blood-bags/O--2026-00001"));
  });

  it("mostra um aviso quando o navegador não tem suporte a câmera", () => {
    Object.defineProperty(window.navigator, "mediaDevices", { value: undefined, configurable: true });
    renderPage();
    expect(screen.getByText(/não tem suporte a acesso à câmera/i)).toBeInTheDocument();
  });

  it("permite digitar o código manualmente e navegar para a bolsa", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText("Código da bolsa"), "O--2026-00001");
    await user.click(screen.getByRole("button", { name: "Abrir bolsa" }));

    expect(navigateMock).toHaveBeenCalledWith("/blood-bags/O--2026-00001");
  });

  it("não navega se o campo manual estiver vazio", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Abrir bolsa" }));

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
