import { defineConfig } from "drizzle-kit";

// Конфиг только для генерации полного DDL всех 42 таблиц из drizzle/schema.ts.
// DATABASE_URL не требуется. Регенерация:
//   npx drizzle-kit generate --config=drizzle-docker.config.ts
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./docker/initdb/_generated",
  dialect: "mysql",
});
