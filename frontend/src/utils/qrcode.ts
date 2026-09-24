/**
 * O QR Code de cada bolsa (ver BloodBagDetail.tsx) codifica uma URL completa,
 * por exemplo: "https://app.bloodlink.com/blood-bags/O--2026-00001".
 *
 * Esta função extrai o código da bolsa (ex.: "O--2026-00001") a partir do
 * texto bruto lido pela câmera, aceitando três formatos de entrada:
 *   1. Uma URL completa (com http/https) contendo "/blood-bags/<codigo>";
 *   2. Um caminho relativo, como "/blood-bags/<codigo>";
 *   3. O próprio código da bolsa, caso alguém aponte a câmera para um QR
 *      (ou digite manualmente) contendo só o código, sem URL nenhuma.
 */
export function extractBagCodeFromScan(rawValue: string): string {
  const trimmed = rawValue.trim();

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/blood-bags\/([^/?#]+)/);
    if (match) return decodeURIComponent(match[1]);
  } catch {
    // Não é uma URL absoluta válida — tenta como caminho relativo abaixo.
  }

  const pathMatch = trimmed.match(/\/blood-bags\/([^/?#]+)/);
  if (pathMatch) return decodeURIComponent(pathMatch[1]);

  return trimmed;
}
