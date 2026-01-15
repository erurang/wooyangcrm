// ================================
// Document Constants
// ================================

export const DOCUMENT_TYPES = {
  ESTIMATE: "estimate",
  ORDER: "order",
  REQUEST_QUOTE: "request_quote",
  INVOICE: "invoice",
} as const;

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  estimate: "견적서",
  order: "발주서",
  request_quote: "견적요청서",
  invoice: "송장",
};

export const DOCUMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELED: "canceled",
  DRAFT: "draft",
} as const;

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  completed: "완료",
  canceled: "취소",
  draft: "임시저장",
};

// ================================
// Consultation Constants
// ================================

export const CONSULTATION_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELED: "canceled",
  FOLLOW_UP: "follow_up",
} as const;

export const CONSULTATION_STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  in_progress: "진행중",
  completed: "완료",
  canceled: "취소",
  follow_up: "후속조치",
};

export const CONSULTATION_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export const CONSULTATION_PRIORITY_LABELS: Record<string, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

// ================================
// Todo Constants
// ================================

export const TODO_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export const TODO_STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  in_progress: "진행중",
  completed: "완료",
};

export const TODO_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export const TODO_PRIORITY_LABELS: Record<string, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
};

// ================================
// User Role Constants
// ================================

export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  USER: "user",
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  admin: "관리자",
  manager: "매니저",
  user: "사용자",
};

// ================================
// Pagination Constants
// ================================

export const DEFAULT_PAGE_SIZE = 15;
export const DEFAULT_PAGE = 1;

export const PAGE_SIZE_OPTIONS = [10, 15, 20, 30, 50] as const;

// ================================
// Date Format Constants
// ================================

export const DATE_FORMAT = {
  DISPLAY: "yyyy-MM-dd",
  DISPLAY_WITH_TIME: "yyyy-MM-dd HH:mm",
  API: "yyyy-MM-dd",
  KOREAN: "yyyy년 MM월 dd일",
} as const;

// ================================
// API Routes
// ================================

export const API_ROUTES = {
  // Auth
  AUTH_TOKEN: "/api/auth-token",
  REFRESH_TOKEN: "/api/refresh-token",
  SEND_CODE: "/api/send-code",

  // Core Resources
  COMPANIES: "/api/companies",
  CONTACTS: "/api/contacts",
  CONSULTATIONS: "/api/consultations",
  DOCUMENTS: "/api/documents",
  PRODUCTS: "/api/products",

  // Management
  MANAGE_CUSTOMERS: "/api/manage/customers",
  MANAGE_CONTACTS: "/api/manage/contacts",

  // Reports
  REPORTS: "/api/reports",
  REPORTS_USERS: "/api/reports/users",
  REPORTS_CUSTOMERS: "/api/reports/customers",

  // Admin
  ADMIN_USERS: "/api/admin/manage/users",
  ADMIN_LOGS: "/api/admin/manage/logs",

  // Dashboard
  DASHBOARD: "/api/dashboard",
  DASHBOARD_SUMMARY: "/api/dashboard/summary",
  DASHBOARD_TODOS: "/api/dashboard/todos",
} as const;

// ================================
// Navigation Routes
// ================================

export const NAV_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  LOGOUT: "/logout",

  // Consultations
  CONSULTATIONS: "/consultations",
  CONSULTATIONS_FOLLOW: "/consultations/follow",
  CONSULTATIONS_RECENT: "/consultations/recent",
  CONSULTATIONS_SEARCH: "/consultations/search",

  // Documents
  DOCUMENTS: "/documents",
  DOCUMENTS_DETAILS: "/documents/details",

  // Management
  MANAGE_CUSTOMERS: "/manage/customers",
  MANAGE_CONTACTS: "/manage/contacts",
  MANAGE_CALENDAR: "/manage/calendar",

  // Products
  PRODUCTS: "/products",
  PRODUCTS_UNIT: "/products/unit",
  PRODUCTS_STOCKS: "/products/stocks",

  // Reports
  REPORTS: "/reports",
  REPORTS_USERS: "/reports/users",
  REPORTS_CUSTOMERS: "/reports/customers",
  REPORTS_PERFORMANCE: "/reports/performance",

  // Admin
  ADMIN_USERS: "/admin/manage/users",
  ADMIN_LOGS: "/admin/manage/logs",

  // My
  MY_TODOS: "/my/todos",
} as const;

// ================================
// Color Constants (Status Colors)
// ================================

export const STATUS_COLORS = {
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-300",
  },
  in_progress: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  completed: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-300",
  },
  canceled: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-300",
  },
  draft: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    border: "border-gray-300",
  },
} as const;

export const PRIORITY_COLORS = {
  low: {
    bg: "bg-gray-100",
    text: "text-gray-700",
  },
  medium: {
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  high: {
    bg: "bg-orange-100",
    text: "text-orange-700",
  },
  urgent: {
    bg: "bg-red-100",
    text: "text-red-700",
  },
} as const;

// ================================
// Message Constants
// ================================

export const ERROR_MESSAGES = {
  REQUIRED_FIELD: "필수 항목입니다.",
  INVALID_EMAIL: "올바른 이메일 형식이 아닙니다.",
  INVALID_PHONE: "올바른 전화번호 형식이 아닙니다.",
  SERVER_ERROR: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  NETWORK_ERROR: "네트워크 연결을 확인해주세요.",
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "접근 권한이 없습니다.",
  NOT_FOUND: "요청한 데이터를 찾을 수 없습니다.",
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: "성공적으로 등록되었습니다.",
  UPDATED: "성공적으로 수정되었습니다.",
  DELETED: "성공적으로 삭제되었습니다.",
  SAVED: "저장되었습니다.",
} as const;
