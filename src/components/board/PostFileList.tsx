"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Loader2, User, Calendar, History } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import dayjs from "dayjs";

interface PostFile {
  id: string;
  file_name: string;
  file_url: string;
  description?: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    level?: string;
  };
  signedUrl?: string;
  downloadCount?: number;
}

interface DownloadRecord {
  id: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    level?: string;
  };
}

interface PostFileListProps {
  postId: string;
  currentUserId?: string;
}

export default function PostFileList({ postId, currentUserId }: PostFileListProps) {
  const [files, setFiles] = useState<PostFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadHistory, setDownloadHistory] = useState<{ [fileId: string]: DownloadRecord[] }>({});
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, [postId]);

  const loadFiles = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("post_files")
      .select(`
        id,
        file_name,
        file_url,
        description,
        user_id,
        created_at,
        users:user_id (
          id,
          name,
          level
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("파일 목록 로드 실패:", error.message);
      setFiles([]);
      setLoading(false);
      return;
    }

    // 다운로드 수 조회
    const fileIds = (data || []).map((f: any) => f.id);
    const { data: downloadCounts } = await supabase
      .from("file_downloads")
      .select("file_id")
      .in("file_id", fileIds);

    const countMap: { [key: string]: number } = {};
    downloadCounts?.forEach((d) => {
      countMap[d.file_id] = (countMap[d.file_id] || 0) + 1;
    });

    // Signed URL 생성
    const filesWithUrls = await Promise.all(
      (data || []).map(async (file: any) => {
        const filePath = file.file_url;

        const { data: signedUrlData } = await supabase.storage
          .from("post_files")
          .createSignedUrl(filePath, 60 * 60); // 1시간 유효

        return {
          id: file.id,
          file_name: file.file_name,
          file_url: file.file_url,
          description: file.description,
          user_id: file.user_id,
          created_at: file.created_at,
          user: file.users,
          signedUrl: signedUrlData?.signedUrl || "",
          downloadCount: countMap[file.id] || 0,
        };
      })
    );

    setFiles(filesWithUrls);
    setLoading(false);
  };

  // 다운로드 기록 조회
  const loadDownloadHistory = async (fileId: string) => {
    if (expandedHistory === fileId) {
      setExpandedHistory(null);
      return;
    }

    setLoadingHistory(fileId);

    const { data, error } = await supabase
      .from("file_downloads")
      .select(`
        id,
        created_at,
        users:user_id (
          id,
          name,
          level
        )
      `)
      .eq("file_id", fileId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setDownloadHistory((prev) => ({
        ...prev,
        [fileId]: data.map((d: any) => ({
          id: d.id,
          created_at: d.created_at,
          user: d.users,
        })),
      }));
    }

    setLoadingHistory(null);
    setExpandedHistory(fileId);
  };

  // 다운로드 기록 저장
  const recordDownload = async (file: PostFile) => {
    if (!currentUserId) return;

    await supabase.from("file_downloads").insert({
      file_id: file.id,
      file_type: "post",
      file_name: file.file_name,
      user_id: currentUserId,
      post_id: postId,
    });

    // 다운로드 수 업데이트
    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id ? { ...f, downloadCount: (f.downloadCount || 0) + 1 } : f
      )
    );
  };

  // 파일 다운로드 (blob 방식)
  const handleDownload = async (file: PostFile) => {
    // 다운로드 기록 저장
    await recordDownload(file);

    const response = await fetch(file.signedUrl || "");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // 파일 확장자 아이콘
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
      return "🖼️";
    } else if (["pdf"].includes(ext || "")) {
      return "📄";
    } else if (["doc", "docx"].includes(ext || "")) {
      return "📝";
    } else if (["xls", "xlsx"].includes(ext || "")) {
      return "📊";
    } else if (["ppt", "pptx"].includes(ext || "")) {
      return "📽️";
    } else if (["zip", "rar", "7z"].includes(ext || "")) {
      return "🗜️";
    }
    return "📎";
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        파일 로딩중...
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-2">첨부된 파일이 없습니다.</p>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div
          key={file.id}
          className="bg-slate-50 rounded-lg p-3 border border-slate-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-2xl">{getFileIcon(file.file_name)}</span>
              <div className="flex-1 min-w-0">
                <div
                  className="font-medium text-sky-600 hover:text-sky-800 cursor-pointer truncate"
                  onClick={() => window.open(file.signedUrl, "_blank")}
                  title={file.file_name}
                >
                  {file.file_name}
                </div>
                {file.description && (
                  <p className="text-sm text-slate-500 mt-1">{file.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {file.user?.name || "알 수 없음"} {file.user?.level || ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {dayjs(file.created_at).format("YYYY-MM-DD HH:mm")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    다운로드 {file.downloadCount || 0}회
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDownload(file)}
                className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                title="다운로드"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadDownloadHistory(file.id)}
                className={`p-2 rounded-lg transition-colors ${
                  expandedHistory === file.id
                    ? "text-sky-600 bg-sky-50"
                    : "text-slate-400 hover:text-sky-600 hover:bg-sky-50"
                }`}
                title="다운로드 기록"
              >
                {loadingHistory === file.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <History className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* 다운로드 기록 */}
          {expandedHistory === file.id && downloadHistory[file.id] && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-400 mb-2">다운로드 기록</div>
              {downloadHistory[file.id].length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {downloadHistory[file.id].map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between text-xs text-slate-500 py-1"
                    >
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {record.user?.name || "알 수 없음"} {record.user?.level || ""}
                      </span>
                      <span className="text-slate-400">
                        {dayjs(record.created_at).format("YYYY-MM-DD HH:mm")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">다운로드 기록이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
