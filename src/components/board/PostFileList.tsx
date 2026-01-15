"use client";

import { useEffect, useState } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { fetchPostFiles } from "@/lib/postFiles";

interface PostFile {
  id: string;
  name: string;
  url: string;
  filePath: string;
  user_id: string;
}

interface PostFileListProps {
  postId: string;
}

export default function PostFileList({ postId }: PostFileListProps) {
  const [files, setFiles] = useState<PostFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFiles = async () => {
      setLoading(true);
      const loadedFiles = await fetchPostFiles(postId);
      setFiles(loadedFiles);
      setLoading(false);
    };
    loadFiles();
  }, [postId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        파일 로딩중...
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <p className="text-sm text-gray-400">첨부된 파일이 없습니다.</p>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <a
          key={file.id}
          href={file.url}
          download={file.name}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-blue-50 rounded-md cursor-pointer transition-colors group"
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
            <span className="text-sm text-gray-700 group-hover:text-blue-600 truncate">{file.name}</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 group-hover:text-blue-800">
            <Download className="w-4 h-4" />
            다운로드
          </div>
        </a>
      ))}
    </div>
  );
}
