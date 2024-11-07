const axios = require('axios');
const fs = require('fs');
const pathModule = require('path');
const FormData = require('form-data');

require('dotenv').config();

const uploadID = '4f5g6h7j8k9l0z';
// const partNumber = ''; // Decided at the time of loop
const bucketId = '67249b78c143e3e5672ba583';
const userId = '6423faa0d5ec149a50032317';
const iv = [...Array(32)]
  .map(() => Math.random().toString(36).charAt(2))
  .join('');

const authToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVzaGEuemFmYXJAaW52b3pvbmUuY29tIiwiaWQiOiI2NDIzZmFhMGQ1ZWMxNDlhNTAwMzIzMTciLCJpYXQiOjE3MzA5MzEyODd9.E-6erDdum_eWMsU4t_G6qAA3_ZFqmZPHx-9HYMeOFtA'; // Placeholder for auth token extraction logic

const uploadFileWithCustomRoute = () => {
  const filePath = './testing/0.png';
  const chunkSize = 2 * 1024 * 1024; // 2MB in bytes

  fs.stat(filePath, async (err, stats) => {
    if (err) {
      console.error('Error getting file stats:', err);
      return;
    }

    const fileSize = stats.size;
    totalChunks = Math.ceil(fileSize / chunkSize);
    contentSize = fileSize;

    // Dynamically import the mime module to avoid the error
    const mimeModule = await import('mime');
    const contentType =
      mimeModule.default.getType(filePath) || 'application/octet-stream';

    objectName = pathModule.basename(filePath);

    console.log(`Path: ${''}`);
    console.log(`Object Name: ${objectName}`);
    console.log(`Content Type: ${contentType}`);
    console.log(`Total File Size: ${fileSize} bytes`);
    console.log(`Total Chunks: ${totalChunks}`);

    for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(start + chunkSize, fileSize);
      const chunk = fs.createReadStream(filePath, { start, end: end - 1 });

      const params = {
        UploadId: uploadID,
        PartNumber: partNumber,
        BucketId: bucketId,
        ObjectName: objectName,
        Path: '',
        UserId: userId,
        IV: iv,
        TotalChunks: totalChunks,
        FolderId: '',
        ContentSize: fileSize,
        ContentType: contentType,
      };
      const queryString = Object.keys(params)
        .map(
          (key) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
        )
        .join('&');
      const uploadUrl = `${process.env.S3_API_GATEWAY}/file-upload?${queryString}`;

      console.log('fs.stat ~ uploadUrl:', uploadUrl);
      try {
        const response = await axios({
          method: 'post',
          url: uploadUrl,
          data: (() => {
            const formData = new FormData();
            formData.append('uploadFile', chunk, objectName);
            return formData;
          })(),
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${authToken}`,
          },
        });
        console.log(`Chunk ${partNumber} uploaded successfully`, response.data);
      } catch (error) {
        console.error(`Error uploading chunk ${partNumber}:`, error);
      }
    }
  });
};

uploadFileWithCustomRoute();
