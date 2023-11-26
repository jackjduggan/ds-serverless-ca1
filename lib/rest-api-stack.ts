import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as custom from "aws-cdk-lib/custom-resources";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { generateBatch } from "../shared/util";
import { movies, reviews } from "../seed/movies"; //updated imports

export class RestAPIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ---------- TABLES ----------
    /**
     * Movies Table
     */
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    /**
      * Movie Review Table
    */
    const reviewsTable = new dynamodb.Table(this, "ReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "reviewDate", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Reviews",
    });
    //GIS
    reviewsTable.addGlobalSecondaryIndex({
      indexName: "ReviewerNameIndex",
      partitionKey: { name: "reviewerName", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    })

    // ---------- LAMBDA FUNCTIONS ----------
    /**
     * Movie Lambda Functions
     */ 
    const getMovieByIdFn = new lambdanode.NodejsFunction(
      this,
      "GetMovieByIdFn",
      {
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `${__dirname}/../lambdas/getMovieById.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
      );

      const getAllMoviesFn = new lambdanode.NodejsFunction(
        this,
        "GetAllMoviesFn",
        {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getAllMovies.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: 'eu-west-1',
          },
        }
        );

        /**
         * Review Lambda Functions
         */
        const addReviewFn = new lambdanode.NodejsFunction(this, "AddReviewFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/addReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: reviewsTable.tableName,
            REGION: "eu-west-1",
          },
        });

        const getReviewsFn = new lambdanode.NodejsFunction(this, "GetReviewsFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/getReviews.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
          TABLE_NAME: reviewsTable.tableName,
          REGION: 'eu-west-1',
          },
        });

        const getAllReviewsFn = new lambdanode.NodejsFunction( this, "GetAllReviewsFn", {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_16_X,
            entry: `${__dirname}/../lambdas/getAllReviews.ts`,
            timeout: cdk.Duration.seconds(10),
            memorySize: 128,
            environment: {
            TABLE_NAME: reviewsTable.tableName,
            REGION: 'eu-west-1',
          },
        });

        const updateReviewFn = new lambdanode.NodejsFunction(this, "UpdateReviewFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/updateReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
          TABLE_NAME: reviewsTable.tableName,
          REGION: "eu-west-1",
          },
        });

        // const getReviewsByReviewerFn = new lambdanode.NodejsFunction(this, "getReviewsByReviewerFn" , {
        //   architecture: lambda.Architecture.ARM_64,
        //   runtime: lambda.Runtime.NODEJS_16_X,
        //   entry: `${__dirname}/../lambdas/getReviewsByReviewer.ts`,
        //   timeout: cdk.Duration.seconds(10),
        //   memorySize: 128,
        //   environment: {
        //   TABLE_NAME: reviewsTable.tableName,
        //   REGION: "eu-west-1",
        //   },
        // })

        const translateFn = new lambdanode.NodejsFunction(this, "translateFn" , {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `${__dirname}/../lambdas/translateReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
          TABLE_NAME: reviewsTable.tableName,
          REGION: "eu-west-1",
          },
        })
        
        // ---------- DYNAMODB INIT ----------
        new custom.AwsCustomResource(this, "moviesddbInitData", {
          onCreate: {
            service: "DynamoDB",
            action: "batchWriteItem",
            parameters: {
              RequestItems: {
                [moviesTable.tableName]: generateBatch(movies),
                [reviewsTable.tableName]: generateBatch(reviews)  // Forgot this line!!!
              },
            },
            physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"),
          },
          policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
            resources: [moviesTable.tableArn, reviewsTable.tableArn],  // Includes movie reviews
          }),
        });

        const translatePolicyStatement = new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["translate:TranslateText"],
          resources: ["*"],
        });
        translateFn.addToRolePolicy(translatePolicyStatement)
        
        // ---------- PERMISSIONS ----------
        moviesTable.grantReadData(getMovieByIdFn)
        moviesTable.grantReadData(getAllMoviesFn)
        reviewsTable.grantReadWriteData(addReviewFn);
        reviewsTable.grantReadData(getReviewsFn);
        reviewsTable.grantReadData(getAllReviewsFn);
        reviewsTable.grantReadWriteData(updateReviewFn);
        reviewsTable.grantReadWriteData(translateFn);

        // ---------- REST API ----------
    const api = new apig.RestApi(this, "RestAPI", {
      description: "demo api",
      deployOptions: {
        stageName: "dev",
      },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowCredentials: true,
        allowOrigins: ["*"],
      },
    });

    /**
     * Get movies
     */
    const moviesEndpoint = api.root.addResource("movies");
    moviesEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllMoviesFn, { proxy: true })
    );

    const movieEndpoint = moviesEndpoint.addResource("{movieId}");
    movieEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(getMovieByIdFn, { proxy: true })
    );

    /**
     * Reviews API Endpoints
     */
    const reviewEndpoint = movieEndpoint.addResource("reviews")
    const reviewsEndpoint = moviesEndpoint.addResource("reviews");
    const reviewerEndpointMovie = reviewEndpoint.addResource("{reviewerNameMovie}")
    const reviewerEndpointReviews = reviewsEndpoint.addResource("{reviewerNameReviews}")
    //const reviewerEndpoint = reviewEndpoint.addResource("{proxy}")
    //const yearEndpoint = reviewEndpoint.addResource("{year}")

    // POST reviews endpoint
    reviewsEndpoint.addMethod(
      "POST", new apig.LambdaIntegration(addReviewFn, { proxy: true })
      );
    
    reviewsEndpoint.addMethod(
      "GET", new apig.LambdaIntegration(getAllReviewsFn, { proxy: true})
    );

    // Get reviews endpoints 
    reviewEndpoint.addMethod(
      "GET", new apig.LambdaIntegration(getReviewsFn, { proxy: true })
      );

    /**
     * Reviewer Endpoints
     */
    // Get review by reviewer endpoint
    reviewerEndpointMovie.addMethod(
      "GET", new apig.LambdaIntegration(getReviewsFn, { proxy: true })
      );
    // Update endpoint
    reviewerEndpointMovie.addMethod(
      "PUT", new apig.LambdaIntegration(updateReviewFn, { proxy: true })
      );
    reviewerEndpointReviews.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllReviewsFn, { proxy: true })
    );

    // Get reviews for a specific year endpoint
    // yearEndpoint.addMethod(
    //   "GET",
    //   new apig.LambdaIntegration(getReviewsFn, { proxy: true })
    //   );

    const translationEndpoint = reviewerEndpointMovie.addResource("translation");
    translationEndpoint.addMethod(
      "GET",
      new apig.LambdaIntegration(translateFn, { proxy: true })
    );
        
      }

    }

    