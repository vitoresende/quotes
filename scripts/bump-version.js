import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.resolve(__dirname, "../package.json");

try {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const currentVersion = pkg.version || "1.0.0";
  const parts = currentVersion.split(".").map((num) => parseInt(num, 10));

  if (parts.length === 3 && parts.every((n) => !isNaN(n))) {
    parts[2] += 1;
  } else {
    parts[0] = parts[0] || 1;
    parts[1] = parts[1] || 0;
    parts[2] = (parts[2] || 0) + 1;
  }

  const newVersion = parts.join(".");
  pkg.version = newVersion;

  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  console.log(`🚀 Version bumped from ${currentVersion} to ${newVersion} in package.json`);
} catch (error) {
  console.error("Failed to bump version:", error);
  process.exit(1);
}
