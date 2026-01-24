/**
 * Work Order File Storage Service
 *
 * Pre-configured file storage service for work order attachments.
 *
 * @example
 * import { workOrderFileService } from "@/lib/file-storage";
 *
 * const result = await workOrderFileService.upload(file, workOrderId, userId);
 * const files = await workOrderFileService.fetch(workOrderId);
 */
import { createFileStorageService } from "../createFileService";

export const workOrderFileService = createFileStorageService({
  bucketName: "consultation_files",
  tableName: "work_order_files",
  foreignKey: "work_order_id",
  pathPrefix: "work_orders",
  useSignedUrls: false, // Uses public URLs
  additionalFields: (file) => ({
    file_size: file.size,
  }),
  selectFields: `
    *,
    user:users!work_order_files_user_id_fkey(id, name)
  `,
});
