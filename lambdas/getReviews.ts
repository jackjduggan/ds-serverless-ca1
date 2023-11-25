import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

// Create DynamoDB Client
const ddbDocClient = createDDbDocClient();

// Handler function handles API Gateway reqs
export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Print Event
    console.log(`Event: ${JSON.stringify(event)}`);

    // params
    const movieId   = event?.pathParameters?.movieId ? parseInt(event?.pathParameters.movieId) : undefined;
    const minRating = event?.queryStringParameters?.minRating;  // min rating functionality
    const reviewerName = event?.pathParameters?.reviewerName
    ? decodeURIComponent(event?.pathParameters?.reviewerName) // fixes the issue of two worded reviewers not working properly
    : undefined;

    // If missing movie id
    if (!movieId) {
      return createResponse(404, { Message: "Missing movieId" });
    }

    // QueryCommandInput init
    let queryInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME!,
      KeyConditionExpression: "movieId = :id",
      ExpressionAttributeValues: { ":id": movieId },
    };

    // If url provides minRating query, add FilterExpression
    queryInput = {
      ...queryInput,
      ...(minRating !== undefined && !isNaN(parseFloat(minRating))
        ? {
            FilterExpression: "reviewRating >= :rating",
            ExpressionAttributeValues: {
              ...queryInput.ExpressionAttributeValues,
              ":rating": parseFloat(minRating),
            },
          }
        : {
        }),
    };

    // If url provides reviewer query, add FilterExpression
    queryInput = {
      ...queryInput,
      ...(reviewerName
        ? {
            FilterExpression: "reviewerName = :name",
            ExpressionAttributeValues: {
              ...queryInput.ExpressionAttributeValues,
              ":name": reviewerName,
            },
          }
        : {
        }),
    };

    // Execute query
    const commandOutput = await ddbDocClient.send(new QueryCommand(queryInput));

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
