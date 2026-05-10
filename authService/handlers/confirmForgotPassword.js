const {CognitoIdentityProviderClient, ConfirmForgotPasswordCommand} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });

//Define Cognito App Client Id for user pool authentication
const CLIENT_ID = process.env.CLIENT_ID;

exports.confirmForgotPassword = async (event) => {
    const { email, code, newPassword } = JSON.parse(event.body);
    const params = {
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
    };
    try {
        await cognitoClient.send(new ConfirmForgotPasswordCommand(params));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Password reset successful" }),
        };
    } catch (error) {
        console.error("Error confirming forgot password:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Error confirming password reset", error: error.message }),
        };
    }
};