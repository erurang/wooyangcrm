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
      <div className="ml-5 mt-1 border-l border-white/10 pl-3">
        <div className="py-2 text-[13px] text-sidebar-text">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-3">
      <Link
        href="/board"
        className="block px-2 py-1.5 text-[13px] rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors duration-150 font-medium cursor-pointer"
      >
        전체
      </Link>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/board?category=${encodeURIComponent(category.name)}`}
          className="block px-2 py-1.5 text-[13px] rounded-md text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors duration-150 cursor-pointer"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
