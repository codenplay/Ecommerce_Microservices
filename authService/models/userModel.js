const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const crypto = require("crypto"); //Use crypto module to generate UUID instead of uuid package to avoid additional dependency
//const {v4: uuidv4} = require("uuid"); //We no need to install this package just for generating uuid, we can use crypto module which is built in nodejs to generate uuid using crypto.randomUUID() method which is available in nodejs 14.17.0 and above

const TABLE_NAME = "Users";

const client = new DynamoDBClient({ region: process.env.REGION });

//User Model class to represent a user and handle database operations related to user data

class UserModel {
  constructor(email, fullName) {
    this.userId = crypto.randomUUID(); //Bult-in generator to generate a unique user ID using uuid
    this.email = email;
    this.fullName = fullName;
    this.state = ""; //Default empty string for state
    this.city = "";
    this.locality = "";
    this.createdAt = new Date().toISOString(); //Store the creation time of the user
  }

  //save user data to dynamodb
  async save() {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        userId: { S: this.userId },
        email: { S: this.email },
        fullName: { S: this.fullName },
        state: { S: this.state },
        city: { S: this.city },
        locality: { S: this.locality },
        createdAt: { S: this.createdAt },
      },
    };

    try {
      await client.send(new PutItemCommand(params));
      console.log("User saved successfully.");
    } catch (error) {
      console.error("Error saving user:", error);
      throw error;
    }
  }
}

module.exports = UserModel;
