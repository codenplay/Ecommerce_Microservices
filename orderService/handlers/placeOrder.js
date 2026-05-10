const {DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const {SQSClient, SendMessageCommand} = require("@aws-sdk/client-sqs");
const {sendOrderEmail} = require("../services/sendEmail");
const axios = require("axios");
const crypto = require("crypto");

const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });
const sqsClient = new SQSClient({ region: process.env.REGION });

exports.placeOrder = async (event) => {
  try {
    const { id, quantity, email } = JSON.parse(event.body);
    if (!id || !quantity || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
      };
    }
    const productResponse = await axios.get('https://bbfukehb9i.execute-api.ap-southeast-2.amazonaws.com/approved-products');
    const approvedProducts = productResponse.data.products || [];
    const product = approvedProducts.find((p) => p.id?.S === id);
    if (!product) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Product not found" }),
        };
    }
    const availableStock = parseInt(product.quantity?.N || "0");
    if (quantity > availableStock) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Insufficient stock" }),
        };
    }
    const orderId = crypto.randomUUID();
    const orderPayload = {
        id: orderId,
        productId: id,
        quantity,
        email,
        status: "pending",
        createdAt: new Date().toISOString(),
    };
    // Send message to SQS queue for order processing
    await sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.ORDERS_QUEUE_URL,
        MessageBody: JSON.stringify(orderPayload),
    }));
    // Send order confirmation email to the customer
    await sendOrderEmail(
        email, 
        orderId, 
        product.productName?.S || "Unknown Product", 
        quantity
    );    
        
    return {
        statusCode: 201,
        body: JSON.stringify({ message: "Order placed successfully", orderId }),
    };
  }
    catch (error) {
        console.error("Error placing order:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};