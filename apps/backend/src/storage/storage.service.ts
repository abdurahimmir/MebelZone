import { CreateBucketCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';

type S3StorageConfig = {
  bucket: string;
  client: S3Client;
};

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly localRoot: string;
  private readonly s3?: S3StorageConfig;

  constructor(private readonly config: ConfigService) {
    this.localRoot = resolve(
      process.cwd(),
      this.getString('STORAGE_DIR') ?? './storage',
    );

    const endpoint = this.getString('S3_ENDPOINT');
    const region = this.getString('S3_REGION') ?? 'us-east-1';
    const bucket = this.getString('S3_BUCKET');
    const accessKeyId = this.getString('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.getString('S3_SECRET_ACCESS_KEY');
    const nodeEnv = this.getString('NODE_ENV');

    if (
      nodeEnv !== 'test' &&
      endpoint &&
      bucket &&
      accessKeyId &&
      secretAccessKey
    ) {
      this.s3 = {
        bucket,
        client: new S3Client({
          endpoint,
          region,
          forcePathStyle: true,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        }),
      };
    }
  }

  async onModuleInit() {
    if (this.s3) {
      await this.ensureBucket();
      return;
    }

    await mkdir(this.localRoot, { recursive: true });
    this.logger.log(`Local storage root: ${this.localRoot}`);
  }

  randomFilename(extension: string): string {
    const normalizedExtension = extension.startsWith('.')
      ? extension
      : `.${extension}`;
    return `${randomUUID()}${normalizedExtension}`;
  }

  async saveBytes(
    prefix: string,
    filename: string,
    buffer: Buffer,
  ): Promise<string> {
    const key = this.normalizeKey(`${prefix}/${filename}`);

    if (this.s3) {
      await this.s3.client.send(
        new PutObjectCommand({
          Bucket: this.s3.bucket,
          Key: key,
          Body: buffer,
        }),
      );
      return key;
    }

    const path = this.resolveLocalPath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, buffer);
    return key;
  }

  async createReadStreamForKey(key: string): Promise<Readable> {
    const normalizedKey = this.normalizeKey(key);

    if (this.s3) {
      const response = await this.s3.client.send(
        new GetObjectCommand({
          Bucket: this.s3.bucket,
          Key: normalizedKey,
        }),
      );
      const body = response.Body;
      if (!body) {
        throw new Error(`Storage object has no body: ${normalizedKey}`);
      }
      return this.toReadable(body);
    }

    return createReadStream(this.resolveLocalPath(normalizedKey));
  }

  private async ensureBucket() {
    if (!this.s3) return;

    try {
      await this.s3.client.send(
        new HeadBucketCommand({ Bucket: this.s3.bucket }),
      );
    } catch {
      await this.s3.client.send(
        new CreateBucketCommand({ Bucket: this.s3.bucket }),
      );
    }

    this.logger.log(`S3 storage bucket: ${this.s3.bucket}`);
  }

  private toReadable(body: unknown): Readable {
    if (body instanceof Readable) {
      return body;
    }

    const webStream = body as {
      transformToWebStream?: () => ReadableStream<Uint8Array>;
    };
    if (typeof webStream.transformToWebStream === 'function') {
      return Readable.fromWeb(
        webStream.transformToWebStream() as unknown as Parameters<
          typeof Readable.fromWeb
        >[0],
      );
    }

    const asyncBody = body as AsyncIterable<Uint8Array>;
    if (typeof asyncBody[Symbol.asyncIterator] === 'function') {
      return Readable.from(asyncBody);
    }

    throw new Error('Unsupported storage response body');
  }

  private normalizeKey(rawKey: string): string {
    const key = rawKey.replace(/\\/g, '/').replace(/^\/+/, '');
    const parts = key
      .split('/')
      .filter((part) => part.length > 0 && part !== '.' && part !== '..');
    if (parts.length === 0) {
      throw new Error('Storage key must not be empty');
    }
    return parts.join('/');
  }

  private resolveLocalPath(key: string): string {
    const path = resolve(this.localRoot, key);
    const rootPrefix = this.localRoot.endsWith(sep)
      ? this.localRoot
      : `${this.localRoot}${sep}`;

    if (path !== this.localRoot && !path.startsWith(rootPrefix)) {
      throw new Error('Storage key resolves outside storage root');
    }

    return path;
  }

  private getString(key: string): string | undefined {
    const value: unknown = this.config.get(key);
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : undefined;
  }
}
