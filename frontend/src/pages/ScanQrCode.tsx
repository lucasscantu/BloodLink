import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { PageHeader, Card } from "../components/UI";
import { extractBagCodeFromScan } from "../utils/qrcode";

const SCANNER_ELEMENT_ID = "qr-reader";

export default function ScanQrCode() {
  const navigate = useNavigate();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    let cancelled = false;

    const scanner = new Html5QrcodeScanner(
      SCANNER_ELEMENT_ID,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        rememberLastUsedCamera: true,
      },
      /* verbose */ false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        if (cancelled) return;
        const codigo = extractBagCodeFromScan(decodedText);
        // Evita navegar de novo caso o componente já tenha sido desmontado
        // ou o mesmo quadro seja decodificado múltiplas vezes seguidas.
        cancelled = true;
        scanner.clear().catch(() => undefined);
        navigate(`/blood-bags/${encodeURIComponent(codigo)}`);
      },
      () => {
        // Chamado a cada quadro sem QR Code detectado — ignorado silenciosamente,
        // faz parte do funcionamento normal do scanner.
      }
    );

    // A biblioteca não expõe um evento de "permissão negada" diretamente;
    // detectamos indiretamente checando se o navegador oferece câmera.
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Este navegador não tem suporte a acesso à câmera. Use o campo abaixo para digitar o código da bolsa.");
    }

    return () => {
      cancelled = true;
      scannerRef.current?.clear().catch(() => undefined);
    };
  }, [navigate]);

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    navigate(`/blood-bags/${encodeURIComponent(manualCode.trim())}`);
  }

  return (
    <div>
      <PageHeader
        title="Escanear QR Code"
        subtitle="Aponte a câmera para o QR Code impresso na bolsa para abrir seu histórico"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Câmera</h2>
          {cameraError && <p className="mb-3 text-sm text-amber-600">{cameraError}</p>}
          {/* O html5-qrcode injeta a interface (vídeo + controles) diretamente neste elemento */}
          <div id={SCANNER_ELEMENT_ID} data-testid="qr-reader" />
          <p className="mt-3 text-xs text-slate-400">
            O navegador vai pedir permissão de acesso à câmera. Nenhuma imagem é enviada a um servidor — a leitura
            acontece localmente, no seu dispositivo.
          </p>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Ou digite o código da bolsa</h2>
          <p className="mb-3 text-xs text-slate-500">
            Útil quando a câmera não está disponível, a permissão foi negada, ou o QR Code está danificado.
          </p>
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="manual-bag-code" className="text-xs font-medium text-slate-600">
                Código da bolsa
              </label>
              <input
                id="manual-bag-code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex.: O--2026-00001"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Abrir bolsa
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
