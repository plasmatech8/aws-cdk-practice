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
  - [3. Hello CDK!](#3-hello-cdk)
    - [3.1 Create Lambda function](#31-create-lambda-function)
    - [3.2 About constructs and constructors](#32-about-constructs-and-constructors)
    - [3.3 CDK Deploy & Watch](#33-cdk-deploy--watch)

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

## 3. Hello CDK!

Let's build a stack which consists of a Lambda function with an API Gateway.

We will modify `cdk-workshop`.

### 3.1 Create Lambda function

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

### 3.2 About constructs and constructors

`CdkWorkshopStack` and `lambda.Function` have function signatures of `(scope, id, props)`
(scope/parent, id/name, properties) because these classes are **constructs**
representing "cloud components".

A construct is always created in the scope of another.

### 3.3 CDK Deploy & Watch

`cdk deploy --hotswap` is for hotswap deployment:
* Assesses whether a hotswap deployment can be made instead of a new CloudFormation deployment
* Otherwise falls back to CloudFormation deployment
* Useful for when we are not changing our infrastructure, but are just making some changes to Lambda function code
* (USE ONLY FOR DEV because it introduces CloudFormation drift)

`cdk watch` is the same as deploy with hotswap, except it runs whenever you save a file.
* You will need to remove `**/*.js` from the exclude block in `cdk.json`

Command                     | Deployment Time   | Total Time
============================|===================|============
`cdk deploy`                | 60.8s             | 67.77s
`cdk deploy --hotswap`      | 3.99s             | 11.48s
