// Global test setup
// Provide env vars so modules that read them at import time don't crash
process.env.JWT_SECRET = "test-secret-for-unit-tests-only";
process.env.NODE_ENV = "test";
