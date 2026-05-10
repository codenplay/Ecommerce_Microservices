const {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });
const snsClient = new SNSClient({ region: process.env.REGION });

//Define the cleanup functionto remove outdated products from the DynamoDB table
exports.cleanupProducts = async (event) => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;
    const snsTopicArn = process.env.SNS_TOPIC_ARN;

    //Calculate the timestampfor 1 hour ago(to filter outdated products)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    //Create a scan command to find products that are older than 1 hour
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
          message: "No outdated products found for cleanup",
        }),
      };
    }

    //initialize a counter to track the number of deleted products
    let deletedCount = 0;
    //Iterate through the outdated products and delete them from the DynamoDB table
    for (const item of Items) {
      //Create a delete command using the product's primary key (id in this case) to identify the item to be deleted
      const deleteCommand = new DeleteItemCommand({
        TableName: tableName,
        Key: {
          id: { S: item.id.S }, //Assuming id is the primary key
        },
      });
      await dynamoDBClient.send(deleteCommand);
      deletedCount++;
    }

    // Publish a message to the SNS topic to notify about the cleanup
    const snsMessage = `Outdated products cleaned up successfully. Total deleted: ${deletedCount}`;
    const publishCommand = new PublishCommand({
      TopicArn: snsTopicArn,
      Message: snsMessage,
      Subject: "Product Cleanup Notification",
    });
    await snsClient.send(publishCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Outdated products cleaned up successfully",
        deletedCount,
      }),
    };
  } catch (error) {
    console.error("Error cleaning up products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
