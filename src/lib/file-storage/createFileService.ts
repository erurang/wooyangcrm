/**
 * File Storage Service Factory
 *
 * Creates file storage services with consistent APIs for different entities.
 * Reduces code duplication across postFiles, commentFiles, workOrderFiles, etc.
 *
 * @example
 * const postFileService = createFileStorageService({
 *   bucketName: 'post_files',
 *   tableName: 'post_files',
 *   foreignKey: 'post_id',
 *   pathPrefix: 'posts',
 * });
 *
 * await postFileService.upload(file, postId, userId);
 */
import { supabase } from "@/lib/supabaseClient";

// ============ Types ============

export interface FileStorageConfig {
  /** Supabase storage bucket name */
  bucketName: string;
  /** Database table name */
  tableName: string;
  /** Foreign key column name (e.g., 'post_id', 'comment_id') */
  foreignKey: string;
  /** Path prefix for storage (e.g., 'posts', 'comments') */
  pathPrefix: string;
  /** Use signed URLs instead of public URLs (default: true) */
  useSignedUrls?: boolean;
  /** Signed URL expiration in seconds (default: 3600) */
  signedUrlExpiration?: number;
  /** Additional fields to include in DB insert */
  additionalFields?: (file: File) => Record<string, unknown>;
  /** Additional fields to select from DB */
  selectFields?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  path: string;
  url: string;
}

export interface FileRecord {
  id: string;
  name: string;
  filePath: string;
  url: string;
  user_id: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface FileStorageService {
  /** Upload a file to storage and DB */
  upload: (
    file: File,
    entityId: string,
    userId: string,
    extra?: Record<string, unknown>
  ) => Promise<UploadedFile | null>;

  /** Fetch files for an entity */
  fetch: (entityId: string) => Promise<FileRecord[]>;

  /** Delete a file from storage and DB */
  delete: (fileId: string, filePath: string) => Promise<boolean>;

  /** Get download URL for a file */
  getDownloadUrl: (filePath: string) => Promise<string | null>;
}

// ============ Utility Functions ============

/**
 * Sanitizes a file name for safe storage
 */
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

/**
 * Generates a unique file path
 */
const generateFilePath = (
  pathPrefix: string,
  entityId: string,
  userId: string,
  fileName: string
): string => {
  const timestamp = Date.now();
  const sanitized = sanitizeFileName(fileName);
  return `${pathPrefix}/${userId}/${entityId}/${timestamp}_${sanitized}`;
};

// ============ Factory Function ============

/**
 * Creates a file storage service with the specified configuration
 */
export function createFileStorageService(
  config: FileStorageConfig
): FileStorageService {
  const {
    bucketName,
    tableName,
    foreignKey,
    pathPrefix,
    useSignedUrls = true,
    signedUrlExpiration = 3600,
    additionalFields,
    selectFields = "*",
  } = config;

  /**
   * Upload a file to storage and record it in the database
   */
  const upload = async (
    file: File,
    entityId: string,
    userId: string,
    extra?: Record<string, unknown>
  ): Promise<UploadedFile | null> => {
    const filePath = generateFilePath(pathPrefix, entityId, userId, file.name);

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file);

    if (uploadError) {
      console.error(`[${tableName}] Storage upload failed:`, uploadError.message);
      return null;
    }

    // Build insert data
    const insertData: Record<string, unknown> = {
      [foreignKey]: entityId,
      user_id: userId,
      file_url: filePath,
      file_name: file.name,
      ...(additionalFields ? additionalFields(file) : {}),
      ...(extra || {}),
    };

    // Insert into database
    const { data: dbData, error: dbError } = await supabase
      .from(tableName)
      .insert([insertData])
      .select("id, file_name, file_url")
      .single();

    if (dbError) {
      console.error(`[${tableName}] DB insert failed:`, dbError.message);
      // Cleanup uploaded file
      await supabase.storage.from(bucketName).remove([filePath]);
      return null;
    }

    // Get URL
    let url = "";
    if (useSignedUrls) {
      const { data: urlData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, signedUrlExpiration);
      url = urlData?.signedUrl || "";
    } else {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      url = urlData?.publicUrl || "";
    }

    return {
      id: dbData.id,
      name: dbData.file_name,
      path: filePath,
      url,
    };
  };

  /**
   * Fetch all files for an entity
   */
  const fetch = async (entityId: string): Promise<FileRecord[]> => {
    const { data: files, error } = await supabase
      .from(tableName)
      .select(selectFields)
      .eq(foreignKey, entityId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(`[${tableName}] Fetch failed:`, error.message);
      return [];
    }

    // Type guard for file array
    const fileArray = (files || []) as unknown as Array<Record<string, unknown>>;

    // Generate URLs for each file
    const filesWithUrls = await Promise.all(
      fileArray.map(async (file) => {
        let url = "";
        if (useSignedUrls) {
          const { data: urlData } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(file.file_url as string, signedUrlExpiration);
          url = urlData?.signedUrl || "";
        } else {
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(file.file_url as string);
          url = urlData?.publicUrl || "";
        }

        return {
          id: file.id as string,
          name: file.file_name as string,
          filePath: file.file_url as string,
          url,
          user_id: file.user_id as string,
          created_at: file.created_at as string | undefined,
          ...file,
        };
      })
    );

    return filesWithUrls;
  };

  /**
   * Delete a file from storage and database
   */
  const deleteFile = async (
    fileId: string,
    filePath: string
  ): Promise<boolean> => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (storageError) {
      console.error(`[${tableName}] Storage delete failed:`, storageError.message);
      // Continue to try deleting from DB anyway
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from(tableName)
      .delete()
      .eq("id", fileId);

    if (dbError) {
      console.error(`[${tableName}] DB delete failed:`, dbError.message);
      return false;
    }

    return true;
  };

  /**
   * Get a download URL for a file
   */
  const getDownloadUrl = async (filePath: string): Promise<string | null> => {
    if (useSignedUrls) {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, signedUrlExpiration);

      if (error) {
        console.error(`[${tableName}] URL generation failed:`, error.message);
        return null;
      }

      return data?.signedUrl || null;
    } else {
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      return data?.publicUrl || null;
    }
  };

  return {
    upload,
    fetch,
    delete: deleteFile,
    getDownloadUrl,
  };
}
