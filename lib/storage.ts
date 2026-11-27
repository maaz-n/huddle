import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.UPLOADS_BUCKET;

const credentials =
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined;

// Neon Object Storage speaks the S3 API with path-style addressing.
export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  credentials,
});

export function avatarKey(userId: string) {
  return `avatars/${userId}`;
}

export function attachmentKey(attachmentId: string) {
  return `attachments/${attachmentId}`;
}

export async function putObject({
  key,
  body,
  contentType,
  cacheControl,
}: {
  key: string;
  body: Uint8Array;
  contentType: string;
  cacheControl?: string;
}) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(cacheControl ? { CacheControl: cacheControl } : {}),
    }),
  );
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Private buckets stay private: the app authenticates, then hands the browser
 * a short-lived signed URL so files never need to be public.
 */
export async function getObjectUrl(
  key: string,
  options?: {
    expiresIn?: number;
    contentType?: string;
    contentDisposition?: string;
  },
) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ...(options?.contentType
        ? { ResponseContentType: options.contentType }
        : {}),
      ...(options?.contentDisposition
        ? { ResponseContentDisposition: options.contentDisposition }
        : {}),
    }),
    { expiresIn: options?.expiresIn ?? 60 },
  );
}
