"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useCompanySearch } from "@/hooks/manage/contacts/useCompanySearch";

interface UserType {
  id: string;
  name: string;
  level: string;
}

interface UseDocumentDetailsFiltersProps {
  type: string;
  users: UserType[];
}

interface FilterState {
  searchTerm: string;
  searchDocNumber: string;
  searchNotes: string;
  selectedStatus: string;
  selectedUser: UserType | null;
  documentsPerPage: number;
  currentPage: number;
}

export function useDocumentDetailsFilters({
  type,
  users,
}: UseDocumentDetailsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("company") || ""
  );
  const [searchDocNumber, setSearchDocNumber] = useState(
    searchParams.get("docNumber") || ""
  );
  const [searchNotes, setSearchNotes] = useState(
    searchParams.get("notes") || ""
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || "all"
  );
  const [selectedUser, setSelectedUser] = useState<UserType | null>(() => {
    const userId = searchParams.get("userId");
    if (!userId) return null;
    return { id: userId, name: "", level: "" };
  });
  const [documentsPerPage, setDocumentsPerPage] = useState(
    Number.parseInt(searchParams.get("limit") || "10", 10)
  );
  const [currentPage, setCurrentPage] = useState(
    Number.parseInt(searchParams.get("page") || "1", 10)
  );

  // Debounced values
  const debounceSearchTerm = useDebounce(searchTerm, 300);
  const { companies } = useCompanySearch(debounceSearchTerm);
  const companyIds = companies.map((company: any) => company.id);
  const debounceCompanyIds = useDebounce(companyIds, 300);
  const debounceDocNumber = useDebounce(searchDocNumber, 300);
  const debounceNotes = useDebounce(searchNotes, 300);

  // URL update helper
  const updateUrlParams = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });

      router.push(`/documents/details?${newParams.toString()}`);
    },
    [router, searchParams]
  );

  // Effects
  useEffect(() => {
    if (users.length > 0 && searchParams.get("userId")) {
      const userId = searchParams.get("userId");
      const user = users.find((u: UserType) => u.id === userId) || null;
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [users, searchParams]);

  // Handlers
  const handleSearchTermChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      setCurrentPage(1);
      updateUrlParams({ company: value, page: "1" });
    },
    [updateUrlParams]
  );

  const handleDocNumberChange = useCallback(
    (value: string) => {
      setSearchDocNumber(value);
      setCurrentPage(1);
      updateUrlParams({ docNumber: value, page: "1" });
    },
    [updateUrlParams]
  );

  const handleNotesChange = useCallback(
    (value: string) => {
      setSearchNotes(value);
      setCurrentPage(1);
      updateUrlParams({ notes: value, page: "1" });
    },
    [updateUrlParams]
  );

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setSelectedStatus(value);
      setCurrentPage(1);
      updateUrlParams({ status: value, page: "1" });
    },
    [updateUrlParams]
  );

  const handleUserChange = useCallback(
    (user: UserType | null) => {
      setSelectedUser(user);
      setCurrentPage(1);
      updateUrlParams({ userId: user?.id || null, page: "1" });
    },
    [updateUrlParams]
  );

  const handlePerPageChange = useCallback(
    (value: number) => {
      setDocumentsPerPage(value);
      setCurrentPage(1);
      updateUrlParams({ limit: value.toString(), page: "1" });
    },
    [updateUrlParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      updateUrlParams({ page: page.toString() });
    },
    [updateUrlParams]
  );

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedUser(null);
    setSearchDocNumber("");
    setSearchNotes("");
    setCurrentPage(1);
    setSelectedStatus("all");
    setDocumentsPerPage(10);
    router.push(`/documents/details?type=${type}`);
  }, [router, type]);

  return {
    // State
    filters: {
      searchTerm,
      searchDocNumber,
      searchNotes,
      selectedStatus,
      selectedUser,
      documentsPerPage,
      currentPage,
    } as FilterState,
    // Debounced values for API calls
    debounced: {
      companyIds: debounceCompanyIds,
      docNumber: debounceDocNumber,
      notes: debounceNotes,
    },
    // Handlers
    handlers: {
      onSearchTermChange: handleSearchTermChange,
      onDocNumberChange: handleDocNumberChange,
      onNotesChange: handleNotesChange,
      onStatusChange: handleStatusFilterChange,
      onUserChange: handleUserChange,
      onPerPageChange: handlePerPageChange,
      onPageChange: handlePageChange,
      onResetFilters: resetFilters,
    },
  };
}
