const {CognitoIdentityProviderClient, ForgotPasswordCommand} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });

//Define Cognito App Client Id for user pool authentication
const CLIENT_ID = process.env.CLIENT_ID;

exports.forgotPassword = async (event) => {
    const { email } = JSON.parse(event.body);

    const params = {
        ClientId: CLIENT_ID,
        Username: email,
    };
    try {
        await cognitoClient.send(new ForgotPasswordCommand(params));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Password reset email sent" }),
        };
    } catch (error) {
        console.error("Error sending forgot password email:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Error sending password reset email", error: error.message }),
        };
    }
};