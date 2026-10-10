// Запускает доказательство шторки дважды: admin-фикстура и student-фикстура.
// process.env выставляется здесь, поэтому shell-синтаксис не нужен.
import { spawnSync } from "node:child_process";

const roles = ["admin", "student"];
let failed = false;
for (const role of roles) {
  console.log("\n=================== SHEET_ROLE=" + role + " ===================");
  const result = spawnSync("npx", ["tsx", "e2e/sheet-proof.ts"], {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, SHEET_ROLE: role },
  });
  if (result.status !== 0) { console.log("роль " + role + ": код выхода " + result.status); failed = true; }
}
process.exit(failed ? 1 : 0);