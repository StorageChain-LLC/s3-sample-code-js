const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const download_single_Object_from_bucket = require('./downloadSingleFile');
const fs = require('fs');
const path = require('path');
const getBucketObjectListPaginated = require('./getBucketObjectListPaginated');

const downloadFolder = async (client, bucketName, folderKey, localPath) => {
  console.log('folderKey:', folderKey);
  // const command = new ListObjectsV2Command({
  //   Bucket: bucketName,
  //   Prefix: folderKey,
  // });

  try {
    const response = await getBucketObjectListPaginated(
      client,
      bucketName,
      folderKey,
      0
    );

    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }
    console.log('responseresponse==>', response);

    const objects = response.content || [];
    console.log('objects:', objects);
    // for (const obj of objects) {
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      // const tempKey = obj.Key;
      const key = obj.Key;
      // console.log('key==>', folderKey + '/' + key);

      const filePath = key;
      console.log('filePathfilePath==>', filePath);

      if (key.endsWith('/')) {
        // If it's a directory, make sure the directory exists locally
        if (!fs.existsSync(filePath)) {
          fs.mkdirSync(filePath, { recursive: true });
        }
      } else {
        // If it's a file, download it
        await download_single_Object_from_bucket(
          client,
          bucketName,
          key,
          `./testing/${filePath}`
        );
      }
    }
  } catch (err) {
    console.error(
      `Error listing objects in folder "${folderKey}" from bucket "${bucketName}":`,
      err
    );
  }
};

module.exports = downloadFolder;
