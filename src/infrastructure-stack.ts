import * as apiv2 from '@aws-cdk/aws-apigatewayv2';
import * as apiv2int from '@aws-cdk/aws-apigatewayv2-integrations';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';


export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);

    // Fargate and CloudMap needs to be setup in a VPC
    const vpc = this.getVpc(this);

    // CloudMap Namespace
    const namespace = new servicediscovery.PrivateDnsNamespace(this, 'Namespace', {
      name: 'cdk.dev',
      vpc,
    });

    // Fargate Service (a simple nginx container)
    const taskDefinition = new ecs.TaskDefinition(this, 'taskdef', {
      compatibility: ecs.Compatibility.FARGATE,
      memoryMiB: '512',
      cpu: '256',
    });
    const containerDef = taskDefinition.addContainer('nginx', {
      image: ecs.RepositoryImage.fromRegistry('public.ecr.aws/nginx/nginx:latest'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'fargateway' }),
      healthCheck: {
        command: ['curl --fail http://localhost || exit 1'],
      },
    });
    containerDef.addPortMappings({ containerPort: 80 });

    const cluster = new ecs.Cluster(this, 'cluster', { vpc });
    const fargateService = new ecs.FargateService(this, 'fargateway', {
      taskDefinition,
      cluster,
      cloudMapOptions: {
        cloudMapNamespace: namespace,
        dnsRecordType: servicediscovery.DnsRecordType.SRV,
        name: 'fargateway',
      },
    });

    // Http Api Gateway with default integration (routes all traffic to the Fargate service)
    const apiSecurityGroup = new ec2.SecurityGroup(this, 'api', { vpc });
    const vpcLink = new apiv2.VpcLink(this, 'VpcLink', {
      vpc,
      securityGroups: [apiSecurityGroup],
    });

    const fargatePort = new ec2.Port({ protocol: ec2.Protocol.TCP, fromPort: 80, toPort: 80, stringRepresentation: 'API to Fargate' });
    fargateService.connections.allowFrom(apiSecurityGroup, fargatePort);

    const defaultIntegration = new apiv2int.HttpServiceDiscoveryIntegration({
      vpcLink,
      service: fargateService.cloudMapService!,
    });

    // Connect it to "api"
    const api = new apiv2.HttpApi(this, 'fargateapi', {
      defaultIntegration,
    });

    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: api.url ?? 'Something went wrong with the deploy',
    });
  }

  getVpc(scope: cdk.Construct): ec2.IVpc {
    return ec2.Vpc.fromVpcAttributes(scope, 'vpc', {
      vpcId: cdk.Fn.importValue('vpc-VPC'),
      availabilityZones: ['eu-west-1a', 'eu-west-1b'],
      isolatedSubnetIds: [],
      isolatedSubnetRouteTableIds: [],
      privateSubnetIds: [
        cdk.Fn.importValue('vpc-SubnetAPrivate'),
        cdk.Fn.importValue('vpc-SubnetBPrivate'),
      ],
      privateSubnetRouteTableIds: [
        cdk.Fn.importValue('vpc-RouteTableAPrivate'),
        cdk.Fn.importValue('vpc-RouteTableBPrivate'),
      ],
      publicSubnetIds: [
        cdk.Fn.importValue('vpc-SubnetAPublic'),
        cdk.Fn.importValue('vpc-SubnetBPublic'),
      ],
      publicSubnetRouteTableIds: [
        cdk.Fn.importValue('vpc-RouteTableAPublic'),
        cdk.Fn.importValue('vpc-RouteTableBPublic'),
      ],
    });
  }
}

