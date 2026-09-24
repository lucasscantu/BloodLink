import { PageHeader, Card } from "../components/UI";

export default function Settings() {
  return (
    <div>
      <PageHeader title="Configurações" subtitle="Parâmetros do protótipo" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Faixa segura de temperatura</h2>
          <p className="text-sm text-slate-600">2,0 °C a 6,0 °C (padrão para armazenamento de concentrado de hemácias).</p>
          <p className="mt-2 text-xs text-slate-400">Configurado em backend/src/services/TemperatureService.ts</p>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Validade padrão da bolsa</h2>
          <p className="text-sm text-slate-600">42 dias a partir da data de coleta.</p>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Rede blockchain</h2>
          <p className="text-sm text-slate-600">EVM local (Hardhat), contrato BloodChainRegistry.sol.</p>
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Aviso acadêmico</h2>
          <p className="text-sm text-slate-600">
            Este é um protótipo acadêmico. Não deve ser utilizado como software médico em ambiente de produção real.
          </p>
        </Card>
      </div>
    </div>
  );
}
