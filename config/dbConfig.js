import mongoose from "mongoose";
import { connectDB } from "./db.js";

await connectDB();

const client = mongoose.connection.getClient();
const db = mongoose.connection.db;

// console.log(db);

let cmdType = "collMod";
try {
  await db.command({
    [cmdType]: "users",
    validator: {
      $jsonSchema: {
        required: ["userName", "email", "password"],
        properties: {
          _id: {
            bsonType: "objectId",
          },
          userName: {
            bsonType: "string",
          },
          email: {
            bsonType: "string",
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$",
          },
          password: {
            bsonType: "string",
          },
          role: {
            bsonType: "string",
            enum: ["user", "admin", "manager"],
          },
        },
        additionalProperties: true,
      },
    },
  });

  console.log("validation is implemented Successfully");
} catch (error) {
  console.log("validation is implemented Failed", error);
} finally {
  client.close();
}
