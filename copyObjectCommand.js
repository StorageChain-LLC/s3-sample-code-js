const { CopyObjectCommand } = require("@aws-sdk/client-s3");

const copyObject = async (s3Client, copyParams) => {
  try {
    const command = new CopyObjectCommand(copyParams);
    const response = await s3Client.send(command);
    console.log("✅ Copy successful:", response);
  } catch (error) {
    console.error("❌ Copy failed:", error);
  }
};

module.exports = copyObject;
