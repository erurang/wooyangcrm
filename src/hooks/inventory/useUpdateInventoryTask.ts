import { useState } from "react";
import type {
  UpdateInventoryTaskRequest,
  InventoryTaskWithDetails,
} from "@/types/inventory";

interface UpdateResult {
  success: boolean;
  task?: InventoryTaskWithDetails;
  error?: string;
}

export function useUpdateInventoryTask() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTask = async (
    taskId: string,
    data: UpdateInventoryTaskRequest & { user_id: string }
  ): Promise<UpdateResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/inventory/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "수정 실패");
        return { success: false, error: result.error };
      }

      return { success: true, task: result.task };
    } catch (err) {
      const message = err instanceof Error ? err.message : "수정 중 오류 발생";
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const assignTask = async (
    taskId: string,
    assigned_to: string,
    user_id: string
  ): Promise<UpdateResult> => {
    return updateTask(taskId, {
      assigned_to,
      user_id,
    });
  };

  const completeTask = async (
    taskId: string,
    completed_by: string
  ): Promise<UpdateResult> => {
    return updateTask(taskId, {
      status: "completed",
      user_id: completed_by,
    });
  };

  const updateExpectedDate = async (
    taskId: string,
    expected_date: string,
    user_id: string
  ): Promise<UpdateResult> => {
    return updateTask(taskId, {
      expected_date,
      user_id,
    });
  };

  const updateNotes = async (
    taskId: string,
    notes: string,
    user_id: string
  ): Promise<UpdateResult> => {
    return updateTask(taskId, {
      notes,
      user_id,
    });
  };

  const cancelTask = async (
    taskId: string,
    user_id: string
  ): Promise<UpdateResult> => {
    return updateTask(taskId, {
      status: "canceled",
      user_id,
    });
  };

  return {
    updateTask,
    assignTask,
    completeTask,
    updateExpectedDate,
    updateNotes,
    cancelTask,
    isLoading,
    error,
  };
}
