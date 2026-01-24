/**
 * Generic API Query Hook
 *
 * Reduces code duplication across data fetching hooks by providing
 * a standardized SWR wrapper with common options and return values.
 *
 * @example
 * // Simple usage
 * const { data, isLoading, refresh } = useApiQuery<User[]>({
 *   url: '/api/users',
 *   dataKey: 'users',
 * });
 *
 * // With pagination
 * const { data, total, isLoading, refresh } = useApiQuery<Company[]>({
 *   url: `/api/companies?page=${page}&limit=${limit}`,
 *   dataKey: 'data',
 * });
 *
 * // Conditional fetching
 * const { data } = useApiQuery<User>({
 *   url: userId ? `/api/users/${userId}` : null,
 *   dataKey: 'user',
 * });
 */
import useSWR, { SWRConfiguration, KeyedMutator } from "swr";

// Default fetcher
const defaultFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("API request failed");
    throw error;
  }
  return res.json();
};

interface UseApiQueryOptions<T> {
  /** API endpoint URL. Pass null to skip fetching. */
  url: string | null;
  /** Key to extract data from response (e.g., 'data', 'users', 'items') */
  dataKey?: string;
  /** Key to extract total count from response (default: 'total') */
  totalKey?: string;
  /** Custom fetcher function */
  fetcher?: (url: string) => Promise<unknown>;
  /** SWR configuration options */
  swrOptions?: SWRConfiguration;
  /** Default value when data is undefined */
  defaultValue?: T;
}

interface UseApiQueryReturn<T> {
  /** The fetched data */
  data: T;
  /** Total count (for paginated responses) */
  total: number;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  isError: boolean;
  /** Error object */
  error: Error | undefined;
  /** Function to revalidate data */
  refresh: () => Promise<unknown>;
  /** Raw response from API */
  rawResponse: unknown;
}

export function useApiQuery<T>({
  url,
  dataKey = "data",
  totalKey = "total",
  fetcher = defaultFetcher,
  swrOptions = {},
  defaultValue,
}: UseApiQueryOptions<T>): UseApiQueryReturn<T> {
  const { data: rawResponse, error, isLoading, mutate } = useSWR(
    url,
    fetcher as (url: string) => Promise<Record<string, unknown>>,
    {
      revalidateOnFocus: false,
      ...swrOptions,
    }
  );

  // Extract data using dataKey
  const response = rawResponse as Record<string, unknown> | undefined;
  const extractedData = response?.[dataKey] ?? defaultValue ?? (Array.isArray(defaultValue) ? [] : undefined);

  // Extract total count
  const total = (response?.[totalKey] as number) ?? 0;

  return {
    data: extractedData as T,
    total,
    isLoading,
    isError: !!error,
    error,
    refresh: async () => { await mutate(); },
    rawResponse,
  };
}

/**
 * Simplified hook for list queries with pagination
 */
interface UseListQueryOptions {
  /** Base API endpoint */
  baseUrl: string;
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
  /** Search parameters */
  searchParams?: Record<string, string | number | boolean | undefined>;
  /** Key to extract data from response */
  dataKey?: string;
  /** SWR options */
  swrOptions?: SWRConfiguration;
}

export function useListQuery<T>({
  baseUrl,
  page,
  limit,
  searchParams = {},
  dataKey = "data",
  swrOptions = {},
}: UseListQueryOptions) {
  // Build query string
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  // Add search params
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  });

  const url = `${baseUrl}?${params.toString()}`;

  return useApiQuery<T[]>({
    url,
    dataKey,
    swrOptions,
    defaultValue: [] as T[],
  });
}

/**
 * Hook for single resource queries
 */
export function useDetailQuery<T>({
  url,
  dataKey = "data",
  swrOptions = {},
}: Omit<UseApiQueryOptions<T>, "defaultValue">) {
  return useApiQuery<T | null>({
    url,
    dataKey,
    swrOptions,
    defaultValue: null,
  });
}

export default useApiQuery;
