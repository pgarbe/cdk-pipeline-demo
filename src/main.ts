import * as cdk from '@aws-cdk/core';
import { PipelineStack } from './pipeline-stack';


// for development, use account/region from cdk cli
const env = {
  account: '424144556073',
  region: 'eu-west-1',
};

const app = new cdk.App();
new PipelineStack(app, 'my-stack-dev', { env });

app.synth();