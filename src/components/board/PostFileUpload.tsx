"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, X, FileText, Loader2, Download, User, Calendar, History } from "lucide-react";
import { uploadPostFile, fetchPostFilesWithDetails, deletePostFile } from "@/lib/postFiles";
import { supabase } from "@/lib/supabaseClient";
import { useGlobalToast } from "@/context/toast";
import dayjs from "dayjs";

interface PostFile {
  id: string;
  name: string;
  url: string;
  filePath: string;
  user_id: string;
  description?: string;
  created_at?: string;
  user?: {
    id: string;
    name: string;
    level?: string;
  };
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

interface PostFileUploadProps {
  postId: string | null;
  userId: string;
  onFilesChange?: (files: PostFile[]) => void;
}

export default function PostFileUpload({
  postId,
  userId,
  onFilesChange,
}: PostFileUploadProps) {
  const [files, setFiles] = useState<PostFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<{ [fileId: string]: DownloadRecord[] }>({});
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);
  const { error: showError } = useGlobalToast();

  // 기존 파일 로드
  useEffect(() => {
    if (postId) {
      loadFiles();
    }
  }, [postId]);

  const loadFiles = async () => {
    if (!postId) return;
    const uploadedFiles = await fetchPostFilesWithDetails(postId);
    setFiles(uploadedFiles);
    onFilesChange?.(uploadedFiles);
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
    if (!postId) return;

    await supabase.from("file_downloads").insert({
      file_id: file.id,
      file_type: "post",
      file_name: file.name,
      user_id: userId,
      post_id: postId,
    });

    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id ? { ...f, downloadCount: (f.downloadCount || 0) + 1 } : f
      )
    );
  };

  // 파일 다운로드 (blob 방식)
  const handleDownload = async (file: PostFile) => {
    await recordDownload(file);

    const response = await fetch(file.url || "");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // 파일 선택 핸들러
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0 || uploading) return;

    // 새 글 작성 시 임시 저장
    if (!postId) {
      const newFiles = Array.from(selectedFiles);
      setPendingFiles((prev) => [...prev, ...newFiles]);
      const newDescriptions: { [key: string]: string } = {};
      newFiles.forEach((file) => {
        newDescriptions[file.name] = "";
      });
      setDescriptions((prev) => ({ ...prev, ...newDescriptions }));
      setShowUploadForm(true);
      return;
    }

    // 기존 글 수정 시 파일 선택
    const fileArray = Array.from(selectedFiles);
    setPendingFiles(fileArray);
    const newDescriptions: { [key: string]: string } = {};
    fileArray.forEach((file) => {
      newDescriptions[file.name] = "";
    });
    setDescriptions(newDescriptions);
    setShowUploadForm(true);
  };

  // 실제 업로드 실행
  const handleUpload = async () => {
    if (pendingFiles.length === 0 || uploading || !postId) return;

    setUploading(true);
    const uploadedFiles: PostFile[] = [];

    for (const file of pendingFiles) {
      const result = await uploadPostFile(file, postId, userId, descriptions[file.name]);
      if (result) {
        uploadedFiles.push({
          id: result.id,
          name: result.name,
          url: result.url,
          filePath: result.path,
          user_id: userId,
          description: descriptions[file.name] || undefined,
          created_at: new Date().toISOString(),
          downloadCount: 0,
        });
      }
    }

    setUploading(false);
    setPendingFiles([]);
    setDescriptions({});
    setShowUploadForm(false);

    // 새로고침하여 유저 정보 포함
    await loadFiles();
  };

  // 업로드 취소
  const cancelUpload = () => {
    setPendingFiles([]);
    setDescriptions({});
    setShowUploadForm(false);
  };

  // 파일 삭제
  const handleDelete = async (fileId: string, filePath: string) => {
    setDeletingFile(fileId);
    const success = await deletePostFile(fileId, filePath);

    if (success) {
      const newFiles = files.filter((file) => file.id !== fileId);
      setFiles(newFiles);
      onFilesChange?.(newFiles);
    } else {
      showError("파일 삭제에 실패했습니다.");
    }
    setDeletingFile(null);
  };

  // 대기 파일 삭제
  const removePendingFile = (index: number) => {
    const fileToRemove = pendingFiles[index];
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setDescriptions((prev) => {
      const newDesc = { ...prev };
      delete newDesc[fileToRemove.name];
      return newDesc;
    });
    if (pendingFiles.length === 1) {
      setShowUploadForm(false);
    }
  };

  // 드래그 & 드롭
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 글 저장 후 호출되는 함수
  const uploadPendingFiles = async (newPostId: string) => {
    if (pendingFiles.length === 0) return [];

    setUploading(true);
    const uploadedFiles: PostFile[] = [];

    for (const file of pendingFiles) {
      const result = await uploadPostFile(file, newPostId, userId, descriptions[file.name]);
      if (result) {
        uploadedFiles.push({
          id: result.id,
          name: result.name,
          url: result.url,
          filePath: result.path,
          user_id: userId,
          description: descriptions[file.name] || undefined,
        });
      }
    }

    setUploading(false);
    setPendingFiles([]);
    setDescriptions({});
    setShowUploadForm(false);
    return uploadedFiles;
  };

  // window에 함수 노출
  (window as any).__uploadPendingPostFiles = uploadPendingFiles;

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

  return (
    <div className="space-y-3">
      {/* 기존 파일 목록 */}
      {files.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl">{getFileIcon(file.name)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-700 truncate">
                      {file.name}
                    </div>
                    {file.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{file.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400 flex-wrap">
                      {file.user && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {file.user.name} {file.user.level || ""}
                        </span>
                      )}
                      {file.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {dayjs(file.created_at).format("MM/DD HH:mm")}
                        </span>
                      )}
                      {file.downloadCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {file.downloadCount}회
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {file.url && (
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="다운로드"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  {file.url && (
                    <button
                      type="button"
                      onClick={() => loadDownloadHistory(file.id)}
                      className={`p-1.5 rounded transition-colors ${
                        expandedHistory === file.id
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      }`}
                      title="다운로드 기록"
                    >
                      {loadingHistory === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <History className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {file.user_id === userId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(file.id, file.filePath)}
                      disabled={deletingFile === file.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="삭제"
                    >
                      {deletingFile === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 다운로드 기록 */}
              {expandedHistory === file.id && downloadHistory[file.id] && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-1">다운로드 기록</div>
                  {downloadHistory[file.id].length > 0 ? (
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {downloadHistory[file.id].map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between text-xs text-gray-500 py-0.5"
                        >
                          <span>{record.user?.name || "알 수 없음"} {record.user?.level || ""}</span>
                          <span className="text-gray-400">
                            {dayjs(record.created_at).format("YYYY-MM-DD HH:mm")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">다운로드 기록 없음</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 대기중인 파일 목록 (새 글 작성 시) */}
      {!postId && pendingFiles.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {pendingFiles.map((file, index) => (
            <div
              key={`pending-${index}`}
              className="flex items-center justify-between px-3 py-2 bg-yellow-50 rounded-md border border-yellow-200"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span>{getFileIcon(file.name)}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-600 truncate block">
                    {file.name}
                    <span className="text-xs text-yellow-600 ml-1">(대기중)</span>
                  </span>
                  <input
                    type="text"
                    placeholder="파일 설명 (선택)"
                    value={descriptions[file.name] || ""}
                    onChange={(e) =>
                      setDescriptions((prev) => ({
                        ...prev,
                        [file.name]: e.target.value,
                      }))
                    }
                    className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removePendingFile(index)}
                className="p-1 text-gray-400 hover:text-red-500 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 업로드 폼 (기존 글에서 파일 선택 후) */}
      {postId && showUploadForm && pendingFiles.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-800">파일 업로드</h4>
            <button
              type="button"
              onClick={cancelUpload}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {pendingFiles.map((file, index) => (
              <div key={index} className="bg-white rounded p-2 border">
                <div className="flex items-center gap-2 mb-1">
                  <span>{getFileIcon(file.name)}</span>
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="파일 설명 (선택)"
                  value={descriptions[file.name] || ""}
                  onChange={(e) =>
                    setDescriptions((prev) => ({
                      ...prev,
                      [file.name]: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={cancelUpload}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              {uploading && <Loader2 className="w-3 h-3 animate-spin" />}
              {uploading ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </div>
      )}

      {/* 파일 선택 영역 */}
      {(!postId || !showUploadForm) && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>업로드 중...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-500">
              <Upload className="w-6 h-6" />
              <p className="text-sm">파일을 드래그하거나 클릭하여 업로드</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
