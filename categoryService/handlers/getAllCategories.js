const {DynamoDBClient, ScanCommand} = require("@aws-sdk/client-dynamodb");

const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });

// Define the  Lambdafunction to get all categories from the DynamoDB table
exports.getAllCategories = async () => {
    try {
        const tableName = process.env.DYNAMODB_TABLE;
        // Create a scan command to retrieve all items from the DynamoDB table
        const scanCommand = new ScanCommand({
            TableName: tableName,
        });
        // Execute the scan command and retrieve the results
        const { Items } = await dynamoDbClient.send(scanCommand);
        // if no items are found, return an empty list
        if (!Items || Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({
                    message: "No categories found"
                })
            };
        }

        // Return the categories
        return {
            statusCode: 200,
            body: JSON.stringify({
                categories: Items
            })
        };
    } catch (error) {
        console.error("Error occurred while fetching categories:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: error.message
            })
        };
    }
}