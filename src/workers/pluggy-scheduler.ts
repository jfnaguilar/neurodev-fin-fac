import { Queue, ConnectionOptions } from "bullmq";
import { prisma } from "@/lib/prisma";
import { startPluggySyncWorker } from "./pluggy-sync-worker";

let queue: Queue | null = null;
let schedulerInterval: ReturnType<typeof setInterval> | null = null;

function buildCron(scheduledTime: string): string {
  const [h = "5", m = "0"] = scheduledTime.split(":");
  return `${m} ${h} * * *`;
}

function redisConnectionFromUrl(url: string): ConnectionOptions {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    maxRetriesPerRequest: null,
  };
}

async function scheduleAll(q: Queue) {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true, settings: true },
    });

    for (const tenant of tenants) {
      const pluggyConfig = (tenant.settings as Record<string, unknown> | null)
        ?.pluggy as Record<string, unknown> | undefined;

      if (pluggyConfig?.syncMode !== "SCHEDULED") continue;

      const scheduledTime = (pluggyConfig.scheduledTime as string) ?? "05:00";
      const jobId = `pluggy-scheduled-${tenant.id}`;

      // Upsert repeatable job — BullMQ deduplicates by jobId
      await q.upsertJobScheduler(
        jobId,
        { pattern: buildCron(scheduledTime) },
        { name: "scheduled-sync", data: { tenantId: tenant.id } }
      ).catch(async () => {
        // Fallback for older BullMQ versions without upsertJobScheduler
        await q.add("scheduled-sync", { tenantId: tenant.id }, {
          repeat: { pattern: buildCron(scheduledTime) },
          jobId,
        }).catch(() => {});
      });
    }
  } catch (err) {
    console.error("[PluggyScheduler] scheduleAll error:", err);
  }
}

export async function startPluggyScheduler() {
  if (!process.env.REDIS_URL) {
    console.warn("[PluggyScheduler] REDIS_URL not set — skipping");
    return;
  }
  if (!process.env.PLUGGY_CLIENT_ID || !process.env.PLUGGY_CLIENT_SECRET) {
    console.warn("[PluggyScheduler] Pluggy credentials not set — skipping");
    return;
  }

  const connection = redisConnectionFromUrl(process.env.REDIS_URL);

  queue = new Queue("pluggy-sync", { connection });
  startPluggySyncWorker(connection);

  await scheduleAll(queue);

  // Refresh every 15 min to pick up config changes
  schedulerInterval = setInterval(() => scheduleAll(queue!), 15 * 60 * 1000);

  console.log("[PluggyScheduler] Started");
}

export function getPluggySyncQueue(): Queue | null {
  return queue;
}
