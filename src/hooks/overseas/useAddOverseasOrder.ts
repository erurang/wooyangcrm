import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { OverseasOrderFormData } from "@/types/overseas";

export function useAddOverseasOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOrder = async (orderData: OverseasOrderFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetcher("/api/overseas-orders", {
        arg: {
          method: "POST",
          body: orderData,
        },
      });

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add order";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    addOrder,
    isLoading,
    error,
  };
}
