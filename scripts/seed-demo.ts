import "dotenv/config";

import { seedDemoData } from "../lib/demo-seed";

async function main() {
  const { workspaceId, userId } = await seedDemoData({ reset: true });
  console.log(`Demo seeded: workspace ${workspaceId}, user ${userId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
