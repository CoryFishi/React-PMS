import supertest from "supertest";

export function api(app) {
  const agent = supertest(app);
  const withKey = (method, url) =>
    agent[method](url).set("x-api-key", process.env.API_KEY);
  return {
    get: (url) => withKey("get", url),
    post: (url) => withKey("post", url),
    put: (url) => withKey("put", url),
    patch: (url) => withKey("patch", url),
    delete: (url) => withKey("delete", url),
    raw: agent,
  };
}
