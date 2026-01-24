import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

interface DefaultApprovalLine {
  id: string;
  category_id: string;
  team_id: string | null;
  department_id: string | null;
  approver_type: "position" | "role" | "user";
  approver_value: string;
  line_type: "approval" | "review" | "reference";
  line_order: number;
  is_required: boolean;
}

interface ResolvedApprovalLine {
  approver_id: string;
  approver_name: string;
  approver_position: string;
  approver_team?: string;
  line_type: "approval" | "review" | "reference";
  line_order: number;
  is_required: boolean;
}

interface PositionHierarchy {
  position_name: string;
  hierarchy_level: number;
}

/**
 * 자동 결재선 결정 API
 * POST /api/approvals/resolve-lines
 *
 * 기안자의 직급/팀을 기반으로 자동으로 결재자를 결정합니다.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category_id, requester_id } = body;

    if (!category_id || !requester_id) {
      return NextResponse.json(
        { error: "category_id와 requester_id는 필수입니다." },
        { status: 400 }
      );
    }

    // 1. 기안자 정보 조회
    const { data: requester, error: requesterError } = await supabase
      .from("users")
      .select(`
        id, name, position, level,
        team_id,
        team:teams(
          id, name, department_id,
          department:departments(id, name)
        )
      `)
      .eq("id", requester_id)
      .single();

    if (requesterError || !requester) {
      console.error("Error fetching requester:", requesterError);
      return NextResponse.json(
        { error: "기안자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Supabase에서 반환된 team 데이터 처리
    const teamData = Array.isArray(requester.team) ? requester.team[0] : requester.team;
    const departmentData = teamData?.department
      ? (Array.isArray(teamData.department) ? teamData.department[0] : teamData.department)
      : null;

    // 2. 기안자의 직급 레벨 조회
    const { data: requesterPositionData } = await supabase
      .from("position_hierarchy")
      .select("hierarchy_level")
      .eq("position_name", requester.position)
      .single();

    const requesterLevel = requesterPositionData?.hierarchy_level || 1;

    // 3. 해당 카테고리의 기본 결재선 조회
    // 팀별 > 부서별 > 전체 순으로 우선순위
    let { data: defaultLines, error: linesError } = await supabase
      .from("default_approval_lines")
      .select("*")
      .eq("category_id", category_id)
      .order("line_order", { ascending: true });

    if (linesError) {
      console.error("Error fetching default lines:", linesError);
      return NextResponse.json(
        { error: "기본 결재선 정보를 조회할 수 없습니다." },
        { status: 500 }
      );
    }

    // 팀/부서별 필터링 적용
    let filteredLines: DefaultApprovalLine[] = [];

    if (defaultLines && defaultLines.length > 0) {
      // 팀 특정 설정 찾기
      const teamSpecificLines = defaultLines.filter(
        (line: DefaultApprovalLine) => line.team_id === requester.team_id
      );

      // 부서 특정 설정 찾기
      const deptSpecificLines = defaultLines.filter(
        (line: DefaultApprovalLine) =>
          line.department_id === departmentData?.id && !line.team_id
      );

      // 전체 적용 설정 찾기
      const globalLines = defaultLines.filter(
        (line: DefaultApprovalLine) => !line.team_id && !line.department_id
      );

      // 우선순위: 팀 > 부서 > 전체
      if (teamSpecificLines.length > 0) {
        filteredLines = teamSpecificLines;
      } else if (deptSpecificLines.length > 0) {
        filteredLines = deptSpecificLines;
      } else {
        filteredLines = globalLines;
      }
    }

    // 4. 직급 체계 조회
    const { data: positionHierarchy } = await supabase
      .from("position_hierarchy")
      .select("position_name, hierarchy_level")
      .order("hierarchy_level", { ascending: true });

    const positionMap = new Map<string, number>(
      (positionHierarchy || []).map((p: PositionHierarchy) => [
        p.position_name,
        p.hierarchy_level,
      ])
    );

    // 5. 각 결재선에 대해 실제 결재자 결정
    const resolvedLines: ResolvedApprovalLine[] = [];

    for (const line of filteredLines) {
      const targetPositionLevel = positionMap.get(line.approver_value) || 0;

      // 기안자보다 직급이 같거나 낮은 결재자는 스킵
      if (targetPositionLevel > 0 && targetPositionLevel <= requesterLevel) {
        continue;
      }

      let approver = null;

      if (line.approver_type === "position") {
        // 직급 기반 결재자 찾기
        approver = await findApproverByPosition(
          line.approver_value,
          requester.team_id,
          departmentData?.id
        );
      } else if (line.approver_type === "role") {
        // 역할 기반 결재자 찾기
        approver = await findApproverByRole(line.approver_value);
      } else if (line.approver_type === "user") {
        // 특정 사용자 지정
        approver = await findApproverById(line.approver_value);
      }

      if (approver && approver.id !== requester_id) {
        resolvedLines.push({
          approver_id: approver.id,
          approver_name: approver.name,
          approver_position: approver.position || "",
          approver_team: approver.team_name,
          line_type: line.line_type,
          line_order: resolvedLines.length + 1, // 순서 재정렬
          is_required: line.is_required,
        });
      }
    }

    return NextResponse.json({
      lines: resolvedLines,
      requester: {
        id: requester.id,
        name: requester.name,
        position: requester.position,
        team: teamData?.name,
        department: departmentData?.name,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/approvals/resolve-lines:", error);
    return NextResponse.json(
      { error: "결재선 결정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * 직급 기반으로 결재자 찾기
 * 1. 같은 팀에서 찾기
 * 2. 같은 부서에서 찾기
 * 3. 전체에서 찾기 (사업장장, 대표 등)
 */
async function findApproverByPosition(
  targetPosition: string,
  teamId: string | null,
  departmentId: string | null
): Promise<{ id: string; name: string; position: string; team_name?: string } | null> {
  // 팀장은 특수 처리 (position이 아닌 역할)
  if (targetPosition === "팀장") {
    // 해당 팀의 부장 또는 과장급 이상 중 한 명을 팀장으로 간주
    if (teamId) {
      const { data: teamLeader } = await supabase
        .from("users")
        .select("id, name, position, team:teams(name)")
        .eq("team_id", teamId)
        .in("position", ["부장", "차장", "과장"])
        .order("position", { ascending: false }) // 부장 > 차장 > 과장 순
        .limit(1)
        .single();

      if (teamLeader) {
        const teamData = Array.isArray(teamLeader.team)
          ? teamLeader.team[0]
          : teamLeader.team;
        return {
          id: teamLeader.id,
          name: teamLeader.name,
          position: teamLeader.position,
          team_name: teamData?.name,
        };
      }
    }
    return null;
  }

  // 1. 같은 팀에서 해당 직급자 찾기
  if (teamId) {
    const { data: teamApprover } = await supabase
      .from("users")
      .select("id, name, position, team:teams(name)")
      .eq("team_id", teamId)
      .eq("position", targetPosition)
      .limit(1)
      .single();

    if (teamApprover) {
      const teamData = Array.isArray(teamApprover.team)
        ? teamApprover.team[0]
        : teamApprover.team;
      return {
        id: teamApprover.id,
        name: teamApprover.name,
        position: teamApprover.position,
        team_name: teamData?.name,
      };
    }
  }

  // 2. 같은 부서에서 해당 직급자 찾기
  if (departmentId) {
    const { data: deptApprover } = await supabase
      .from("users")
      .select("id, name, position, team:teams!inner(name, department_id)")
      .eq("team.department_id", departmentId)
      .eq("position", targetPosition)
      .limit(1)
      .single();

    if (deptApprover) {
      const teamData = Array.isArray(deptApprover.team)
        ? deptApprover.team[0]
        : deptApprover.team;
      return {
        id: deptApprover.id,
        name: deptApprover.name,
        position: deptApprover.position,
        team_name: teamData?.name,
      };
    }
  }

  // 3. 전체에서 해당 직급자 찾기 (사업장장, 대표 등 고위직)
  const { data: globalApprover } = await supabase
    .from("users")
    .select("id, name, position, team:teams(name)")
    .eq("position", targetPosition)
    .limit(1)
    .single();

  if (globalApprover) {
    const teamData = Array.isArray(globalApprover.team)
      ? globalApprover.team[0]
      : globalApprover.team;
    return {
      id: globalApprover.id,
      name: globalApprover.name,
      position: globalApprover.position,
      team_name: teamData?.name,
    };
  }

  return null;
}

/**
 * 역할 기반으로 결재자 찾기
 */
async function findApproverByRole(
  roleName: string
): Promise<{ id: string; name: string; position: string; team_name?: string } | null> {
  const { data: roleApprover } = await supabase
    .from("users")
    .select("id, name, position, team:teams(name)")
    .eq("role", roleName)
    .limit(1)
    .single();

  if (roleApprover) {
    const teamData = Array.isArray(roleApprover.team)
      ? roleApprover.team[0]
      : roleApprover.team;
    return {
      id: roleApprover.id,
      name: roleApprover.name,
      position: roleApprover.position,
      team_name: teamData?.name,
    };
  }

  return null;
}

/**
 * ID로 특정 사용자 찾기
 */
async function findApproverById(
  userId: string
): Promise<{ id: string; name: string; position: string; team_name?: string } | null> {
  const { data: userApprover } = await supabase
    .from("users")
    .select("id, name, position, team:teams(name)")
    .eq("id", userId)
    .single();

  if (userApprover) {
    const teamData = Array.isArray(userApprover.team)
      ? userApprover.team[0]
      : userApprover.team;
    return {
      id: userApprover.id,
      name: userApprover.name,
      position: userApprover.position,
      team_name: teamData?.name,
    };
  }

  return null;
}
