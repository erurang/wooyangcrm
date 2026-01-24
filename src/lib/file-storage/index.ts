/**
 * File Storage Module
 *
 * Provides centralized file storage services for different entities.
 *
 * ## Usage
 *
 * ### Using pre-configured services:
 * ```typescript
 * import { postFileService, commentFileService } from "@/lib/file-storage";
 *
 * // Upload
 * const result = await postFileService.upload(file, postId, userId);
 *
 * // Fetch
 * const files = await postFileService.fetch(postId);
 *
 * // Delete
 * await postFileService.delete(fileId, filePath);
 * ```
 *
 * ### Creating a custom service:
 * ```typescript
 * import { createFileStorageService } from "@/lib/file-storage";
 *
 * const myFileService = createFileStorageService({
 *   bucketName: 'my_files',
 *   tableName: 'my_files',
 *   foreignKey: 'entity_id',
 *   pathPrefix: 'my-entities',
 * });
 * ```
 */

// Factory and types
export {
  createFileStorageService,
  sanitizeFileName,
  type FileStorageConfig,
  type FileStorageService,
  type UploadedFile,
  type FileRecord,
} from "./createFileService";

// Pre-configured services
export { postFileService } from "./services/postFiles";
export { commentFileService } from "./services/commentFiles";
export { workOrderFileService } from "./services/workOrderFiles";
export { workOrderCommentFileService } from "./services/workOrderCommentFiles";
export { approvalFileService } from "./services/approvalFiles";
