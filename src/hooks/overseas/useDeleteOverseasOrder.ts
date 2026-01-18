import { useState } from "react";
import { fetcher } from "@/lib/fetcher";

export function useDeleteOverseasOrder() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteOrder = async (orderId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetcher(`/api/overseas-orders/${orderId}`, {
        arg: {
          method: "DELETE",
        },
      });

      return response;
    } catch (err: any) {
      setError(err.message || "Failed to delete order");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteOrder,
    isLoading,
    error,
  };
}
