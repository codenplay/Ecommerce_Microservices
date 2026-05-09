const {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");

const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

//Define the cleanup functionto remove outdated categories from the DynamoDB table
exports.cleanupCategories = async (event) => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;

    //Calculate the timestampfor 1 hour ago(to filter outdated categories)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    //Create a scan command to find categories that are older than 1 hour
    // and do not have an imageUrl attribute (indicating that the image upload was not completed)
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression:
        "createdAt < :oneHourAgo AND attribute_not_exists(imageUrl)",
      ExpressionAttributeValues: {
        ":oneHourAgo": { S: oneHourAgo },
      },
    });

    //Excute the scan command to retrive matching items from the database
    const { Items } = await dynamoDBClient.send(scanCommand);

    //if no items are found, return a success response indicating no cleanup was needed
    if (!Items || Items.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No outdated categories found for cleanup",
        }),
      };
    }

    //initialize a counter to track the number of deleted categories
    let deletedCount = 0;

    //Iterate through the outdated categories and delete them from the DynamoDB table
    for (const item of Items) {
      //Create a delete command using the category's primary key (fileName in this case) to identify the item to be deleted
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          fileName: { S: item.fileName.S }, //Assuming fileName is the primary key
        },
      });
      await dynamoDBClient.send(deleteCommand);
      deletedCount++;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Outdated categories cleaned up successfully",
        deletedCount,
      }),
    };
  } catch (error) {
    console.error("Error cleaning up categories:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
