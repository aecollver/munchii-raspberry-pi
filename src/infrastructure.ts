import { Artifacts, BuildSpec, ComputeType, LinuxBuildImage, Project } from "@aws-cdk/aws-codebuild";
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
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            "runtime-versions": {
              nodejs: 12
            }
          },
          build: {
            commands: [
              "wget --progress=dot:mega https://downloads.raspberrypi.org/raspbian_lite_latest",
              "unzip raspbian_lite_latest",
              "mkdir pi_image",
              "mknod /dev/loop0 b 7 0",
              "mount --verbose --options offset=272629760 2019-09-26-raspbian-buster-lite.img pi_image",
              `chroot pi_image /bin/sh <<"EOF"\n${chrootCommands.join("\n")}\nEOF`,
              "umount pi_image"
            ]
          }
        },
        artifacts: {
          files: [
            "2019-09-26-raspbian-buster-lite.img"
          ]
        }
      })
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
