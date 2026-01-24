import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// 권한 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (roleId) {
      // 특정 역할의 권한 조회
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .eq("role_id", roleId);

      if (error) throw error;

      return NextResponse.json({ permissions: data || [] });
    }

    // 모든 권한 조회
    const { data, error } = await supabase
      .from("role_permissions")
      .select("*")
      .order("role_id")
      .order("category")
      .order("permission_key");

    if (error) throw error;

    // 역할별로 그룹화
    const grouped: Record<number, Record<string, boolean>> = {};
    data?.forEach((p) => {
      if (!grouped[p.role_id]) {
        grouped[p.role_id] = {};
      }
      grouped[p.role_id][p.permission_key] = p.is_enabled;
    });

    return NextResponse.json({ permissions: data || [], grouped });
  } catch (error) {
    console.error("권한 조회 오류:", error);
    return NextResponse.json(
      { error: "권한을 조회할 수 없습니다" },
      { status: 500 }
    );
  }
}

// 권한 업데이트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleId, permissionKey, isEnabled } = body;

    if (!roleId || !permissionKey) {
      return NextResponse.json(
        { error: "roleId와 permissionKey가 필요합니다" },
        { status: 400 }
      );
    }

    // upsert로 권한 업데이트
    const { data, error } = await supabase
      .from("role_permissions")
      .upsert(
        {
          role_id: roleId,
          permission_key: permissionKey,
          permission_name: getPermissionName(permissionKey),
          category: getPermissionCategory(permissionKey),
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "role_id,permission_key" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, permission: data });
  } catch (error) {
    console.error("권한 업데이트 오류:", error);
    return NextResponse.json(
      { error: "권한을 업데이트할 수 없습니다" },
      { status: 500 }
    );
  }
}

// 역할별 전체 권한 일괄 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleId, permissions } = body;

    if (!roleId || !permissions) {
      return NextResponse.json(
        { error: "roleId와 permissions가 필요합니다" },
        { status: 400 }
      );
    }

    // 기존 권한 삭제
    const { error: deleteError } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", roleId);

    if (deleteError) throw deleteError;

    // 새 권한 일괄 삽입
    const permissionRecords = Object.entries(permissions).map(([key, enabled]) => ({
      role_id: roleId,
      permission_key: key,
      permission_name: getPermissionName(key),
      category: getPermissionCategory(key),
      is_enabled: enabled,
    }));

    if (permissionRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("role_permissions")
        .insert(permissionRecords);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("권한 일괄 업데이트 오류:", error);
    return NextResponse.json(
      { error: "권한을 일괄 업데이트할 수 없습니다" },
      { status: 500 }
    );
  }
}

// 권한 배치 업데이트 (부분 업데이트) - N+1 문제 해결
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleId, updates } = body;

    if (!roleId || !updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: "roleId와 updates 배열이 필요합니다" },
        { status: 400 }
      );
    }

    // 배치 upsert
    const permissionRecords = updates.map((update: { permissionKey: string; isEnabled: boolean }) => ({
      role_id: roleId,
      permission_key: update.permissionKey,
      permission_name: getPermissionName(update.permissionKey),
      category: getPermissionCategory(update.permissionKey),
      is_enabled: update.isEnabled,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("role_permissions")
      .upsert(permissionRecords, { onConflict: "role_id,permission_key" });

    if (error) throw error;

    return NextResponse.json({ success: true, count: updates.length });
  } catch (error) {
    console.error("권한 배치 업데이트 오류:", error);
    return NextResponse.json(
      { error: "권한을 배치 업데이트할 수 없습니다" },
      { status: 500 }
    );
  }
}

// 권한 키에서 이름 추출
function getPermissionName(key: string): string {
  const names: Record<string, string> = {
    // 사이드바 권한
    "sidebar.dashboard": "대시보드",
    "sidebar.consultations": "상담 관리",
    "sidebar.documents": "문서 관리",
    "sidebar.products": "품목 관리",
    "sidebar.manage": "거래처/담당자 관리",
    "sidebar.inventory": "재고 관리",
    "sidebar.reports": "리포트",
    "sidebar.board": "게시판",
    "sidebar.overseas": "해외 영업",
    "sidebar.admin": "관리자 메뉴",
    // 거래처 권한
    "companies.view": "거래처 조회",
    "companies.create": "거래처 생성",
    "companies.edit": "거래처 수정",
    "companies.delete": "거래처 삭제",
    // 문서 권한
    "documents.view": "문서 조회",
    "documents.create": "문서 생성",
    "documents.edit": "문서 수정",
    "documents.delete": "문서 삭제",
    "documents.approve": "문서 승인",
    // 재고 권한
    "inventory.view": "재고 조회",
    "inventory.manage": "재고 관리",
    // 리포트 권한
    "reports.view": "리포트 조회",
    "reports.export": "리포트 내보내기",
    // 사용자 권한
    "users.view": "사용자 조회",
    "users.create": "사용자 생성",
    "users.edit": "사용자 수정",
    "users.delete": "사용자 삭제",
    // 시스템 권한
    "system.settings": "시스템 설정",
    "system.backup": "백업 관리",
    "system.logs": "로그 조회",
  };
  return names[key] || key;
}

// 권한 키에서 카테고리 추출
function getPermissionCategory(key: string): string {
  const prefix = key.split(".")[0];
  return prefix === "sidebar" ? "sidebar" : "feature";
}
