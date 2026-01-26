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
  MessageCircle,
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
  FileSignature,
  FolderKanban,
  Wallet,
  Award,
  FileStack,
  Milestone,
  UsersRound,
  Landmark,
  BookOpen,
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

// Dashboard - 홈 + 성과지표 + 업무일지
export const DASHBOARD_SUB_ITEMS: SidebarSubItem[] = [
  { id: "home", title: "홈", path: "/dashboard" },
  { id: "performance", title: "성과지표", path: "/reports/performance/__USER_ID__" },
  { id: "daily-report", title: "업무일지", path: "/reports/daily" },
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
      { id: "consultation-calendar", title: "상담 캘린더", path: "/consultations/calendar" },
      { id: "recent", title: "상담내역 조회", path: "/consultations/recent" },
      { id: "follow", title: "후속상담 검색", path: "/consultations/follow" },
      { id: "domestic-shipping", title: "배송현황", path: "/shipping/domestic" },
    ],
  },
  {
    id: "overseas",
    title: "해외거래처 관리",
    icon: Globe,
    subItems: [
      { id: "overseas-customers", title: "거래처 검색", path: "/overseas" },
      { id: "overseas-orders", title: "발주 관리", path: "/overseas/orders" },
      { id: "overseas-consultations", title: "상담내역 조회", path: "/overseas/consultations" },
      { id: "customs-costs", title: "통관비용", path: "/overseas/customs-costs" },
      { id: "shipping", title: "FedEx 배송현황", path: "/shipping" },
    ],
  },
  {
    id: "documents",
    title: "문서 관리",
    icon: FileText,
    subItems: [
      { id: "calendar", title: "문서 캘린더", path: "/documents/calendar" },
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
      { id: "suggestions", title: "발주 권장", path: "/inventory/suggestions" },
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
  {
    id: "approvals",
    title: "결재",
    icon: FileSignature,
    subItems: [
      { id: "pending", title: "결재 대기", path: "/approvals?tab=pending" },
      { id: "requested", title: "내가 기안", path: "/approvals?tab=requested" },
      { id: "completed", title: "완료 문서", path: "/approvals?tab=approved" },
      { id: "new", title: "새 결재", path: "/approvals/new" },
    ],
  },
  {
    id: "messenger",
    title: "메신저",
    icon: MessageCircle,
    path: "/chat",
  },
];

// Research role menu - 국가과제 R&D 관리
export const RESEARCH_SIDEBAR_ITEM: SidebarMenuItem = {
  id: "research",
  title: "국가과제 R&D",
  icon: FlaskConical,
  roles: ["research", "admin"],
  subItems: [
    { id: "rnd-dashboard", title: "과제 현황", path: "/manage/rnds/dashboard" },
    { id: "rnds", title: "과제 관리", path: "/manage/rnds" },
    { id: "orgs", title: "지원기관 관리", path: "/manage/orgs" },
    { id: "rnd-budgets", title: "예산 현황", path: "/manage/rnds/budgets" },
    { id: "rnd-outcomes", title: "성과물 관리", path: "/manage/rnds/outcomes" },
    { id: "rnd-reports", title: "보고서 일정", path: "/manage/rnds/reports" },
    { id: "rnd-researchers", title: "연구인력 현황", path: "/manage/rnds/researchers" },
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
    { id: "teams", title: "부서/팀 관리", path: "/admin/manage/teams" },
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
    { id: "approval-rules", title: "결재 자동화 규칙", path: "/admin/approvals/rules" },
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

// Position-based menu restrictions (레거시 지원)
// "생산관리" position can only see: dashboard, production, inventory, board, approvals
const PRODUCTION_ALLOWED_MENUS = ["dashboard", "production", "inventory", "board", "approvals"];

// Build sidebar menu based on user role, team's allowed_menus, and role-based sidebar permissions
export function buildSidebarMenu(
  userId: string | undefined,
  userRole: string | undefined,
  userPosition?: string | null,
  teamAllowedMenus?: string[] | null,
  sidebarPermissions?: string[] | null  // role_permissions 테이블에서 가져온 권한
): SidebarMenuItem[] {
  // Deep copy to prevent mutation and inject user ID
  let items: SidebarMenuItem[] = BASE_SIDEBAR_ITEMS.map((item) => ({
    ...item,
    subItems: item.subItems
      ? item.subItems.map((sub) => ({
          ...sub,
          path: sub.path.replace("__USER_ID__", userId || ""),
        }))
      : undefined,
  }));

  // Admin은 모든 메뉴 접근 가능
  if (userRole === "admin") {
    // Add role-based items for admin
    items.push({ ...RESEARCH_SIDEBAR_ITEM });
    items.push({ ...MANAGEMENT_SIDEBAR_ITEM });
    items.push({ ...ADMIN_USERS_SIDEBAR_ITEM });
    items.push({ ...ADMIN_SYSTEM_SIDEBAR_ITEM });
    items.push({ ...ADMIN_CONTENT_SIDEBAR_ITEM });
    items.push({ ...ADMIN_DATA_SIDEBAR_ITEM });
    items.push({ ...ADMIN_SECURITY_SIDEBAR_ITEM });
    return items;
  }

  // 1순위: role_permissions 테이블의 사이드바 권한 (가장 세밀한 제어)
  if (sidebarPermissions && sidebarPermissions.length > 0) {
    items = items.filter((item) => sidebarPermissions.includes(item.id));

    // role-based 메뉴도 sidebarPermissions에 포함된 경우에만 추가
    if (sidebarPermissions.includes("research")) {
      items.push({ ...RESEARCH_SIDEBAR_ITEM });
    }
    if (sidebarPermissions.includes("management")) {
      items.push({ ...MANAGEMENT_SIDEBAR_ITEM });
    }
    return items;
  }

  // 2순위: 팀의 allowed_menus가 설정된 경우 해당 메뉴만 표시
  if (teamAllowedMenus && teamAllowedMenus.length > 0) {
    items = items.filter((item) => teamAllowedMenus.includes(item.id));

    // role-based 메뉴도 allowed_menus에 포함된 경우에만 추가
    if (teamAllowedMenus.includes("research") && (userRole === "research")) {
      items.push({ ...RESEARCH_SIDEBAR_ITEM });
    }
    if (teamAllowedMenus.includes("management") && (userRole === "managementSupport")) {
      items.push({ ...MANAGEMENT_SIDEBAR_ITEM });
    }
    return items;
  }

  // 3순위: 레거시 position으로 필터링 (team과 sidebarPermissions가 없는 경우)
  if (userPosition === "생산관리") {
    items = items.filter((item) => PRODUCTION_ALLOWED_MENUS.includes(item.id));
    return items;
  }

  // 기본: role-based items (권한 설정이 없는 경우 모든 기본 메뉴 표시)
  if (userRole === "research") {
    items.push({ ...RESEARCH_SIDEBAR_ITEM });
  }
  if (userRole === "managementSupport") {
    items.push({ ...MANAGEMENT_SIDEBAR_ITEM });
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
  approvals: FileSignature,
  messenger: MessageCircle,
  research: FlaskConical,
  management: ChartBar,
  admin: Settings,
  favorites: Star,
  // R&D 서브메뉴 아이콘
  "rnd-dashboard": FolderKanban,
  rnds: BookOpen,
  orgs: Landmark,
  "rnd-budgets": Wallet,
  "rnd-outcomes": Award,
  "rnd-reports": FileStack,
  "rnd-researchers": UsersRound,
};
