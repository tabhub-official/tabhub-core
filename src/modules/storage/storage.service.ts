import { Bucket } from '@google-cloud/storage';

export class StorageService {
  async generateSignedUrl(bucket, filename: string) {
    const options = {
      version: 'v2',
      action: 'read',
      expires: '01-11-2100',
    };

    const [url] = await bucket.file(filename).getSignedUrl(options);
    return url;
  }

  async uploadMarkdownFilePath(
    bucket: Bucket,
    prefixPath: string,
    destination: string,
    readmeData: string
  ) {
    const file = bucket.file(`${prefixPath}/${destination}`);
    await file.save(readmeData, {
      contentType: 'text/markdown',
      private: true,
      origin: process.env.GOOGLE_CLOUD_ORIGIN,
    });
  }

  async uploadImage(
    bucket: Bucket,
    prefixPath: string,
    destination: string,
    imageData: string,
    mimeType: string
  ) {
    await bucket.upload(imageData, {
      contentType: mimeType,
      destination: `${prefixPath}/${destination}`,
      gzip: true,
      private: true,
      metadata: {
        origin: process.env.GOOGLE_CLOUD_ORIGIN,
        cacheControl: 'public, max-age=31536000',
      },
    });
  }
}
