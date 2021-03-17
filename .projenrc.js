const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.94.1',
  name: 'cdk-pipeline-demo',

  cdkDependencies: [
    '@aws-cdk/aws-apigatewayv2',
    '@aws-cdk/aws-apigatewayv2-integrations',
    '@aws-cdk/aws-codebuild',
    '@aws-cdk/aws-codepipeline',
    '@aws-cdk/aws-codepipeline-actions',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-events',
    '@aws-cdk/aws-glue',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-s3',
    '@aws-cdk/aws-servicediscovery',
    '@aws-cdk/aws-sns',
    '@aws-cdk/aws-ssm',
    '@aws-cdk/aws-sns-subscriptions',
    '@aws-cdk/aws-quicksight',
    '@aws-cdk/pipelines',
    '@aws-cdk/aws-lambda-nodejs',
  ],

  context: {
    '@aws-cdk/core:newStyleStackSynthesis': 'true',
  },

  // Disable all the GitHub stuff
  buildWorkflow: false,
  dependabot: false,
  mergify: false,
  pullRequestTemplate: false,
  releaseWorkflow: false,
  rebuildBot: false,
});

project.synth();
