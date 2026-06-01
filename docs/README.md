# Orator Endpoint

> Base endpoint class for Orator providing route definition and request handling patterns

`orator-endpoint` is a base class that other endpoint modules extend. It turns a declarative description of an endpoint's routes into live handlers on a running [Orator](https://fable-retold.github.io/orator) service, and gives every endpoint the same initialization lifecycle.

You do not run this module on its own. You either extend it directly or use a higher-level module built on the same pattern.

## What an Endpoint Is

An endpoint is a [Fable](https://github.com/fable-retold/fable) service provider that bundles a set of related HTTP routes. A subclass provides two things:

1. **A route map** - the `EndpointMethods` option, keyed by HTTP verb, listing `{ Path, Function }` entries.
2. **Handler methods** - one method per route, with the signature `(pRequest, pResponse, fNext)`.

When the endpoint is registered, the base class walks `EndpointMethods` and binds each route's handler onto the Orator service server for the matching verb.

## Why Use It

- **Declarative routing** - routes live in a single options object next to the class, not scattered through imperative `serviceServer.get(...)` calls.
- **Consistent lifecycle** - every endpoint gets the same `onBeforeInitialize` / `onInitialize` / `onAfterInitialize` hooks, so cross-cutting setup (wiring a helper service, registering body-parser routes) happens in a predictable place.
- **Handler-per-route** - each route maps to a named method on the class, which keeps handlers small and testable.

## Features

- **Route Definition Map** - `EndpointMethods` declares verb -> `[{ Path, Function }]` routes.
- **Endpoint Identity** - each instance carries an `EndpointIdentifier` (explicit or auto-generated from a UUID).
- **Initialization Lifecycle** - ordered `onBeforeInitialize` / `onInitialize` / `onAfterInitialize` hooks around `initialize`.
- **Fable Service Provider** - extends `fable-serviceproviderbase`, so handlers reach services, logging, and configuration through `this.fable`.
- **Service Server Binding** - routes are registered onto the active Orator service server (Restify, IPC, or a custom one).

## Documentation

- [Getting Started](quickstart.md) - build and register your first endpoint
- [API Reference](api-reference.md) - the public surface as evidenced

## Related Modules

- [orator](https://fable-retold.github.io/orator) - the API server this endpoint registers routes against
- [orator-serviceserver-base](https://fable-retold.github.io/orator-serviceserver-base) - the service server interface (`get`/`post`/`put`/...) endpoints ultimately call
- [meadow-endpoints](https://fable-retold.github.io/meadow-endpoints) - schema-driven RESTful endpoints over the Meadow data layer
