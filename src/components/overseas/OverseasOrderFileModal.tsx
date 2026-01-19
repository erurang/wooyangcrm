"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton, CircularProgress } from "@mui/material";
import { X, Download, Trash2, Upload, FileText, Calendar, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useLoginUser } from "@/context/login";
import { useGlobalToast } from "@/context/toast";
import dayjs from "dayjs";

interface OrderFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  description?: string;
  user_id: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
  };
  signedUrl?: string;
}

interface OverseasOrderFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  invoiceNo: string;
  onFileCountChange?: (count: number) => void;
}

const FILE_TYPE_OPTIONS = [
  { value: "PI", label: "PI (Proforma Invoice)" },
  { value: "OC", label: "OC (Order Confirmation)" },
  { value: "BL", label: "B/L (Bill of Lading)" },
  { value: "CI", label: "CI (Commercial Invoice)" },
  { value: "PL", label: "PL (Packing List)" },
  { value: "remittance", label: "송금 증빙" },
  { value: "other", label: "기타" },
];

export default function OverseasOrderFileModal({
  isOpen,
  onClose,
  orderId,
  invoiceNo,
  onFileCountChange,
}: OverseasOrderFileModalProps) {
  const loginUser = useLoginUser();
  const { error: showError } = useGlobalToast();
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // 업로드 폼 상태
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fileType, setFileType] = useState("other");
  const [description, setDescription] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 목록 로드
  useEffect(() => {
    if (isOpen && orderId) {
      loadFiles();
    }
  }, [isOpen, orderId]);

  const loadFiles = async () => {
    if (!orderId) {
      setLoading(false);
      setFiles([]);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("overseas_order_files")
      .select(`
        id,
        file_name,
        file_url,
        file_type,
        description,
        user_id,
        created_at,
        users:user_id (
          id,
          name
        )
      `)
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("파일 목록 로드 실패:", error.message);
      setFiles([]);
      setLoading(false);
      return;
    }

    // Signed URL 생성
    const filesWithUrls = await Promise.all(
      (data || []).map(async (file: any) => {
        const { data: signedUrlData } = await supabase.storage
          .from("overseas_order_files")
          .createSignedUrl(file.file_url, 60 * 60);

        return {
          ...file,
          user: file.users,
          signedUrl: signedUrlData?.signedUrl || "",
        };
      })
    );

    setFiles(filesWithUrls);
    onFileCountChange?.(filesWithUrls.length);
    setLoading(false);
  };

  // 파일 선택
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setPendingFiles(Array.from(selectedFiles));
    setShowUploadForm(true);
  };

  // 파일 업로드
  const handleUpload = async () => {
    if (pendingFiles.length === 0 || uploading || !loginUser?.id) return;

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
      const filePath = `orders/${orderId}/${uniqueFileName}`;

      // 스토리지에 업로드
      const { error: uploadError } = await supabase.storage
        .from("overseas_order_files")
        .upload(filePath, file);

      if (uploadError) {
        console.error("파일 업로드 실패:", uploadError.message);
        continue;
      }

      // DB에 저장
      const { error: dbError } = await supabase
        .from("overseas_order_files")
        .insert({
          order_id: orderId,
          user_id: loginUser.id,
          file_url: filePath,
          file_name: file.name,
          file_type: fileType,
          description: description || null,
        });

      if (dbError) {
        console.error("DB 저장 실패:", dbError.message);
      }
    }

    setUploading(false);
    cancelUpload();
    loadFiles();
  };

  // 업로드 취소
  const cancelUpload = () => {
    setPendingFiles([]);
    setFileType("other");
    setDescription("");
    setShowUploadForm(false);
  };

  // 파일 삭제
  const handleDelete = async (fileId: string, filePath: string) => {
    if (!confirm("파일을 삭제하시겠습니까?")) return;

    setDeletingFile(fileId);

    // 스토리지에서 삭제
    await supabase.storage.from("overseas_order_files").remove([filePath]);

    // DB에서 삭제
    const { error: dbError } = await supabase
      .from("overseas_order_files")
      .delete()
      .eq("id", fileId);

    if (dbError) {
      showError("파일 삭제에 실패했습니다.");
    } else {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      onFileCountChange?.(files.length - 1);
    }

    setDeletingFile(null);
  };

  // 파일 다운로드
  const handleDownload = async (file: OrderFile) => {
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

  // 파일 타입 라벨
  const getFileTypeLabel = (type: string) => {
    const option = FILE_TYPE_OPTIONS.find((o) => o.value === type);
    return option?.label || type;
  };

  // 파일 확장자 아이콘
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) return "🖼️";
    if (["pdf"].includes(ext || "")) return "📄";
    if (["doc", "docx"].includes(ext || "")) return "📝";
    if (["xls", "xlsx"].includes(ext || "")) return "📊";
    return "📎";
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          maxHeight: "85vh",
          minHeight: "500px",
        },
      }}
    >
      <DialogTitle className="flex items-center justify-between border-b pb-3">
        <div>
          <span className="text-lg font-semibold">첨부파일</span>
          <span className="ml-2 text-sm text-gray-500">({invoiceNo})</span>
        </div>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent className="pt-4">
        {/* 드래그 앤 드롭 영역 */}
        {!showUploadForm && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 transition-colors ${
              dragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              파일을 여기에 끌어다 놓거나
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              파일 선택
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <p className="text-xs text-gray-400 mt-2">
              PI, OC, B/L, CI, PL, 송금 증빙 등
            </p>
          </div>
        )}

        {/* 업로드 폼 */}
        {showUploadForm && (
          <div className="border rounded-lg p-4 mb-4 bg-gray-50">
            <h4 className="text-sm font-medium mb-3">파일 업로드</h4>
            <div className="space-y-3">
              {/* 선택된 파일 목록 */}
              <div className="text-sm text-gray-600">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FileText size={14} />
                    {f.name}
                  </div>
                ))}
              </div>

              {/* 파일 타입 선택 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">문서 종류</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {FILE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">설명 (선택)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="파일에 대한 설명"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={cancelUpload}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {uploading && <CircularProgress size={14} color="inherit" />}
                  업로드
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 파일 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <CircularProgress size={24} />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm">첨부된 파일이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-xl">{getFileIcon(file.file_name)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {file.file_name}
                      </span>
                      <span className="shrink-0 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {getFileTypeLabel(file.file_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {dayjs(file.created_at).format("YYYY-MM-DD HH:mm")}
                      </span>
                      {file.user && (
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {file.user.name}
                        </span>
                      )}
                      {file.description && (
                        <span className="text-gray-400">{file.description}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="다운로드"
                  >
                    <Download size={16} />
                  </button>
                  {file.user_id === loginUser?.id && (
                    <button
                      onClick={() => handleDelete(file.id, file.file_url)}
                      disabled={deletingFile === file.id}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="삭제"
                    >
                      {deletingFile === file.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
