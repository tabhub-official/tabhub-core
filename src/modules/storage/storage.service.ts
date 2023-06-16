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
    bucket,
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
}
