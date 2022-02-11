# RDS Example in AWS CDK - Complete Guide

Following Tutorial: https://bobbyhadz.com/blog/aws-cdk-rds-example

- [RDS Example in AWS CDK - Complete Guide](#rds-example-in-aws-cdk---complete-guide)
  - [1. Setup](#1-setup)
  - [2. Create VPC and EC2 instance](#2-create-vpc-and-ec2-instance)
  - [3. Create RDS Inance](#3-create-rds-inance)
  - [3. Connecting to RDS](#3-connecting-to-rds)
  - [4. Cleanup](#4-cleanup)

## 1. Setup

```bash
cdk init app --language=typescript
```

## 2. Create VPC and EC2 instance

In AWS Console:
* **Create an EC2 Key Pair** called 'ec2-key-pair' so we can connect to our EC2 instance - EC2 > Key Pairs > Create key Pair

In `rds_example-stack.ts`:
* **Create a VPC** called 'my-cdk-vpc' with public and private subnet
* **Create Security Group** called 'ec2-instance-sg' to allow SSH from anywhere
* **Create EC2 Instance** called 'ec2-instance' in the VPC public subnet

## 3. Create RDS Inance

In `rds_example-stack.ts`:
* **Create RDS Instance** called 'db-instance' in the VPC private subnet
* **Create CloudFormation Output** of the database endpoint and secret name

We wish, we can put outputs into a file using command: `npx cdk deploy  --outputs-file ./cdk-outputs.json`

If we look at the security group for the RDS instance,
we can see that port 5432 is allowed from the security group
of our EC2 instance. This is because we added:
```ts
dbInstance.connections.allowFrom(ec2Instance, ec2.Port.tcp(5432));
```

Now we need to get the secret to connect to the database. Either use the AWS Console (Secrets Manager > (Select Database))
or use the AWS command using the secret-name from CloudFormation outputs:
```bash
aws secretsmanager get-secret-value --secret-id <SECRET-NAME> --output yaml
```

Take note of the outputs.

## 3. Connecting to RDS

SSH into EC2:
```bash
chmod 400 ec2-key-pair.pem
ssh -i "ec2-key-pair.pem" \
  ec2-user@<YOUR_EC2_PUBLIC_IPV4_ADDRESS>
```

Install postgres client:
```bash
sudo amazon-linux-extras install epel -y
sudo yum install postgresql postgresql-server -y
```

Connect to the RDS database (we can use dbEndpoint from outputs):
```bash
psql -p 5432 -h rdp520nopb360t.cm9pnmgmvami.ap-southeast-2.rds.amazonaws.com -U postgres
```

Enter the database password noted above.

Now we can manage the database:
```
# 👇 list tables
\l

# 👇 print current database
SELECT current_database();

# 👇 connect to todosdb
\c todosdb

# 👇 Create table and insert rows
CREATE TABLE IF NOT EXISTS todos (todoid SERIAL PRIMARY KEY, text TEXT NOT NULL);
INSERT INTO todos (text) VALUES ('Walk the dog');
INSERT INTO todos (text) VALUES ('Buy groceries');

# 👇 select rows
SELECT * FROM todos;
```

## 4. Cleanup

```bash
cdk destroy
```