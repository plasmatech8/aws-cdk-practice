# RDS Example in AWS CDK - Complete Guide

Following Tutorial: https://bobbyhadz.com/blog/aws-cdk-rds-example

- [RDS Example in AWS CDK - Complete Guide](#rds-example-in-aws-cdk---complete-guide)
  - [1. Setup](#1-setup)
  - [2. Create VPC and EC2 instance](#2-create-vpc-and-ec2-instance)
  - [3. Create RDS Inance](#3-create-rds-inance)

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
