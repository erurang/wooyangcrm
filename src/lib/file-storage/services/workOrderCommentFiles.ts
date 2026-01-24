/**
 * Work Order Comment File Storage Service
 *
 * Pre-configured file storage service for work order comment attachments.
 *
 * @example
 * import { workOrderCommentFileService } from "@/lib/file-storage";
 *
 * const result = await workOrderCommentFileService.upload(file, commentId, userId);
 */
import { createFileStorageService } from "../createFileService";

export const workOrderCommentFileService = createFileStorageService({
  bucketName: "consultation_files",
  tableName: "work_order_comment_files",
  foreignKey: "comment_id",
  pathPrefix: "work_order_comments",
  useSignedUrls: false,
  additionalFields: (file) => ({
    file_size: file.size,
  }),
});
