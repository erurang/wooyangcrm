/**
 * Approval File Storage Service
 *
 * Pre-configured file storage service for approval request attachments.
 *
 * @example
 * import { approvalFileService } from "@/lib/file-storage";
 *
 * const result = await approvalFileService.upload(file, approvalId, userId);
 * const files = await approvalFileService.fetch(approvalId);
 */
import { createFileStorageService } from "../createFileService";

export const approvalFileService = createFileStorageService({
  bucketName: "approval_files",
  tableName: "approval_files",
  foreignKey: "request_id",
  pathPrefix: "approvals",
  useSignedUrls: true,
  signedUrlExpiration: 3600,
  additionalFields: (file) => ({
    file_size: file.size,
    file_type: file.type,
  }),
  selectFields: `
    id,
    file_name,
    file_url,
    file_size,
    file_type,
    created_at,
    user:users(id, name)
  `,
});
