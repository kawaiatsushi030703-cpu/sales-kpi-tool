import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  try {
    await client.execute(
      "ALTER TABLE Member ADD COLUMN isAdmin INTEGER NOT NULL DEFAULT 0"
    );
    console.log("✓ isAdmin カラムを追加しました");
  } catch (e: any) {
    if (e.message?.includes("duplicate column")) {
      console.log("isAdmin カラムはすでに存在します（スキップ）");
    } else {
      throw e;
    }
  }
  client.close();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
