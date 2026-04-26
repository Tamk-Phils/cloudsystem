import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const bucketName = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Uploads a Buffer to AWS S3.
 * @param key The key (path) in the bucket.
 * @param body The data to upload.
 * @param contentType The MIME type of the content.
 */
export async function uploadToS3(key: string, body: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  return await s3Client.send(command);
}

/**
 * Downloads a file from AWS S3 as a Buffer.
 * @param key The key (path) in the bucket.
 */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  const chunks = [];
  
  if (response.Body) {
    // @ts-ignore
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
  }

  return Buffer.concat(chunks);
}

/**
 * Gets a readable stream for an object in S3.
 */
export async function getS3Stream(key: string) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const response = await s3Client.send(command);
  return response.Body;
}

/**
 * Deletes an object from AWS S3.
 * @param key The key (path) in the bucket.
 */
export async function deleteFromS3(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await s3Client.send(command);
}

/**
 * Generates a signed URL for downloading an object.
 * @param key The key (path) in the bucket.
 * @param expiresIn Time in seconds until the URL expires.
 */
export async function getPresignedUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}
