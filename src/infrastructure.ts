import { Artifacts, ComputeType, LinuxBuildImage, Project, Source } from "@aws-cdk/aws-codebuild";
import { Bucket } from "@aws-cdk/aws-s3";
import { App, Construct, Stack, StackProps } from "@aws-cdk/core";
import "source-map-support/register";

const chrootCommands = [
  "apt-get update --assume-yes",
  "apt-get upgrade --assume-yes",
  "apt-get autoremove --assume-yes"
];

class RaspberryPiStack extends Stack {
  constructor(scope: Construct, name: string, props: StackProps) {
    super(scope, name, props);

    const artifactBucket = new Bucket(this, "ImageBucket");

    new Project(this, "RaspberryPiImage", {
      environment: {
        buildImage: LinuxBuildImage.AMAZON_LINUX_2_ARM,
        computeType: ComputeType.LARGE,
        privileged: true
      },
      artifacts: Artifacts.s3({
        bucket: artifactBucket,
        name: "munchii.zip"
      }),
      source: Source.gitHub({
        owner: "aecollver",
        repo: "munchii-raspberry-pi"
      }),
      secondarySources: [
        Source.gitHub({
          owner: "aecollver",
          repo: "munchii-daemon",
          identifier: "DAEMON"
        })
      ]
    });
  }
}

const app = new App();
new RaspberryPiStack(app, "raspberry-pi", {
  env: {
    region: "us-west-2"
  }
});
app.synth();
