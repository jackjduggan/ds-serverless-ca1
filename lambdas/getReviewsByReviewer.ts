import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, ScanCommandInput } from "@aws-sdk/lib-dynamodb";

// Create DynamoDB Client
const ddbDocClient = createDDbDocClient();

// Handler function handles API Gateway reqs
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Print Event
    console.log(`Event: ${JSON.stringify(event)}`);

    // Params
    const reviewerName = event?.pathParameters?.reviewerName
      ? decodeURIComponent(event?.pathParameters?.reviewerName)
      : undefined;

    // If missing reviewerName
    if (!reviewerName) {
      return createResponse(404, { Message: "Missing reviewerName" });
    }

    // ScanCommandInput init
    let scanInput: ScanCommandInput = {
      TableName: process.env.TABLE_NAME!,
      FilterExpression: "reviewerName = :name",
      ExpressionAttributeValues: { ":name": reviewerName },
    };

    // Execute scan
    const commandOutput = await ddbDocClient.send(new ScanCommand(scanInput));

    // Check if no reviews found
    if (!commandOutput.Items) {
        return createResponse(404, { Message: "No reviews found" });
      }
      const body = {
        data: commandOutput.Items,
      };

    // Successful response!
    return createResponse(200, body);
  } catch (error: any) {
    // Error if exception
    console.log(JSON.stringify(error));
    return createResponse(500, { error });
  }
};

// Function to create an API Gateway response
function createResponse(statusCode: number, body: any) {
    return {
      statusCode,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    };
  }


// Function to create DynamoDB Doc client
function createDDbDocClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
      wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
  }
