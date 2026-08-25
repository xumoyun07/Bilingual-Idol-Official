# Dynamic Circle QA Findings

- Full-page desktop capture succeeded for About, Contact and Enroll; Home capture failed in the screenshot service.
- New edge circles are visible at multiple scroll-depth positions on the captured pages and remain outside the main content column.
- About and Enroll screenshot captures show blank media panels where storage-backed photos were previously expected; this needs a separate media-loading check before treating the visual result as complete.
- Contact map, address block, enquiry form and existing page composition render without visible horizontal clipping in the captured desktop pages.
- Current TypeScript and Vitest checks passed before visual capture; the dynamic circle field still requires mobile capture and an explicit count/size runtime assertion.

## Mobile capture update

Mobile full-page capture succeeded for About, Contact and Enroll. The edge circle treatment remains visible at multiple vertical positions without clipping or horizontal overflow, and the center content remains readable. Home capture failed again in the screenshot service rather than producing a page image. About media panels still appear blank in the captured preview and should be validated separately before final delivery.
