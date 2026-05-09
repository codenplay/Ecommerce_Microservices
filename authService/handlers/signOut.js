const {
  CognitoIdentityProviderClient,
  GlobalSignOutCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({
  region: process.env.REGION,
});
//don't need client id here because accessToken is enough for cognito to understand which user need to sign out

exports.signOut = async (event) => {
  try {
    const { accessToken } = JSON.parse(event.body);
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });
    await client.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "User signed out successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error signing out user",
        details: error.message,
      }),
    };
  }
};
