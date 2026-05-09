const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({
  region: process.env.REGION,
});

const CLIENT_ID = process.env.CLIENT_ID;

exports.signIn = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    const command = new InitiateAuthCommand({
      ClientId: CLIENT_ID,
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "User signed in successfully",
        token: response.AuthenticationResult,
      }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Error signing in user",
        details: error.message,
      }),
    };
  }
};
