import { beforeAll, afterAll, afterEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongo;

process.env.API_KEY = process.env.API_KEY || "test-api-key";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
process.env.EMAIL = process.env.EMAIL || "test@example.com";
process.env.PASS = process.env.PASS || "test-pass";
process.env.STRIPE_SECRET = process.env.STRIPE_SECRET || "sk_test_stub";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_stub";
process.env.DS_ACCOUNT_ID = process.env.DS_ACCOUNT_ID || "test-account";
process.env.DS_BASE_PATH = process.env.DS_BASE_PATH || "https://demo.docusign.net/restapi";
process.env.DS_INTEGRATION_KEY = process.env.DS_INTEGRATION_KEY || "test-integration";
process.env.DS_OAUTH_BASE = process.env.DS_OAUTH_BASE || "account-d.docusign.com";
process.env.DS_PRIVATE_KEY_B = process.env.DS_PRIVATE_KEY_B || "dGVzdC1rZXk=";
process.env.DS_USER_ID = process.env.DS_USER_ID || "test-user";
process.env.DS_LEASE_TEMPLATE_ID = process.env.DS_LEASE_TEMPLATE_ID || "tpl_test_lease";
process.env.DS_CONNECT_HMAC_KEY = process.env.DS_CONNECT_HMAC_KEY || "test-hmac-key";
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test";
process.env.OPENTECH_CLIENT_ID = process.env.OPENTECH_CLIENT_ID || "test-client-id";
process.env.OPENTECH_CLIENT_SECRET = process.env.OPENTECH_CLIENT_SECRET || "test-client-secret";
process.env.OPENTECH_ENV = process.env.OPENTECH_ENV || "dev";
process.env.GATE_ACCESS_CODE_LENGTH = process.env.GATE_ACCESS_CODE_LENGTH || "8";
process.env.GATE_RETRY_BACKOFF_MS = process.env.GATE_RETRY_BACKOFF_MS || "10,20,40";

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
