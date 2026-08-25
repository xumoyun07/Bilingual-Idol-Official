import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const cases = [
  { name: "desktop", width: 1440, height: 900, expectedContent: { width: 723, height: 675 } },
  { name: "mobile", width: 390, height: 844, expectedContent: { width: null, height: null } },
];
const results = [];

for (const testCase of cases) {
  const page = await browser.newPage({ viewport: { width: testCase.width, height: testCase.height } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  const measurement = await page.evaluate(() => {
    const hero = document.querySelector(".simple-home-intro");
    const content = document.querySelector(".simple-home-intro-content");
    const spheres = getComputedStyle(document.querySelector(".simple-public-shell") || document.body, "::before");
    const rect = element => element ? element.getBoundingClientRect() : null;
    const contentStyle = content ? getComputedStyle(content) : null;
    return { viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, hero: rect(hero), content: rect(content), contentComputedWidth: contentStyle?.width, contentComputedHeight: contentStyle?.height, contentBoxSizing: contentStyle?.boxSizing, sphereLayerPosition: spheres.position, sphereLayerBackground: spheres.backgroundImage };
  });
  if (!measurement.hero || !measurement.content) throw new Error(`${testCase.name}: Home Hero elements missing`);
  if (measurement.documentWidth > testCase.width) throw new Error(`${testCase.name}: horizontal overflow ${measurement.documentWidth - testCase.width}px`);
  if (testCase.expectedContent.width !== null && Math.abs(measurement.content.width - testCase.expectedContent.width) > 5) throw new Error(`${testCase.name}: content width mismatch ${measurement.content.width}`);
  if (testCase.expectedContent.height !== null && Math.abs(measurement.content.height - testCase.expectedContent.height) > 5) throw new Error(`${testCase.name}: content height mismatch ${measurement.content.height}`);
  if (measurement.sphereLayerPosition !== "absolute") throw new Error(`${testCase.name}: sphere layer is not full-document absolute`);
  if (!measurement.sphereLayerBackground.includes("radial-gradient")) throw new Error(`${testCase.name}: sphere layer has no radial gradients`);
  results.push({ name: testCase.name, status: "passed", measurement });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(results, null, 2));
