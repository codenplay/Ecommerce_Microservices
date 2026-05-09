//import the reqired AWS Cognito SDK Classes
//CognitoIdentityProviderClient: used to communicate with Cognito
//SignUpCommand: used to send sign-up request to the Cognito User Pool to create a new user
//import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const {
  CognitoIdentityProviderClient,
  SignUpCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const UserModel = require("../models/userModel"); //Import the UserModel to save user data to DynamoDB after successful sign-up

const client = new CognitoIdentityProviderClient({
  region: process.env.REGION,
});

//specify the Cognito app client Id
//the app client id tells Cognito which app is making the request

const CLIENT_ID = process.env.CLIENT_ID;

//define a lambda function to send sign-up request

exports.signUp = async (event) => {
  const { email, fullName, password } = JSON.parse(event.body);

  //Prepare parameter required by cognito's SignUpCommand
  const params = {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "name",
        Value: fullName,
      },
    ],
  };

  try {
    //create a new SignUpCommand with the prepared parameters
    const command = new SignUpCommand(params);

    await client.send(command);

    const newUser = new UserModel(email, fullName);

    // Save user data to DynamoDB
    await newUser.save();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message:
          "Account created successfully. Please check your email for a confirmation code and enter it.",
      }),
    };
  } catch (error) {
    console.error("Error signing up user:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error signing up user",
        error: error.message,
      }),
    };
  }
};
