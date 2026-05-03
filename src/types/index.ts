export type TitleSituation =
  | "PENDING_APPROVAL"
  | "RELEASED"
  | "PAID"
  | "RECEIVED"
  | "CANCELED"
  | "AGREED"
  | "BANK"
  | "OVERDUE";

export type PaymentMethod =
  | "CASH"
  | "PIX"
  | "TED"
  | "DOC"
  | "CHECK"
  | "CARD"
  | "ADF_COMPENSATION"
  | "BANK_SLIP";

export type DocumentOriginType =
  | "CONTRACT"
  | "ENROLLMENT"
  | "REENROLLMENT"
  | "INVOICE_IN"
  | "RECEIPT"
  | "OTHER";

export type RatingType = "STUDENT" | "CLASS" | "TEACHER" | "GENERAL";
export type AgreementType = "REPAIR" | "RENEGOTIATION" | "DISCOUNT" | "SETTLEMENT";
export type AdfType = "OUTFLOW" | "INFLOW";
export type RemittanceType = "PAYMENT" | "COLLECTION";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "DELEGATED";

export interface Tenant {
  id: string;
  cnpj: string;
  companyName: string;
  tradeName?: string;
  logoUrl?: string;
  economicGroupId: string;
  economicGroupName: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  image?: string;
  currentTenantId: string;
  tenants: Tenant[];
}

export interface PaymentTitle {
  id: string;
  tenantId: string;
  supplierId: string;
  supplierName: string;
  documentType: DocumentOriginType;
  documentNumber?: string;
  emissionDate: string;
  dueDate: string;
  originalValue: number;
  currentBalance: number;
  discountAmount: number;
  interestAmount: number;
  situation: TitleSituation;
  paymentMethod?: PaymentMethod;
  observation?: string;
  ctbNominalDone: boolean;
  isModified: boolean;
  createdAt: string;
  createdBy: string;
}

export interface ReceivableTitle {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  documentType: DocumentOriginType;
  documentNumber?: string;
  emissionDate: string;
  dueDate: string;
  originalValue: number;
  currentBalance: number;
  discountAmount: number;
  interestAmount: number;
  fineAmount: number;
  situation: TitleSituation;
  createdAt: string;
}

export interface DashboardSummary {
  currentBalance: number;
  weekReceivables: number;
  monthReceivables: number;
  weekPayables: number;
  monthPayables: number;
  netPosition: number;
  overdueReceivables: number;
  overduePayables: number;
}

export interface CashFlowItem {
  period: string;
  label: string;
  inflows: number;
  outflows: number;
  balance: number;
  isProjection: boolean;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
