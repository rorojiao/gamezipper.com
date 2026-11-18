import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import nodemailer from 'nodemailer';
import wishWorker from '../worker/src/index.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const databasePath = process.env.WISH_DB_PATH || path.join(directory, 'data', 'wishes.db');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
database.pragma('busy_timeout = 5000');
const migration = fs.readFileSync(path.join(directory, '../worker/migrations/0001_create_wishes.sql'), 'utf8');
database.exec(migration);

class PreparedStatement {
  constructor(sql) {
    this.sql = sql;
    this.parameters = [];
  }
  bind(...parameters) {
    this.parameters = parameters;
    return this;
  }
  async run() {
    const result = database.prepare(this.sql).run(...this.parameters);
    return { meta: { changes: result.changes, lastInsertRowid: result.lastInsertRowid } };
  }
  async first() {
    return database.prepare(this.sql).get(...this.parameters) || null;
  }
  async all() {
    return { results: database.prepare(this.sql).all(...this.parameters) };
  }
}

class MemoryCache {
  constructor() {
    this.entries = new Map();
  }
  async match(request) {
    const entry = this.entries.get(request.url);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(request.url);
      return undefined;
    }
    return entry.response.clone();
  }
  async put(request, response) {
    if (this.entries.size >= 200) {
      const oldest = this.entries.keys().next().value;
      this.entries.delete(oldest);
    }
    this.entries.set(request.url, { expiresAt: Date.now() + 30000, response: response.clone() });
  }
}

const env = {
  ...process.env,
  DB: { prepare: sql => new PreparedStatement(sql) },
};
globalThis.caches = { default: new MemoryCache() };

function smtpConfiguration() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return { host, port, user, pass, secure: port === 465 };
}

const smtp = smtpConfiguration();
let transporter;
if (smtp) {
  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 12000,
  });
  env.WISH_EMAIL_SENDER = async message => {
    const result = await transporter.sendMail({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { id: result.messageId || '' };
  };
}

async function toRequest(nodeRequest) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeRequest.headers)) {
    if (Array.isArray(value)) value.forEach(item => headers.append(name, item));
    else if (value != null) headers.set(name, String(value));
  }
  const method = nodeRequest.method || 'GET';
  return new Request(`https://wishes.gamezipper.com${nodeRequest.url}`, {
    method,
    headers,
    body: ['GET', 'HEAD'].includes(method) ? undefined : nodeRequest,
    duplex: 'half',
  });
}

async function handleRequest(nodeRequest, nodeResponse) {
  const backgroundTasks = [];
  try {
    const request = await toRequest(nodeRequest);
    const context = { waitUntil: promise => backgroundTasks.push(promise) };
    const response = await wishWorker.fetch(request, env, context);
    const headers = Object.fromEntries(response.headers.entries());
    delete headers['set-cookie'];
    const cookies = response.headers.getSetCookie();
    if (cookies.length) nodeResponse.setHeader('Set-Cookie', cookies);
    nodeResponse.writeHead(response.status, headers);
    nodeResponse.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Node adapter error', error);
    if (!nodeResponse.headersSent) {
      nodeResponse.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    }
    nodeResponse.end(JSON.stringify({ ok: false, error: 'server_error', message: 'Something went wrong. Please try again.' }));
  } finally {
    const results = await Promise.allSettled(backgroundTasks);
    results.forEach(result => {
      if (result.status === 'rejected') console.error('Background task failed', result.reason);
    });
  }
}

const server = http.createServer(handleRequest);
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || '0.0.0.0';
server.listen(port, host, async () => {
  console.log(`GameZipper wishes listening on ${host}:${port}`);
  if (transporter && process.env.SMTP_VERIFY_ON_START !== 'false') {
    try {
      await transporter.verify();
      console.log('SMTP connection and authentication verified');
    } catch (error) {
      console.error('SMTP verification failed', error.message);
      server.close(() => database.close());
      process.exitCode = 1;
    }
  }
});

function shutdown(signal) {
  console.log(`${signal} received; closing wish service`);
  server.close(() => {
    database.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
