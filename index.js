const S3ClientInstance = require("./s3");
const getBucketsList = require("./getBucketsList");
const getBucketObjectList = require("./getBucketObjectList");
const getSignedUrl = require("./getSignedUrls");
const s3Upload = require("./uploadFile");
const uploadFolder = require("./uploadFolder");
const path = require("path");
const getBucketObjectListPaginated = require("./getBucketObjectListPaginated");
const download_single_Object_from_bucket = require("./downloadSingleFile");
const downloadFolder = require("./downloadFolder");
const getS3Object = require("./getObject");
const multipartUploadFile = require("./multipartUpload");
// const multipartUploadFile = require("./multipartUpload");

require("dotenv").config(); // Load environment variables

const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRETE_ACCESS_KEY_ID;
const s3GatewayUrl = process.env.S3_API_GATEWAY;

console.log("Access Key ID:", accessKeyId);
console.log("Secret Access Key:", secretAccessKey);
console.log("S3 Gateway URL:", s3GatewayUrl);

const s3Client = S3ClientInstance(s3GatewayUrl, accessKeyId, secretAccessKey);

(async () => {
  /*
    Fetches a list of all buckets from the S3 client
    s3Client: The initialized S3 client object
  */
  console.log("Executing getBucketsList");
  const buckets = await getBucketsList(s3Client);
  console.log("buckets:", buckets);

  /*
    Selects the first bucket's name and sets a prefix for object filtering
    Name of the first bucket
    Prefix to filter objects within a specific folder or subfolder
  */
  const bucketName = buckets[0].Name;
  const prefix = "";

  /*
    Retrieves a list of objects from the specified bucket filtered by the prefix
    s3Client: S3 client, bucketName: Name of the bucket, prefix: Prefix for filtering objects
  */
  // console.log("Executing getBucketObjectList");
  // const bucketObjects = await getBucketObjectList(s3Client, bucketName, prefix);
  // console.log("bucketObjects:", bucketObjects);

  /*
    Retrieves a paginated list of objects from the specified bucket filtered by the prefix
    The initialized S3 client object
    Name of the bucket
    Prefix to filter objects within a specific folder or subfolder
    Initial page number for pagination
  */
  // console.log("Executing getBucketObjectListPaginated");
  // const bucketObjectsPaginated = await getBucketObjectListPaginated(
  //   s3Client,
  //   bucketName,
  //   prefix,
  //   0
  // );
  // console.log("bucketObjectsPaginated:", bucketObjectsPaginated);
  // console.log("Files Length", bucketObjectsPaginated?.files.length);

  /*
    Generates a signed URL for the first file in the list, if any files are present
    s3Client: S3 client, accessKeyId: Access key ID, secretAccessKey: Secret access key
    Name of the bucket
    Key of the selected file for which to generate the signed URL
  */
  // if (bucketObjects?.files?.length > 0) {
  //   console.log("Executing getSignedUrl");
  //   const selectedFile = bucketObjects?.files[0];
  //   console.log("🚀 ~ selectedFile:", selectedFile);
  //   const signedUrl = await getSignedUrl(
  //     { s3Client, accessKeyId, secretAccessKey },
  //     bucketName,
  //     selectedFile
  //   );
  //   console.log("signedUrl:", signedUrl);
  // }

  /*
    Uploads a single file to the specified bucket
    The initialized S3 client object
    Name of the bucket to upload the file to
    The key under which to store the file in the bucket
    The file name to be used in the bucket
    The local file path of the file to be uploaded
  */
  console.log("Executing uploadSingleFile");
  const filePath = path.join("./testing/multi-part-pdf-file.pdf");
  const key = "multi-part-pdf-file.pdf";
  await multipartUploadFile({ s3Client, bucketName, filePath, key });

  // await s3Upload.uploadFile(
  //   s3Client,
  //   bucketName,
  //   "",
  //   "multi-part-pdf-file.pdf",
  //   filePath
  // );

  /*
    Uploads an entire folder to the specified bucket
    The initialized S3 client object
    Name of the bucket to which the folder will be uploaded
  */
  // console.log("Executing uploadFolder");
  // await uploadFolder(s3Client, bucketName);

  // Download single file
  // console.log("Executing Download Single File");
  // await download_single_Object_from_bucket(
  //   s3Client,
  //   bucketName,
  //   "0.png",
  //   "./testing/0-1.png"
  // );

  // Download Folder
  // console.log("Executing Folder Download");
  // await downloadFolder(
  //   s3Client,
  //   bucketName,
  //   "SubFolder-23/",
  //   "./testing/SubFolder-23-2"
  // );

  // Get Single Object
  // console.log("Executing file download with getObjectCommand");
  // if (bucketObjects?.files?.length > 0) {
  //   const fileName = bucketObjects?.files[0];
  //   const prefix = "";
  //   const objectContent = await getS3Object(
  //     s3Client,
  //     bucketName,
  //     `${prefix}/${fileName}`
  //   );
  //   console.log("🚀 ~ objectContent:", objectContent);
  // }

  // handleFileUpload();
})();
