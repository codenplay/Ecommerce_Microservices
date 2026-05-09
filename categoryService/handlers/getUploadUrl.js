const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3"); //if we want to execute the function locally only then we need to instll it locally using npm install @aws-sdk/client-s3, otherwise it will be available in the AWS Lambda environment by default.
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner"); //This is to use a secure way to uplod files to S3
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb"); //if we want to execute the function locally only then we need to instll it locally using npm install @aws-sdk/client-dynamodb, otherwise it will be available in the AWS Lambda environment by default.

const s3Client = new S3Client({ region: process.env.REGION }); // Create an S3 client instance
const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION }); // Create a DynamoDB client instance

exports.getUploadUrl = async (event) => {
  try {
    const bucketName = process.env.BUCKET_NAME; // Get the bucket name from environment variables
    const { fileName, fileType, categoryName } = JSON.parse(event.body); // Parse the file name and type from the request body

    if (!fileName || !fileType || !categoryName) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "fileName, fileType, and categoryName are required",
        }),
      };
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    }); // Generate a signed URL that expires in 1 hour

    //Save category details in DynamoDB
    const putItemCommand = new PutItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        fileName: { S: fileName },
        categoryName: { S: categoryName },
        createdAt: { S: new Date().toISOString() },
      },
    });

    await dynamoDBClient.send(putItemCommand);

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
