"use client";

import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { X } from "lucide-react";
import FileUpload from "../FileUpload";

interface FileAttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  userId: string;
  consultationDate?: string;
  onFileCountChange?: (count: number) => void;
}

export default function FileAttachmentModal({
  isOpen,
  onClose,
  consultationId,
  userId,
  consultationDate,
  onFileCountChange,
}: FileAttachmentModalProps) {
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
          {consultationDate && (
            <span className="ml-2 text-sm text-gray-500">
              ({consultationDate} 상담)
            </span>
          )}
        </div>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent className="pt-4">
        <FileUpload
          consultationId={consultationId}
          userId={userId}
          onFileCountChange={onFileCountChange}
        />
      </DialogContent>
    </Dialog>
  );
}
