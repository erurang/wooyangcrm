"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  X,
  Upload,
  FileText,
  Users,
  Search,
  GripVertical,
  Link2,
  MessageSquare,
  ShoppingCart,
} from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useApprovalCategories, useCreateApproval } from "@/hooks/approvals";
import { supabase } from "@/lib/supabaseClient";
import type { ApprovalLineFormData, ApprovalLineType } from "@/types/approval";
import { APPROVAL_LINE_TYPE_LABELS } from "@/types/approval";

interface User {
  id: string;
  name: string;
  position?: string;
  level?: string;
  team?: { name: string; department?: { name: string } };
}

interface RelatedDocument {
  id: string;
  document_number: string;
  type: string;
  company_name: string;
  created_at: string;
}

interface RelatedConsultation {
  id: string;
  title: string;
  company_name: string;
  created_at: string;
}

export default function NewApprovalPage() {
  const router = useRouter();
  const user = useLoginUser();
  const { categories, isLoading: categoriesLoading } = useApprovalCategories();
  const { createApproval, isLoading, error } = useCreateApproval();

  // 폼 상태
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lines, setLines] = useState<
    (ApprovalLineFormData & { user?: User })[]
  >([]);
  const [shareScope, setShareScope] = useState<"all" | "partial">("partial");
  const [shareUsers, setShareUsers] = useState<User[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  // 사용자 검색
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [searchMode, setSearchMode] = useState<"approver" | "share" | null>(null);

  // 관련 문서/상담
  const [relatedDocument, setRelatedDocument] = useState<RelatedDocument | null>(null);
  const [relatedConsultation, setRelatedConsultation] = useState<RelatedConsultation | null>(null);
  const [relatedSearchTerm, setRelatedSearchTerm] = useState("");
  const [relatedSearchType, setRelatedSearchType] = useState<"document" | "consultation">("document");
  const [relatedSearchResults, setRelatedSearchResults] = useState<{
    documents: RelatedDocument[];
    consultations: RelatedConsultation[];
  }>({ documents: [], consultations: [] });
  const [isRelatedSearching, setIsRelatedSearching] = useState(false);

  // 사용자 검색
  useEffect(() => {
    if (userSearchTerm && searchMode) {
      const searchUsers = async () => {
        const { data } = await supabase
          .from("users")
          .select(
            `
            id, name, position, level,
            team:teams(name, department:departments(name))
          `
          )
          .ilike("name", `%${userSearchTerm}%`)
          .limit(10);

        // Supabase에서 반환된 데이터를 User 타입으로 변환
        const formattedUsers: User[] = (data || []).map((u: Record<string, unknown>) => {
          const teamData = Array.isArray(u.team) ? u.team[0] : u.team;
          const deptData = teamData?.department
            ? (Array.isArray(teamData.department) ? teamData.department[0] : teamData.department)
            : undefined;
          return {
            id: u.id as string,
            name: u.name as string,
            position: u.position as string | undefined,
            level: u.level as string | undefined,
            team: teamData ? {
              name: teamData.name as string,
              department: deptData,
            } : undefined,
          };
        });
        setUserSearchResults(formattedUsers);
      };
      searchUsers();
    } else {
      setUserSearchResults([]);
    }
  }, [userSearchTerm, searchMode]);

  // 관련 문서/상담 검색
  useEffect(() => {
    if (relatedSearchTerm && relatedSearchTerm.length >= 2) {
      const searchRelated = async () => {
        setIsRelatedSearching(true);
        try {
          const response = await fetch(
            `/api/search/related?keyword=${encodeURIComponent(relatedSearchTerm)}&type=${relatedSearchType}`
          );
          if (response.ok) {
            const data = await response.json();
            setRelatedSearchResults(data);
          }
        } catch (error) {
          console.error("관련 문서 검색 오류:", error);
        } finally {
          setIsRelatedSearching(false);
        }
      };
      const debounceTimer = setTimeout(searchRelated, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setRelatedSearchResults({ documents: [], consultations: [] });
    }
  }, [relatedSearchTerm, relatedSearchType]);

  // 결재자 추가
  const handleAddApprover = (selectedUser: User, lineType: ApprovalLineType) => {
    const newLine: ApprovalLineFormData & { user?: User } = {
      approver_id: selectedUser.id,
      line_type: lineType,
      line_order: lines.length + 1,
      is_required: lineType !== "reference",
      user: selectedUser,
    };
    setLines([...lines, newLine]);
    setUserSearchTerm("");
    setSearchMode(null);
  };

  // 결재자 제거
  const handleRemoveApprover = (index: number) => {
    const newLines = lines.filter((_, i) => i !== index);
    // 순서 재정렬
    setLines(newLines.map((line, i) => ({ ...line, line_order: i + 1 })));
  };

  // 결재선 타입 변경
  const handleLineTypeChange = (index: number, type: ApprovalLineType) => {
    const newLines = [...lines];
    newLines[index].line_type = type;
    newLines[index].is_required = type !== "reference";
    setLines(newLines);
  };

  // 공유 대상 추가
  const handleAddShareUser = (selectedUser: User) => {
    if (!shareUsers.find((u) => u.id === selectedUser.id)) {
      setShareUsers([...shareUsers, selectedUser]);
    }
    setUserSearchTerm("");
    setSearchMode(null);
  };

  // 공유 대상 제거
  const handleRemoveShareUser = (userId: string) => {
    setShareUsers(shareUsers.filter((u) => u.id !== userId));
  };

  // 파일 추가
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  // 파일 제거
  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // 임시저장
  const handleSaveDraft = async () => {
    if (!user?.id || !categoryId || !title) {
      alert("분류와 제목을 입력해주세요.");
      return;
    }

    const formattedLines = lines.map((line) => ({
      approver_id: line.approver_id,
      approver_team: line.user?.team?.name,
      line_type: line.line_type,
      line_order: line.line_order,
      is_required: line.is_required,
    }));

    const result = await createApproval({
      category_id: categoryId,
      title,
      content,
      lines: formattedLines,
      share_scope: shareScope,
      share_users: shareUsers.map((u) => u.id),
      requester_id: user.id,
      requester_team_id: user.team_id,
      requester_department: user.team?.department?.name || user.team?.name,
      is_draft: true,
      related_document_id: relatedDocument?.id,
      related_consultation_id: relatedConsultation?.id,
    });

    if (result) {
      router.push("/approvals");
    }
  };

  // 상신
  const handleSubmit = async () => {
    if (!user?.id) return;

    if (!categoryId) {
      alert("문서 분류를 선택해주세요.");
      return;
    }

    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (lines.filter((l) => l.line_type === "approval").length === 0) {
      alert("결재자를 최소 1명 이상 지정해주세요.");
      return;
    }

    const formattedLines = lines.map((line) => ({
      approver_id: line.approver_id,
      approver_team: line.user?.team?.name,
      line_type: line.line_type,
      line_order: line.line_order,
      is_required: line.is_required,
    }));

    // TODO: 파일 업로드 처리

    const result = await createApproval({
      category_id: categoryId,
      title,
      content,
      lines: formattedLines,
      share_scope: shareScope,
      share_users: shareUsers.map((u) => u.id),
      requester_id: user.id,
      requester_team_id: user.team_id,
      requester_department: user.team?.department?.name || user.team?.name,
      is_draft: false,
      related_document_id: relatedDocument?.id,
      related_consultation_id: relatedConsultation?.id,
    });

    if (result) {
      router.push(`/approvals/${result.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/approvals")}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-bold text-slate-800">새 결재</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDraft}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                임시저장
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                상신
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-4">
          <h2 className="font-bold text-slate-800 mb-4">기본 정보</h2>

          {/* 분류 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              문서 분류 <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">선택하세요</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* 제목 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="결재 제목을 입력하세요"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              기안 내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="기안 내용을 입력하세요"
              rows={8}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* 관련 문서 연결 */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-4">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-slate-600" />
            관련 문서 연결
            <span className="text-xs font-normal text-slate-400">(선택사항)</span>
          </h2>

          {/* 검색 타입 선택 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setRelatedSearchType("document")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                relatedSearchType === "document"
                  ? "bg-blue-50 text-blue-700 border border-blue-300"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              문서
            </button>
            <button
              onClick={() => setRelatedSearchType("consultation")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                relatedSearchType === "consultation"
                  ? "bg-purple-50 text-purple-700 border border-purple-300"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              상담
            </button>
          </div>

          {/* 선택된 문서/상담 표시 */}
          {relatedDocument && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="font-medium text-slate-800">
                    {relatedDocument.document_number}
                  </span>
                  <span className="text-sm text-slate-500 ml-2">
                    ({relatedDocument.type === "estimate" ? "견적서" : relatedDocument.type === "order" ? "발주서" : relatedDocument.type})
                  </span>
                  <p className="text-xs text-slate-500">
                    {relatedDocument.company_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRelatedDocument(null)}
                className="p-1 hover:bg-blue-100 rounded"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}

          {relatedConsultation && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="font-medium text-slate-800">
                    {relatedConsultation.title}
                  </span>
                  <p className="text-xs text-slate-500">
                    {relatedConsultation.company_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRelatedConsultation(null)}
                className="p-1 hover:bg-purple-100 rounded"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}

          {/* 검색 입력 */}
          <div className="relative">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={relatedSearchTerm}
                onChange={(e) => setRelatedSearchTerm(e.target.value)}
                placeholder={
                  relatedSearchType === "document"
                    ? "문서번호 또는 회사명으로 검색..."
                    : "상담 제목 또는 회사명으로 검색..."
                }
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {relatedSearchTerm && (
                <button
                  onClick={() => {
                    setRelatedSearchTerm("");
                    setRelatedSearchResults({ documents: [], consultations: [] });
                  }}
                  className="p-2 hover:bg-slate-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 검색 결과 */}
            {(relatedSearchResults.documents.length > 0 ||
              relatedSearchResults.consultations.length > 0) && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                {relatedSearchType === "document" &&
                  relatedSearchResults.documents.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setRelatedDocument(doc);
                        setRelatedSearchTerm("");
                        setRelatedSearchResults({ documents: [], consultations: [] });
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-slate-800">
                          {doc.document_number}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            doc.type === "estimate"
                              ? "bg-blue-100 text-blue-700"
                              : doc.type === "order"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {doc.type === "estimate" ? "견적" : doc.type === "order" ? "발주" : doc.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 ml-6">
                        {doc.company_name} ·{" "}
                        {new Date(doc.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </button>
                  ))}

                {relatedSearchType === "consultation" &&
                  relatedSearchResults.consultations.map((con) => (
                    <button
                      key={con.id}
                      onClick={() => {
                        setRelatedConsultation(con);
                        setRelatedSearchTerm("");
                        setRelatedSearchResults({ documents: [], consultations: [] });
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-slate-800">
                          {con.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 ml-6">
                        {con.company_name} ·{" "}
                        {new Date(con.created_at).toLocaleDateString("ko-KR")}
                      </p>
                    </button>
                  ))}
              </div>
            )}

            {/* 로딩 표시 */}
            {isRelatedSearching && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-4 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-slate-500">검색 중...</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-3">
            관련 견적서, 발주서 또는 상담을 연결하면 결재 문서에서 바로 확인할 수 있습니다.
          </p>
        </div>

        {/* 결재선 */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-4">
          <h2 className="font-bold text-slate-800 mb-4">결재선 설정</h2>

          {/* 결재선 목록 */}
          {lines.length > 0 && (
            <div className="mb-4 space-y-2">
              {lines.map((line, index) => (
                <div
                  key={`${line.approver_id}-${index}`}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                >
                  <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
                  <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {line.line_order}
                  </span>
                  <select
                    value={line.line_type}
                    onChange={(e) =>
                      handleLineTypeChange(index, e.target.value as ApprovalLineType)
                    }
                    className="px-2 py-1 border border-slate-200 rounded text-sm bg-white"
                  >
                    <option value="approval">결재</option>
                    <option value="review">검토</option>
                    <option value="reference">참조</option>
                  </select>
                  <div className="flex-1">
                    <span className="font-medium text-slate-800">
                      {line.user?.name}
                    </span>
                    {line.user?.position && (
                      <span className="text-sm text-slate-500 ml-2">
                        {line.user.position}
                      </span>
                    )}
                    {line.user?.team && (
                      <span className="text-sm text-slate-500">
                        {" "}
                        / {line.user.team.name}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveApprover(index)}
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 결재자 추가 */}
          <div className="relative">
            {searchMode === "approver" ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="사원명을 입력하세요"
                    autoFocus
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      setSearchMode(null);
                      setUserSearchTerm("");
                    }}
                    className="p-2 hover:bg-slate-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {userSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                    {userSearchResults.map((searchUser) => (
                      <div
                        key={searchUser.id}
                        className="flex items-center justify-between px-4 py-2 hover:bg-slate-50"
                      >
                        <div>
                          <span className="font-medium">{searchUser.name}</span>
                          {searchUser.position && (
                            <span className="text-slate-500 ml-2">
                              {searchUser.position}
                            </span>
                          )}
                          {searchUser.team && (
                            <span className="text-slate-500">
                              {" "}
                              / {searchUser.team.name}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAddApprover(searchUser, "approval")}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            결재
                          </button>
                          <button
                            onClick={() => handleAddApprover(searchUser, "reference")}
                            className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                          >
                            참조
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setSearchMode("approver")}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                결재자 추가
              </button>
            )}
          </div>
        </div>

        {/* 첨부파일 */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6 mb-4">
          <h2 className="font-bold text-slate-800 mb-4">첨부파일</h2>

          {files.length > 0 && (
            <div className="mb-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="text-sm text-slate-700">{file.name}</span>
                    <span className="text-xs text-slate-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer justify-center">
            <Upload className="w-4 h-4" />
            파일 추가
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* 공유 범위 */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <h2 className="font-bold text-slate-800 mb-4">공유 범위</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShareScope("all")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                shareScope === "all"
                  ? "bg-slate-100 text-slate-700 border border-slate-300"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              전체 공유
            </button>
            <button
              onClick={() => setShareScope("partial")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                shareScope === "partial"
                  ? "bg-blue-50 text-blue-700 border border-blue-300"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              일부 공유
            </button>
          </div>

          {shareScope === "partial" && (
            <div>
              {shareUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {shareUsers.map((shareUser) => (
                    <span
                      key={shareUser.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm"
                    >
                      {shareUser.name}
                      <button
                        onClick={() => handleRemoveShareUser(shareUser.id)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                {searchMode === "share" ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="사원명을 입력하세요"
                        autoFocus
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          setSearchMode(null);
                          setUserSearchTerm("");
                        }}
                        className="p-2 hover:bg-slate-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {userSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                        {userSearchResults.map((searchUser) => (
                          <button
                            key={searchUser.id}
                            onClick={() => handleAddShareUser(searchUser)}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 text-sm"
                          >
                            <span className="font-medium">{searchUser.name}</span>
                            {searchUser.position && (
                              <span className="text-slate-500 ml-2">
                                {searchUser.position}
                              </span>
                            )}
                            {searchUser.team && (
                              <span className="text-slate-500">
                                {" "}
                                / {searchUser.team.name}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchMode("share")}
                    className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 w-full justify-center"
                  >
                    <Users className="w-4 h-4" />
                    공유 대상 추가
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
