import useSWR from "swr";

interface Template {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  users?: { name: string };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNotesTemplates() {
  const { data, error, isLoading, mutate } = useSWR<{ templates: Template[] }>(
    "/api/document-templates",
    fetcher
  );

  const addTemplate = async (title: string, content: string, createdBy?: string) => {
    const response = await fetch("/api/document-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, created_by: createdBy }),
    });

    if (!response.ok) {
      throw new Error("Failed to add template");
    }

    await mutate();
    return response.json();
  };

  const updateTemplate = async (id: string, title: string, content: string) => {
    const response = await fetch(`/api/document-templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      throw new Error("Failed to update template");
    }

    await mutate();
    return response.json();
  };

  const deleteTemplate = async (id: string) => {
    const response = await fetch(`/api/document-templates/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete template");
    }

    await mutate();
    return response.json();
  };

  return {
    templates: data?.templates || [],
    isLoading,
    error,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    refresh: mutate,
  };
}
