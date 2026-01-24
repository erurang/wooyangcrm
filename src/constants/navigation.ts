// Navigation menu configuration
// Role-based menu sections are added dynamically in Sidebar component

export interface NavMenuItem {
  id: string;
  title: string;
  path: string;
}

export interface NavMenuSection {
  title: string;
  items: NavMenuItem[];
}

export interface MainMenuItem {
  id: string;
  title: string;
  subItems: SubMenuItem[];
}

export interface SubMenuItem {
  id: string;
  title: string;
  path: string;
}

// Base menu sections (available to all users)
export const BASE_MENU_SECTIONS: NavMenuSection[] = [
  {
    title: "대시보드",
    items: [
      { id: "dashboard", title: "대시보드", path: "/" },
      // mySales는 user.id가 필요하므로 동적으로 추가됨
    ],
  },
  {
    title: "커뮤니케이션",
    items: [
      { id: "messenger", title: "메신저", path: "/chat" },
      { id: "board", title: "게시판", path: "/board" },
      { id: "approvals", title: "결재", path: "/approvals" },
    ],
  },
  {
    title: "거래처 관리",
    items: [
      { id: "customers", title: "거래처 검색", path: "/manage/customers" },
      { id: "contacts", title: "담당자 검색", path: "/manage/contacts" },
      { id: "resignContacts", title: "퇴사자 검색", path: "/manage/contacts/resign" },
      { id: "search", title: "상담내용 검색", path: "/consultations/search" },
      { id: "recent", title: "상담내역 조회", path: "/consultations/recent" },
      { id: "follow_search", title: "후속상담 검색", path: "/consultations/follow" },
    ],
  },
  {
    title: "해외거래처 관리",
    items: [
      { id: "overseas-customers", title: "거래처 검색", path: "/overseas" },
      { id: "overseas-orders", title: "발주 관리", path: "/overseas/orders" },
      { id: "overseas-consultations", title: "상담내역 조회", path: "/overseas/consultations" },
      { id: "customs-costs", title: "통관비용", path: "/overseas/customs-costs" },
    ],
  },
  {
    title: "문서 관리",
    items: [
      { id: "all", title: "전체 문서", path: "/documents/review" },
      { id: "estimate", title: "견적서 관리", path: "/documents/review?type=estimate" },
      { id: "order", title: "발주서 관리", path: "/documents/review?type=order" },
      { id: "requestQuote", title: "의뢰서 관리", path: "/documents/review?type=requestQuote" },
      { id: "costs", title: "비용 대시보드", path: "/documents/costs" },
    ],
  },
  {
    title: "매입/매출 관리",
    items: [
      { id: "order-unit", title: "매입 단가 관리", path: "/products/unit?type=order" },
      { id: "estimate-unit", title: "매출 단가 관리", path: "/products/unit?type=estimate" },
    ],
  },
  {
    title: "재고 관리",
    items: [
      { id: "inventory-calendar", title: "캘린더", path: "/inventory/calendar" },
      { id: "inventory-inbound", title: "입고 관리", path: "/inventory/inbound" },
      { id: "inventory-outbound", title: "출고 관리", path: "/inventory/outbound" },
    ],
  },
];

// Research role menu section
export const RESEARCH_MENU_SECTION: NavMenuSection = {
  title: "연구실",
  items: [
    { id: "rndsorg", title: "지원기관 검색", path: "/manage/orgs" },
    { id: "rnds", title: "R&D 검색", path: "/manage/rnds" },
    { id: "brnds", title: "비 R&D 검색", path: "/manage/brnds" },
    { id: "develop", title: "개발건 검색", path: "/manage/develop" },
    { id: "develop_contacts", title: "담당자 검색", path: "/manage/develop_contacts" },
  ],
};

// Management support role menu section
export const MANAGEMENT_SUPPORT_MENU_SECTION: NavMenuSection = {
  title: "경영지원",
  items: [
    { id: "sales-users", title: "직원", path: "/reports/users" },
    { id: "sales-customers", title: "거래처", path: "/reports/customers" },
    { id: "sales-report", title: "매출/매입 리포트", path: "/reports" },
  ],
};

// Admin role menu section
export const ADMIN_MENU_SECTION: NavMenuSection = {
  title: "관리자",
  items: [
    { id: "logs", title: "로그", path: "/admin/manage/logs" },
    { id: "deleteRequest", title: "삭제 요청", path: "/admin/delete_request" },
  ],
};

// Helper function to build menu sections based on user role
export function buildMenuSections(
  userId: string | undefined,
  userRole: string | undefined
): NavMenuSection[] {
  // Deep copy base sections
  const sections: NavMenuSection[] = BASE_MENU_SECTIONS.map((section) => ({
    ...section,
    items: [...section.items],
  }));

  // Add mySales to dashboard section if user is logged in
  if (userId) {
    const dashboardSection = sections.find((s) => s.title === "대시보드");
    if (dashboardSection) {
      dashboardSection.items.push({
        id: "mySales",
        title: "영업 기록",
        path: `/reports/users/${userId}`,
      });
    }
  }

  // Add role-based sections
  if (userRole === "research" || userRole === "admin") {
    sections.push({ ...RESEARCH_MENU_SECTION, items: [...RESEARCH_MENU_SECTION.items] });
  }

  if (userRole === "managementSupport" || userRole === "admin") {
    sections.push({ ...MANAGEMENT_SUPPORT_MENU_SECTION, items: [...MANAGEMENT_SUPPORT_MENU_SECTION.items] });
  }

  if (userRole === "admin") {
    sections.push({ ...ADMIN_MENU_SECTION, items: [...ADMIN_MENU_SECTION.items] });
  }

  return sections;
}

// Convert menu sections to main menu format
export function convertToMainMenu(sections: NavMenuSection[]): MainMenuItem[] {
  return sections.map((section) => ({
    id: section.title,
    title: section.title,
    subItems: section.items.map((item) => ({
      id: item.id,
      title: item.title,
      path: item.path,
    })),
  }));
}
