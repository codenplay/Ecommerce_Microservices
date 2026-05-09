const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3"); //if we want to execute the function locally only then we need to instll it locally using npm install @aws-sdk/client-s3, otherwise it will be available in the AWS Lambda environment by default.
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner"); //This is to use a secure way to uplod files to S3

const s3Client = new S3Client({ region: process.env.REGION }); // Create an S3 client instance

exports.getUploadUrl = async (event) => {
  try {
    const bucketName = process.env.BUCKET_NAME; // Get the bucket name from environment variables
    const { fileName, filetype } = JSON.parse(event.body); // Parse the file name and type from the request body

    if (!fileName || !filetype) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "fileName and filetype are required" }),
      };
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: filetype,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    }); // Generate a signed URL that expires in 1 hour

    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl: signedUrl }),
    };
  } catch (error) {
    console.error("Error generating upload URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
