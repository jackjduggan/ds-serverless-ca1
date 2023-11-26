import { APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import { DynamoDBClient} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const ddbDocClient = createDDbDocClient();
const translate = new AWS.Translate();

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    console.log("Event: ", event);

    const movieId = event?.pathParameters?.movieId;
    const reviewerName = event?.pathParameters?.reviewerNameMovie;
    const reviewDate = event?.pathParameters?.reviewDate;
    const language = event.queryStringParameters?.language;


    if (!reviewerName) {
        return createResponse(404, { Message: "Invalid reviewerName" });
    }

    if (!movieId) {
        return createResponse(404, { Message: "Invalid movieId" });
    }

    if (!language) {
        return createResponse(404, { Message: "Invalid language" });
    }

    console.log(`movieId: ${movieId}`);
    console.log(`reviewDate: ${reviewDate}`);
    console.log(`Type of movieId: ${typeof movieId}`);
    console.log(`Type of reviewDate: ${typeof reviewDate}`);



    // Use QueryCommand to query by reviewerName using the GSI
    const queryInput = {
        TableName: process.env.TABLE_NAME,
        IndexName: "ReviewerNameIndex",  // Specify the GSI name
        KeyConditionExpression: "reviewerName = :name",
        ExpressionAttributeValues: {
          ":name": reviewerName,
        },
      };
  
      // Execute query
      const queryOutput = await ddbDocClient.send(new QueryCommand(queryInput));
  
      // Check if no reviews found
      if (!queryOutput.Items || queryOutput.Items.length === 0) {
          return createResponse(404, { Message: "Review not found" });
      }
  
      // Assuming you want to translate the content of the first review found
      const reviewResponse = queryOutput.Items[0];
      console.log(reviewResponse.reviewContent);

    //https://www.youtube.com/watch?v=xdWpbr1DZHQ&t=1288s
    const translateParams = {
      Text: reviewResponse.Item.reviewContent,
      SourceLanguageCode: 'en',
      TargetLanguageCode: language,
    };

    //.promise() turns the translate text from a callback into a promise
    const translatedMessage = await translate.translateText(translateParams).promise();

    return createResponse(200, { data: translatedMessage });

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