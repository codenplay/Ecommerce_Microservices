const {DynamoDBClient, PutItemCommand} = require("@aws-sdk/client-dynamodb");

const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

exports.processOrder = async (event) => {
    try {
        // loop through each recordin the SQS event and process the order
        for (const record of event.Records) {
            const order = JSON.parse(record.body);
            const { id, productId, quantity, email, status, createdAt } = order;

            //send a command to DynamoDB to insert the order item
            await dynamoDBClient.send(new PutItemCommand({  
                TableName: process.env.DYNAMODB_TABLE,
                Item: {
                    id: { S: id },
                    productId: { S: productId },
                    quantity: { N: quantity.toString() },
                    email: { S: email },
                    status: { S: status },
                    createdAt: { S: createdAt },
                },
            }));
        }
        // Return a success response after processing all orders
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Orders processed successfully" }),
        };
    } catch (error) {
        console.error("Error processing order:", error);
        throw error;
    }
};