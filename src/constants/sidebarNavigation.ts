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
  LucideIcon,
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

// Dashboard sub-items (previously tabs)
export const DASHBOARD_SUB_ITEMS: SidebarSubItem[] = [
  { id: "overview", title: "개요", path: "/dashboard" },
  { id: "consultation", title: "상담 현황", path: "/dashboard/consultation" },
  { id: "sales", title: "매출 분석", path: "/dashboard/sales" },
  { id: "purchase", title: "매입 분석", path: "/dashboard/purchase" },
  { id: "items", title: "품목 분석", path: "/dashboard/items" },
  { id: "trends", title: "추이 분석", path: "/dashboard/trends" },
  { id: "performance", title: "성과 지표", path: "/dashboard/performance" },
  { id: "clients", title: "거래처 분석", path: "/dashboard/clients" },
  { id: "documents", title: "문서 현황", path: "/dashboard/documents" },
  { id: "todo", title: "할 일", path: "/dashboard/todo" },
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
    ],
  },
  {
    id: "consultations",
    title: "상담 관리",
    icon: MessageSquare,
    subItems: [
      { id: "search", title: "상담내용 검색", path: "/consultations/search" },
      { id: "follow", title: "후속상담 검색", path: "/consultations/follow" },
    ],
  },
  {
    id: "documents",
    title: "문서 관리",
    icon: FileText,
    subItems: [
      { id: "estimate", title: "견적서", path: "/documents/details?type=estimate&status=all" },
      { id: "order", title: "발주서", path: "/documents/details?type=order&status=all" },
      { id: "requestQuote", title: "의뢰서", path: "/documents/details?type=requestQuote&status=all" },
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
    id: "board",
    title: "게시판",
    icon: Newspaper,
    path: "/board",
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

// Admin role menu
export const ADMIN_SIDEBAR_ITEM: SidebarMenuItem = {
  id: "admin",
  title: "관리자",
  icon: Settings,
  roles: ["admin"],
  subItems: [
    { id: "logs", title: "로그", path: "/admin/manage/logs" },
    { id: "deleteRequest", title: "삭제 요청", path: "/admin/delete_request" },
  ],
};

// Build sidebar menu based on user role
export function buildSidebarMenu(
  userId: string | undefined,
  userRole: string | undefined
): SidebarMenuItem[] {
  // Deep copy to prevent mutation
  const items: SidebarMenuItem[] = BASE_SIDEBAR_ITEMS.map((item) => ({
    ...item,
    subItems: item.subItems ? [...item.subItems] : undefined,
  }));


  // Add role-based items
  if (userRole === "research" || userRole === "admin") {
    items.push({ ...RESEARCH_SIDEBAR_ITEM });
  }

  if (userRole === "managementSupport" || userRole === "admin") {
    items.push({ ...MANAGEMENT_SIDEBAR_ITEM });
  }

  if (userRole === "admin") {
    items.push({ ...ADMIN_SIDEBAR_ITEM });
  }

  return items;
}

// Get icon component by menu id (for quick access)
export const MENU_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  companies: Building,
  consultations: MessageSquare,
  documents: FileText,
  pricing: DollarSign,
  board: Newspaper,
  research: Beaker,
  management: ChartBar,
  admin: Settings,
  favorites: Star,
};
