"use client";

import { useState, useEffect } from "react";
import { X, Plus, Search, GripVertical, Upload, FileText, Users, Save, Send, ChevronDown, ChevronUp, CreditCard, Wallet, Trash2 } from "lucide-react";
import { useLoginUser } from "@/context/login";
import { useApprovalCategories, useCreateApproval } from "@/hooks/approvals";
import { supabase } from "@/lib/supabaseClient";
import type { ApprovalLineFormData, ApprovalLineType } from "@/types/approval";
import type { ExpenseItem, ExpenseData } from "./ExpenseContentDisplay";

interface User {
  id: string;
  name: string;
  position?: string;
  level?: string;
  team?: { name: string; department?: { name: string } };
}

interface ApprovalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (id: string) => void;
}

export default function ApprovalFormModal({
  isOpen,
  onClose,
  onSuccess,
}: ApprovalFormModalProps) {
  const user = useLoginUser();
  const { categories, isLoading: categoriesLoading } = useApprovalCategories();
  const { createApproval, isLoading, error } = useCreateApproval();

  // 폼 상태
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lines, setLines] = useState<(ApprovalLineFormData & { user?: User })[]>([]);
  const [shareScope, setShareScope] = useState<"all" | "partial">("partial");
  const [shareUsers, setShareUsers] = useState<User[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  // 비용 정산용 상태
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    { amount: 0, date: "", merchant: "", category: "", paymentMethod: "personal", externalAttendees: "", internalAttendees: "", description: "" }
  ]);
  const [expandedExpenseItems, setExpandedExpenseItems] = useState<Set<number>>(new Set([0]));

  // 비용 정산 관련 카테고리인지 확인
  const selectedCategory = categories.find(c => c.id === categoryId);
  const isExpenseCategory = selectedCategory?.name?.includes("지출") ||
                           selectedCategory?.name?.includes("비용") ||
                           selectedCategory?.name?.includes("정산") ||
                           selectedCategory?.name?.includes("경비");

  // 사용자 검색
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [searchMode, setSearchMode] = useState<"approver" | "share" | null>(null);

  // 모달 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setCategoryId("");
      setTitle("");
      setContent("");
      setLines([]);
      setShareScope("partial");
      setShareUsers([]);
      setFiles([]);
      setUserSearchTerm("");
      setSearchMode(null);
      setExpenseItems([{ amount: 0, date: "", merchant: "", category: "", paymentMethod: "personal", externalAttendees: "", internalAttendees: "", description: "" }]);
      setExpandedExpenseItems(new Set([0]));
    }
  }, [isOpen]);

  // 비용 항목 추가
  const handleAddExpenseItem = () => {
    const newItem: ExpenseItem = {
      amount: 0,
      date: "",
      merchant: "",
      category: "",
      paymentMethod: "personal",
      externalAttendees: "",
      internalAttendees: "",
      description: "",
    };
    setExpenseItems([...expenseItems, newItem]);
    setExpandedExpenseItems(new Set([...expandedExpenseItems, expenseItems.length]));
  };

  // 비용 항목 삭제
  const handleRemoveExpenseItem = (index: number) => {
    if (expenseItems.length <= 1) return;
    setExpenseItems(expenseItems.filter((_, i) => i !== index));
    const newExpanded = new Set<number>();
    expandedExpenseItems.forEach(i => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedExpenseItems(newExpanded);
  };

  // 비용 항목 수정
  const handleExpenseItemChange = (index: number, field: keyof ExpenseItem, value: string | number) => {
    const newItems = [...expenseItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setExpenseItems(newItems);
  };

  // 비용 항목 토글
  const toggleExpenseItem = (index: number) => {
    setExpandedExpenseItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // 비용 합계 계산
  const expenseTotal = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // 비용 데이터 -> JSON 문자열
  const getExpenseContentJson = (): string => {
    const data: ExpenseData = {
      items: expenseItems,
      totalAmount: expenseTotal,
    };
    return JSON.stringify(data);
  };

  // 사용자 검색
  useEffect(() => {
    if (userSearchTerm && searchMode) {
      const searchUsers = async () => {
        const { data } = await supabase
          .from("users")
          .select(`id, name, position, level, team:teams(name, department:departments(name))`)
          .ilike("name", `%${userSearchTerm}%`)
          .limit(10);

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
            team: teamData ? { name: teamData.name as string, department: deptData } : undefined,
          };
        });
        setUserSearchResults(formattedUsers);
      };
      searchUsers();
    } else {
      setUserSearchResults([]);
    }
  }, [userSearchTerm, searchMode]);

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

  const handleRemoveApprover = (index: number) => {
    const newLines = lines.filter((_, i) => i !== index);
    setLines(newLines.map((line, i) => ({ ...line, line_order: i + 1 })));
  };

  const handleLineTypeChange = (index: number, type: ApprovalLineType) => {
    const newLines = [...lines];
    newLines[index].line_type = type;
    newLines[index].is_required = type !== "reference";
    setLines(newLines);
  };

  const handleAddShareUser = (selectedUser: User) => {
    if (!shareUsers.find((u) => u.id === selectedUser.id)) {
      setShareUsers([...shareUsers, selectedUser]);
    }
    setUserSearchTerm("");
    setSearchMode(null);
  };

  const handleRemoveShareUser = (userId: string) => {
    setShareUsers(shareUsers.filter((u) => u.id !== userId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

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

    // 비용 정산 카테고리면 JSON 형태로 content 저장
    const finalContent = isExpenseCategory ? getExpenseContentJson() : content;

    const result = await createApproval({
      category_id: categoryId,
      title,
      content: finalContent,
      lines: formattedLines,
      share_scope: shareScope,
      share_users: shareUsers.map((u) => u.id),
      requester_id: user.id,
      requester_team_id: user.team_id,
      requester_department: user.team?.department?.name || user.team?.name,
      is_draft: true,
    });

    if (result) {
      onClose();
      onSuccess?.(result.id);
    }
  };

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

    // 비용 정산 카테고리면 JSON 형태로 content 저장
    const finalContent = isExpenseCategory ? getExpenseContentJson() : content;

    const result = await createApproval({
      category_id: categoryId,
      title,
      content: finalContent,
      lines: formattedLines,
      share_scope: shareScope,
      share_users: shareUsers.map((u) => u.id),
      requester_id: user.id,
      requester_team_id: user.team_id,
      requester_department: user.team?.department?.name || user.team?.name,
      is_draft: false,
    });

    if (result) {
      onClose();
      onSuccess?.(result.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 my-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">새 결재</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-5 max-h-[calc(100vh-200px)] overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 기본 정보 */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  문서 분류 <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">선택</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="결재 제목"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 비용 정산 폼 또는 일반 텍스트 입력 */}
            {isExpenseCategory ? (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2">
                  비용 내역
                </label>
                <div className="space-y-3">
                  {expenseItems.map((item, index) => {
                    const isExpanded = expandedExpenseItems.has(index);
                    return (
                      <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                        {/* 헤더 */}
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => toggleExpenseItem(index)}
                            className="flex items-center gap-2 text-sm font-medium text-slate-700"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            내역 {index + 1}
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-700">
                              ₩{(Number(item.amount) || 0).toLocaleString("ko-KR")}
                            </span>
                            {expenseItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveExpenseItem(index)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* 상세 필드 */}
                        {isExpanded && (
                          <div className="p-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">정산 금액 *</label>
                                <input
                                  type="number"
                                  value={item.amount || ""}
                                  onChange={(e) => handleExpenseItemChange(index, "amount", Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">사용일 *</label>
                                <input
                                  type="date"
                                  value={item.date}
                                  onChange={(e) => handleExpenseItemChange(index, "date", e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">사용처 *</label>
                                <input
                                  type="text"
                                  value={item.merchant}
                                  onChange={(e) => handleExpenseItemChange(index, "merchant", e.target.value)}
                                  placeholder="예: 스타벅스 강남점"
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">비용 항목</label>
                                <select
                                  value={item.category}
                                  onChange={(e) => handleExpenseItemChange(index, "category", e.target.value)}
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                  <option value="">선택</option>
                                  <option value="식비">식비</option>
                                  <option value="교통비">교통비</option>
                                  <option value="접대비">접대비</option>
                                  <option value="회의비">회의비</option>
                                  <option value="소모품비">소모품비</option>
                                  <option value="기타">기타</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1">결제 수단</label>
                              <div className="flex gap-2">
                                {[
                                  { value: "personal", label: "개인 카드", icon: CreditCard },
                                  { value: "corporate", label: "법인 카드", icon: CreditCard },
                                  { value: "cash", label: "현금", icon: Wallet },
                                ].map((method) => (
                                  <button
                                    key={method.value}
                                    type="button"
                                    onClick={() => handleExpenseItemChange(index, "paymentMethod", method.value)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition-colors ${
                                      item.paymentMethod === method.value
                                        ? "bg-blue-50 border border-blue-300 text-blue-700"
                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    <method.icon className="w-3.5 h-3.5" />
                                    {method.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">외부인</label>
                                <input
                                  type="text"
                                  value={item.externalAttendees || ""}
                                  onChange={(e) => handleExpenseItemChange(index, "externalAttendees", e.target.value)}
                                  placeholder="외부 참석자명"
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] text-slate-500 mb-1">참석자</label>
                                <input
                                  type="text"
                                  value={item.internalAttendees || ""}
                                  onChange={(e) => handleExpenseItemChange(index, "internalAttendees", e.target.value)}
                                  placeholder="내부 참석자명"
                                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-500 mb-1">상세 내용</label>
                              <textarea
                                value={item.description || ""}
                                onChange={(e) => handleExpenseItemChange(index, "description", e.target.value)}
                                placeholder="상세 사용 내역 입력"
                                rows={2}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 항목 추가 버튼 */}
                  <button
                    type="button"
                    onClick={handleAddExpenseItem}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">내역 추가</span>
                  </button>

                  {/* 합계 */}
                  <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">합계</span>
                    <span className="text-base font-bold text-blue-600">
                      ₩{expenseTotal.toLocaleString("ko-KR")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  기안 내용
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="기안 내용을 입력하세요"
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            )}
          </div>

          {/* 결재선 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              결재선 <span className="text-red-500">*</span>
            </label>

            {lines.length > 0 && (
              <div className="space-y-2 mb-3">
                {lines.map((line, index) => (
                  <div
                    key={`${line.approver_id}-${index}`}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg"
                  >
                    <GripVertical className="w-4 h-4 text-slate-300" />
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-xs font-medium">
                      {line.line_order}
                    </span>
                    <select
                      value={line.line_type}
                      onChange={(e) => handleLineTypeChange(index, e.target.value as ApprovalLineType)}
                      className="px-2 py-1 border border-slate-200 rounded text-xs bg-white"
                    >
                      <option value="approval">결재</option>
                      <option value="review">검토</option>
                      <option value="reference">참조</option>
                    </select>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {line.user?.name}
                      </span>
                      {line.user?.team && (
                        <span className="text-xs text-slate-400 ml-1.5">
                          {line.user.team.name}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveApprover(index)}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchMode === "approver" ? (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      placeholder="사원명 검색"
                      autoFocus
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => { setSearchMode(null); setUserSearchTerm(""); }}
                    className="p-2 hover:bg-slate-100 rounded-lg"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {userSearchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-20">
                    {userSearchResults.map((u) => (
                      <div key={u.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-50">
                        <div className="text-sm">
                          <span className="font-medium">{u.name}</span>
                          {u.team && <span className="text-slate-400 ml-1.5">{u.team.name}</span>}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAddApprover(u, "approval")}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            결재
                          </button>
                          <button
                            onClick={() => handleAddApprover(u, "reference")}
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
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">결재자 추가</span>
              </button>
            )}
          </div>

          {/* 첨부파일 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              첨부파일
            </label>

            {files.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{file.name}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button onClick={() => handleRemoveFile(index)} className="p-1 hover:bg-slate-200 rounded">
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm">파일 추가</span>
              <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          {/* 공유 범위 */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              공유 범위
            </label>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setShareScope("all")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  shareScope === "all"
                    ? "bg-slate-100 text-slate-700 ring-1 ring-slate-300"
                    : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                전체 공유
              </button>
              <button
                onClick={() => setShareScope("partial")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  shareScope === "partial"
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-300"
                    : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                일부 공유
              </button>
            </div>

            {shareScope === "partial" && (
              <div>
                {shareUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {shareUsers.map((u) => (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                      >
                        {u.name}
                        <button onClick={() => handleRemoveShareUser(u.id)} className="hover:text-blue-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {searchMode === "share" ? (
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          placeholder="사원명 검색"
                          autoFocus
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => { setSearchMode(null); setUserSearchTerm(""); }}
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>

                    {userSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-36 overflow-y-auto z-20">
                        {userSearchResults.map((u) => (
                          <button
                            key={u.id}
                            onClick={() => handleAddShareUser(u)}
                            className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm"
                          >
                            <span className="font-medium">{u.name}</span>
                            {u.team && <span className="text-slate-400 ml-1.5">{u.team.name}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchMode("share")}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:border-slate-400 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span className="text-sm">공유 대상 추가</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            임시저장
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <Send className="w-4 h-4" />
            {isLoading ? "처리 중..." : "상신"}
          </button>
        </div>
      </div>
    </div>
  );
}
