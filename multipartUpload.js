const {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} = require("@aws-sdk/client-s3");
const fs = require("fs");
const mime = require("mime-types");

const multipartUploadFile = async ({
  s3Client,
  bucketName,
  filePath,
  key,
  partSize = 8 * 1024 * 1024,
}) => {
  const fileStat = fs.statSync(filePath);
  const totalSize = fileStat.size;
  const numParts = Math.ceil(totalSize / partSize);
  const fileHandle = fs.openSync(filePath, "r");

  const fileType = mime.lookup(filePath) || "application/octet-stream";
  console.log("Detected file type:", fileType);

  let uploadId;
  try {
    // STEP 1: Initiate multipart upload with file type
    const createResp = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: fileType, // 👈 Passed here
      })
    );

    uploadId = createResp.UploadId;
    console.log("Multipart upload initiated:", uploadId, createResp);

    const parts = [];

    // STEP 2: Upload parts
    for (let partNumber = 1; partNumber <= numParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, totalSize);
      const partBuffer = Buffer.alloc(end - start);

      fs.readSync(fileHandle, partBuffer, 0, partBuffer.length, start);

      const uploadResp = await s3Client.send(
        new UploadPartCommand({
          Bucket: bucketName,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: partBuffer,
        })
      );
      console.log("🚀 ~ uploadResp:", uploadResp);

      parts.push({ ETag: uploadResp.ETag, PartNumber: partNumber });
      console.log(`Uploaded part ${partNumber}`);
    }

    console.log("parts", parts);

    // STEP 3: Complete upload
    const completeResp = await s3Client.send(
      new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts,
        },
      })
    );

    console.log("✅ Upload completed:", completeResp);
  } catch (err) {
    console.error("❌ Upload failed:", err);

    if (uploadId) {
      try {
        await s3Client.send(
          new AbortMultipartUploadCommand({
            Bucket: bucketName,
            Key: key,
            UploadId: uploadId,
          })
        );
        console.log("⚠️ Multipart upload aborted.");
      } catch (abortErr) {
        console.error("❌ Abort failed:", abortErr);
      }
    }

    throw err;
  } finally {
    fs.closeSync(fileHandle);
  }
};

module.exports = multipartUploadFile;
