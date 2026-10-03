const path = require("node:path");
const express = require("express");
const { closeDatabase, getProjects } = require("./src/database");

const app = express();
const publicDirectory = path.join(__dirname, "public");
const port = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error("PORT must be an integer between 0 and 65535.");
}

app.disable("x-powered-by");

app.get("/api/projects", async (_request, response) => {
  response.json(await getProjects());
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API endpoint not found." });
});

app.use(
  "/vendor/three",
  express.static(path.join(__dirname, "node_modules", "three", "build")),
);
app.use(express.static(publicDirectory));

app.use(["/assets", "/css", "/js", "/vendor"], (_request, response) => {
  response.status(404).json({ error: "Requested asset was not found." });
});

app.get("*splat", (request, response, next) => {
  if (path.extname(request.path)) return next();
  response.sendFile(path.join(publicDirectory, "index.html"));
});

app.use((error, _request, response, _next) => {
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;

  if (status >= 500) console.error(error);
  const message = status === 413
    ? "Request body exceeds the 12kb limit."
    : status < 500
      ? "Request body is invalid."
      : "An unexpected server error occurred.";
  response.status(status).json({ error: message });
});

if (require.main === module && !process.env.VERCEL) {
  const server = app.listen(port, () => {
    const address = server.address();
    const listeningPort = typeof address === "object" && address ? address.port : port;
    console.log(`Portfolio available at http://localhost:${listeningPort}`);
  });

  function shutDown() {
    server.close(() => {
      closeDatabase()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error("Failed to close the project database cleanly.", error);
          process.exitCode = 1;
        });
    });
  }

  process.on("SIGINT", shutDown);
  process.on("SIGTERM", shutDown);
}

module.exports = app;
