import { useState } from "react";
import { fetcher } from "@/lib/fetcher";

export function useUpdateOverseasOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOrder = async (orderId: string, orderData: Record<string, any>) => {
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
    } catch (err: any) {
      setError(err.message || "Failed to update order");
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
