import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Favorite {
  id: string;
  name: string;
}

export function useFavorites(userId: string | undefined) {
  const { data, error, mutate } = useSWR(
    userId ? `/api/favorite?userId=${userId}&type=company` : null,
    fetcher
  );

  const addFavorite = async (userId: string, companyId: string, companyName: string) => {
    try {
      const res = await fetch(
        `/api/favorite?userId=${userId}&type=company&name=${companyName}&itemId=${companyId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (res.ok) {
        const newFavorite: Favorite = { id: companyId, name: companyName };

        await mutate((prevData: { favorites: Favorite[] } | undefined) => {
          if (!prevData) return { favorites: [newFavorite] };
          return { favorites: [...prevData.favorites, newFavorite] };
        }, false);
      } else {
        console.error("Failed to add favorite");
      }
    } catch (error) {
      console.error("Error adding favorite:", error);
    }
  };

  const removeFavorite = async (id: string) => {
    try {
      const res = await fetch(
        `/api/favorite?userId=${userId}&companyId=${id}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        await mutate((prevData: { favorites: Favorite[] } | undefined) => {
          if (!prevData) return { favorites: [] };
          return {
            favorites: prevData.favorites.filter((fav) => fav.id !== id),
          };
        }, false);
      } else {
        console.error("Failed to remove favorite");
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  return {
    favorites: data?.favorites || [],
    isLoading: !data && !error,
    isError: !!error,
    addFavorite,
    removeFavorite,
    refetchFavorites: mutate,
  };
}
