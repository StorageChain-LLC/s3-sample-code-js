const { GetObjectCommand } = require("@aws-sdk/client-s3");

const getObject = async (s3Client, bucketName, objectKey) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
  });

  try {
    const { Body } = await s3Client.send(command);

    // Convert stream to string
    const streamToString = (stream) =>
      new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () =>
          resolve(Buffer.concat(chunks).toString("utf-8"))
        );
        stream.on("error", reject);
      });

    const content = await streamToString(Body);
    console.log("File Content:", content);
    return content;
  } catch (err) {
    console.error("Error fetching object:", err);
  }
};

module.exports = getObject;
