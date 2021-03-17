import '@aws-cdk/assert/jest';
import { App } from '@aws-cdk/core';
import { InfrastructureStack } from '../src/infrastructure-stack';

test('Snapshot', () => {
  const app = new App();
  const stack = new InfrastructureStack(app, 'test');

  expect(stack).not.toHaveResource('AWS::S3::Bucket');
});