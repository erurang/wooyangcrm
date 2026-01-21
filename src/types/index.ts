// ================================
// Domain Models
// ================================

/**
 * User 관련 타입
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  role_id?: string;
  level: string;
  position: string;
  team_id?: string;
  team?: Team;
  works_email?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginUser {
  id: string;
  email: string;
  name: string;
  role: string;
  level: string;
  position: string;
  team_id?: string;
  team?: Team;
  worksEmail: string;
}

export interface Role {
  id: string;
  role_name: string;
  description?: string;
}

/**
 * Department (부서) 관련 타입
 */
export interface Department {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  teams?: Team[];
}

/**
 * Team (팀) 관련 타입
 */
export interface Team {
  id: string;
  department_id: string;
  name: string;
  description?: string;
  allowed_menus: string[];
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  department?: Department;
}

export interface TeamWithDepartment extends Team {
  department: Department;
}

/**
 * Company 관련 타입
 */
export interface Company {
  id: string;
  name: string;
  address: string;
  phone: string;
  fax?: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyWithContacts extends Company {
  contacts?: Contact[];
}

/**
 * Contact 관련 타입
 */
export interface Contact {
  id: string;
  company_id: string;
  contact_name: string;
  department?: string;
  position?: string;
  mobile?: string;
  email?: string;
  is_resigned?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ContactWithCompany extends Contact {
  company?: Company;
}

/**
 * Consultation 관련 타입
 */
export interface Consultation {
  id: string;
  company_id: string;
  contact_id: string;
  user_id: string;
  date: string;
  content: string;
  status: ConsultationStatus;
  status_reason?: string;
  priority?: ConsultationPriority;
  follow_date?: string;
  created_at?: string;
  updated_at?: string;
}

export type ConsultationStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "canceled"
  | "follow_up";

export type ConsultationPriority = "low" | "medium" | "high" | "urgent";

export interface ConsultationWithRelations extends Consultation {
  company?: Company;
  contact?: Contact;
  user?: User;
}

/**
 * Document 관련 타입
 */
export interface Document {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  content: string;
  user_id: string;
  document_number: string;
  company_id?: string;
  contact_id?: string;
  total_amount?: number;
  created_at?: string;
  updated_at?: string;
}

export type DocumentType = "estimate" | "order" | "request_quote" | "invoice";

export type DocumentStatus = "pending" | "completed" | "canceled" | "draft";

export interface DocumentWithRelations extends Document {
  company?: Company;
  contact?: Contact;
  user?: User;
  items?: DocumentItem[];
}

export interface DocumentItem {
  id: string;
  document_id: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  note?: string;
}

/**
 * Product 관련 타입
 */
export interface Product {
  id: string;
  name: string;
  code?: string;
  category?: string;
  unit?: string;
  price?: number;
  stock_quantity?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Todo 관련 타입
 */
export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority?: TodoPriority;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
}

export type TodoStatus = "pending" | "in_progress" | "completed";
export type TodoPriority = "low" | "medium" | "high";

// ================================
// API Response Types
// ================================

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  totalPages: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
}

export interface DocumentsSummary {
  type: DocumentType;
  statusCounts: {
    pending: number;
    completed: number;
    canceled: number;
    unknown: number;
  };
}

export interface DocumentsResponse {
  documents: DocumentsSummary[];
  documentDetails: Document[];
}

// ================================
// Form/Input Types
// ================================

export interface CompanyFormData {
  name: string;
  address: string;
  phone: string;
  fax?: string;
  email: string;
}

export interface ContactFormData {
  company_id: string;
  contact_name: string;
  department?: string;
  position?: string;
  mobile?: string;
  email?: string;
}

export interface ConsultationFormData {
  company_id: string;
  contact_id: string;
  user_id: string;
  date: string;
  content: string;
  status?: ConsultationStatus;
  priority?: ConsultationPriority;
  follow_date?: string;
}

export interface DocumentFormData {
  type: DocumentType;
  company_id?: string;
  contact_id?: string;
  content: string;
  items?: Omit<DocumentItem, "id" | "document_id">[];
}

// ================================
// Filter/Search Types
// ================================

export interface ConsultationFilters {
  keyword?: string;
  status?: ConsultationStatus;
  startDate?: string;
  endDate?: string;
  userId?: string;
  companyId?: string;
}

export interface DocumentFilters {
  type?: DocumentType;
  status?: DocumentStatus;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: "asc" | "desc";
}

// ================================
// Dashboard Types
// ================================

export interface DashboardSummary {
  totalConsultations: number;
  pendingConsultations: number;
  completedConsultations: number;
  totalDocuments: number;
  pendingDocuments: number;
  totalClients: number;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface LoginLog {
  id: string;
  user_id: string;
  login_at: string;
  ip_address?: string;
  user_agent?: string;
}

// ================================
// Report Types
// ================================

export interface SalesReport {
  period: string;
  totalAmount: number;
  count: number;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  consultationCount: number;
  documentCount: number;
  completedCount: number;
}

export interface CustomerReport {
  companyId: string;
  companyName: string;
  consultationCount: number;
  documentCount: number;
  totalAmount: number;
}
