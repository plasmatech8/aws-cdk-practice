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
    - [2.4 Using Construct Libraries](#24-using-construct-libraries)
      - [2.4.1 Use CDK Dynamo table viewer](#241-use-cdk-dynamo-table-viewer)
    - [2.5 Testing Constructs](#25-testing-constructs)
      - [2.5.1 Assertion](#251-assertion)
      - [2.5.2 Validation](#252-validation)
    - [2.6. CDK Pipelines](#26-cdk-pipelines)
      - [2.6.1. Initialize pipeline stack](#261-initialize-pipeline-stack)
      - [2.6.2. Create CodeCommit repository](#262-create-codecommit-repository)
      - [2.6.2. Create a Code Pipeline](#262-create-a-code-pipeline)
      - [2.6.3. Create stage](#263-create-stage)

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

### 2.4 Using Construct Libraries

We will import a construct library called cdk-dynamo-table-viewer into our project and install it on our hit counter table.

(not intended for production use because it will expose contents of DynamoDB without authentication)

#### 2.4.1 Use CDK Dynamo table viewer

Install:
```bash
npm install cdk-dynamo-table-viewer@0.2.0
```

Add to CDK Workshop stack:
```ts
import { TableViewer } from 'cdk-dynamo-table-viewer';

// ...

new TableViewer(this, 'ViewHitCounter', {
  title: 'Hello Hits',
  table: // <table construct>
});
```

Make the HitCouter DynamoDB table a public property:
```ts
/** the hit counter table */
public readonly table: dynamodb.Table;
// ...
this.table = table;
```

Now we can view the database records in a web UI using the URL of CdkWorkshopStack.ViewHitCounterViewerEndpointCA1B1E4B.

### 2.5 Testing Constructs

We will be using the CDK `assertions` (`aws-cdk-lib/assertions`) library.

We will mostly use the `hasResourceProperties` function.
This checks whether a resource of particular type exists.

e.g.
```ts
template.hasResourceProperties('AWS::CertificateManager::Certificate', {
    DomainName: 'test.example.com',
    ShouldNotExist: Match.absent(),
    // Note: some properties omitted here
});
```

`Match.absent()` can be used to check the a particular key is undefined.

Use command: `npm run test` to run unit tests

#### 2.5.1 Assertion

We can create a stack object, create constructs on the stack,
then create a template object. The template object can be
used to analyse the details of the stack.

We can check the resource count. e.g.
```ts
import { Template, Capture } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { HitCounter }  from '../lib/hitcounter';

test('DynamoDB Table Created', () => {
  const stack = new cdk.Stack();

  // WHEN
  new HitCounter(stack, 'MyTestConstruct', {
    downstream:  new lambda.Function(stack, 'TestFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'hello.handler',
      code: lambda.Code.fromAsset('lambda')
    })
  });

  // THEN
  const template = Template.fromStack(stack);
  template.resourceCountIs("AWS::DynamoDB::Table", 1);
});
```

We can check the environment variables. e.g.
```ts
test('Lambda Has Environment Variables', () => {
  const stack = new cdk.Stack();

  // WHEN
  new HitCounter(stack, 'MyTestConstruct', {
      downstream:  new lambda.Function(stack, 'TestFunction', {
          runtime: lambda.Runtime.NODEJS_14_X,
          handler: 'hello.handler',
          code: lambda.Code.fromAsset('lambda')
      })
  });

  // THEN
  const template = Template.fromStack(stack);
  const envCapture = new Capture();
  template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: envCapture,
  });

  expect(envCapture.asObject()).toEqual(
      {
          Variables: {
              DOWNSTREAM_FUNCTION_NAME: {
                  Ref: "TestFunctionXXXXX",
              },
              HITS_TABLE_NAME: {
                  Ref: "MyTestConstructHitsXXXXX",
              },
          },
      }
  );
});
```

We can also create a test to check that our database was created with encryption. e.g.
```ts
test('DynamoDB Table Created With Encryption', () => {
    const stack = new cdk.Stack();

    // WHEN
    new HitCounter(stack, 'MyTestConstruct', {
        downstream:  new lambda.Function(stack, 'TestFunction', {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'hello.handler',
            code: lambda.Code.fromAsset('lambda')
        })
    });

    // THEN
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
            SSEEnabled: true
        }
    });
});
```

Note that the HitCounter stack will need to be fixed by configuring
`encryption: dynamodb.TableEncryption.AWS_MANAGED`
on the DynamoDB table.

#### 2.5.2 Validation

Input parameter validation is done within the constructor of a construct.

First we will add a `readCapacity?: number;` onto the HitCounter props interface,
and add `readCapacity: props.readCapacity ?? 5` to our DynamoDB table.

We will add validation to HitCounter in the constructor:
```ts
if (props.readCapacity !== undefined && (props.readCapacity < 5 || props.readCapacity > 20)) {
  throw new Error('readCapacity must be greater than 5 and less than 20');
}
```

Now we can add a unit test to expect failure:
```ts
test('read capacity can be configured', () => {
  const stack = new cdk.Stack();

  expect(() => {
    new HitCounter(stack, 'MyTestConstruct', {
      downstream:  new lambda.Function(stack, 'TestFunction', {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: 'hello.handler',
        code: lambda.Code.fromAsset('lambda')
      }),
      readCapacity: 3
    });
  }).toThrowError(/readCapacity must be greater than 5 and less than 20/);
});
```

### 2.6. CDK Pipelines

For continuous deployment using Git repository.

#### 2.6.1. Initialize pipeline stack

We will create completely seperate stack called the pipeline-stack.
```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class WorkshopPipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Pipeline code goes here
    }
}
```

And we will add this stack to `bin/cdk-workshop.ts`.
```ts
import * as cdk from 'aws-cdk-lib';
import { WorkshopPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
// new CdkWorkshopStack(app, 'CdkWorkshopStack');
new WorkshopPipelineStack(app, 'CdkWorkshopPipelineStack');
```

Note that we can only deploy one stack at a time, and we need to
either write the stack name, or comment out the stack to ignore.

#### 2.6.2. Create CodeCommit repository

We will add a codecommit repository to our pipeline stack.
```ts
// Creates a CodeCommit repository called 'WorkshopRepo'
new codecommit.Repository(this, 'WorkshopRepo', {
    repositoryName: "WorkshopRepo"
});
```

And deploy.

Then we will go to AWS Console > IAM > Users > Security credentials > HTTPS
Git Credentials.

Download the git credentialsfor the AWS CodeCommit user.

Go into the CodeCommit console and look for the repo created by CodeCommit.

Copy the HTTPS endpoint.

Note: Make sure you are in the correct region when you navigate to CodeCommit.

Create git repo with CodeCommit and push initial commit using the git credentials:
```bash
cd 01_cdkworkshop/cdk-workshop/
git init
git add -A
git commit -m "init"
git remote add origin https://git-codecommit.ap-southeast-2.amazonaws.com/v1/repos/WorkshopRepo
git push --set-upstream origin master
```

Now we can see our repository in AWS CodeCommit.

#### 2.6.2. Create a Code Pipeline

We will use the `npm install aws-cdk-lib/pipelines` package.

We will get our CodeCommit repo and pass it into the pipeline as a CodePipeline input.
```ts
// This creates a new CodeCommit repository called 'WorkshopRepo'
const repo = new codecommit.Repository(this, 'WorkshopRepo', {
    repositoryName: "WorkshopRepo"
});

// The basic pipeline declaration. This sets the initial structure
// of our pipeline
const pipeline = new CodePipeline(this, 'Pipeline', {
    pipelineName: 'WorkshopPipeline',
    synth: new CodeBuildStep('SynthStep', {
            input: CodePipelineSource.codeCommit(repo, 'master'),
            installCommands: [
                'npm install -g aws-cdk'
            ],
            commands: [
                'npm ci',
                'npm run build',
                'npx cdk synth'
            ]
        }
    )
});
```

Now we can deploy our changes and view the pipeline in the CodePipeline console.
```bash
git commit -am "Added code pipeline"
git push
npx cdk deploy
```

#### 2.6.3. Create stage

Now we have a pipeline that will automatically update itself on each ocmmit.

But now we need to add a stage to deploy the application.

We will create a `pipekine-stage.ts` class which instantiates our CdkWorkshop stack.
```ts
import { CdkWorkshopStack } from './cdk-workshop-stack';
import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class WorkshopPipelineStage extends Stage {
    constructor(scope: Construct, id: string, props?: StageProps) {
        super(scope, id, props);

        new CdkWorkshopStack(this, 'WebService');
    }
}
```

??? "the application stack as it stands now is not configured to be deployed by a pipeline"

And add it to `pipeline-stack.ts`
```ts
import {WorkshopPipelineStage} from './pipeline-stage';

const deploy = new WorkshopPipelineStage(this, 'Deploy');
const deployStage = pipeline.addStage(deploy);
```

...

The Code Pipeline stuff confuses my slightly and I do not know if we intend to use it.