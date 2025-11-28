const getStack = (app) =>
  app.router?.stack || app._router?.stack || app.stack || [];

const matchPattern = (pattern, actual) => {
  const pParts = pattern.replace(/^\/+/, "").split("/").filter(Boolean);
  const aParts = actual.replace(/^\/+/, "").split("/").filter(Boolean);
  if (pParts.length !== aParts.length) return null;
  const params = {};
  for (let i = 0; i < pParts.length; i++) {
    const p = pParts[i];
    const a = aParts[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = a;
    } else if (p !== a) {
      return null;
    }
  }
  return params;
};

const findRoute = (container, method, path, baseParams = {}) => {
  const stack = getStack(container);
  for (const layer of stack) {
    const matchFn = layer.matchers?.[0];
    const matchResult = matchFn ? matchFn(path) : { path: "" };
    if (matchResult === false) continue;
    const matchedPath = matchResult?.path || "";
    const accumulatedParams = { ...baseParams, ...(matchResult?.params || {}) };
    const remainingPath =
      matchedPath && path.startsWith(matchedPath)
        ? path.slice(matchedPath.length) || "/"
        : path;

    // Direct route (method layer lives inside layer.route.stack)
    if (layer.route) {
      const route = layer.route;
      const routeStack = route.stack || [];
      const candidates = [remainingPath, path];
      for (const candidate of candidates) {
        const paramsMatch = matchPattern(route.path || "", candidate);
        if (!paramsMatch) continue;
        const params = { ...accumulatedParams, ...paramsMatch };
        const handlers = routeStack
          .filter((s) => !s.method || s.method === method.toLowerCase())
          .map((s) => s.handle || s.handle_request || s);
        return { handlers, params };
      }
    }

    // Nested router
    if (layer.handle?.stack) {
      try {
        const nested = findRoute(
          layer.handle,
          method,
          remainingPath,
          accumulatedParams
        );
        if (nested) return nested;
      } catch (err) {
        // keep searching other routes
      }
    }
  }
  throw new Error(`Route ${method.toUpperCase()} ${path} not found`);
};

const createRes = () => {
  const res = {
    statusCode: 200,
    body: undefined,
    finished: false,
    headers: {},
    headersSent: false,
  };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.setHeader = (key, value) => {
    res.headers[key.toLowerCase()] = value;
    return res;
  };
  res.getHeader = (key) => res.headers[key.toLowerCase()];
  res.json = (payload) => {
    res.body = payload;
    res.finished = true;
    res.headersSent = true;
    return res;
  };
  res.send = (payload) => {
    res.body = payload;
    res.finished = true;
    res.headersSent = true;
    return res;
  };
  res.end = (payload) => {
    res.body = payload;
    res.finished = true;
    res.headersSent = true;
    return res;
  };
  return res;
};

const runHandlers = async (handlers, req, res) => {
  for (const handler of handlers) {
    await new Promise((resolve, reject) => {
      try {
        const maybe = handler(req, res, (err) =>
          err ? reject(err) : resolve()
        );
        if (maybe && typeof maybe.then === "function") {
          maybe.then(resolve).catch(reject);
        } else if (handler.length < 3) {
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    });
    if (res.finished) return;
  }
};

function buildRequest(app, method, path) {
  let body = {};
  let query = {};
  let headers = {};
  const execute = async () => {
    const { handlers, params } = findRoute(app, method, path);
    const req = {
      body,
      params,
      query,
      method: method.toUpperCase(),
      path,
      url: path,
      headers,
    };
    const res = createRes();
    await runHandlers(handlers, req, res);
    return {
      status: res.statusCode,
      statusCode: res.statusCode,
      body: res.body,
      headers: res.headers,
      text: typeof res.body === "string" ? res.body : undefined,
    };
  };

  const builder = {
    send(payload) {
      body = payload || {};
      return this;
    },
    query(payload) {
      query = payload || {};
      return this;
    },
    set(key, value) {
      if (typeof key === "object") {
        headers = { ...headers, ...key };
      } else if (key) {
        headers[key.toLowerCase()] = value;
      }
      return this;
    },
    then(resolve, reject) {
      return execute().then(resolve, reject);
    },
    catch(reject) {
      return execute().catch(reject);
    },
    [Symbol.asyncIterator]: undefined,
  };
  return builder;
}

module.exports = function request(app) {
  return {
    get: (path) => buildRequest(app, "get", path),
    post: (path) => buildRequest(app, "post", path),
    put: (path) => buildRequest(app, "put", path),
    delete: (path) => buildRequest(app, "delete", path),
  };
};
