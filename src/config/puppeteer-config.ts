import { Cluster } from 'puppeteer-cluster';

export const initPuppeteerCluster = async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
    monitor: true,
  });
  return cluster;
};
