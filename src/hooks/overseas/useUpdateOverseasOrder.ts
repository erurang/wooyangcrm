import { useState } from "react";
import { fetcher } from "@/lib/fetcher";
import { OverseasOrderFormData } from "@/types/overseas";

export function useUpdateOverseasOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOrder = async (orderId: string, orderData: Partial<OverseasOrderFormData>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetcher(`/api/overseas-orders/${orderId}`, {
        arg: {
          method: "PATCH",
          body: orderData,
        },
      });

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update order";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateOrder,
    isLoading,
    error,
  };
}
