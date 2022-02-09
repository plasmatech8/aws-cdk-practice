import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as CdkWorkshop from '../lib/cdk-workshop-stack';

test('Entire CdkWorkshopStack created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new CdkWorkshop.CdkWorkshopStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::Lambda::Function', 3)
  // - HelloHandler (custom)
  // - HelloHitCounterHitCounterHandler (custom wrapper)
  // - ViewHitCounterRendered (table viewer library)
});
