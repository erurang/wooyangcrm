// Sidebar Navigation Configuration
// VSCode-style collapsible sidebar with icons

import {
  LayoutDashboard,
  Users,
  BarChart3,
  PieChart,
  Target,
  TrendingUp,
  Building,
  Package,
  CheckCircle,
  FileText,
  Search,
  UserCheck,
  UserX,
  MessageSquare,
  CalendarClock,
  Clock,
  Receipt,
  FileCheck,
  FileQuestion,
  DollarSign,
  Beaker,
  Building2,
  Microscope,
  FlaskConical,
  Wrench,
  Contact,
  ChartBar,
  Users2,
  ClipboardList,
  Settings,
  ScrollText,
  Trash2,
  Star,
  Newspaper,
  Globe,
  Ship,
  LucideIcon,
  Shield,
  Database,
  Bell,
  Activity,
  FileBarChart,
  Megaphone,
  History,
  KeyRound,
  ServerCog,
  HardDrive,
  AlertTriangle,
  Lock,
  Eye,
  UserCog,
  Gauge,
  Factory,
} from "lucide-react";

export interface SidebarSubItem {
  id: string;
  title: string;
  path: string;
}

export interface SidebarMenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  path?: string; // Direct path if no sub-items
  subItems?: SidebarSubItem[];
  roles?: string[]; // Required roles (empty = all users)
}

// Dashboard - 홈 + 성과지표
export const DASHBOARD_SUB_ITEMS: SidebarSubItem[] = [
  { id: "home", title: "홈", path: "/dashboard" },
  { id: "performance", title: "성과지표", path: "/reports/performance/__USER_ID__" },
];

// Base menu items (available to all users)
export const BASE_SIDEBAR_ITEMS: SidebarMenuItem[] = [
  {
    id: "dashboard",
    title: "대시보드",
    icon: LayoutDashboard,
    subItems: DASHBOARD_SUB_ITEMS,
  },
  {
    id: "companies",
    title: "거래처 관리",
    icon: Building,
    subItems: [
      { id: "customers", title: "거래처 검색", path: "/manage/customers" },
      { id: "contacts", title: "담당자 검색", path: "/manage/contacts" },
      { id: "resignContacts", title: "퇴사자 검색", path: "/manage/contacts/resign" },
      { id: "recent", title: "상담내역 조회", path: "/consultations/recent" },
      { id: "follow", title: "후속상담 검색", path: "/consultations/follow" },
    ],
  },
  {
    id: "overseas",
    title: "해외거래처 관리",
    icon: Globe,
    subItems: [
      { id: "overseas-customers", title: "거래처 검색", path: "/overseas" },
      { id: "overseas-consultations", title: "상담내역 조회", path: "/overseas/consultations" },
      { id: "customs-costs", title: "통관비용", path: "/overseas/customs-costs" },
    ],
  },
  {
    id: "documents",
    title: "문서 관리",
    icon: FileText,
    subItems: [
      { id: "all", title: "전체 문서", path: "/documents/review" },
      { id: "estimate", title: "견적서", path: "/documents/review?type=estimate" },
      { id: "order", title: "발주서", path: "/documents/review?type=order" },
      { id: "requestQuote", title: "의뢰서", path: "/documents/review?type=requestQuote" },
    ],
  },
  {
    id: "pricing",
    title: "단가 관리",
    icon: DollarSign,
    subItems: [
      { id: "order-unit", title: "매입 단가", path: "/products/unit?type=order" },
      { id: "estimate-unit", title: "매출 단가", path: "/products/unit?type=estimate" },
    ],
  },
  {
    id: "production",
    title: "생산관리",
    icon: Factory,
    subItems: [
      { id: "production-calendar", title: "생산 일정 캘린더", path: "/production/calendar" },
      { id: "work-orders", title: "작업지시", path: "/production/work-orders" },
      { id: "production-inventory", title: "원자재 재고", path: "/production/inventory" },
      { id: "products", title: "제품 관리", path: "/production/products" },
      { id: "records", title: "생산 기록", path: "/production/records" },
    ],
  },
  {
    id: "inventory",
    title: "재고",
    icon: Package,
    subItems: [
      { id: "calendar", title: "캘린더", path: "/inventory/calendar" },
      { id: "inbound", title: "입고", path: "/inventory/inbound" },
      { id: "outbound", title: "출고", path: "/inventory/outbound" },
    ],
  },
  {
    id: "board",
    title: "게시판",
    icon: Newspaper,
    subItems: [
      { id: "notice", title: "공지사항", path: "/board?category=공지사항" },
      { id: "free", title: "자유게시판", path: "/board?category=자유게시판" },
      { id: "files", title: "자료실", path: "/board?category=자료실" },
      { id: "myPosts", title: "내 글", path: "/profile/posts" },
    ],
  },
];

// Research role menu
export const RESEARCH_SIDEBAR_ITEM: SidebarMenuItem = {
  id: "research",
  title: "연구실",
  icon: Beaker,
  roles: ["research", "admin"],
  subItems: [
    { id: "orgs", title: "지원기관 검색", path: "/manage/orgs" },
    { id: "rnds", title: "R&D 검색", path: "/manage/rnds" },
    { id: "brnds", title: "비 R&D 검색", path: "/manage/brnds" },
    { id: "develop", title: "개발건 검색", path: "/manage/develop" },
    { id: "develop_contacts", title: "담당자 검색", path: "/manage/develop_contacts" },
  ],
};

// Management support role menu
export const MANAGEMENT_SIDEBAR_ITEM: SidebarMenuItem = {
  id: "management",
  title: "경영지원",
  icon: ChartBar,
  roles: ["managementSupport", "admin"],
  subItems: [
    { id: "users", title: "직원", path: "/reports/users" },
    { id: "customers", title: "거래처", path: "/reports/customers" },
    { id: "report", title: "매출/매입 리포트", path: "/reports" },
  ],
};

// Admin role menu - 사용자 관리
export const ADMIN_USERS_SIDEBAR_ITEM: SidebarMenuItem = {
  id: "admin-users",
  title: "사용자 관리",
  icon: UserCog,
  roles: ["admin"],
  subItems: [
    { id: "roles", title: "직원/권한 관리", path: "/admin/manage/roles" },
    { id: "sessions", title: "접속 현황", path: "/admin/manage/sessions" },
  ],
};

// Admin role menu - 시스템 관리
export const ADMIN_SYSTEM_SIDEBAR_ITEM: SidebarMenuItem = {
  id: "admin-system",
  title: "시스템 관리",
  icon: ServerCog,
  roles: ["admin"],
  subItems: [
    { id: "notifications", title: "알림 트리거", path: "/admin/notifications" },
    { id: "api-monitor", title: "API 모니터링", path: "/admin/api-monitor" },
  ],
};

// Admin role menu - 콘텐츠 관리
export const ADMIN_CONTENT_SIDEBAR_ITEM: SidebarMenuItem = {
  id: "admin-content",
  title: "콘텐츠 관리",
  icon: Megaphone,
  roles: ["admin"],
  subItems: [
    { id: "announcements", title: "공지사항 관리", path: "/admin/announcements" },
    { id: "deleteRequest", title: "삭제 요청", path: "/admin/delete_request" },
    { id: "board-manage", title: "게시판 관리", path: "/admin/board" },
  ],
};

// Admin role menu - 데이터 관리
export const ADMIN_DATA_SIDEBAR_ITEM: SidebarMenuItem = {
  id: "admin-data",
  title: "데이터 관리",
  icon: Database,
  roles: ["admin"],
  subItems: [
    { id: "backup", title: "백업/복원", path: "/admin/backup" },
    { id: "statistics", title: "데이터 통계", path: "/admin/statistics" },
    { id: "audit", title: "감사 로그", path: "/admin/audit" },
  ],
};

// Admin role menu - 보안 관리
export const ADMIN_SECURITY_SIDEBAR_ITEM: SidebarMenuItem = {
  id: "admin-security",
  title: "보안 관리",
  icon: Shield,
  roles: ["admin"],
  subItems: [
    { id: "access-logs", title: "접속 이력", path: "/admin/security/access-logs" },
    { id: "ip-block", title: "IP 차단", path: "/admin/security/ip-block" },
    { id: "security-settings", title: "보안 설정", path: "/admin/security/settings" },
  ],
};

// Build sidebar menu based on user role
export function buildSidebarMenu(
  userId: string | undefined,
  userRole: string | undefined
): SidebarMenuItem[] {
  // Deep copy to prevent mutation and inject user ID
  const items: SidebarMenuItem[] = BASE_SIDEBAR_ITEMS.map((item) => ({
    ...item,
    subItems: item.subItems
      ? item.subItems.map((sub) => ({
          ...sub,
          path: sub.path.replace("__USER_ID__", userId || ""),
        }))
      : undefined,
  }));


  // Add role-based items
  if (userRole === "research" || userRole === "admin") {
    items.push({ ...RESEARCH_SIDEBAR_ITEM });
  }

  if (userRole === "managementSupport" || userRole === "admin") {
    items.push({ ...MANAGEMENT_SIDEBAR_ITEM });
  }

  // Admin role - 5개의 관리자 메뉴 카테고리
  if (userRole === "admin") {
    items.push({ ...ADMIN_USERS_SIDEBAR_ITEM });
    items.push({ ...ADMIN_SYSTEM_SIDEBAR_ITEM });
    items.push({ ...ADMIN_CONTENT_SIDEBAR_ITEM });
    items.push({ ...ADMIN_DATA_SIDEBAR_ITEM });
    items.push({ ...ADMIN_SECURITY_SIDEBAR_ITEM });
  }

  return items;
}

// Get icon component by menu id (for quick access)
export const MENU_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  companies: Building,
  overseas: Globe,
  documents: FileText,
  pricing: DollarSign,
  inventory: Package,
  production: Factory,
  board: Newspaper,
  research: Beaker,
  management: ChartBar,
  admin: Settings,
  favorites: Star,
};
