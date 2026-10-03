"use strict";

const config = require("./src/config");
const { init } = require("./src/db");
const app = require("./src/app");

init();

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`
  ┌─────────────────────────────────────────────────────┐
  │  THE PERSONAL COMPUTER — server running               
  │  http://localhost:${config.port}                                
  │  env: ${config.env}                                            
  └─────────────────────────────────────────────────────┘
  `);
  if (config.env !== "production") {
    // eslint-disable-next-line no-console
    console.log("  Run `npm run seed` first if you haven't yet — the site needs content to show.\n");
  }
});

function shutdown(signal) {
  // eslint-disable-next-line no-console
  console.log(`\n[server] ${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
