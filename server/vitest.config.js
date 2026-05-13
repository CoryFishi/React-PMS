import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.js"],
    testTimeout: 30000,
    hookTimeout: 60000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "controllers/**/*.js",
        "middleware/**/*.js",
        "services/**/*.js",
        "helpers/**/*.js",
        "processes/**/*.js",
      ],
      exclude: ["tests/**", "node_modules/**"],
    },
    pool: "forks",
    singleFork: true,
  },
});
