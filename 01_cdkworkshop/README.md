# CDK Workshop

Following:
* https://cdkworkshop.com/

Contents:
- [CDK Workshop](#cdk-workshop)
  - [01. Prerequisites](#01-prerequisites)
    - [Account Setup](#account-setup)
    - [NodeJS Setup](#nodejs-setup)
    - [Python Setup](#python-setup)
  - [02. TypeScript Workshop](#02-typescript-workshop)
    - [Initialize Project](#initialize-project)
    - [Project Structure](#project-structure)
      - [Entry Point](#entry-point)
      - [Main Stack Definition](#main-stack-definition)
      - [CDK Config](#cdk-config)

## 01. Prerequisites

### Account Setup

You need the AWS CLI to be installed.

You need to create an IAM user
* Credential type: `Access key - Programmatic access`
* Permissions: `Attach existing policies directly, AdministratorAccess`

Take note of your Secret Access Key.

Now configure credentials.
* `aws configure`

Input access key ID and and secret access key. Leave region and output format blank.

### NodeJS Setup

You need NodeJS to be installed.

Install the AWS NPM module: `npm install -g aws-cdk`

Now you will have the cdk command available: `cdk --version`

### Python Setup

You need Python to be installed.

## 02. TypeScript Workshop

### Initialize Project

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

### Project Structure

#### Entry Point

`bin/cdk-workshop.ts` = entrypoint for CDK application which loads the stack

Creating a stack is as simple as instantiating a Stack
and passing in the App object.

#### Main Stack Definition

`lib/cdk-workshop-stack.ts` = application stack is defined

The application with all of the SDS, SNS, EC2, etc instances
are defined, created, and tied together.

#### CDK Config

`cdk.json` = tells toolkit how to run the app (in this case `npx ts-node bin/cdk-workshop.ts`)
