/**
 * Removes `.next` before `next build` to avoid flaky ENOENT errors during
 * collect-build-traces (stale/partial output from interrupted or overlapping builds).
 */
const fs = require("fs");
const path = require("path");

const nextDir = path.join(__dirname, "..", ".next");
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
}
