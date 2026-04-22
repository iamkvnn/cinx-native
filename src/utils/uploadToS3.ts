import {
  PresignedUrlControllerService as CoursePresignedUrlService,
  OpenAPI,
} from "../api/course";
import { PresignedUrlControllerService as UserPresignedUrlService } from "../services/api/PresignedUrlControllerService";
import { PresignedUrlControllerService as LearningPresignedUrlService } from "../services/api/PresignedUrlControllerService";
import { useAuthStore } from "../store/useAuthStore";

export interface UploadResult {
  fileKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export async function uploadFileToS3(
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<UploadResult> {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    OpenAPI.TOKEN = accessToken;
  }

  // 1. Get presigned URL from backend
  const presignedRes = await CoursePresignedUrlService.getPresignedUrl({
    fileName,
    contentType: mimeType,
  });

  const { presignedUrl, fileKey } = presignedRes.data ?? {};
  if (!presignedUrl || !fileKey) {
    throw new Error("Failed to get presigned URL");
  }

  // 2. Upload via XMLHttpRequest.
  //
  // WHY these headers:
  //   - Backend S3Service signs PutObjectRequest with `.contentType(mimeType)` AND `.acl(PUBLIC_READ)`.
  //   - AWS SDK v2 presigner includes ALL signed headers in the signature.
  //   - The client MUST send EXACTLY those headers or S3 returns:
  //       400 InvalidArgument: Missing one or more required signed header
  //
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);

    // Must match what the backend signed
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.setRequestHeader("x-amz-acl", "public-read");

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `S3 upload failed: HTTP ${xhr.status}\n${xhr.responseText}`,
          ),
        );
      }
    };
    xhr.onerror = () => reject(new Error("Network error during S3 upload"));

    // React Native XHR: pass a { uri, type, name } object so the native layer
    // streams the local file without loading it into JS memory.
    xhr.send({ uri: fileUri, type: mimeType, name: fileName } as any);
  });

  return {
    fileKey,
    fileName,
    fileType: mimeType,
    fileSize: 0,
  };
}

export async function uploadAvatarToS3(
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<UploadResult> {
  const presignedRes = await UserPresignedUrlService.getUserPresignedUrl({
    fileName,
    contentType: mimeType,
  });

  const { presignedUrl, fileKey } = presignedRes.data ?? {};
  if (!presignedUrl || !fileKey) {
    throw new Error("Failed to get presigned URL");
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.setRequestHeader("x-amz-acl", "public-read");
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `S3 upload failed: HTTP ${xhr.status}\n${xhr.responseText}`,
          ),
        );
      }
    };
    xhr.onerror = () => reject(new Error("Network error during S3 upload"));
    xhr.send({ uri: fileUri, type: mimeType, name: fileName } as any);
  });

  return {
    fileKey,
    fileName,
    fileType: mimeType,
    fileSize: 0,
  };
}

export async function uploadLearningFileToS3(
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<UploadResult> {
  const presignedRes =
    await LearningPresignedUrlService.getLearningPresignedUrl({
      fileName,
      contentType: mimeType,
    });

  const { presignedUrl, fileKey } = presignedRes.data ?? {};
  if (!presignedUrl || !fileKey) {
    throw new Error("Failed to get presigned URL");
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.setRequestHeader("x-amz-acl", "public-read");
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `S3 upload failed: HTTP ${xhr.status}\n${xhr.responseText}`,
          ),
        );
      }
    };
    xhr.onerror = () => reject(new Error("Network error during S3 upload"));
    xhr.send({ uri: fileUri, type: mimeType, name: fileName } as any);
  });

  return {
    fileKey,
    fileName,
    fileType: mimeType,
    fileSize: 0,
  };
}
