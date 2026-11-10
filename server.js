const path = require("node:path");
const { access, readFile } = require("node:fs/promises");
const { createHmac, timingSafeEqual } = require("node:crypto");
const express = require("express");
const projects = require("./src/projects");

const app = express();
const publicDirectory = path.join(__dirname, "public");
const certificateFiles = {
  "class-x": path.join(__dirname, "private", "certificates", "class-x-result-12221369.pdf"),
  "class-xii": path.join(__dirname, "private", "certificates", "class-xii-result-2246968.pdf"),
};
const certificateTokenLifetime = 120;
const port = process.env.PORT === undefined ? 3000 : Number(process.env.PORT);

if (!Number.isInteger(port) || port < 0 || port > 65535) {
  throw new Error("PORT must be an integer between 0 and 65535.");
}

app.disable("x-powered-by");

app.get("/api/projects", (_request, response) => {
  response.json(projects);
});

app.get("/api/certificates/:certificateId/document", async (request, response) => {
  const certificatePath = Object.hasOwn(certificateFiles, request.params.certificateId)
    ? certificateFiles[request.params.certificateId]
    : undefined;
  const configuredPin = process.env.CERTIFICATE_PIN;
  const tokenMatch = /^(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(request.query.token ?? "");

  if (!certificatePath || !/^\d{6}$/.test(configuredPin ?? "") || !tokenMatch) {
    response.status(404).json({ error: "Certificate not found or access expired." });
    return;
  }

  const expiresAt = Number(tokenMatch[1]);
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt < now || expiresAt > now + certificateTokenLifetime) {
    response.status(404).json({ error: "Certificate access expired." });
    return;
  }

  const payload = `${request.params.certificateId}.${expiresAt}`;
  const expectedToken = createHmac("sha256", configuredPin).update(payload).digest("base64url");
  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(tokenMatch[2]);
  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    response.status(404).json({ error: "Certificate not found or access expired." });
    return;
  }

  let certificate;
  try {
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

app.post("/api/certificates/:certificateId", express.json({ limit: "1kb" }), async (request, response) => {
  const certificatePath = Object.hasOwn(certificateFiles, request.params.certificateId)
    ? certificateFiles[request.params.certificateId]
    : undefined;
  if (!certificatePath) {
    response.status(404).json({ error: "Certificate not found." });
    return;
  }

  const configuredPin = process.env.CERTIFICATE_PIN;
  if (!/^\d{6}$/.test(configuredPin ?? "")) {
    response.status(503).json({ error: "Certificate access is not configured on this server." });
    return;
  }

  const enteredPin = request.body?.pin;
  if (typeof enteredPin !== "string" || !/^\d{6}$/.test(enteredPin)) {
    response.status(400).json({ error: "Enter a six-digit PIN." });
    return;
  }

  if (!timingSafeEqual(Buffer.from(enteredPin), Buffer.from(configuredPin))) {
    response.status(401).json({ error: "The PIN is incorrect." });
    return;
  }

  try {
    await access(certificatePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    response.status(503).json({ error: "Certificate document storage is not configured on this server." });
    return;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + certificateTokenLifetime;
  const payload = `${request.params.certificateId}.${expiresAt}`;
  const token = createHmac("sha256", configuredPin).update(payload).digest("base64url");
  response
    .status(200)
    .set("Cache-Control", "no-store")
    .json({ documentUrl: `/api/certificates/${request.params.certificateId}/document?token=${expiresAt}.${token}` });
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
