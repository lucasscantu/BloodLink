// ============================================
// HospitalChain Frontend Types
// Academic prototype for blood bag traceability using blockchain
// ============================================

// User Roles
export type UserRole = 'ADMIN' | 'HEMOCENTRO' | 'HOSPITAL' | 'AUDITOR';

// User Type
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId: string;
  institution: Institution;
  createdAt: Date;
  updatedAt: Date;
}

// Institution Type
export interface Institution {
  id: string;
  name: string;
  type: 'HEMOCENTRO' | 'HOSPITAL';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Blood Types
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// Blood Bag Status
export type BloodBagStatus = 
  | 'COLETADA'
  | 'EM_TESTE'
  | 'APROVADA'
  | 'REPROVADA'
  | 'ARMAZENADA'
  | 'EM_TRANSPORTE'
  | 'RECEBIDA'
  | 'DISPONIVEL'
  | 'RESERVADA'
  | 'UTILIZADA'
  | 'DESCARTADA'
  | 'EXPIRADA';

// Blood Bag Type
export interface BloodBag {
  id: string;
  codigo: string;
  tipoSanguineo: BloodType;
  fatorRh: '+' | '-';
  volume: number;
  dataColeta: Date;
  dataValidade: Date;
  status: BloodBagStatus;
  instituicaoAtualId: string;
  localizacaoAtual: string;
  temperaturaAtual: number;
  qrCode: string;
  doadorId: string;
  observations: string;
  instituicaoAtual: Institution;
  createdAt: Date;
  updatedAt: Date;
}

// Demand Status
export type DemandStatus = 
  | 'ABERTA'
  | 'EM_ANALISE'
  | 'ATENDIDA'
  | 'PARCIALMENTE_ATENDIDA'
  | 'CANCELADA'
  | 'EXPIRADA';

// Demand Type
export interface Demand {
  id: string;
  institutionId: string;
  institution: Institution;
  tipoSanguineo: BloodType;
  quantidade: number;
  urgencia: 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA';
  motivo: string;
  status: DemandStatus;
  dataCriacao: Date;
  dataAtendimento: Date | null;
  dataExpiracao: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Transfer Status
export type TransferStatus = 
  | 'PENDENTE'
  | 'APROVADA'
  | 'REJEITADA'
  | 'EM_TRANSPORTE'
  | 'ENTREGUE'
  | 'CANCELADA';

// Transfer Type
export interface Transfer {
  id: string;
  demandaId: string;
  demanda: Demand;
  bolsaId: string;
  bolsa: BloodBag;
  deInstituicaoId: string;
  deInstituicao: Institution;
  paraInstituicaoId: string;
  paraInstituicao: Institution;
  quantidade: number;
  status: TransferStatus;
  dataSolicitacao: Date;
  dataAprovacao: Date | null;
  dataTransporte: Date | null;
  dataRecebimento: Date | null;
  observacoes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Event Types
export type EventType = 
  | 'COLETA'
  | 'TESTE'
  | 'APROVACAO'
  | 'REPROVACAO'
  | 'ARMAZENAMENTO'
  | 'TRANSFERENCIA'
  | 'RECEBIMENTO'
  | 'UTILIZACAO'
  | 'DESCARTE'
  | 'RESERVA';

// Event Type
export interface Event {
  id: string;
  bagId: string;
  bloodBag: BloodBag;
  tipoEvento: EventType;
  descricao: string;
  instituicaoId: string;
  instituicao: Institution;
  usuarioId: string;
  usuario: User;
  timestamp: Date;
  hash: string;
  blockchainTransactionId: string;
  createdAt: Date;
}

// Temperature Reading Type
export interface TemperatureReading {
  id: string;
  bagId: string;
  bloodBag: BloodBag;
  temperature: number;
  timestamp: Date;
  isAlert: boolean;
  alertMessage: string | null;
  createdAt: Date;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter Types
export interface BloodBagFilter {
  tipoSanguineo?: BloodType;
  status?: BloodBagStatus;
  instituicaoId?: string;
  dataColetaFrom?: Date;
  dataColetaTo?: Date;
  dataValidadeFrom?: Date;
  dataValidadeTo?: Date;
}

export interface DemandFilter {
  tipoSanguineo?: BloodType;
  status?: DemandStatus;
  institutionId?: string;
  urgencia?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA';
}

// Form Types
export interface CreateBloodBagForm {
  tipoSanguineo: BloodType;
  fatorRh: '+' | '-';
  volume: number;
  localizacaoAtual: string;
  temperaturaAtual: number;
  observations: string;
}

export interface CreateDemandForm {
  tipoSanguineo: BloodType;
  quantidade: number;
  urgencia: 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA';
  motivo: string;
  dataExpiracao?: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalBloodBags: number;
  availableBloodBags: number;
  inTransitBloodBags: number;
  usedBloodBags: number;
  expiredBloodBags: number;
  openDemands: number;
  urgentDemands: number;
  pendingTransfers: number;
  temperatureAlerts: number;
  bloodBagsByType: Record<BloodType, number>;
  demandsByStatus: Record<DemandStatus, number>;
  transfersByStatus: Record<TransferStatus, number>;
}

// Notification Type
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Map Node Type
export interface MapNode {
  id: string;
  name: string;
  type: 'HEMOCENTRO' | 'HOSPITAL';
  latitude: number;
  longitude: number;
  bloodBags: BloodBag[];
  demands: Demand[];
  transfers: Transfer[];
}

// Chart Data Types
export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

// Select Option Type
export interface SelectOption {
  value: string;
  label: string;
}

// Status Badge Props
export interface StatusBadgeProps {
  status: BloodBagStatus | DemandStatus | TransferStatus;
  className?: string;
}

// Table Column Type
export interface TableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

// Pagination Props
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSize: number;
  totalItems: number;
}

// Modal Props
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Form Props
export interface FormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  children: (props: {
    values: T;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    isSubmitting: boolean;
    errors: Record<string, string>;
  }) => React.ReactNode;
}
