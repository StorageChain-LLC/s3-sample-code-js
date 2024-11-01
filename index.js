const S3ClientInstance = require('./s3');
const getBucketsList = require('./getBucketsList');
const getBucketObjectList = require('./getBucketObjectList');
const getSignedUrl = require('./getSignedUrls');
const uploadSingleFile = require('./uploadFile');
const uploadFolder = require('./uploadFolder');
const path = require('path');
const getBucketObjectListPaginated = require('./getBucketObjectListPaginated');

require('dotenv').config(); // Load environment variables

const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRETE_ACCESS_KEY_ID;
const s3GatewayUrl = process.env.S3_API_GATEWAY;

console.log('Access Key ID:', accessKeyId);
console.log('Secret Access Key:', secretAccessKey);
console.log('S3 Gateway URL:', s3GatewayUrl);

const s3Client = S3ClientInstance(s3GatewayUrl, accessKeyId, secretAccessKey);

(async () => {
  // Get list of Buckets
  console.log('Executing getBucketsList');
  const buckets = await getBucketsList(s3Client);
  console.log('buckets:', buckets);

  const bucketName = buckets[0].Name;
  const prefix = 'SubFolder'; // Folder or subfolder name

  console.log('Executing getBucketObjectList');
  //   const bucketObjects = await getBucketObjectList(s3Client, bucketName, prefix);
  //   console.log('bucketObjects:', bucketObjects);

  const bucketObjectsPaginated = await getBucketObjectListPaginated(
    s3Client,
    bucketName,
    prefix
  );
  console.log('bucketObjectsPaginated:', bucketObjectsPaginated);
  console.log('Files Length', bucketObjectsPaginated?.files.length);

  //   if (bucketObjects?.files?.length > 0) {
  //     console.log('Executing getSignedUrl');
  //     const seletedFile = bucketObjects?.files[0];
  //     const signedUrl = await getSignedUrl(
  //       { s3Client, accessKeyId, secretAccessKey },
  //       bucketName,
  //       seletedFile
  //     );
  //     console.log('signedUrl:', signedUrl);
  //   }

  console.log('Executing uploadSingleFile');
  // Uploading of a file
  // Make sure key name is unique everytime you upload a file.
  //   const filePath = path.join('./testing/176.png'); // Path to the file you want to upload

  //   await uploadSingleFile(s3Client, bucketName, 'abc', '176.png', filePath);

  console.log('Executing uploadFolder');
  //   await uploadFolder(s3Client, bucketName);
})();
