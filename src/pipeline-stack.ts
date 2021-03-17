import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as cdk from '@aws-cdk/core';
import * as pipelines from '@aws-cdk/pipelines';
import { InfrastructureStack } from './infrastructure-stack';

export class Application extends cdk.Stage {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    new InfrastructureStack(this, 'infra');
  }
}
export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);

    const sourceArtifact = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub',
      output: sourceArtifact,
      oauthToken: cdk.SecretValue.secretsManager('GitHubToken'),
      owner: 'pgarbe',
      repo: 'cdk-pipeline-demo',
      branch: 'main',
    });

    const cloudAssemblyArtifact = new codepipeline.Artifact();
    const synthAction = pipelines.SimpleSynthAction.standardYarnSynth({
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0, // latest build images which improves speed
      },
      sourceArtifact,
      cloudAssemblyArtifact,
      buildCommand: 'yarn build',
    });

    const pipeline = new pipelines.CdkPipeline(this, 'Pipeline', {
      cloudAssemblyArtifact,
      sourceAction,
      synthAction,
      crossAccountKeys: false, // save money if you don't do x-account deployments
    });

    // Do this as many times as necessary with any account and region
    // Account and region may different from the pipeline's.
    pipeline.addApplicationStage(new Application(this, 'prod', { env: { region: 'eu-west-1' } }));
  }
}
