const { PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Upload a single file into the bucket
async function uploadSingleFile(client, bucketName, prefix, key, filePath) {
  try {
    // Dynamically import the ESM module
    const mimeModule = await import('mime');
    const mime = mimeModule.default;

    // Create a readable stream from the file
    const fileStream = fs.createReadStream(filePath);

    // Get the file's MIME type (e.g., image/jpeg)
    const contentType = mime.getType(filePath);
    const fullKey = prefix ? `${prefix}/${key}` : key;
    // Upload the file using a stream
    const uploadParams = {
      Bucket: bucketName,
      Key: fullKey,
      Body: fileStream,
      ContentType: contentType,
    };

    // Send the command to upload the file
    try {
      const data = await client.send(new PutObjectCommand(uploadParams));
      console.log(
        `File "${key}" uploaded successfully to bucket "${bucketName}".`
      );
    } catch (uploadError) {
      console.error('Failed to upload file:', uploadError);
      console.error('Error details:', JSON.stringify(uploadError, null, 2));
    }
  } catch (err) {
    console.error('Unexpected error uploading file:', err);
  }
}

module.exports = uploadSingleFile;
