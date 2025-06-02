const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const { GetObjectCommand } = require("@aws-sdk/client-s3");

async function generateSignedUrl(s3Client, bucket, key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return signedUrl;
}

module.exports = generateSignedUrl;
