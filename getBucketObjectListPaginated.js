// const { paginateListObjectsV2 } = require('@aws-sdk/client-s3');

// async function getBucketObjectListPaginated(s3Client, bucketName, prefix = '') {
//   const folders = [];
//   const files = [];

//   try {
//     const paginatorConfig = {
//       client: s3Client,
//       pageSize: 50, // Adjust as needed
//     };

//     const input = {
//       Bucket: bucketName,
//       Prefix: prefix,
//       Delimiter: '/',
//     };

//     const paginator = paginateListObjectsV2(paginatorConfig, input);

//     let pageCount = 0;

//     const page = await paginator[0];
//     console.log('getBucketObjectListPaginated ~ page:', page);

//     // for await (const page of paginator) {
//     //   pageCount++;

//     if (page.CommonPrefixes) {
//       const newFolders = page.CommonPrefixes.map((p) => p.Prefix);
//       folders.push(...newFolders);
//       console.log('Found folders:', newFolders);
//     }

//     if (page.Contents) {
//       const newFiles = page.Contents.map((c) => c.Key);
//       files.push(...newFiles);
//       console.log('Found files:', newFiles);
//     }
//     // }

//     console.log('Total pages processed:', pageCount);
//     return { folders, files };
//   } catch (error) {
//     console.error(`Error listing objects in bucket "${bucketName}":`, error);
//     throw error;
//   }
// }

// module.exports = getBucketObjectListPaginated;

const { ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function getBucketObjectListPaginated(s3Client, bucketName, prefix = '') {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: 1,
    });
    const response = await s3Client.send(command);

    const folders = response.CommonPrefixes
      ? response.CommonPrefixes.map((p) => p.Prefix)
      : [];
    const files = response.Contents ? response.Contents.map((c) => c.Key) : [];
    console.log(`Objects in bucket "${bucketName}" with prefix "${prefix}":`, {
      folders,
      files,
    });
    return { folders, files };
  } catch (error) {
    console.error(`Error listing objects in bucket "${bucketName}":`, error);
    throw error;
  }
}

module.exports = getBucketObjectListPaginated;
