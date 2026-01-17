"use client";
import { useEffect, useState, useRef } from "react";
import { CircularProgress } from "@mui/material";
import { Download, Trash2, User, Calendar, FileText, X, History, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import dayjs from "dayjs";

interface ConsultationFile {
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

interface FileUploadProps {
  consultationId: string;
  userId: string;
  onFileCountChange?: (count: number) => void;
}

export default function FileUpload({
  consultationId,
  userId,
  onFileCountChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<ConsultationFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 파일 업로드 시 설명 입력용
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<{ [key: string]: string }>({});
  const [showUploadForm, setShowUploadForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 다운로드 기록
  const [downloadHistory, setDownloadHistory] = useState<{ [fileId: string]: DownloadRecord[] }>({});
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<string | null>(null);

  // 파일 목록 로드
  useEffect(() => {
    loadFiles();
  }, [consultationId]);

  const loadFiles = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("consultation_files")
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
      .eq("consultation_id", consultationId)
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
        const filePath = file.file_url.startsWith("consultations/")
          ? file.file_url
          : `consultations/${file.file_url}`;

        const { data: signedUrlData } = await supabase.storage
          .from("consultation_files")
          .createSignedUrl(filePath, 60 * 60); // 1시간 유효

        return {
          ...file,
          user: file.users,
          signedUrl: signedUrlData?.signedUrl || "",
          downloadCount: countMap[file.id] || 0,
        };
      })
    );

    setFiles(filesWithUrls);
    onFileCountChange?.(filesWithUrls.length);
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
  const recordDownload = async (file: ConsultationFile) => {
    await supabase.from("file_downloads").insert({
      file_id: file.id,
      file_type: "consultation",
      file_name: file.file_name,
      user_id: userId,
      consultation_id: consultationId,
    });

    // 다운로드 수 업데이트
    setFiles((prev) =>
      prev.map((f) =>
        f.id === file.id ? { ...f, downloadCount: (f.downloadCount || 0) + 1 } : f
      )
    );
  };

  // 파일 선택 핸들러
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);
    setPendingFiles(fileArray);

    // 설명 초기화
    const newDescriptions: { [key: string]: string } = {};
    fileArray.forEach((file) => {
      newDescriptions[file.name] = "";
    });
    setDescriptions(newDescriptions);
    setShowUploadForm(true);
  };

  // 실제 업로드 실행
  const handleUpload = async () => {
    if (pendingFiles.length === 0 || uploading) return;

    setUploading(true);

    for (const file of pendingFiles) {
      const timestamp = Date.now();
      const sanitizedName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w.-]/g, "_")
        .replace(/_{2,}/g, "_")
        .toLowerCase();
      const uniqueFileName = `${timestamp}_${sanitizedName}`;
      const filePath = `consultations/${userId}/${consultationId}/${uniqueFileName}`;

      // 스토리지에 업로드
      const { error: uploadError } = await supabase.storage
        .from("consultation_files")
        .upload(filePath, file);

      if (uploadError) {
        console.error("파일 업로드 실패:", uploadError.message);
        continue;
      }

      // DB에 저장 (설명 포함)
      const { error: dbError } = await supabase
        .from("consultation_files")
        .insert({
          consultation_id: consultationId,
          user_id: userId,
          file_url: filePath,
          file_name: file.name,
          description: descriptions[file.name] || null,
        });

      if (dbError) {
        console.error("DB 저장 실패:", dbError.message);
      }
    }

    setUploading(false);
    setPendingFiles([]);
    setDescriptions({});
    setShowUploadForm(false);
    loadFiles(); // 목록 새로고침
  };

  // 업로드 취소
  const cancelUpload = () => {
    setPendingFiles([]);
    setDescriptions({});
    setShowUploadForm(false);
  };

  // 파일 삭제
  const handleDelete = async (fileId: string, filePath: string) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;

    setDeletingFile(fileId);

    // 스토리지에서 삭제
    const { error: storageError } = await supabase.storage
      .from("consultation_files")
      .remove([filePath]);

    if (storageError) {
      console.error("스토리지 삭제 실패:", storageError.message);
    }

    // DB에서 삭제
    const { error: dbError } = await supabase
      .from("consultation_files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      alert("파일 삭제에 실패했습니다.");
    } else {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      onFileCountChange?.(files.length - 1);
    }

    setDeletingFile(null);
  };

  // 파일 다운로드
  const handleDownload = async (file: ConsultationFile) => {
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

  // 드래그 & 드롭 이벤트
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
    <div className="flex flex-col space-y-4">
      {/* 파일 목록 */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <CircularProgress size={24} />
          </div>
        ) : files.length > 0 ? (
          files.map((file) => (
            <div
              key={file.id}
              className="bg-gray-50 rounded-lg p-3 border border-gray-200"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(file.file_name)}</span>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer truncate"
                      onClick={() => window.open(file.signedUrl, "_blank")}
                      title={file.file_name}
                    >
                      {file.file_name}
                    </div>
                    {file.description && (
                      <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
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
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => loadDownloadHistory(file.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      expandedHistory === file.id
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title="다운로드 기록"
                  >
                    {loadingHistory === file.id ? (
                      <CircularProgress size={16} />
                    ) : (
                      <History className="w-4 h-4" />
                    )}
                  </button>
                  {file.user_id === userId && (
                    <button
                      onClick={() => handleDelete(file.id, file.file_url)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={deletingFile === file.id}
                      title="삭제"
                    >
                      {deletingFile === file.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* 다운로드 기록 */}
              {expandedHistory === file.id && downloadHistory[file.id] && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-2">다운로드 기록</div>
                  {downloadHistory[file.id].length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {downloadHistory[file.id].map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between text-xs text-gray-600 py-1"
                        >
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {record.user?.name || "알 수 없음"} {record.user?.level || ""}
                          </span>
                          <span className="text-gray-400">
                            {dayjs(record.created_at).format("YYYY-MM-DD HH:mm")}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">다운로드 기록이 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>첨부된 파일이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 업로드 폼 (파일 선택 후 표시) */}
      {showUploadForm && pendingFiles.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-800">파일 업로드</h4>
            <button
              onClick={cancelUpload}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {pendingFiles.map((file, index) => (
              <div key={index} className="bg-white rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-2">
                  <span>{getFileIcon(file.name)}</span>
                  <span className="font-medium text-sm truncate">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="파일 설명 (선택사항)"
                  value={descriptions[file.name] || ""}
                  onChange={(e) =>
                    setDescriptions((prev) => ({
                      ...prev,
                      [file.name]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={cancelUpload}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              취소
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {uploading && <CircularProgress size={16} className="text-white" />}
              {uploading ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </div>
      )}

      {/* 파일 선택 영역 */}
      {!showUploadForm && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <div className="text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="font-medium">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="text-sm mt-1">여러 파일을 한번에 업로드할 수 있습니다</p>
          </div>
        </div>
      )}
    </div>
  );
}
