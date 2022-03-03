import { Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';


export class ReportStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // TODO: Create outputs for frontend (identity pool ID, user pool ID, user pool client ID, API gateway endpoint)

    // Lambda Function - Confirm Cognito User Signup
    const confirmSignupHandler = new lambda.Function(this, 'ConfirmSignupHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'confirmSignUp.handler',
    });

    // Cognito - User Pool
    const userPool = new cognito.UserPool(this, 'Userpool', {
      userPoolName: 'Userpool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
        phone: true
      },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lambdaTriggers: {
        preSignUp: confirmSignupHandler
      },
    });
    new cdk.CfnOutput(this, 'userPoolId', { value: userPool.userPoolId } );
    const userPoolClient = new cognito.UserPoolClient(this, 'Userpool-Appclient', {
      userPool: userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true
      }
    })
    new cdk.CfnOutput(this, 'userPoolWebClientId', { value: userPoolClient.userPoolClientId} );

    // TODO: MFA and verifications > Which attributes do you want to verify? > No Verification
    // TODO: App clients > Create app client (do not generate secret/token)
    // TODO: App clients > ALLOW_USER_PASSWORD_AUTH

    // Cognito - Identity Pool
    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
    });
    new cdk.CfnOutput(this, 'identityPoolId', { value: identityPool.logicalId } );

    // API Gateway
    const apiGateway = new apigw.RestApi(this, 'Endpoint', {
      description: 'example api gateway',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS
      }
    });
    new cdk.CfnOutput(this, 'apiUrl', {value: apiGateway.url});

    // VVV Token Authorizer w/ Lambda Function
    // Lambda Function - Function for Authorizer for API Gateway
    // const authorizerHandler = new lambda.Function(this, 'AuthorizerHandler', {
    //   runtime: lambda.Runtime.NODEJS_14_X,
    //   code: lambda.Code.fromAsset('lambda'),
    //   handler: 'authorizer.handler',
    // });
    // API Gateway - Authorizer for API Gateway
    // const authorizer = new apigw.TokenAuthorizer(this, 'EndpointAuthorizer', {
    //   handler: authorizerHandler,
    //   identitySource: 'method.request.header.Authorization' ,
    // });

    // Cognito Authorizer
    const authorizer = new apigw.CognitoUserPoolsAuthorizer(this, 'EndpointAuthorizer', {
      cognitoUserPools: [userPool],
    })

    // Configs for API Gateway Resources
    const methodOptions: apigw.MethodOptions = {
      methodResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': true,
          'method.response.header.Access-Control-Allow-Methods': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
          'method.response.header.Access-Control-Allow-Origin': true,
        },
      }],
      authorizer: authorizer
    };
    const lambdaIntegrationConfig: apigw.LambdaIntegrationOptions  = {
      proxy: false,
      integrationResponses: [{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Credentials': "'false'",
          'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
        },
      }],
      passthroughBehavior: apigw.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": JSON.stringify({
          statusCode: 200,
          context: {
            sub: "$context.authorizer.claims.sub",
            username: "$context.authorizer.claims['cognito:username']",
            email: "$context.authorizer.claims.email",
            userId: "$context.authorizer.claims['custom:userId']"
        }
        })
      },
    }

    // Lambda Function - Hello
    const helloHandler = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode('lambda'),
      handler: 'hello.handler'
    });
    const helloResource = apiGateway.root.addResource('hello', {});
    helloResource.addMethod('GET', new apigw.LambdaIntegration(helloHandler, lambdaIntegrationConfig), methodOptions);
    helloResource.addMethod('POST', new apigw.LambdaIntegration(helloHandler, lambdaIntegrationConfig), methodOptions);

    // Lambda Function - GetEmbedInfo
    const getEmbedInfoHandler = new lambda.Function(this, 'GetEmbedInfoHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode('lambda'),
      handler: 'getEmbedInfo.handler',
      timeout: cdk.Duration.seconds(8)
    });
    const getEmbedInfoResource = apiGateway.root.addResource('getEmbedInfo', {});
    getEmbedInfoResource.addMethod('POST', new apigw.LambdaIntegration(getEmbedInfoHandler, lambdaIntegrationConfig), methodOptions);

    // Secrets manager
    const secret = secretsmanager.Secret.fromSecretNameV2(this, 'MsAccountSecret', 'VAS-MS-ACCOUNT-MARK');
    secret.grantRead(getEmbedInfoHandler)

    // S3 Bucket
    const bucket = new s3.Bucket(this, 'ReportBucket');
    const bucketRole = new iam.Role(this, "BucketRole", {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com')
    });
    bucket.grantRead(bucketRole);
    bucketRole.addToPolicy(new iam.PolicyStatement({
      resources: [bucket.bucketArn],
      actions: ['s3:Get']
    }))

    // API Gateway - Bucket Resource & Integration
    const bucketIntegration = new apigw.AwsIntegration({
      service: 's3',
      integrationHttpMethod: 'GET',
      path: `${bucket.bucketName}/{file}`,
      options: {
        credentialsRole: bucketRole,
        requestParameters: {
          'integration.request.path.file': 'method.request.path.file'
        },
        integrationResponses: [{
          statusCode: "200"
        }]
      }
    })
    apiGateway.root
      .addResource("mybucket")
      .addResource("{file}")
      .addMethod('GET', bucketIntegration, {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Content-Type": true,
            },
          },
        ],
        requestParameters: {
          'method.request.path.file': true,
          "method.request.header.Content-Type": true
        },
        authorizer: authorizer
      })
  }
}
