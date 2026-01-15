"use client";

import Link from "next/link";
import useSWR from "swr";
import type { PostCategory } from "@/types/post";

interface CategoriesResponse {
  categories: PostCategory[];
}

interface BoardDropdownProps {
  isExpanded: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BoardDropdown({ isExpanded }: BoardDropdownProps) {
  const { data: catData, isLoading } = useSWR<CategoriesResponse>(
    "/api/posts/categories",
    fetcher,
    { revalidateOnFocus: false }
  );

  const categories = catData?.categories || [];

  if (!isExpanded) return null;

  if (isLoading) {
    return (
      <div className="ml-5 mt-1 border-l border-gray-200 pl-3">
        <div className="py-2 text-sm text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="ml-5 mt-1 space-y-0.5 border-l border-gray-200 pl-3">
      {/* 전체 게시판 링크 */}
      <Link
        href="/board"
        className="block px-2 py-1.5 text-sm rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors font-medium"
      >
        전체
      </Link>
      {/* 카테고리별 링크 */}
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/board?category=${encodeURIComponent(category.name)}`}
          className="block px-2 py-1.5 text-sm rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
