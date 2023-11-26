import { APIGatewayProxyHandlerV2 } from "aws-lambda";  // CHANGED

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => { // CHANGED
  try {
    // Print Event
    console.log("Event: ", event);
    const reviewerName = event?.pathParameters?.reviewerNameReviews
    ? decodeURIComponent(event?.pathParameters?.reviewerNameReviews) // fixes the issue of two worded reviewers not working properly
                                                              // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/decodeURIComponent
    : undefined;
    
    const commandOutput = await ddbDocClient.send(
      new ScanCommand({
        TableName: process.env.TABLE_NAME,
      })
    );
    if (!commandOutput.Items) {
        return createResponse(404, { Message: "Invalid Request" });
    }

    // If reviewerName is provided, filter the reviews
    const filteredReviews = reviewerName
    ? commandOutput.Items.filter((review) => review.reviewerName === reviewerName)
    : commandOutput.Items;

    const body = {
      data: filteredReviews,
    };

    // Return Response
    return createResponse(200, body);
  } catch (error: any) {
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
