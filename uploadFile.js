const fs = require("fs");
const {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} = require("@aws-sdk/client-s3");
const mime = require("mime-types");

const S3_MIN_PART_SIZE = 5 * 1024 * 1024; // 5 MB

async function uploadFile(client, bucketName, prefix, key, filePath) {
  const fileSize = fs.statSync(filePath).size;
  const fullKey = prefix ? `${prefix}/${key}` : key;

  const mimeType = mime.lookup(filePath);
  console.log("🚀 ~ uploadFile ~ mimeType:", mimeType);

  if (fileSize <= S3_MIN_PART_SIZE) {
    // Single-part upload
    console.log(`Uploading ${key} as a single object (${fileSize} bytes)...`);
    await uploadSinglePart(client, bucketName, fullKey, filePath, mimeType);
  } else {
    // Multipart upload
    console.log(
      `Uploading ${key} using multipart upload (${fileSize} bytes)...`
    );
    await uploadMultipart(
      client,
      bucketName,
      fullKey,
      filePath,
      fileSize,
      mimeType
    );
  }
}

async function uploadSinglePart(
  client,
  bucketName,
  key,
  filePath,
  contentType
) {
  try {
    const fileStream = fs.createReadStream(filePath);
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileStream,
      ContentType: contentType,
    });

    await client.send(command);
    console.log(`File "${key}" uploaded successfully to "${bucketName}".`);
  } catch (error) {
    console.error(`Error uploading file "${key}":`, error);
  }
}

async function uploadMultipart(
  client,
  bucketName,
  key,
  filePath,
  fileSize,
  contentType
) {
  const chunkSize = S3_MIN_PART_SIZE;
  const fileStream = fs.createReadStream(filePath, {
    highWaterMark: chunkSize,
  });
  const uploadId = await startMultipartUpload(client, bucketName, key);
  const parts = [];
  let partNumber = 1;
  let uploadedBytes = 0;

  try {
    for await (const chunk of fileStream) {
      let success = false;
      let attempts = 0;
      let ETag = null;

      while (!success && attempts < 3) {
        // Retry up to 3 times if needed
        try {
          const uploadPartParams = {
            Bucket: bucketName,
            Key: key,
            PartNumber: partNumber,
            UploadId: uploadId,
            Body: chunk,
            ContentType: contentType,
          };

          const response = await client.send(
            new CreateMultipartUploadCommand(uploadPartParams)
          );
          ETag = response.ETag;
          success = true;
        } catch (err) {
          console.error(
            `Error uploading part ${partNumber}, attempt ${attempts + 1}:`,
            err
          );
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before retry
        }
      }

      if (!ETag) {
        throw new Error(`Failed to upload part ${partNumber} after 3 attempts`);
      }

      parts.push({ PartNumber: partNumber, ETag });
      uploadedBytes += chunk.length;
      const progress = ((uploadedBytes / fileSize) * 100).toFixed(2);
      console.log(`Progress: ${progress}% (Part ${partNumber})`);

      partNumber++;
    }

    await completeMultipartUpload(client, bucketName, key, uploadId, parts);
    console.log(`File "${key}" uploaded successfully using multipart upload.`);
  } catch (error) {
    console.error("Error uploading file:", error);
    await abortMultipartUpload(client, bucketName, key, uploadId);
  }
}

async function startMultipartUpload(client, bucketName, key) {
  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
  });
  const { UploadId } = await client.send(command);
  return UploadId;
}

async function completeMultipartUpload(
  client,
  bucketName,
  key,
  uploadId,
  parts
) {
  console.log(
    "Completing Multipart Upload with Parts:",
    JSON.stringify(parts, null, 2)
  );

  const command = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });

  return client.send(command);
}

async function abortMultipartUpload(client, bucketName, key, uploadId) {
  console.log(`Aborting multipart upload for ${key}`);
  const command = new AbortMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
  });
  return client.send(command);
}

// Export the functions for use in other files
module.exports = {
  uploadFile,
  uploadSinglePart,
  uploadMultipart,
};
