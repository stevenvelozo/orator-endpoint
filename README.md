# Orator Endpoint Base Class

> **[Read the Orator-Endpoint Documentation](https://fable-retold.github.io/orator-endpoint/)** - interactive docs with the full API reference.

> Base endpoint class for Orator providing route definition and request handling patterns

`orator-endpoint` is a base class that other endpoint modules extend. Instead of wiring routes onto the Orator service server by hand, you describe an endpoint's routes declaratively and implement one handler method per route. The base class registers those routes against a running [Orator](https://github.com/fable-retold/orator) service and gives each endpoint a consistent initialization lifecycle.

This package ships only the base class - it is not run on its own. You consume it by extending it (see the example below) or through higher-level modules that build on the same pattern.

## Installation

```bash
npm install orator-endpoint
```

The package depends on a running [Orator](https://github.com/fable-retold/orator) service (Orator `^6.1.2`) and the [Fable](https://github.com/fable-retold/fable) service provider framework.

## Concept

An endpoint is a [Fable](https://github.com/fable-retold/fable) service provider that groups a set of related HTTP routes. Each subclass:

- declares its routes in an `EndpointMethods` map (HTTP verb -> one or more `{ Path, Function }` entries), and
- implements a handler method per route with the standard `(pRequest, pResponse, fNext)` signature.

The base class reads `EndpointMethods` and binds each route onto the Orator service server, so the routes light up when the endpoint is registered. Routes that need extra middleware (for example a body parser on `PUT`/`POST`) can be registered explicitly in an initialization hook.

## Minimal Example

The following mirrors how endpoints are authored against this pattern in the Retold ecosystem (see the `parime` server's endpoints for full working examples).

```javascript
const libOratorEndpoint = require('orator-endpoint');

const _DefaultOptions = (
	{
		"EndpointIdentifier": 'ServerInfo',
		"EndpointMethods":
		{
			"GET":
				[
					{
						"Path": "/1.0/ServerInfo",
						"Function": "getServerInfo"
					}
				]
		}
	});

class EndpointServerInfo extends libOratorEndpoint
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(_DefaultOptions)), pOptions);
		super(pFable, tmpOptions, pServiceHash);
	}

	getServerInfo(pRequest, pResponse, fNext)
	{
		pResponse.send(200, { Product: this.fable.settings.Product });
		return fNext();
	}
}

module.exports = EndpointServerInfo;
module.exports.default_options = _DefaultOptions;
```

Register the endpoint against an initialized Orator service. The exact registration entry point is implemented in the base class - in the demonstrated pattern endpoints are added with a static `addEndpoint(pEndpointHash, pEndpointClass, fCallback, pOrator)` helper that instantiates the endpoint, runs its initialization lifecycle, and maps each `EndpointMethods` route onto `pOrator.serviceServer`:

```javascript
libOratorEndpoint.addEndpoint('ServerInfo', EndpointServerInfo, fCallback, _Orator);
```

> The route handler runs with the Orator service server's request/response objects. With the Restify service server (`orator-serviceserver-restify`), that means `pRequest.params`, `pRequest.body`, and `pResponse.send(...)` behave as documented by Restify/Orator.

## Documentation

- [Documentation home](https://fable-retold.github.io/orator-endpoint/)
- [Getting Started](docs/quickstart.md)
- [API Reference](docs/api-reference.md)

## Related Modules

- [orator](https://github.com/fable-retold/orator) - the API server this endpoint registers routes against
- [orator-serviceserver-base](https://github.com/fable-retold/orator-serviceserver-base) - the service server interface (`get`/`post`/`put`/...) endpoints ultimately call
- [meadow-endpoints](https://github.com/fable-retold/meadow-endpoints) - schema-driven RESTful endpoints over the Meadow data layer

## License

MIT
