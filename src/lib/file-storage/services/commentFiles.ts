/**
 * Comment File Storage Service
 *
 * Pre-configured file storage service for post comment attachments.
 *
 * @example
 * import { commentFileService } from "@/lib/file-storage";
 *
 * const result = await commentFileService.upload(file, commentId, userId);
 * const files = await commentFileService.fetch(commentId);
 */
import { createFileStorageService } from "../createFileService";

export const commentFileService = createFileStorageService({
  bucketName: "post_files",
  tableName: "post_comment_files",
  foreignKey: "comment_id",
  pathPrefix: "comments",
  useSignedUrls: true,
  signedUrlExpiration: 3600,
});
