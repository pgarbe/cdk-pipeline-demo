import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as cdk from '@aws-cdk/core';
import * as pipelines from '@aws-cdk/pipelines';
import { InfrastructureStack } from './infrastructure-stack';

export class Application extends cdk.Stage {

  public readonly apiUrl: cdk.CfnOutput;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    const infraStack = new InfrastructureStack(this, 'infra');
    this.apiUrl = infraStack.apiUrl;
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

    // pipeline.addApplicationStage(new Application(this, 'prod', { env: { region: 'eu-west-1' } }));

    const app = new Application(this, 'prod', { env: { region: 'eu-west-1' } });
    const appStage = pipeline.addApplicationStage(app);

    appStage.addActions(new pipelines.ShellScriptAction({
      actionName: 'SimpleValidation',
      commands: ['curl -Ssf $URL'],
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
      },
      useOutputs: {
        URL: pipeline.stackOutput(app.apiUrl),
      },
    }));
  }
}
