/**
 * Post File Storage Service
 *
 * Pre-configured file storage service for board post attachments.
 *
 * @example
 * import { postFileService } from "@/lib/file-storage";
 *
 * // Upload
 * const result = await postFileService.upload(file, postId, userId);
 *
 * // With description
 * const result = await postFileService.upload(file, postId, userId, { description: "설명" });
 */
import { createFileStorageService } from "../createFileService";

export const postFileService = createFileStorageService({
  bucketName: "post_files",
  tableName: "post_files",
  foreignKey: "post_id",
  pathPrefix: "posts",
  useSignedUrls: true,
  signedUrlExpiration: 3600,
  selectFields: `
    id,
    file_name,
    file_url,
    description,
    user_id,
    created_at
  `,
});
