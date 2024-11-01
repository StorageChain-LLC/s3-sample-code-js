const { ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function getBucketObjectList(s3Client, bucketName, prefix = '') {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: '/',
    });
    const response = await s3Client.send(command);

    const folders = response.CommonPrefixes
      ? response.CommonPrefixes.map((p) => p.Prefix)
      : [];
    const files = response.Contents ? response.Contents.map((c) => c.Key) : [];

    return { folders, files };
  } catch (error) {
    console.error(`Error listing objects in bucket "${bucketName}":`, error);
    throw error;
  }
}

module.exports = getBucketObjectList;
