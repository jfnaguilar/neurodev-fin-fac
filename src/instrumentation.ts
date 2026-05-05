export async function register() {
  // Only run in Node.js runtime (not Edge), only in server context
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { startPluggyScheduler } = await import("./workers/pluggy-scheduler");
  await startPluggyScheduler();
}
