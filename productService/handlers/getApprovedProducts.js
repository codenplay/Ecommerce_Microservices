const {DynamoDBClient, ScanCommand} = require("@aws-sdk/client-dynamodb");

const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

// Define the function to get approved products from the DynamoDB table
exports.getApprovedProducts = async (event) => {
  try {
    const tableName = process.env.DYNAMODB_TABLE;
    // Create a scan command to retrieve products with status "approved"
    const scanCommand = new ScanCommand({
      TableName: tableName,
      FilterExpression: "isApproved = :trueValue",
      ExpressionAttributeValues: {
        ":trueValue": { BOOL: true }, // Assuming isApproved is a boolean attribute in DynamoDB
      }
    });
    // Execute the scan command and retrieve the results
    const { Items } = await dynamoDBClient.send(scanCommand);

    // Return the approved products
    return {
      statusCode: 200,
      body: JSON.stringify({
        products: Items
      })
    };
  } catch (error) {
    console.error("Error occurred while fetching approved products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message
      })
    };
  }
};