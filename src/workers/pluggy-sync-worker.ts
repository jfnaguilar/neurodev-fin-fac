import { Worker, Job, ConnectionOptions } from "bullmq";
import { prisma } from "@/lib/prisma";
import { getItem, getAccounts, getTransactions } from "@/lib/pluggy";
import { format, subDays } from "date-fns";

export interface PluggySyncJobData {
  tenantId: string;
  connectionId?: string;
}

let worker: Worker | null = null;

export function startPluggySyncWorker(connection: ConnectionOptions) {
  if (worker) return worker;

  worker = new Worker<PluggySyncJobData>(
    "pluggy-sync",
    async (job: Job<PluggySyncJobData>) => {
      const { tenantId, connectionId } = job.data;

      const connections = await prisma.pluggyConnection.findMany({
        where: connectionId ? { id: connectionId, tenantId } : { tenantId },
      });

      const to = format(new Date(), "yyyy-MM-dd");
      const from = format(subDays(new Date(), 1), "yyyy-MM-dd");

      for (const conn of connections) {
        try {
          const item = await getItem(conn.itemId);

          await prisma.pluggyConnection.update({
            where: { id: conn.id },
            data: { status: item.status, error: item.error?.message ?? null, lastSync: new Date() },
          });

          if (item.status !== "UPDATED" && item.status !== "UPDATING") continue;

          const accounts = await getAccounts(conn.itemId);
          await Promise.all(
            accounts.map((acc) =>
              prisma.pluggyAccount.upsert({
                where: { pluggyId: acc.id },
                create: {
                  connectionId: conn.id,
                  tenantId,
                  pluggyId: acc.id,
                  name: acc.name,
                  number: acc.number ?? null,
                  bankData: (acc.bankData as object) ?? {},
                  type: acc.type,
                  subtype: acc.subtype ?? null,
                  currencyCode: acc.currencyCode ?? "BRL",
                  balance: acc.balance,
                  syncedAt: new Date(),
                },
                update: {
                  balance: acc.balance,
                  bankData: (acc.bankData as object) ?? {},
                  syncedAt: new Date(),
                },
              })
            )
          );

          const savedAccounts = await prisma.pluggyAccount.findMany({
            where: { connectionId: conn.id },
          });

          for (const acc of savedAccounts) {
            const transactions = await getTransactions(acc.pluggyId, from, to);
            for (const tx of transactions) {
              await prisma.pluggyTransaction.upsert({
                where: { pluggyId: tx.id },
                create: {
                  accountId: acc.id,
                  tenantId,
                  pluggyId: tx.id,
                  date: new Date(tx.date),
                  description: tx.description,
                  amount: tx.amount,
                  type: tx.type,
                  category: tx.category ?? null,
                },
                update: {
                  description: tx.description,
                  amount: tx.amount,
                  category: tx.category ?? null,
                },
              });
            }
          }
        } catch (err) {
          console.error(`[PluggySyncWorker] Error on connection ${conn.id}:`, err);
        }
      }
    },
    { connection, concurrency: 3 }
  );

  worker.on("completed", (job) => {
    console.log(`[PluggySyncWorker] Job ${job.id} done — tenant ${job.data.tenantId}`);
  });
  worker.on("failed", (job, err) => {
    console.error(`[PluggySyncWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
