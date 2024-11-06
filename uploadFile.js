// const { PutObjectCommand } = require('@aws-sdk/client-s3');
// const fs = require('fs');
// const path = require('path');

// // Upload a single file into the bucket
// async function uploadSingleFile(client, bucketName, prefix, key, filePath) {
//   try {
//     // Dynamically import the ESM module
//     const mimeModule = await import('mime');
//     const mime = mimeModule.default;

//     // Create a readable stream from the file
//     const fileStream = fs.createReadStream(filePath);

//     // Get the file's MIME type (e.g., image/jpeg)
//     const contentType = mime.getType(filePath);
//     const fullKey = prefix ? `${prefix}/${key}` : key;
//     // Upload the file using a stream
//     const uploadParams = {
//       Bucket: bucketName,
//       Key: fullKey,
//       Body: fileStream,
//       ContentType: contentType,
//     };

//     // Send the command to upload the file
//     try {
//       const data = await client.send(new PutObjectCommand(uploadParams));
//       console.log('data', data?.on);
//       console.log(
//         `File "${key}" uploaded successfully to bucket "${bucketName}".`
//       );
//     } catch (uploadError) {
//       console.error('Failed to upload file:', uploadError);
//       console.error('Error details:', JSON.stringify(uploadError, null, 2));
//     }
//   } catch (err) {
//     console.error('Unexpected error uploading file:', err);
//   }
// }

// module.exports = uploadSingleFile;

////////////////////////////////////////////////////////////////////////////////////////////////////////////

// const { PutObjectCommand } = require('@aws-sdk/client-s3');
// const fs = require('fs');
// const { Transform } = require('stream');

// // Function to create a progress-tracking stream
// function createProgressStream(fileSize, onProgress) {
//   let uploadedBytes = 0;

//   return new Transform({
//     transform(chunk, encoding, callback) {
//       uploadedBytes += chunk.length;
//       const progress = (uploadedBytes / fileSize) * 100;
//       onProgress(progress.toFixed(2)); // Call the progress callback with decimals
//       callback(null, chunk);
//     },
//   });
// }

// // Upload a single file with continuous progress tracking
// async function uploadSingleFile(client, bucketName, prefix, key, filePath) {
//   try {
//     const mimeModule = await import('mime');
//     const mime = mimeModule.default;
//     const contentType = mime.getType(filePath);
//     const fullKey = prefix ? `${prefix}/${key}` : key;

//     // Get the file size for calculating progress
//     const fileSize = fs.statSync(filePath).size;

//     // Create a readable stream from the file and pipe it through the progress stream
//     const fileStream = fs.createReadStream(filePath);
//     const progressStream = createProgressStream(fileSize, (progress) => {
//       console.log(`Progress: ${progress}%`);
//     });

//     // Pipe the file stream through the progress stream
//     const uploadParams = {
//       Bucket: bucketName,
//       Key: fullKey,
//       Body: fileStream.pipe(progressStream),
//       ContentType: contentType,
//     };

//     // Use PutObjectCommand to upload the file
//     const data = await client.send(new PutObjectCommand(uploadParams));
//     console.log(
//       `File "${key}" uploaded successfully to bucket "${bucketName}".`
//     );
//   } catch (error) {
//     console.error('Failed to upload file:', error);
//   }
// }

// module.exports = uploadSingleFile;

////////////////////////////////////////////////////////////////////////////////////////////////////////////

// const { PutObjectCommand } = require('@aws-sdk/client-s3');
// const fs = require('fs');
// const { Transform } = require('stream');

// function createProgressStream(fileSize, onProgress) {
//   let uploadedBytes = 0;

//   return new Transform({
//     transform(chunk, encoding, callback) {
//       uploadedBytes += chunk.length;
//       const progress = (uploadedBytes / fileSize) * 100;
//       onProgress(progress.toFixed(2)); // Call progress callback with decimals
//       callback(null, chunk);
//     },
//   });
// }

// async function uploadSingleFile(client, bucketName, prefix, key, filePath) {
//   try {
//     const mimeModule = await import('mime');
//     const mime = mimeModule.default;
//     const contentType = mime.getType(filePath);
//     const fullKey = prefix ? `${prefix}/${key}` : key;

//     const fileSize = fs.statSync(filePath).size;

//     const fileStream = fs.createReadStream(filePath);
//     const progressStream = createProgressStream(fileSize, (progress) => {
//       console.log(`Progress: ${progress}%`);
//       if (progress >= 100) {
//         console.log('Upload complete, finalizing...');
//       }
//     });

//     const uploadParams = {
//       Bucket: bucketName,
//       Key: fullKey,
//       Body: fileStream.pipe(progressStream),
//       ContentType: contentType,
//     };

//     const data = await client.send(new PutObjectCommand(uploadParams));
//     console.log(
//       `File "${key}" uploaded successfully to bucket "${bucketName}".`
//     );
//   } catch (error) {
//     console.error('Failed to upload file:', error);
//   }
// }

// module.exports = uploadSingleFile;

////////////////////////////////////////////////////////////////////////////////////////////////////////////

const {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} = require('@aws-sdk/client-s3');
const fs = require('fs');

// Upload a single file in chunks with parallel progress tracking
async function uploadSingleFile(client, bucketName, prefix, key, filePath) {
  const fileSize = fs.statSync(filePath).size;
  const chunkSize = 2 * 1024 * 1024; // 5 MB per part (minimum for S3 multipart upload)
  const fullKey = prefix ? `${prefix}/${key}` : key;
  const fileStream = fs.createReadStream(filePath, {
    highWaterMark: chunkSize,
  });
  const uploadId = await startMultipartUpload(client, bucketName, fullKey);

  try {
    let partNumber = 1;
    let uploadedBytes = 0;
    const parts = [];
    const uploadPromises = [];

    for await (const chunk of fileStream) {
      // Create a promise for each chunk upload
      const uploadPromise = (async () => {
        const uploadPartParams = {
          Bucket: bucketName,
          Key: fullKey,
          PartNumber: partNumber,
          UploadId: uploadId,
          Body: chunk,
        };

        const { ETag } = await client.send(
          new UploadPartCommand(uploadPartParams)
        );
        parts[partNumber - 1] = { PartNumber: partNumber, ETag };

        uploadedBytes += chunk.length;
        const progress = ((uploadedBytes / fileSize) * 100).toFixed(2);
        console.log(`Progress: ${progress}% (Part ${partNumber})`);

        partNumber++;
      })();

      uploadPromises.push(uploadPromise);

      // Execute the uploads in batches of 5 parts
      if (uploadPromises.length === 5) {
        await Promise.all(uploadPromises);
        uploadPromises.length = 0; // Clear the batch
      }
    }

    // Await any remaining uploads in the final batch
    if (uploadPromises.length > 0) {
      await Promise.all(uploadPromises);
    }

    // Complete the multipart upload
    await completeMultipartUpload(client, bucketName, fullKey, uploadId, parts);
    console.log(
      `File "${key}" uploaded successfully to bucket "${bucketName}".`
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    // await abortMultipartUpload(client, bucketName, fullKey, uploadId);
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
  const command = new CompleteMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: { Parts: parts },
  });
  return client.send(command);
}

async function abortMultipartUpload(client, bucketName, key, uploadId) {
  const command = new AbortMultipartUploadCommand({
    Bucket: bucketName,
    Key: key,
    UploadId: uploadId,
  });
  return client.send(command);
}

module.exports = uploadSingleFile;
