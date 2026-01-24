"use client";

import { useParams } from "next/navigation";
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
import { motion } from "framer-motion";

interface RecentPost {
  id: string;
  title: string;
  created_at: string;
  category?: { name: string };
}

export default function UserActivityPage() {
  const params = useParams();
  const loginUser = useLoginUser();
  const targetUserId = typeof params.userId === "string" ? params.userId : params.userId?.[0] ?? "";
  const basePath = `/profile/${targetUserId}`;

  // 최근 활동 조회
  const { recentActivities, recentActivitiesIsLoading } = useRecentActivities(
    targetUserId
  );

  // 최근 게시글 조회
  const { data: recentPosts, isLoading: postsLoading } = useSWR<{
    posts: RecentPost[];
  }>(
    targetUserId ? `/api/posts?user_id=${targetUserId}&limit=5` : null,
    (url) => fetcher(url, { arg: { method: "GET" } }),
    { revalidateOnFocus: false }
  );

  if (!targetUserId) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse"
          >
            <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-4 bg-gray-100 rounded" />
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
    <div className="space-y-6">
      {/* 최근 상담 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <ActivitySection
          title="최근 상담"
        icon={<MessageSquare className="w-5 h-5 text-green-500" />}
        viewAllHref={`${basePath}/consultations`}
        isLoading={recentActivitiesIsLoading}
      >
        {(recentActivities?.recent_consultations?.length ?? 0) > 0 ? (
          <ul className="divide-y divide-gray-100">
            {recentActivities!.recent_consultations
              .slice(0, 5)
              .map((item: { id: string; company_name: string; company_id: string; content: string; created_at: string }, idx: number) => (
                <li key={item.id || idx} className="py-3">
                  <Link
                    href={item.company_id ? `/consultations/${item.company_id}?highlight=${item.id}` : "#"}
                    className="block hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {item.company_name || "회사명 없음"}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1 pl-4">
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
      </motion.div>

      {/* 최근 문서 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ActivitySection
          title="최근 문서"
        icon={<FileCheck className="w-5 h-5 text-purple-500" />}
        viewAllHref={`${basePath}/documents`}
        isLoading={recentActivitiesIsLoading}
      >
        {(recentActivities?.recent_documents?.length ?? 0) > 0 ? (
          <ul className="divide-y divide-gray-100">
            {recentActivities!.recent_documents
              .slice(0, 5)
              .map((item: { company_name: string; created_at: string }, idx: number) => (
                <li
                  key={idx}
                  className="py-3 flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">
                    {item.company_name || "회사명 없음"}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
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
      </motion.div>

      {/* 최근 게시글 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ActivitySection
          title="최근 게시글"
        icon={<FileText className="w-5 h-5 text-blue-500" />}
        viewAllHref={`${basePath}/posts`}
        isLoading={postsLoading}
      >
        {recentPosts?.posts?.length ? (
          <ul className="divide-y divide-gray-100">
            {recentPosts.posts.slice(0, 5).map((post) => (
              <li key={post.id} className="py-3">
                <Link
                  href={`/board/${post.id}`}
                  className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1 rounded transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {post.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {post.category.name}
                      </span>
                    )}
                    <span className="text-sm text-gray-700 hover:text-indigo-600">
                      {post.title}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
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
      </motion.div>
    </div>
  );
}

function ActivitySection({
  title,
  icon,
  viewAllHref,
  isLoading,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  viewAllHref: string;
  isLoading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <Link
          href={viewAllHref}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
        >
          전체보기
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
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
    <p className="text-sm text-gray-400 text-center py-4">{children}</p>
  );
}
