const path = require("node:path");
const { access, readFile } = require("node:fs/promises");
const { timingSafeEqual } = require("node:crypto");
const express = require("express");
const projects = require("./src/projects");

const app = express();
const publicDirectory = path.join(__dirname, "public");
const certificateFiles = {
  "class-x": path.join(__dirname, "private", "certificates", "class-x-result-12221369.pdf"),
  "class-xii": path.join(__dirname, "private", "certificates", "class-xii-result-2246968.pdf"),
  "scout-guide": path.join(__dirname, "private", "certificates", "scout-guide.pdf"),
  "ai-agentic": path.join(__dirname, "private", "certificates", "ai-agentic.pdf"),
  mkcl: path.join(__dirname, "private", "certificates", "mkcl.pdf"),
  astrovega: path.join(__dirname, "private", "certificates", "astrovega.pdf"),
};
const port = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error("PORT must be an integer between 0 and 65535.");
}

app.disable("x-powered-by");

app.get("/api/projects", (_request, response) => {
  response.json(projects);
});

app.post("/api/certificates/:certificateId", express.json({ limit: "1kb" }), async (request, response) => {
  const certificatePath = Object.hasOwn(certificateFiles, request.params.certificateId)
    ? certificateFiles[request.params.certificateId]
    : undefined;
  if (!certificatePath) {
    response.status(404).json({ error: "Certificate not found." });
    return;
  }

  const configuredPin = process.env.CERTIFICATE_PIN;
  if (!/^\d{4}$/.test(configuredPin ?? "")) {
    response.status(503).json({ error: "Certificate access is not configured on this server." });
    return;
  }

  const enteredPin = request.body?.pin;
  if (typeof enteredPin !== "string" || !/^\d{4}$/.test(enteredPin)) {
    response.status(400).json({ error: "Enter a four-digit PIN." });
    return;
  }

  if (!timingSafeEqual(Buffer.from(enteredPin), Buffer.from(configuredPin))) {
    response.status(401).json({ error: "The PIN is incorrect." });
    return;
  }

  let certificate;
  try {
    await access(certificatePath);
    certificate = await readFile(certificatePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    response.status(503).json({ error: "Certificate document storage is not configured on this server." });
    return;
  }

  response
    .status(200)
    .type("application/pdf")
    .set("Cache-Control", "no-store")
    .set("Content-Disposition", "inline")
    .send(certificate);
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
    ? "Request body exceeds the allowed size."
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
      process.exit(0);
    });
  }

  process.on("SIGINT", shutDown);
  process.on("SIGTERM", shutDown);
}

module.exports = app;
