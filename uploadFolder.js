// Import required AWS SDK clients and commands for Node.js
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

async function uploadSingleFile(client, bucketName, key, filePath) {
  try {
    // Dynamically import the ESM module
    const mimeModule = await import('mime');
    const mime = mimeModule.default; // Access the default export

    // Create a readable stream from the file
    const fileStream = fs.createReadStream(filePath);

    // Get the file's MIME type (e.g., image/jpeg)
    const contentType = mime.getType(filePath);

    // Upload the file using a stream
    const uploadParams = {
      Bucket: bucketName, // Bucket name
      Key: key, // File key (name)
      Body: fileStream, // File content as a stream
      ContentType: contentType, // Set the correct ContentType
    };

    // Send the command to upload the file
    const data = await client.send(new PutObjectCommand(uploadParams));
    console.log(
      `File "${key}" uploaded successfully to bucket "${bucketName}".`
    );
  } catch (err) {
    console.error('Error uploading file:', err);
  }
}

// Example usage
const folderPath = path.join(__dirname, './testing/SubFolder-23'); // Path to the folder you want to upload
console.log('folderPath:', folderPath);

// Function to upload a whole folder to an S3 bucket
const uploadFolder = async (client, bucketName, baseKey = '') => {
  const items = fs.readdirSync(folderPath);
  const folderName = path.basename(folderPath); // Get the folder name

  const rootFolderKey =
    path.join(baseKey, folderName).replace(/\\/g, '/') + '/'; // Folder key in S3

  // Create the folder key in S3 (to represent the folder itself)
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: rootFolderKey, // Ensure the folder key ends with '/'
    Body: '', // Empty body for the folder
  });

  try {
    await client.send(command);
    console.log(
      `Folder "${rootFolderKey}" created successfully in bucket "${bucketName}".`
    );
  } catch (err) {
    console.error(
      `Error creating folder "${rootFolderKey}" in bucket "${bucketName}":`,
      err
    );
  }

  // Now upload the files and subfolders within the folder
  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const uploadkey = path.join(rootFolderKey, item).replace(/\\/g, '/'); // Add the folder's key as part of the item's key

    if (fs.statSync(fullPath).isDirectory()) {
      // Recursive call for subdirectories
      await uploadFolder(client, bucketName, fullPath, rootFolderKey);
    } else {
      // Upload file
      await uploadSingleFile(client, bucketName, uploadkey, fullPath);
    }
  }
};

module.exports = uploadFolder;
