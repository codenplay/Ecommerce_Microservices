const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

exports.confirmUpload = async (event) => {
  try {
    const bucketName = process.env.BUCKET_NAME; // Get the bucket name from environment variables
    const tableName = process.env.DYNAMODB_TABLE; // Get the DynamoDB table name from environment variables
    const record = event.Records[0];

    const fileName = record.s3.object.key;
    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

    const params = {
      TableName: tableName,
      Item: {
        fileName: { S: fileName }, // Use the file name as the unique identifier
        fileUrl: { S: fileUrl },
        uploadedAt: { S: new Date().toISOString() }, // Store the upload timestamp
      },
    };

    await dynamoDBClient.send(new PutItemCommand(params)); // Insert the record into DynamoDB

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Upload confirmed and record saved to DynamoDB",
      }),
    };
  } catch (error) {
    console.error("Error confirming upload:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
