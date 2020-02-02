import { Artifacts, ArtifactsConfig, ArtifactsProps, ComputeType, IProject, LinuxBuildImage, Project, Source } from "@aws-cdk/aws-codebuild";
import { Bucket, IBucket } from "@aws-cdk/aws-s3";
import { App, Construct, Stack, StackProps } from "@aws-cdk/core";
import "source-map-support/register";

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
      artifacts: new NameFromBuildSpec({
        bucket: artifactBucket
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

interface NameFromBuildSpecProps extends ArtifactsProps {
  bucket: IBucket
}

class NameFromBuildSpec extends Artifacts {
  public readonly type: string = "S3";

  constructor(private props: NameFromBuildSpecProps) {
    super(props);
  }

  public bind(_scope: Construct, project: IProject): ArtifactsConfig {
    this.props.bucket.grantReadWrite(project.role);

    return {
      artifactsProperty: {
        type: this.type,
        location: this.props.bucket.bucketName,
        packaging: "ZIP",
        overrideArtifactName: true,
        namespaceType: "NONE",
        name: project.projectName
      }
    };
  };
}

const app = new App();
new RaspberryPiStack(app, "raspberry-pi", {
  env: {
    region: "us-west-2"
  }
});
app.synth();
