const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

const deleteObject = async (bucketName, key) => {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    await client.send(command);
    console.log(
      `Object "${key}" deleted successfully from bucket "${bucketName}".`
    );
  } catch (err) {
    console.error(
      `Error deleting object "${key}" from bucket "${bucketName}":`,
      err
    );
  }
};
