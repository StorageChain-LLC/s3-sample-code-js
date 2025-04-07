const { S3Client } = require("@aws-sdk/client-s3");

const S3ClientInstance = (s3GatewayUrl, accessKeyId, secretAccessKey) => {
  const instance = new S3Client({
    region: "us-east-1", // replace with your region if different
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    endpoint: s3GatewayUrl,
    forcePathStyle: true, // Needed for custom endpoints
  });

  return instance;
};

module.exports = S3ClientInstance;
