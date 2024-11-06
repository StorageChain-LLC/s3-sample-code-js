const { GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const download_single_Object_from_bucket = async (
  client,
  bucketName,
  key,
  downloadPath
) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const response = await client.send(command);

    // Create a write stream to the local file
    const fileStream = fs.createWriteStream(downloadPath);

    // Pipe the response body to the file
    response.Body.pipe(fileStream);

    fileStream.on('finish', () => {
      console.log(
        `Object "${key}" downloaded successfully to "${downloadPath}".`
      );
    });

    fileStream.on('error', (err) => {
      console.error(`Error writing file "${downloadPath}":`, err);
    });
  } catch (err) {
    console.error(
      `Error downloading object "${key}" from bucket "${bucketName}":`,
      err
    );
  }
};

module.exports = download_single_Object_from_bucket;
