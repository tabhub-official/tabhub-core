import * as createCsvWriter from 'csv-writer';
import * as admin from 'firebase-admin';
import path from 'path';

const COLLECTION_NAME = 'users';
const FIELDS = ['id', 'email', 'created_date', 'username', 'full_name'];
const DIRECTION = 'asc';

const getClient = () => {
  const firebaseSecret = {
    private_key:
      '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC5IAdeslqae1S2\ncxF7/gFqK0EEDJZ8tqK4Fgenc8v+Glf/H4fp87/PgKoFHf7yb5gbCJcsmQtzt0f9\nqWqKy68l7vRde9cc8jK9+dHTClo01W02aUlo4NyAKqnu47LQ8MlvLoxeJqy6kniT\nRjTX9NbSSCBIhSqbNLFhVThlsfgeHKF5aU2UDg5j4R+B4G+FV8+11SLKWjw82QsD\nuYyuM9V0jg04j1Y8YlkmOiWYp3yMEb0t7l0sXFs/96tHgp82Mz40LynJWFs7gOAo\nu9VWul99VyJkaB3JOCCFDJTuvOmOccyxB6UDCgwR8bwudMKvz9X8CDG7HgNOwS54\n3nlRyOj9AgMBAAECggEAPywq16nNOUI02j3SDZnUKcKw4QzanZxFUsRRwFbHmeKr\nfKfp3XAMWGbzneNqiJiEM1VvIQzo14gHzQvvC4YOMsekI/KKqZoMrr99VqMFvVnH\ndvXe0ydIl4P3kUmqT5qbYpFj3Q0djF1HQBqJFdi7Je7u9VBcBbKphSlroWhl3wAZ\nkSS61hfOMXHNUmFo69ZjwiqgjN9+HttniDMr6dQZr6XLmgI0Y5TqoI/6I/XJSAk8\n5BVkwbHQaQ0BjsJcIxtIcnZ3ncICf+pLbVFA0zF7smosTNzDC5L6eKXi+yJ5zaap\nv7uB6plE4biCavv5Qllxw0A+Vy5kpAvUAiiJDNIWEQKBgQDdWvfWAEKdrnFA+JwJ\nV+XFCmO3aGpMuuDsNcL08KKv2uGrg0Xq7sKd+HfHtV4jkiruBT5gVvAJPOAOOEdF\nSgMFldUig9z9fY/DE9lB/wSbgVzV9ukNAQ9aVytqpex2bSypnjziCxtkYhMx9liB\nWHls2OdiT5T+a7IoBcRFU15SRwKBgQDWGW0SWpNNEkt7Z0LlaGHiGGQQaGSRnZuO\nQbrWmIZBQlDn9d9wRg3TYjPMVDNDexYNO28wLB2tsUDK8Q7+1XA821qCHiGqL4hQ\nDETnREUAsz7EINXVqncvcycKrdn2fnFrthpeKk7oNrLbULeE5cCu3Tufq34T7Fkn\ntvQplZ4omwKBgEeM4A+MhfvyJymZMtbSUrMeaJ0gYzvqLEouFpaWMgAmAEwwYqlO\nBBqL9ivXtFZLKRVHHKKHd4+E3ee6yU7cXZ2wkPRXK1fE/nNQNyneBN8/MYL4DNzn\nOs843g/bElQ1dfpd69AlRvVrvkioGHO25YkJk8Fzd/XFWhEVzBuclyCBAoGAeeH9\nqu4vXzfkCruNZMYYuzsBdCnJ3u/nh4O51sL74xjasELT0bm/0y/bpx3kFS10L1I/\niSAEQUZgSWgUDlT50Vta2ipHJfhrVI63hyThV3WzbLn4oeuqcDPQ7Q5twBrZfOUt\ne6AATcgd6Ca6YwjcuW+uqsZZPwRU+Pv5YdcQM7MCgYBP/UHhr3ZFrhFYOYHJKbCF\n3UG17cy1V//bKPh2FbHWDbLAtNW6mESp2xS9c9Yr7jO7tribGZUD0jT8UTvbz647\no9kuH+nzUSXXaHDGHwWitxBCY283xqEo2e9Egdtx4uhbcHtX6eFzWLBqSsQPjD6B\nuCuvX2LL78nNBF3En6INJQ==\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-rb9pe@tabhub-io.iam.gserviceaccount.com',
    project_id: 'tabhub-io',
  };

  // Initialize firebase admin SDK
  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail: firebaseSecret.client_email,
      privateKey: firebaseSecret.private_key.replace(/\n/gm, '\n'),
      projectId: firebaseSecret.project_id,
    }),
    storageBucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
  });

  return admin.firestore();
};

async function main() {
  const client = getClient();
  const collection = client.collection(COLLECTION_NAME);

  const writer = csvWriter(path.resolve(__dirname, '../backup/tabhub-users.csv'), FIELDS);
  writer.writeRecords([]);
  const snapshots = await collection.orderBy('created_date', DIRECTION).get();
  snapshots.forEach(snapshot => {
    const data = snapshot.data();
    writer.writeRecords([data]);
  });
}

function csvWriter(file: string, fields: string[]) {
  const csvWriterInstance = createCsvWriter.createObjectCsvWriter({
    path: file,
    header: fields.map(field => ({ id: field, title: field })),
  });
  return {
    writeRecords: (data: object[]) => csvWriterInstance.writeRecords(data),
  };
}

main();
