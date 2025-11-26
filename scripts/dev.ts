import { spawn } from "bun";

// Run frontend and Convex dev server in parallel
console.log("🚀 Starting Campaignion development servers...\n");

const frontend = spawn({
  cmd: ["bunx", "--bun", "vite"],
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

const convex = spawn({
  cmd: ["bunx", "convex", "dev"],
  stdout: "inherit",
  stderr: "inherit",
  stdin: "inherit",
});

// Wait for both processes
await Promise.all([frontend.exited, convex.exited]);

