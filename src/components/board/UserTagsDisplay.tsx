"use client";

import Link from "next/link";
import { User, Users, UserCheck } from "lucide-react";
import type { PostUserTag } from "@/types/post";

interface UserTagsDisplayProps {
  tags: PostUserTag[];
}

const tagTypeLabels: Record<"reference" | "coauthor", string> = {
  reference: "참조",
  coauthor: "공동작성",
};

const tagTypeColors: Record<"reference" | "coauthor", string> = {
  reference: "bg-blue-50 text-blue-600 border-blue-200",
  coauthor: "bg-green-50 text-green-600 border-green-200",
};

const tagTypeIcons: Record<"reference" | "coauthor", React.ReactNode> = {
  reference: <User className="w-3 h-3" />,
  coauthor: <UserCheck className="w-3 h-3" />,
};

export default function UserTagsDisplay({ tags }: UserTagsDisplayProps) {
  if (!tags || tags.length === 0) return null;

  // 태그 타입별로 그룹화
  const coauthors = tags.filter((t) => t.tag_type === "coauthor");
  const references = tags.filter((t) => t.tag_type === "reference");

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
        <Users className="w-4 h-4" />
        태그된 유저
      </div>
      <div className="flex flex-wrap gap-2">
        {coauthors.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {coauthors.map((tag) => (
              <Link
                key={tag.id}
                href={`/profile/${tag.user_id}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors hover:opacity-80 ${tagTypeColors.coauthor}`}
              >
                {tagTypeIcons.coauthor}
                <span className="font-medium">{tag.user?.name}</span>
                {tag.user?.level && (
                  <span className="opacity-70">{tag.user.level}</span>
                )}
                <span className="opacity-60">· {tagTypeLabels.coauthor}</span>
              </Link>
            ))}
          </div>
        )}
        {references.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {references.map((tag) => (
              <Link
                key={tag.id}
                href={`/profile/${tag.user_id}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-colors hover:opacity-80 ${tagTypeColors.reference}`}
              >
                {tagTypeIcons.reference}
                <span className="font-medium">{tag.user?.name}</span>
                {tag.user?.level && (
                  <span className="opacity-70">{tag.user.level}</span>
                )}
                <span className="opacity-60">· {tagTypeLabels.reference}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
