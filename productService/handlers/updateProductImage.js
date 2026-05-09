const {DynamoDBClient, UpdateItemCommand, ScanCommand} = require('@aws-sdk/client-dynamodb');

const dynamoDBClient = new DynamoDBClient({ region: process.env.REGION });

exports.updateProductImage = async (event) => {
    try {
        const tableName = process.env.DYNAMODB_TABLE;

        //extract the first record from the event
        const record = event.Records[0]; 

        //get the s3 bucket name from the event record
        const bucketName = record.s3.bucket.name;
        //get the file name from the event record
        const fileName = record.s3.object.key;
        const imageUrl = `https://${bucketName}.s3.${process.env.REGION}.amazonaws.com/${fileName}`;

        //scan the DynamoDB table to find the item with the matching fileName
        const scanCommand = new ScanCommand({
            TableName: tableName,
            FilterExpression: 'fileName = :fileName',
            ExpressionAttributeValues: {
                ':fileName': { S: fileName }
            }
        });

        const scanResult = await dynamoDBClient.send(scanCommand);

        if (!scanResult.Items || scanResult.Items.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Product not found' })
            };
        }
        const productId = scanResult.Items[0].id.S;
        //update the DynamoDB item with the imageUrl
        const updateCommand = new UpdateItemCommand({
            TableName: tableName,
            Key: {
                id: { S: productId }
            },
            UpdateExpression: 'SET imageUrl = :imageUrl',
            ExpressionAttributeValues: {
                ':imageUrl': { S: imageUrl }
            }
        });
        await dynamoDBClient.send(updateCommand);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Product image updated successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,    
            body: JSON.stringify({message: error.message})
        }
    }
}