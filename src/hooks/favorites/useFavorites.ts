import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Favorite {
  id: string;
  name: string;
}

export function useFavorites(userId: string | undefined) {
  const { data, error, mutate } = useSWR(
    userId ? `/api/move/favorite?userId=${userId}&type=company` : null,
    fetcher
  );

  const removeFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/move/favorite?favoriteId=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        mutate((prevData: { favorites: Favorite[] } | undefined) => {
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
    removeFavorite,
  };
}
