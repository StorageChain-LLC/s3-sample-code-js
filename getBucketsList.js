const { ListBucketsCommand } = require('@aws-sdk/client-s3');

const getBucketsList = async (s3Client) => {
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    return response.Buckets;
  } catch (error) {
    console.error('Error listing buckets:', error);
    throw error;
  }
};

module.exports = getBucketsList;
