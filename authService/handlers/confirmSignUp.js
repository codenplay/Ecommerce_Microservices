const {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({
  region: process.env.REGION,
});

//specify the Cognito app client Id
//the app client id tells Cognito which app is making the request

const CLIENT_ID = process.env.CLIENT_ID; // Get the CLIENT_ID from environment variables

exports.confirmSignUp = async (event) => {
  try {
    const { email, confirmationCode } = JSON.parse(event.body);

    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User confirmed successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error confirming user",
        details: error.message,
      }),
    };
  }
};
