const { ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function getBucketObjectListPaginated(
  s3Client,
  bucketName,
  prefix = '',
  pageNumber = 0
) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: '/',
      ContinuationToken: pageNumber,
    });
    const response = await s3Client.send(command);

    const folders = response.CommonPrefixes
      ? response.CommonPrefixes.map((p) => p.Prefix)
      : [];
    const files = response.Contents ? response.Contents.map((c) => c.Key) : [];

    return { folders, files, content: response.Contents };
  } catch (error) {
    console.error(`Error listing objects in bucket "${bucketName}":`, error);
    throw error;
  }
}

module.exports = getBucketObjectListPaginated;
