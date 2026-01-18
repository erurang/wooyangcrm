"use client";

import { useLoginUser } from "@/context/login";
import { useRecentActivities } from "@/hooks/dashboard/useRecentActivities";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import {
  MessageSquare,
  FileCheck,
  FileText,
  Clock,
  ArrowRight,
  Building2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface RecentPost {
  id: string;
  title: string;
  created_at: string;
  category?: { name: string };
}

export default function MyActivityPage() {
  const user = useLoginUser();

  // 최근 활동 조회
  const { recentActivities, recentActivitiesIsLoading } = useRecentActivities(
    user?.id || ""
  );

  // 최근 게시글 조회
  const { data: recentPosts, isLoading: postsLoading } = useSWR<{
    posts: RecentPost[];
  }>(
    user?.id ? `/api/posts?user_id=${user.id}&limit=5` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );

  if (!user) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse ${i === 3 ? "lg:col-span-2" : ""}`}
          >
            <div className="h-6 w-32 bg-slate-200 rounded-lg mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-12 bg-slate-100 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: ko,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 최근 상담 */}
      <ActivitySection
        title="최근 상담"
        icon={<MessageSquare className="w-5 h-5 text-emerald-500" />}
        viewAllHref="/profile/consultations"
        isLoading={recentActivitiesIsLoading}
        accentColor="emerald"
      >
        {recentActivities?.recent_consultations?.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {recentActivities.recent_consultations
              .slice(0, 5)
              .map((item: { id: string; company_name: string; company_id: string; content: string; created_at: string }, idx: number) => (
                <li key={item.id || idx} className="py-3">
                  <Link
                    href={item.company_id ? `/consultations/${item.company_id}?highlight=${item.id}` : "#"}
                    className="block hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {item.company_name || "회사명 없음"}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1 pl-5">
                      {item.content || "내용 없음"}
                    </p>
                  </Link>
                </li>
              ))}
          </ul>
        ) : (
          <EmptyMessage>최근 상담 기록이 없습니다.</EmptyMessage>
        )}
      </ActivitySection>

      {/* 최근 문서 */}
      <ActivitySection
        title="최근 문서"
        icon={<FileCheck className="w-5 h-5 text-purple-500" />}
        viewAllHref="/profile/documents"
        isLoading={recentActivitiesIsLoading}
        accentColor="purple"
      >
        {recentActivities?.recent_documents?.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {recentActivities.recent_documents
              .slice(0, 5)
              .map((item: { company_name: string; created_at: string }, idx: number) => (
                <li
                  key={idx}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <span className="text-sm text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {item.company_name || "회사명 없음"}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.created_at)}
                  </span>
                </li>
              ))}
          </ul>
        ) : (
          <EmptyMessage>최근 문서 기록이 없습니다.</EmptyMessage>
        )}
      </ActivitySection>

      {/* 최근 게시글 - 전체 너비 */}
      <div className="lg:col-span-2">
        <ActivitySection
          title="최근 게시글"
          icon={<FileText className="w-5 h-5 text-blue-500" />}
          viewAllHref="/profile/posts"
          isLoading={postsLoading}
          accentColor="blue"
        >
          {recentPosts?.posts?.length ? (
            <ul className="divide-y divide-slate-100">
              {recentPosts.posts.slice(0, 5).map((post) => (
                <li key={post.id} className="py-3">
                  <Link
                    href={`/board/${post.id}`}
                    className="flex items-center justify-between hover:bg-slate-50 -mx-2 px-2 py-1 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {post.category && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {post.category.name}
                        </span>
                      )}
                      <span className="text-sm text-slate-700 hover:text-blue-600">
                        {post.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(post.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyMessage>작성한 게시글이 없습니다.</EmptyMessage>
          )}
        </ActivitySection>
      </div>
    </div>
  );
}

function ActivitySection({
  title,
  icon,
  viewAllHref,
  isLoading,
  children,
  accentColor = "blue",
}: {
  title: string;
  icon: React.ReactNode;
  viewAllHref: string;
  isLoading?: boolean;
  children: React.ReactNode;
  accentColor?: "blue" | "emerald" | "purple";
}) {
  const linkColors = {
    blue: "text-blue-600 hover:text-blue-700",
    emerald: "text-emerald-600 hover:text-emerald-700",
    purple: "text-purple-600 hover:text-purple-700",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        </div>
        <Link
          href={viewAllHref}
          className={`text-sm ${linkColors[accentColor]} flex items-center gap-1 font-medium`}
        >
          전체보기
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
      <p className="text-sm">{children}</p>
    </div>
  );
}
