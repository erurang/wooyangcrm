import { useState } from "react";
import { OverseasContact } from "@/types/overseas";

interface UpdateOverseasCompanyData {
  id: string;
  name: string;
  address?: string;
  email?: string;
  website?: string;
  notes?: string;
  contacts?: OverseasContact[];
}

export function useUpdateOverseasCompany() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCompany = async (data: UpdateOverseasCompanyData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/companies/overseas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "거래처 수정 실패");
      }

      const result = await response.json();
      return result.company;
    } catch (err) {
      const message = err instanceof Error ? err.message : "거래처 수정 실패";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateCompany, isLoading, error };
}
