// Stub for optional peers (e.g. @opentelemetry/api) that the bundled SDK code
// references at the top level but never actually invokes at runtime. Returning
// an empty object satisfies the import without pulling in the real package.
module.exports = {};
