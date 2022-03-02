import { Stack, StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';

import { Construct } from 'constructs';

const lambdaIntegrationConfig = {
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
    "application/json": "{\"statusCode\": 200}"
  },
}
const methodOptions = {
  methodResponses: [{
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Headers': true,
      'method.response.header.Access-Control-Allow-Methods': true,
      'method.response.header.Access-Control-Allow-Credentials': true,
      'method.response.header.Access-Control-Allow-Origin': true,
    },
  }]
};

export class ReportStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    // TODO: Create outputs for frontend (identity pool ID, user pool ID, user pool client ID, API gateway endpoint)

    // Lambda function for confirm user signup

    const confirmSignup = new lambda.Function(this, 'ConfirmSignupHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'confirmSignUp.handler',
    });

    // API Gateway

    const apiGateway = new apigw.RestApi(this, 'Endpoint', {
      description: 'example api gateway',
      deployOptions: {
        stageName: 'prod',
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS
      },
    });
    new cdk.CfnOutput(this, 'apiUrl', {value: apiGateway.url});


    // Lambda Function
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler'
    });
    // integrate with API gateway
    const helloResourse = apiGateway.root.addResource('hello', {});
    helloResourse.addMethod('GET', new apigw.LambdaIntegration(hello, lambdaIntegrationConfig), methodOptions);
    helloResourse.addMethod('POST', new apigw.LambdaIntegration(hello, lambdaIntegrationConfig), methodOptions);

    // Cognito
    const userPool = new cognito.UserPool(this, 'Userpool', {
      userPoolName: 'Userpool',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
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
        preSignUp: confirmSignup
      }
    });
    // TODO: MFA and verifications > Which attributes do you want to verify? > No Verification
    // TODO: App clients > Create app client (do not generate secret/token)
    // TODO: App clients > ALLOW_USER_PASSWORD_AUTH

    const identityPool = new cognito.CfnIdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: false,
    });
  }
}
