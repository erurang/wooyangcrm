"use client";

import { useEffect, useState } from "react";
import { Upload, X, FileText, Loader2, Download } from "lucide-react";
import { uploadPostFile, fetchPostFiles, deletePostFile } from "@/lib/postFiles";

interface PostFile {
  id: string;
  name: string;
  url: string;
  filePath: string;
  user_id: string;
}

interface PostFileUploadProps {
  postId: string | null; // null이면 새 글 (임시 저장)
  userId: string;
  onFilesChange?: (files: PostFile[]) => void;
}

export default function PostFileUpload({
  postId,
  userId,
  onFilesChange,
}: PostFileUploadProps) {
  const [files, setFiles] = useState<PostFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // 새 글 작성 시 임시 파일
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // 기존 파일 로드 (수정 시)
  useEffect(() => {
    if (postId) {
      loadFiles();
    }
  }, [postId]);

  const loadFiles = async () => {
    if (!postId) return;
    const uploadedFiles = await fetchPostFiles(postId);
    setFiles(uploadedFiles);
    onFilesChange?.(uploadedFiles);
  };

  // 파일 업로드
  const handleUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || uploading) return;

    // 새 글 작성 시에는 pendingFiles에 저장
    if (!postId) {
      const newFiles = Array.from(selectedFiles);
      setPendingFiles((prev) => [...prev, ...newFiles]);
      return;
    }

    setUploading(true);
    const uploadedFiles: PostFile[] = [];

    for (const file of selectedFiles) {
      const result = await uploadPostFile(file, postId, userId);
      if (result) {
        uploadedFiles.push({
          id: result.id,
          name: result.name,
          url: result.url,
          filePath: result.path,
          user_id: userId,
        });
      }
    }

    setUploading(false);
    const newFiles = [...files, ...uploadedFiles];
    setFiles(newFiles);
    onFilesChange?.(newFiles);
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
      alert("파일 삭제에 실패했습니다.");
    }
    setDeletingFile(null);
  };

  // 대기 파일 삭제 (새 글 작성 시)
  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
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
    handleUpload(e.dataTransfer.files);
  };

  // 외부에서 호출 가능한 업로드 함수 (글 저장 후 호출)
  const uploadPendingFiles = async (newPostId: string) => {
    if (pendingFiles.length === 0) return [];

    setUploading(true);
    const uploadedFiles: PostFile[] = [];

    for (const file of pendingFiles) {
      const result = await uploadPostFile(file, newPostId, userId);
      if (result) {
        uploadedFiles.push({
          id: result.id,
          name: result.name,
          url: result.url,
          filePath: result.path,
          user_id: userId,
        });
      }
    }

    setUploading(false);
    setPendingFiles([]);
    return uploadedFiles;
  };

  // 외부에서 접근 가능하도록 함수 노출
  (window as any).__uploadPendingPostFiles = uploadPendingFiles;

  const allFiles = [...files, ...pendingFiles.map((f, i) => ({
    id: `pending-${i}`,
    name: f.name,
    url: "",
    filePath: "",
    user_id: userId,
  }))];

  return (
    <div className="space-y-3">
      {/* 파일 목록 */}
      {allFiles.length > 0 && (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {allFiles.map((file, index) => (
            <div
              key={file.id}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {file.url ? (
                  <span className="text-sm text-gray-700 truncate">
                    {file.name}
                  </span>
                ) : (
                  <span className="text-sm text-gray-600 truncate">
                    {file.name}
                    {file.id.startsWith("pending") && (
                      <span className="text-xs text-gray-400 ml-1">(대기중)</span>
                    )}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* 다운로드 버튼 */}
                {file.url && (
                  <a
                    href={file.url}
                    download={file.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                {/* 삭제 버튼 */}
                {file.user_id === userId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (file.id.startsWith("pending")) {
                        removePendingFile(index - files.length);
                      } else {
                        handleDelete(file.id, file.filePath);
                      }
                    }}
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
          ))}
        </div>
      )}

      {/* 업로드 영역 */}
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
          onChange={(e) => handleUpload(e.target.files)}
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
    </div>
  );
}
