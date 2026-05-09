const {
  DynamoDBClient,
  UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");

const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

exports.updateCategoryImage = async (event) => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;
    const record = event.Records[0];

    //get the s3 bucket name from the event record
    const bucketName = record.s3.bucket.name;
    //extract the file name from the event record
    const fileName = record.s3.object.key;

    //contruct a public url on how the upload file will be accessed
    const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

    //Prepare the dynamooDB update command
    const updateCommand = new UpdateItemCommand({
      TableName: tableName,
      Key: {
        fileName: { S: fileName },
      },
      UpdateExpression: "SET imageUrl = :imageUrl", //:imageUrl this is a parameter passed to the update command, we will define its value in the ExpressionAttributeValues
      ExpressionAttributeValues: {
        ":imageUrl": { S: imageUrl },
      },
    });

    await dynamoDBClient.send(updateCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Category image URL updated successfully",
      }),
    };
  } catch (error) {
    console.error("Error updating category image URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
