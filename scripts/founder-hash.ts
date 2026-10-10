/**
 * npm run founder:hash
 *
 * Запрашивает пароль основателя на stdin БЕЗ ЭХА (не через argv — пароль
 * не попадает ни в историю команд, ни в список процессов) и печатает
 * только готовый хеш для переменной окружения FOUNDER_PASSWORD_HASH.
 *
 * Сам пароль никуда не выводится, не пишется в файл и не сохраняется.
 * Алгоритм — тот же, что проверяет вход: scrypt, 64-байтовый дайджест,
 * формат значения "scrypt:<salt>:<hex>".
 */
import { randomBytes, scryptSync } from "node:crypto";

const MIN_LENGTH = 12;

function promptHiddenTty(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(prompt);

    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let buffer = "";
    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(wasRaw);
          stdin.pause();
          stdin.removeListener("data", onData);
          process.stdout.write("\n");
          resolve(buffer);
          return;
        }
        if (char === "\u0003") {
          // Ctrl+C
          stdin.setRawMode(wasRaw);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") {
          buffer = buffer.slice(0, -1);
          continue;
        }
        buffer += char;
      }
    };
    stdin.on("data", onData);
  });
}

/**
 * Не-TTY (пайп, редирект): читаем stdin целиком и разбираем на строки.
 * Построчный стриминг здесь не нужен и легко теряет символы, поэтому
 * весь ввод буферизуется до первого запроса.
 */
let pipedLines: string[] | null = null;

async function ensurePipedLines(): Promise<string[]> {
  if (pipedLines) return pipedLines;
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  const text = Buffer.concat(chunks).toString("utf8");
  pipedLines = text.split(/\r?\n/);
  // Windows-пайпы (в частности PowerShell) могут дописать BOM в начало
  // первой строки. Без зачистки первый и второй ввод считались бы разными.
  if (pipedLines.length > 0 && pipedLines[0].charCodeAt(0) === 0xfeff) {
    pipedLines[0] = pipedLines[0].slice(1);
  }
  // Последний пустой элемент от завершающего перевода строки не нужен.
  if (pipedLines.length > 1 && pipedLines[pipedLines.length - 1] === "") pipedLines.pop();
  return pipedLines;
}

async function promptHidden(prompt: string): Promise<string> {
  if (process.stdin.isTTY) return promptHiddenTty(prompt);
  const lines = await ensurePipedLines();
  process.stdout.write(prompt);
  return lines.shift() ?? "";
}

async function main() {
  console.log("Генерация хеша пароля основателя.\n");

  const first = await promptHidden("Пароль: ");
  if (first.length < MIN_LENGTH) {
    console.error(`\nПароль короче ${MIN_LENGTH} символов — отклонён. Значение не сохранено.`);
    process.exit(1);
  }

  const second = await promptHidden("Повторите пароль: ");
  if (first !== second) {
    console.error("\nПароли не совпали — отклонено. Значение не сохранено.");
    process.exit(1);
  }

  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(first, salt, 64).toString("hex");
  const value = `scrypt:${salt}:${digest}`;

  console.log(`\nДлина пароля: ${first.length} символов (сам пароль не выводится).\n`);
  console.log("Добавьте в .env строку:\n");
  console.log(`FOUNDER_PASSWORD_HASH='${value}'`);
  console.log(
    "\nЗначение обёрнуто в ОДИНАРНЫЕ кавычки намеренно: если в нём встретится $ " +
      "(или другой спецсимвол), dotenv иначе попытается подставить переменную и значение будет испорчено."
  );
  console.log("\nПароль нигде не сохранён. Храните его в менеджере секретов.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Ошибка генерации хеша:", (error as Error).message);
  process.exit(1);
});
