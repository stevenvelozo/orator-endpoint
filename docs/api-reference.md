# API Reference

> **Source note.** This checkout of `orator-endpoint` does not include the `source/` directory, so this reference is reconstructed from the package metadata (`main` -> `source/Orator-Endpoint-Base.js`), the endpoint authoring pattern used across the Retold ecosystem, and the way sibling code consumes that pattern. Items that cannot be confirmed without the source are flagged explicitly. Treat signatures as the demonstrated shape, not a guaranteed contract; verify against `source/Orator-Endpoint-Base.js` where exactness matters.

## Class: Orator-Endpoint-Base

The package `main` is `source/Orator-Endpoint-Base.js`. The class extends `fable-serviceproviderbase`, so an endpoint is a Fable service provider: handlers reach other services, logging, and configuration through `this.fable`.

### Constructor

```javascript
new EndpointSubclass(pFable, pOptions, pServiceHash)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `pFable` | object | The Fable instance the endpoint registers against. |
| `pOptions` | object | Endpoint options, including `EndpointIdentifier` and `EndpointMethods` (see below). |
| `pServiceHash` | string | Fable service hash for the provider. |

Subclasses conventionally merge their own defaults under the caller-supplied options before calling `super(...)`:

```javascript
let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(_DefaultOptions)), pOptions);
super(pFable, tmpOptions, pServiceHash);
```

## Options

### `EndpointIdentifier`

A string identifying the endpoint. When omitted, the demonstrated pattern auto-generates one of the form `AutoEndpointID-<uuid>`. Used in log lines and as a key when the endpoint is stored on the Orator instance.

### `EndpointMethods`

The route map. An object keyed by HTTP verb; each value is an array of route descriptors:

```javascript
"EndpointMethods":
{
	"GET":
		[
			{ "Path": "/1.0/Record/:category", "Function": "listRecords" },
			{ "Path": "/1.0/Record/:category/:hash", "Function": "readRecord" }
		],
	"DEL":
		[
			{ "Path": "/1.0/Record/:category/:hash", "Function": "deleteRecord" }
		]
}
```

| Field | Type | Description |
|-------|------|-------------|
| *(key)* | string | HTTP verb - `GET`, `PUT`, `POST`, `DEL`, `PATCH`, etc. Observed verbs in usage are `GET` and `DEL`; other verbs follow the service server's verb method names. |
| `Path` | string | Route pattern. Restify-style path parameters (`:name`) are supported and surface on `pRequest.params`. |
| `Function` | string | Name of the handler method on the endpoint class to bind to this route. |

When the endpoint is registered, each descriptor's `Function` is bound to the endpoint instance and mapped onto the Orator service server for the matching verb (effectively `pOrator.serviceServer[verb.toLowerCase()](Path, this[Function].bind(this))`).

> The exact set of verbs the base class accepts in `EndpointMethods` (and how it lowercases/looks them up on the service server) is implemented in the source. Verbs map onto the service server methods documented in [orator-serviceserver-base](https://fable-retold.github.io/orator-serviceserver-base).

## Lifecycle Methods

The base class exposes an ordered initialization lifecycle. Subclasses override the hooks they need; the default implementations are no-ops that invoke their callback.

### `initialize(fCallback)`

Runs the lifecycle in order: `onBeforeInitialize` -> `onInitialize` -> (records an initialization timestamp) -> `onAfterInitialize`, then invokes `fCallback(pError)`. In the demonstrated pattern this is orchestrated with a Fable `Anticipate` waterfall.

### `onBeforeInitialize(fCallback)`

Override hook that runs first. Default: calls `fCallback()`.

### `onInitialize(fCallback)`

Override hook for the main setup step. Common uses: registering a dependent Fable service, or registering routes that need middleware not covered by `EndpointMethods` (for example body-parsed `PUT`/`POST` routes via `this.fable.Orator.serviceServer.putWithBodyParser(...)`). Default: calls `fCallback()`.

### `onAfterInitialize(fCallback)`

Override hook that runs last. Default: calls `fCallback()`.

## Route Handlers

Each entry in `EndpointMethods` names a method on the class. Handlers use the Orator service server request/response signature:

```javascript
handlerName(pRequest, pResponse, fNext)
{
	// ... read pRequest.params / pRequest.body, do work ...
	pResponse.send(200, tmpResultObject);
	return fNext();
}
```

| Parameter | Description |
|-----------|-------------|
| `pRequest` | Incoming request. With the Restify service server, route parameters are on `pRequest.params` and the parsed body (for body-parsed routes) is on `pRequest.body`. |
| `pResponse` | Response object. `pResponse.send(pStatusCode, pBody)` sends a response. |
| `fNext` | Continuation callback; call (and `return`) it to pass control to the next handler / complete the request. |

The precise request/response capabilities depend on the active Orator service server implementation (Restify, the built-in IPC server, or a custom one) rather than on this module.

## Registration

In the demonstrated pattern, endpoints are added to a running Orator service through a static helper on the endpoint class:

### `addEndpoint(pEndpointHash, pEndpointClass, fCallback, pOrator)` *(static)*

| Parameter | Type | Description |
|-----------|------|-------------|
| `pEndpointHash` | string | Key the endpoint instance is stored under on `pOrator.endpoints`. |
| `pEndpointClass` | class | The endpoint subclass to instantiate. Its `default_options` are used as the instance options. |
| `fCallback` | function | `fCallback(pError)`, invoked when registration completes. |
| `pOrator` | object | The Orator service to register routes against. |

Behavior in the demonstrated pattern: instantiate the class, run its `initialize` lifecycle, store it at `pOrator.endpoints[pEndpointHash]`, then iterate `EndpointMethods` and bind each route's handler onto `pOrator.serviceServer`.

> **Unverified against source.** This static helper signature and behavior come from a sibling copy of the endpoint pattern (the `parime` server's vendored `Orator-Endpoint.js`), not from this package's own `source/`. The published base class may expose registration under a different name or signature, or as an instance method. Confirm against `source/Orator-Endpoint-Base.js`.

## Module Exports

Endpoint modules in this pattern export the class and attach the default options for the registrar to read:

```javascript
module.exports = EndpointSubclass;
module.exports.default_options = _DefaultOptions;
```

Whether the base `Orator-Endpoint-Base` module itself attaches a `default_options` export (and what it contains) is defined in its source.

## Unknowns - require the source to confirm

The following could not be determined from this checkout (no `source/`, and the local `test/`/`debug/` do not exercise the base class):

- The exact exported class name and any `module.exports.default_options` on the base module.
- The base class's own default options (the sibling copy defaults to `{ EndpointIdentifier: false }`, but the published version is unconfirmed).
- The precise registration entry point: name (`addEndpoint` vs. other), static vs. instance, and exact parameter order.
- The exact lifecycle method names/order beyond the demonstrated `onBeforeInitialize` / `onInitialize` / `onAfterInitialize` / `initialize`.
- Which HTTP verbs the base accepts in `EndpointMethods`, and how it normalizes/dispatches them onto the service server.
- Any additional public methods, properties, configuration options, or events the base class provides.
- Whether the base class registers itself as a named Fable service type (and under what name).
