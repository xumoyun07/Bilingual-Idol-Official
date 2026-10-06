import { chromium } from "playwright";
import fs from "fs";

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    
    console.log("Navigating to http://localhost:3000 ...");
    await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded"
    });
    
    await page.waitForTimeout(4000);
    
    // 1. Audit all elements matching criteria in viewport
    const elementsData = await page.evaluate(() => {
      const results = [];
      const allElms = Array.from(document.querySelectorAll("*"));
      
      for (const el of allElms) {
        // We check the element itself
        const rect = el.getBoundingClientRect();
        const computed = window.getComputedStyle(el);
        const leftVal = rect.left;
        const widthVal = rect.width;
        const heightVal = rect.height;
        
        if (leftVal < 300 && widthVal >= 40 && widthVal <= 400 && heightVal > 1.3 * widthVal) {
          results.push({
            type: "element",
            tagName: el.tagName.toLowerCase(),
            id: el.id,
            className: el.className,
            parent: el.parentElement ? `${el.parentElement.tagName.toLowerCase()}${el.parentElement.id ? "#" + el.parentElement.id : ""}.${Array.from(el.parentElement.classList).join(".")}` : "null",
            getBoundingClientRect: {
              width: rect.width,
              height: rect.height,
              x: rect.x,
              y: rect.y
            },
            computedStyle: {
              width: computed.width,
              height: computed.height,
              "border-radius": computed.borderRadius,
              "background-image": computed.backgroundImage,
              position: computed.position,
              margin: computed.margin
            },
            styleAttr: el.getAttribute("style") || ""
          });
        }
        
        // Check pseudo-elements ::before and ::after
        for (const pseudo of ["::before", "::after"]) {
          const pseudoComputed = window.getComputedStyle(el, pseudo);
          // Wait, pseudo elements do not have getBoundingClientRect directly, but they affect computed size
          // We can parse computed size from pseudoComputed
          const pWidthStr = pseudoComputed.width;
          const pHeightStr = pseudoComputed.height;
          const pPosition = pseudoComputed.position;
          const pLeftStr = pseudoComputed.left;
          
          if (pWidthStr && pHeightStr && pWidthStr !== "auto" && pHeightStr !== "auto") {
            const w = parseFloat(pWidthStr);
            const h = parseFloat(pHeightStr);
            if (w >= 40 && w <= 400 && h > 1.3 * w) {
              results.push({
                type: `pseudo-${pseudo}`,
                tagName: el.tagName.toLowerCase(),
                id: el.id,
                className: el.className,
                parent: el.parentElement ? `${el.parentElement.tagName.toLowerCase()}` : "null",
                computedStyle: {
                  width: pseudoComputed.width,
                  height: pseudoComputed.height,
                  "border-radius": pseudoComputed.borderRadius,
                  "background-image": pseudoComputed.backgroundImage,
                  position: pseudoComputed.position,
                  margin: pseudoComputed.margin,
                  left: pseudoComputed.left,
                  top: pseudoComputed.top
                }
              });
            }
          }
        }
      }
      return results;
    });
    
    // 2. Audit the 5th and 6th div children inside .simple-public-shell
    const shellDivChildren = await page.evaluate(() => {
      const shell = document.querySelector(".simple-public-shell");
      if (!shell) return "simple-public-shell not found";
      
      const children = Array.from(shell.children);
      const allDivChildren = Array.from(shell.querySelectorAll(":scope > div"));
      
      const childrenList = children.map((c, idx) => {
        return {
          index: idx + 1,
          tagName: c.tagName.toLowerCase(),
          id: c.id,
          className: c.className
        };
      });
      
      const divChildrenList = allDivChildren.map((d, idx) => {
        return {
          divIndex: idx + 1,
          tagName: d.tagName.toLowerCase(),
          id: d.id,
          className: d.className
        };
      });
      
      return {
        allDirectChildren: childrenList,
        directDivChildren: divChildrenList
      };
    });
    
    const output = {
      matchingElements: elementsData,
      shellAudit: shellDivChildren
    };
    
    fs.writeFileSync("audit_results.json", JSON.stringify(output, null, 2), "utf-8");
    console.log("SUCCESS");
  } catch (err) {
    console.error("Execution failed:", err);
  } finally {
    if (browser) await browser.close();
  }
})();
