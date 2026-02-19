"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Building2, FileText, MessageSquare, ChevronRight, Loader2, User, Calendar } from "lucide-react";
import dayjs from "dayjs";
import type { ReferenceType, CreateReferenceData } from "@/types/post";

interface ReferenceSearchItem {
  id: string;
  name: string;
  type: ReferenceType;
  subtext?: string;
  // 상담용 추가 정보
  content?: string;
  userName?: string;
  date?: string;
}

interface ReferenceSelectorProps {
  selectedReferences: CreateReferenceData[];
  onAdd: (reference: CreateReferenceData) => void;
  onRemove: (index: number) => void;
}

const typeLabels: Record<ReferenceType, string> = {
  company: "거래처",
  consultation: "상담",
  document: "문서",
};

const typeIcons: Record<ReferenceType, React.ReactNode> = {
  company: <Building2 className="w-4 h-4" />,
  consultation: <MessageSquare className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
};

const typeColors: Record<ReferenceType, string> = {
  company: "bg-sky-50 text-sky-700 border-sky-200",
  consultation: "bg-green-50 text-green-700 border-green-200",
  document: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function ReferenceSelector({
  selectedReferences,
  onAdd,
  onRemove,
}: ReferenceSelectorProps) {
  // 회사 선택 상태
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [companyResults, setCompanyResults] = useState<ReferenceSearchItem[]>([]);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  // 상담 선택 상태
  const [selectedConsultation, setSelectedConsultation] = useState<{ id: string; name: string } | null>(null);

  // 상담/문서 목록
  const [consultations, setConsultations] = useState<ReferenceSearchItem[]>([]);
  const [documents, setDocuments] = useState<ReferenceSearchItem[]>([]);
  const [isLoadingConsultations, setIsLoadingConsultations] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // 필터
  const [consultationFilter, setConsultationFilter] = useState("");
  const [documentFilter, setDocumentFilter] = useState("");

  // 확장된 상담 ID (내용 보기)
  const [expandedConsultationId, setExpandedConsultationId] = useState<string | null>(null);

  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 회사 검색
  useEffect(() => {
    if (!companySearch || companySearch.length < 1) {
      setCompanyResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCompany(true);
      try {
        const params = new URLSearchParams({
          q: companySearch,
          type: "company",
          limit: "10",
        });
        const response = await fetch(`/api/posts/references/search?${params}`);
        const data = await response.json();
        setCompanyResults(data.results || []);
      } catch (error) {
        console.error("Company search error:", error);
        setCompanyResults([]);
      } finally {
        setIsSearchingCompany(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [companySearch]);

  // 회사 선택 시 상담 로드
  const loadConsultations = useCallback(async (companyId: string) => {
    setIsLoadingConsultations(true);
    try {
      const params = new URLSearchParams({
        type: "consultation",
        companyId,
        limit: "50",
      });
      const res = await fetch(`/api/posts/references/search?${params}`);
      const data = await res.json();
      setConsultations(data.results || []);
    } catch (error) {
      console.error("Consultation load error:", error);
      setConsultations([]);
    } finally {
      setIsLoadingConsultations(false);
    }
  }, []);

  // 문서 로드 (상담 선택 시 해당 상담의 문서만, 아니면 회사 전체)
  const loadDocuments = useCallback(async (companyId: string, consultationId?: string) => {
    setIsLoadingDocuments(true);
    try {
      const params = new URLSearchParams({
        type: "document",
        limit: "50",
      });
      if (consultationId) {
        params.set("consultationId", consultationId);
      } else {
        params.set("companyId", companyId);
      }
      const res = await fetch(`/api/posts/references/search?${params}`);
      const data = await res.json();
      setDocuments(data.results || []);
    } catch (error) {
      console.error("Document load error:", error);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  // 회사 선택
  const handleSelectCompany = (company: ReferenceSearchItem) => {
    setSelectedCompany({ id: company.id, name: company.name });
    setCompanySearch("");
    setCompanyResults([]);
    setShowCompanyDropdown(false);
    setConsultationFilter("");
    setDocumentFilter("");
    setSelectedConsultation(null);
    loadConsultations(company.id);
    loadDocuments(company.id);

    // 회사를 참조에 추가
    const exists = selectedReferences.some(
      (ref) => ref.reference_id === company.id && ref.reference_type === "company"
    );
    if (!exists) {
      onAdd({
        reference_type: "company",
        reference_id: company.id,
        reference_name: company.name,
      });
    }
  };

  // 회사 선택 해제
  const handleClearCompany = () => {
    const companyRefIndex = selectedReferences.findIndex(
      (ref) => ref.reference_id === selectedCompany?.id && ref.reference_type === "company"
    );
    if (companyRefIndex !== -1) {
      onRemove(companyRefIndex);
    }

    setSelectedCompany(null);
    setSelectedConsultation(null);
    setConsultations([]);
    setDocuments([]);
    setConsultationFilter("");
    setDocumentFilter("");
  };

  // 상담 선택/해제 토글
  const handleToggleConsultation = (item: ReferenceSearchItem) => {
    const existingIndex = selectedReferences.findIndex(
      (ref) => ref.reference_id === item.id && ref.reference_type === "consultation"
    );

    if (existingIndex !== -1) {
      // 선택 해제
      onRemove(existingIndex);
      if (selectedConsultation?.id === item.id) {
        setSelectedConsultation(null);
        // 회사 전체 문서로 복원
        if (selectedCompany) {
          loadDocuments(selectedCompany.id);
        }
      }
    } else {
      // 선택
      onAdd({
        reference_type: "consultation",
        reference_id: item.id,
        reference_name: item.name,
      });
      setSelectedConsultation({ id: item.id, name: item.name });
      // 해당 상담의 문서만 로드
      loadDocuments(selectedCompany!.id, item.id);
    }
  };

  // 문서 토글
  const handleToggleDocument = (item: ReferenceSearchItem) => {
    const existingIndex = selectedReferences.findIndex(
      (ref) => ref.reference_id === item.id && ref.reference_type === item.type
    );

    if (existingIndex !== -1) {
      onRemove(existingIndex);
    } else {
      onAdd({
        reference_type: item.type,
        reference_id: item.id,
        reference_name: item.name,
      });
    }
  };

  // 필터링된 상담/문서
  const filteredConsultations = consultations.filter((c) =>
    (c.name || "").toLowerCase().includes(consultationFilter.toLowerCase()) ||
    (c.content || "").toLowerCase().includes(consultationFilter.toLowerCase())
  );
  const filteredDocuments = documents.filter((d) =>
    (d.name || "").toLowerCase().includes(documentFilter.toLowerCase())
  );

  // 선택 여부 확인
  const isSelected = (id: string, type: ReferenceType) =>
    selectedReferences.some((ref) => ref.reference_id === id && ref.reference_type === type);

  return (
    <div className="space-y-4">
      {/* 선택된 참조 태그 */}
      {selectedReferences.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-3 border-b border-slate-200">
          {selectedReferences.map((ref, index) => (
            <div
              key={`${ref.reference_type}-${ref.reference_id}`}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-sm ${typeColors[ref.reference_type]}`}
            >
              {typeIcons[ref.reference_type]}
              <span className="font-medium max-w-[150px] truncate">{ref.reference_name}</span>
              <button
                type="button"
                onClick={() => {
                  if (ref.reference_type === "company" && ref.reference_id === selectedCompany?.id) {
                    handleClearCompany();
                  } else if (ref.reference_type === "consultation" && ref.reference_id === selectedConsultation?.id) {
                    handleToggleConsultation({ id: ref.reference_id, name: ref.reference_name || "", type: "consultation" });
                  } else {
                    onRemove(index);
                  }
                }}
                className="ml-1 p-0.5 rounded hover:bg-black/10"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Step 1: 회사 선택 */}
      {!selectedCompany ? (
        <div ref={companyDropdownRef} className="relative">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            1. 거래처 선택
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={companySearch}
              onChange={(e) => {
                setCompanySearch(e.target.value);
                setShowCompanyDropdown(true);
              }}
              onFocus={() => setShowCompanyDropdown(true)}
              placeholder="거래처 이름 검색..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* 회사 검색 결과 */}
          {showCompanyDropdown && (companySearch || companyResults.length > 0) && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {isSearchingCompany ? (
                <div className="px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  검색 중...
                </div>
              ) : companyResults.length > 0 ? (
                companyResults.map((company) => (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelectCompany(company)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-sky-50 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">{company.name}</div>
                      {company.subtext && (
                        <div className="text-xs text-slate-400">{company.subtext}</div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))
              ) : companySearch ? (
                <div className="px-4 py-3 text-sm text-slate-400">
                  &quot;{companySearch}&quot;에 대한 검색 결과가 없습니다.
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 선택된 회사 표시 */}
          <div className="flex items-center justify-between bg-sky-50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span className="font-medium text-sky-700">{selectedCompany.name}</span>
            </div>
            <button
              type="button"
              onClick={handleClearCompany}
              className="text-sky-600 hover:text-sky-800 text-sm"
            >
              다른 거래처 선택
            </button>
          </div>

          {/* Step 2: 상담 선택 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              2. 상담 선택 (선택사항)
              {selectedConsultation && (
                <span className="ml-2 text-green-600 text-xs">
                  ✓ 선택됨: {selectedConsultation.name}
                </span>
              )}
            </label>
            {isLoadingConsultations ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                상담 목록 로딩 중...
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-sm text-slate-400 py-2">
                등록된 상담이 없습니다.
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={consultationFilter}
                  onChange={(e) => setConsultationFilter(e.target.value)}
                  placeholder="상담 제목/내용 검색..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100">
                  {filteredConsultations.map((item) => (
                    <div key={item.id} className={`${isSelected(item.id, "consultation") ? "bg-green-50" : ""}`}>
                      <button
                        type="button"
                        onClick={() => handleToggleConsultation(item)}
                        className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected(item.id, "consultation")}
                          readOnly
                          className="mt-1 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span className="font-medium text-sm truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                            {item.userName && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.userName}
                              </span>
                            )}
                            {item.date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {dayjs(item.date).format("YYYY-MM-DD")}
                              </span>
                            )}
                          </div>
                          {item.content && (
                            <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                              {item.content}
                            </p>
                          )}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Step 3: 문서 선택 */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              3. 문서 선택 (선택사항)
              {selectedConsultation ? (
                <span className="ml-2 text-xs text-slate-400">
                  (선택한 상담의 문서만 표시)
                </span>
              ) : (
                <span className="ml-2 text-xs text-slate-400">
                  (전체 문서 표시)
                </span>
              )}
            </label>
            {isLoadingDocuments ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                문서 목록 로딩 중...
              </div>
            ) : documents.length === 0 ? (
              <div className="text-sm text-slate-400 py-2">
                {selectedConsultation ? "선택한 상담에 등록된 문서가 없습니다." : "등록된 문서가 없습니다."}
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={documentFilter}
                  onChange={(e) => setDocumentFilter(e.target.value)}
                  placeholder="문서번호 검색..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-md">
                  {filteredDocuments.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleDocument(item)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                        isSelected(item.id, "document") ? "bg-purple-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected(item.id, "document")}
                        readOnly
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <FileText className="w-3 h-3 text-purple-600 flex-shrink-0" />
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.subtext && (
                        <span className="text-xs text-slate-400 flex-shrink-0">{item.subtext}</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
