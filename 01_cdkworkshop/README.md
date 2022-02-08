# CDK Workshop

Following:
* https://cdkworkshop.com/

Contents:
- [CDK Workshop](#cdk-workshop)
  - [1. Prerequisites](#1-prerequisites)
    - [1.1 Account Setup](#11-account-setup)
    - [1.2 NodeJS Setup](#12-nodejs-setup)
    - [1.3 Python Setup](#13-python-setup)
  - [2. TypeScript Workshop](#2-typescript-workshop)
    - [2.1 New Project](#21-new-project)
      - [2.1.1 Initialize Project](#211-initialize-project)
      - [2.1.2 Project Structure](#212-project-structure)
      - [2.1.3 CDK Synth](#213-cdk-synth)
      - [2.1.3 CDK Deploy](#213-cdk-deploy)
    - [2.2 Hello CDK!](#22-hello-cdk)
      - [2.2.1 Create Lambda function](#221-create-lambda-function)
      - [2.2.2 About constructs and constructors](#222-about-constructs-and-constructors)
      - [2.2.3 CDK Deploy & Watch](#223-cdk-deploy--watch)
      - [2.2.4 API Gateway](#224-api-gateway)
    - [2.3 Writing Constructs](#23-writing-constructs)
      - [2.3.1 Define HitCounter API (Stack)](#231-define-hitcounter-api-stack)
      - [2.3.2 HitCounter handler (Lambda function)](#232-hitcounter-handler-lambda-function)
      - [2.3.3 Add hit counter to the stack](#233-add-hit-counter-to-the-stack)
      - [2.3.4 Deploy, Test, Debug](#234-deploy-test-debug)

## 1. Prerequisites

### 1.1 Account Setup

You need the AWS CLI to be installed.

You need to create an IAM user
* Credential type: `Access key - Programmatic access`
* Permissions: `Attach existing policies directly, AdministratorAccess`

Take note of your Secret Access Key.

Now configure credentials.
* `aws configure`

Input access key ID and and secret access key. Leave region and output format blank.

### 1.2 NodeJS Setup

You need NodeJS to be installed.

Install the AWS NPM module: `npm install -g aws-cdk`

Now you will have the cdk command available: `cdk --version`

### 1.3 Python Setup

You need Python to be installed.

## 2. TypeScript Workshop

### 2.1 New Project

#### 2.1.1 Initialize Project

Use `cdk init <template>` to create a new project.

```bash
mkdir cdk-workshop && cd cdk-workshop
cdk init sample-app --language typescript
```

Output:
```
# Welcome to your CDK TypeScript project!

You should explore the contents of this project. It demonstrates a CDK app with an instance of a stack (`CdkWorkshopStack`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
```

#### 2.1.2 Project Structure

**Entry Point**

`bin/cdk-workshop.ts` = entrypoint for CDK application which loads the stack

Creating a stack is as simple as instantiating a Stack
and passing in the App object.

**Main Stack Definition**

`lib/cdk-workshop-stack.ts` = application stack is defined

The application with all of the SDS, SNS, EC2, etc instances
are defined, created, and tied together.

```ts
export class CdkWorkshopStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'CdkWorkshopQueue', {
      visibilityTimeout: Duration.seconds(300)
    });

    const topic = new sns.Topic(this, 'CdkWorkshopTopic');

    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
```

**CDK Config**

`cdk.json` = tells toolkit how to run the app (in this case `npx ts-node bin/cdk-workshop.ts`)


#### 2.1.3 CDK Synth

A CDK app is a definition of your infrastructure.

When executed, they produce a CloudFormation template for each stack
defined in your application.

Use command: `cdk synth`, to generate a CloudFormation template.

#### 2.1.3 CDK Deploy

Before you deploy, you need to create the CDK toolkit stack using: `cdk bootstrap`

This contains resources required to deploy CDK apps.

Then you can deploy using: `cdk deploy`

And you can destroy using: `cdk destroy`

### 2.2 Hello CDK!

Let's build a stack which consists of a Lambda function with an API Gateway.

We will modify `cdk-workshop`.

#### 2.2.1 Create Lambda function

We will create Lambda function at: `lambda/hello.js`
```js
exports.handler = async function(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/plain" },
    body: `Hello, CDK! You've hit ${event.path}\n`
  };
};
```

We will add the Lambda function to our stack.
```ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
// ...
const hello = new lambda.Function(this, 'HelloHandler', {
    runtime: lambda.Runtime.NODEJS_14_X,
    code: lambda.Code.fromAsset('lambda'),
    handler: 'hello.handler'
});
```

We can now test by deploying the function and finding the Lambda function in the AWS Console.

See [Lambda Function Props](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-lambda.FunctionProps.html)

#### 2.2.2 About constructs and constructors

`CdkWorkshopStack` and `lambda.Function` have function signatures of `(scope, id, props)`
(scope/parent, id/name, properties) because these classes are **constructs**
representing "cloud components".

A construct is always created in the scope of another.

#### 2.2.3 CDK Deploy & Watch

`cdk deploy --hotswap` is for hotswap deployment:
* Assesses whether a hotswap deployment can be made instead of a new CloudFormation deployment
* Otherwise falls back to CloudFormation deployment
* Useful for when we are not changing our infrastructure, but are just making some changes to Lambda function code
* (USE ONLY FOR DEV because it introduces CloudFormation drift)

`cdk watch` is the same as deploy with hotswap, except it runs whenever you save a file.
* You will need to remove `**/*.js` from the exclude block in `cdk.json`

Command                     | Deployment Time   | Total Time
----------------------------|-------------------|-------------
`cdk deploy`                | 60.8s             | 67.77s
`cdk deploy --hotswap`      | 3.99s             | 11.48s

#### 2.2.4 API Gateway

We can create an API gateway by creating an API gateway object in our stack.
```ts
import * as apigw from 'aws-cdk-lib/aws-apigateway';

// ...

// API Gateway
new apigw.LambdaRestApi(this, 'Endpoint', {
    handler: hello
});
```

See [LambdaRestApi Props for API Gateway](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-apigateway.LambdaRestApiProps.html)

### 2.3 Writing Constructs

We will create a `HitCounter` Lambda function with a database.

It will update a counter in DynamoDB and return the response from calling a different Lambda function.

#### 2.3.1 Define HitCounter API (Stack)

We will define the HitCounter stack.
```ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface HitCounterProps {
    /** the function for which we want to count url hits **/
    downstream: lambda.IFunction;
}

export class HitCounter extends Construct {
    /** allows accessing the counter function */
    public readonly handler: lambda.Function;

    constructor(scope: Construct, id: string, props: HitCounterProps) {
        super(scope, id);

        const table = new dynamodb.Table(this, 'Hits', {
            partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING }
        });

        this.handler = new lambda.Function(this, 'HitCounterHandler', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'hitcounter.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
                HITS_TABLE_NAME: table.tableName
            }
        });
    }
}
```

* DynamoDB is created with `path` as partition key
* Lambda function bound to the code in `lambda/hitcounter.js`
* Input environment variables
* `props.downstream.funcitonName` (name of the function about to be deployed) and `table.tableName` (the name of the table about to be deployed) are values that are resolved when the stack is deployed

#### 2.3.2 HitCounter handler (Lambda function)

It will update DynamoDB with a counter and just return the response from calling a different Lambda function.
```ts
const { DynamoDB, Lambda } = require('aws-sdk');

exports.handler = async function(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  // create AWS SDK clients
  const dynamo = new DynamoDB();
  const lambda = new Lambda();

  // update dynamo entry for "path" with hits++
  await dynamo.updateItem({
    TableName: process.env.HITS_TABLE_NAME,
    Key: { path: { S: event.path } },
    UpdateExpression: 'ADD hits :incr',
    ExpressionAttributeValues: { ':incr': { N: '1' } }
  }).promise();

  // call downstream function and capture response
  const resp = await lambda.invoke({
    FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
    Payload: JSON.stringify(event)
  }).promise();

  console.log('downstream response:', JSON.stringify(resp, undefined, 2));

  // return response back to upstream caller
  return JSON.parse(resp.Payload);
};
```

#### 2.3.3 Add hit counter to the stack

We will add HitCounter to `cdk-workshop-stack.ts`.

```ts
import { HitCounter } from './hitcounter';
// ...
const helloWithCounter = new HitCounter(this, 'HelloHitCounter', {
    downstream: hello
});
// ...
new apigw.LambdaRestApi(this, 'Endpoint', {
    handler: helloWithCounter.handler
});
```

#### 2.3.4 Deploy, Test, Debug

After `cdk deploy` it will show URLs of the endpoint as the outputs.

Test lambda function:
```bash
curl -i https://<???>.execute-api.ap-southeast-2.amazonaws.com/prod/
```

We get `{"message": "Internal server error"}`.

Go to AWS Console > Find the Lambda Function CdkWorkshopStack-HelloHitCounter. Find CloudWatch logs.

We need to grant permission for the Lambda function to write to DynamoDB. Add to `hitcounter.js`:
```ts
//...
// grant the lambda role read/write permissions to our table
table.grantReadWriteData(this.handler);
```

Now it should be able to write to DynamoDB.

We need to grant permission for the Lambda function to call the other Lambda function. Add to `hitcounter.js`:
```ts
//...
// grant the lambda role invoke permissions to the downstream function
props.downstream.grantInvoke(this.handler);
```

Now redeploy and retry. You may need to wait a few minutes for the roles to update.