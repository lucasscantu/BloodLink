// User Roles
export type UserRole = 'ADMIN' | 'HEMOCENTRO' | 'HOSPITAL' | 'AUDITOR';

// Blood Types
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// Bag Status
export type BagStatus =
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

// Event Types
export type EventType =
  | 'COLETA'
  | 'TESTE'
  | 'APROVACAO'
  | 'REPROVACAO'
  | 'ARMAZENAMENTO'
  | 'TRANSPORTE'
  | 'RECEBIMENTO'
  | 'RESERVA'
  | 'UTILIZACAO'
  | 'DESCARTE'
  | 'EXPIRACAO'
  | 'TRANSFERENCIA_SOLICITADA'
  | 'TRANSFERENCIA_APROVADA'
  | 'TRANSFERENCIA_REJEITADA'
  | 'DEMANDA_CRIADA'
  | 'DEMANDA_ATENDIDA';

// Demand Status
export type DemandStatus =
  | 'ABERTA'
  | 'EM_ANALISE'
  | 'ATENDIDA'
  | 'PARCIALMENTE_ATENDIDA'
  | 'CANCELADA'
  | 'EXPIRADA';

// Demand Urgency
export type DemandUrgency = 'BAIXA' | 'MEDIA' | 'ALTA' | 'EMERGENCIA';

// Transfer Status
export type TransferStatus =
  | 'SOLICITADA'
  | 'APROVADA'
  | 'REJEITADA'
  | 'EM_TRANSPORTE'
  | 'RECEBIDA'
  | 'CANCELADA'
  | 'COMPLETADA';

// Temperature Alert Status
export type TemperatureAlertStatus = 'NORMAL' | 'AVISO' | 'CRITICO';

// Institution Type
export type InstitutionType = 'HEMOCENTRO' | 'HOSPITAL';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
