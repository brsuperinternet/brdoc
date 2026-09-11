import { LOCAL_STORAGE_PATH } from "../../../common/helpers";
import { EnvironmentService } from "../../environment/environment.service";
import {
  STORAGE_CONFIG_TOKEN,
  STORAGE_DRIVER_TOKEN,
} from "../constants/storage.constants";
import { AzureDriver, LocalDriver, S3Driver } from "../drivers";
import {
  AzureStorageConfig,
  LocalStorageConfig,
  S3StorageConfig,
  StorageConfig,
  StorageDriver,
  StorageOption,
} from "../interfaces";

function createStorageDriver(disk: StorageConfig): StorageDriver {
  switch (disk.driver) {
    case StorageOption.LOCAL:
      return new LocalDriver(disk.config as LocalStorageConfig);
    case StorageOption.S3:
      return new S3Driver(disk.config as S3StorageConfig);
    case StorageOption.AZURE:
      return new AzureDriver(disk.config as AzureStorageConfig);
    default:
      throw new Error("Unknown storage driver");
  }
}

export const storageDriverConfigProvider = {
  inject: [EnvironmentService],
  provide: STORAGE_CONFIG_TOKEN,
  useFactory: async (environmentService: EnvironmentService) => {
    const driver = environmentService.getStorageDriver().toLowerCase();

    switch (driver) {
      case StorageOption.LOCAL:
        return {
          config: {
            storagePath: LOCAL_STORAGE_PATH,
          },
          driver,
        };

      case StorageOption.S3: {
        const s3Config = {
          config: {
            baseUrl: environmentService.getAwsS3Url(),
            bucket: environmentService.getAwsS3Bucket(),
            credentials: undefined,
            endpoint: environmentService.getAwsS3Endpoint(),
            forcePathStyle: environmentService.getAwsS3ForcePathStyle(),
            region: environmentService.getAwsS3Region(),
          },
          driver,
        };

        /**
         * This makes use of AWS_S3_ACCESS_KEY_ID and AWS_S3_SECRET_ACCESS_KEY if present,
         * If not present, it makes it lenient for the AWS SDK to use
         * AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY if they are present in the environment
         */
        if (
          environmentService.getAwsS3AccessKeyId() ||
          environmentService.getAwsS3SecretAccessKey()
        ) {
          s3Config.config.credentials = {
            accessKeyId: environmentService.getAwsS3AccessKeyId(),
            secretAccessKey: environmentService.getAwsS3SecretAccessKey(),
          };
        }

        return s3Config;
      }

      case StorageOption.AZURE:
        return {
          config: {
            accountKey: environmentService.getAzureStorageAccountKey(),
            accountName: environmentService.getAzureStorageAccountName(),
            baseUrl: environmentService.getAzureStorageUrl() || undefined,
            container: environmentService.getAzureStorageContainer(),
            endpoint: environmentService.getAzureStorageEndpoint() || undefined,
          },
          driver,
        };

      default:
        throw new Error(`Unknown storage driver: ${driver}`);
    }
  },
};

export const storageDriverProvider = {
  inject: [STORAGE_CONFIG_TOKEN],
  provide: STORAGE_DRIVER_TOKEN,
  useFactory: (config: StorageConfig) => createStorageDriver(config),
};
