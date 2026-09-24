export type UserRole = "ADMIN" | "HEMOCENTRO" | "HOSPITAL" | "AUDITOR";
export type InstitutionType = "HEMOCENTRO" | "HOSPITAL";
export type BloodType = "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG";
export type BloodBagStatus =
  | "COLETADA"
  | "EM_TESTE"
  | "APROVADA"
  | "REPROVADA"
  | "ARMAZENADA"
  | "EM_TRANSPORTE"
  | "RECEBIDA"
  | "DISPONIVEL"
  | "RESERVADA"
  | "UTILIZADA"
  | "DESCARTADA"
  | "EXPIRADA";

export type DemandStatus = "ABERTA" | "EM_ANALISE" | "ATENDIDA" | "PARCIALMENTE_ATENDIDA" | "CANCELADA" | "EXPIRADA";
export type DemandUrgency = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
export type TransferStatus = "OFERTADA" | "ACEITA" | "RESERVADA" | "EM_TRANSPORTE" | "RECEBIDA" | "RECUSADA" | "CANCELADA";

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  _count?: { bloodBags: number; demands: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution: Institution | null;
}

export interface BloodBag {
  id: string;
  codigo: string;
  tipoSanguineo: BloodType;
  dataColeta: string;
  dataValidade: string;
  status: BloodBagStatus;
  instituicaoAtual: Institution;
  localizacaoAtual: string;
  temperaturaAtual: number | null;
  qrCode: string | null;
  createdAt: string;
}

export interface BloodBagEvent {
  id: string;
  bagId: string;
  tipoEvento: string;
  descricao: string;
  instituicao: Institution;
  usuario: { id: string; name: string } | null;
  timestamp: string;
  hash: string;
  blockchainTx: { id: string; txHash: string; blockNumber: number | null } | null;
}

export interface BloodDemand {
  id: string;
  hospital: Institution;
  tipoSanguineo: BloodType;
  quantidade: number;
  quantidadeAtendida: number;
  urgencia: DemandUrgency;
  motivo: string;
  status: DemandStatus;
  createdAt: string;
  transfers: BloodTransfer[];
  fornecedoresCompativeis?: { institution: Institution; disponivel: number; tipoSanguineo: string }[];
}

export interface BloodTransfer {
  id: string;
  bagId: string;
  bloodBag: BloodBag;
  sourceInstitution: Institution;
  destinationInstitution: Institution;
  status: TransferStatus;
  createdAt: string;
}

export interface DashboardSummary {
  cards: {
    disponiveis: number;
    emTransporte: number;
    utilizadas: number;
    expiradas: number;
    demandasAbertas: number;
    demandasUrgentes: number;
    transferenciasAndamento: number;
    alertasTemperatura: number;
  };
  estoquePorTipo: { tipoSanguineo: BloodType; label: string; quantidade: number }[];
  movimentacoes: { tipo: string; quantidade: number }[];
  demandasPorStatus: { status: DemandStatus; quantidade: number }[];
}
