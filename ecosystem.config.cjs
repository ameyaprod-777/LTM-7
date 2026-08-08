/** PM2 — même modèle que ameyawebsite / lemoonkey */
module.exports = {
  apps: [
    {
      name: "louetonmatos",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "800M",
      env: {
        NODE_ENV: "production",
        PORT: 3007,
      },
    },
  ],
};
