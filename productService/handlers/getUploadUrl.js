const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3');
const {getSignedUrl} = require('@aws-sdk/s3-request-presigner');
const {DynamoDBClient, PutItemCommand} = require('@aws-sdk/client-dynamodb');
const crypto = require('crypto');
const { get } = require('http');

const s3Client = new S3Client({ region: process.env.REGION });
const ddbClient = new DynamoDBClient();

exports.getUploadUrl = async (event) =>{
    try {
        const bucketName = process.env.BUCKET_NAME;
        const {fileName, fileType, productName, productPrice, description, quantity, category, email} = JSON.parse(event.body);
        if(!fileName || !fileType || !productName || !productPrice || !description || !quantity || !category || !email){
            return {
                statusCode: 400,
                body: JSON.stringify({message: 'Missing required fields'})
            }
        }

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            ContentType: fileType
        });
        
        const signedUrl = await getSignedUrl(s3Client, command, {expiresIn: 3600});
        const productId = crypto.randomUUID();

        const putItemCommand = new PutItemCommand({
            TableName: process.env.DYNAMODB_TABLE,
            Item: {
                id: { S: productId },
                fileName: { S: fileName },
                fileType: { S: fileType },
                productName: { S: productName },
                productPrice: { N: productPrice.toString() },
                description: { S: description },
                quantity: { N: quantity.toString() },
                category: { S: category },
                email: { S: email },
                isApproved: { BOOL: false },
                createdAt: { S: new Date().toISOString() }
            }
        });

        await ddbClient.send(putItemCommand);

        return {
            statusCode: 201,
            body: JSON.stringify({uploadUrl: signedUrl, productId})
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({message: error.message})
        }
    }
}