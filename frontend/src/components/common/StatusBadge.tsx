// ============================================
// HospitalChain - Status Badge Component
// Academic prototype for blood bag traceability using blockchain
// ============================================

import { clsx } from 'clsx';
import { BloodBagStatus, DemandStatus, TransferStatus } from '../../types';

type StatusType = BloodBagStatus | DemandStatus | TransferStatus;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; color: string; bgColor: string }> = {
  // Blood Bag Statuses
  COLETADA: { label: 'Coletada', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  EM_TESTE: { label: 'Em Teste', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  APROVADA: { label: 'Aprovada', color: 'text-green-600', bgColor: 'bg-green-100' },
  REPROVADA: { label: 'Reprovada', color: 'text-red-600', bgColor: 'bg-red-100' },
  ARMAZENADA: { label: 'Armazenada', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  EM_TRANSPORTE: { label: 'Em Transporte', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  RECEBIDA: { label: 'Recebida', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  DISPONIVEL: { label: 'Disponível', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  RESERVADA: { label: 'Reservada', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  UTILIZADA: { label: 'Utilizada', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  DESCARTADA: { label: 'Descartada', color: 'text-red-800', bgColor: 'bg-red-200' },
  EXPIRADA: { label: 'Expirada', color: 'text-rose-600', bgColor: 'bg-rose-100' },
  
  // Demand Statuses
  ABERTA: { label: 'Aberta', color: 'text-green-600', bgColor: 'bg-green-100' },
  EM_ANALISE: { label: 'Em Análise', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  ATENDIDA: { label: 'Atendida', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  PARCIALMENTE_ATENDIDA: { label: 'Parcialmente Atendida', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  CANCELADA: { label: 'Cancelada', color: 'text-red-600', bgColor: 'bg-red-100' },
  EXPIRADA: { label: 'Expirada', color: 'text-rose-600', bgColor: 'bg-rose-100' },
  
  // Transfer Statuses
  PENDENTE: { label: 'Pendente', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  APROVADA: { label: 'Aprovada', color: 'text-green-600', bgColor: 'bg-green-100' },
  REJEITADA: { label: 'Rejeitada', color: 'text-red-600', bgColor: 'bg-red-100' },
  EM_TRANSPORTE: { label: 'Em Transporte', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  ENTREGUE: { label: 'Entregue', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  CANCELADA: { label: 'Cancelada', color: 'text-gray-600', bgColor: 'bg-gray-100' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status as StatusType] || {
    label: status,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  };

  return (
    <span
      className={clsx(
        'px-2 py-1 rounded-full text-xs font-medium',
        config.color,
        config.bgColor,
        className
      )}
    >
      {config.label}
    </span>
  );
};
