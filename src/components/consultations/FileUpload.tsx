"use client";
import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { supabaseUploadFile } from "@/lib/supabaseUploadFile";
import { supabasefetchConsultationFiles } from "@/lib/supabasefetchConsultationFiles";
import { supabaseDeleteConsultationFiles } from "@/lib/supabaseDeleteConsultationFiles";

interface FileUploadProps {
  consultationId: string;
  userId: any;
}

export default function FileUpload({
  consultationId,
  userId,
}: FileUploadProps) {
  const [files, setFiles] = useState<
    {
      filePath: string;
      id: string;
      name: string;
      url: string;
    }[]
  >([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      const uploadedFiles = await supabasefetchConsultationFiles(
        consultationId,
        userId
      );

      if (!uploadedFiles || !Array.isArray(uploadedFiles)) {
        console.error("파일 목록을 불러오는 데 실패했습니다.");
        setFiles([]);
        return;
      }

      setFiles(uploadedFiles); // ✅ `null` 값 제거 완료된 리스트 사용
    };

    loadFiles();
  }, [consultationId, userId]);

  const handleUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || uploading) return;

    setUploading(true);
    const uploadedFiles: {
      id: string;
      name: string;
      url: string;
      filePath: string;
    }[] = [];

    for (const file of selectedFiles) {
      const uploadedFile = await supabaseUploadFile(
        file,
        consultationId,
        userId
      );
      if (uploadedFile) {
        uploadedFiles.push({
          id: uploadedFile.id,
          name: uploadedFile.name,
          url: uploadedFile.path, // ✅ 이미 Signed URL 생성되므로 원본 경로만 저장
          filePath: uploadedFile.path, // ✅ 원본 파일 경로 포함
        });
      }
    }

    setUploading(false);
    setFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
  };

  // ✅ 파일 삭제 처리 수정
  const handleDelete = async (fileId: string, filePath: string) => {
    setDeletingFile(fileId);

    const success = await supabaseDeleteConsultationFiles(fileId, filePath);

    if (success) {
      setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    } else {
      alert("파일 삭제에 실패했습니다.");
    }

    setDeletingFile(null);
  };

  // ✅ 드래그 & 드롭 이벤트
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

  return (
    <div
      className="flex flex-col space-y-2 text-sm"
      style={{
        minHeight: "120px",
        maxHeight: "120px",
        overflowY: "auto",
        display: "block",
      }}
    >
      <div className="mt-2">
        <div className="space-y-2">
          {files.map((file, index) => (
            <ul key={index} className="flex justify-between items-center  pl-4">
              <li className="flex justify-between items-center w-full">
                <span
                  onClick={() => window.open(file.url, "_blank")}
                  className="text-blue-500 cursor-pointer truncate w-[150px] overflow-hidden text-ellipsis"
                  title={file.name} // 마우스 오버 시 전체 파일명 표시
                >
                  {file.name}
                </span>

                <button
                  onClick={() => handleDelete(file.id, file.filePath)}
                  className="px-2 py-1 opacity-50 text-sm rounded-md hover:text-red-500 hover:opacity-100 flex items-center"
                  disabled={deletingFile === file.url} // 삭제 중이면 버튼 비활성화
                >
                  {deletingFile === file.id ? (
                    <CircularProgress size={16} className="text-red-500" />
                  ) : (
                    "삭제"
                  )}
                </button>
              </li>
            </ul>
          ))}
        </div>
      </div>
      {uploading ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
            dragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
          } flex justify-center items-center`}
        >
          <CircularProgress size={24} className="text-blue-500" />
          <p className="text-gray-500 ml-2">업로드 중...</p>
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
            dragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
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
          />
          <p className="text-gray-500">
            여기에 파일을 드래그하거나 여러 개를 클릭하여 업로드하세요.
          </p>
        </div>
      )}
    </div>
  );
}
