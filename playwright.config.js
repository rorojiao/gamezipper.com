const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  use: { headless: true },
});
