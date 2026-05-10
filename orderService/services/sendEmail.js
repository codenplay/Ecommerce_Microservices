const {SESClient, SendEmailCommand} = require('@aws-sdk/client-ses');

const sesClient = new SESClient({ region: process.env.REGION });

exports.sendOrderEmail = async (toEmail, orderId, productName, quantity) => {
    const emailParams = {
        Source: "sr.hallow@gmail.com",
        Destination: {
            ToAddresses: [toEmail],
        },
        Message: {
            Subject: {
                Data: "Order Confirmation",
            },
            Body: {
                Text: {
                    Data: `Thank you for order.\n\nOrder ID: ${orderId}\nProduct: ${productName}\n Quantity: ${quantity}`,
                },
            },
        },
    };
    
    try {
        const command = new SendEmailCommand(emailParams);
        await sesClient.send(command);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error(error.message || "Failed to send email");
    }
};