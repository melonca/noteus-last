module.exports = {
  apps : [{
    name   : "noteus",
    script : "./server.js",
    max_restarts: 8000000,
    max_memory_restart: "150M"
  }]
}
