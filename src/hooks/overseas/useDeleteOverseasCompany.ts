import { useState } from "react";

export function useDeleteOverseasCompany() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCompany = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/companies/overseas?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "거래처 삭제 실패");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "거래처 삭제 실패";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteCompany, isLoading, error };
}
