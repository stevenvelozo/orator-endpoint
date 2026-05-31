# Getting Started

This guide shows how to define an endpoint by extending `orator-endpoint`, then register it against a running [Orator](https://fable-retold.github.io/orator) service. The shape below follows the endpoint pattern used elsewhere in the Retold ecosystem (for full working examples, look at the endpoints in the `parime` server).

## Install

```bash
npm install orator-endpoint orator
```

## 1. Define an Endpoint

A subclass declares its routes in `EndpointMethods` and implements one handler method per route. Each handler takes `(pRequest, pResponse, fNext)`.

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
					},
					{
						"Path": "/1.0/ServerInfo/Lakes",
						"Function": "getLakesSummary"
					}
				]
		}
	});

class EndpointServerInfo extends libOratorEndpoint
{
	constructor(pFable, pOptions, pServiceHash)
	{
		// Merge the endpoint's defaults under any caller-supplied options
		let tmpOptions = Object.assign({}, JSON.parse(JSON.stringify(_DefaultOptions)), pOptions);
		super(pFable, tmpOptions, pServiceHash);

		this._StartTime = new Date();
	}

	getServerInfo(pRequest, pResponse, fNext)
	{
		let tmpSettings = this.fable.settings;
		pResponse.send(200,
			{
				Product: tmpSettings.Product || 'My Service',
				Version: tmpSettings.ProductVersion || '1.0.0'
			});
		return fNext();
	}

	getLakesSummary(pRequest, pResponse, fNext)
	{
		pResponse.send(200, { Lakes: [] });
		return fNext();
	}
}

module.exports = EndpointServerInfo;
module.exports.default_options = _DefaultOptions;
```

Notes:

- **`EndpointMethods`** is keyed by HTTP verb (`GET`, `PUT`, `POST`, `DEL`, &hellip;). Each entry maps a `Path` to the name of a handler method (`Function`) on the class.
- **Path parameters** use the Restify style, e.g. `/1.0/Record/:category/:hash`, and arrive on `pRequest.params`.
- **`module.exports.default_options`** exposes the defaults so the registration helper can read them when instantiating the endpoint.

## 2. Use the Initialization Lifecycle

The base class runs ordered hooks around `initialize`. Override `onInitialize` (or `onBeforeInitialize` / `onAfterInitialize`) for setup work &mdash; for example, wiring a dependent service, or registering routes that need middleware the declarative map does not cover.

Routes that require a body parser (typically `PUT` / `POST`) are a common case. In the demonstrated pattern these are registered explicitly against the service server inside `onInitialize`:

```javascript
onInitialize(fCallback)
{
	// Register a PUT route that needs body parsing (not handled by the EndpointMethods map)
	let tmpOrator = this.fable.Orator;
	tmpOrator.serviceServer.putWithBodyParser('/1.0/Record/:category/:hash', this.writeRecord.bind(this));
	return fCallback();
}
```

The `*WithBodyParser` helpers come from the Orator service server &mdash; see [orator-serviceserver-base](https://fable-retold.github.io/orator-serviceserver-base) for the full verb surface (`get`, `post`, `put`, `del`, `patch`, `opts`, `head`, and their `*WithBodyParser` variants).

## 3. Register the Endpoint

Endpoints are registered against an already-initialized Orator service. In the demonstrated pattern a static helper does the work: it instantiates the endpoint class, runs its initialization lifecycle, stores it on the Orator instance, and maps every `EndpointMethods` route onto the service server.

```javascript
const libFable = require('fable');
const libOrator = require('orator');
const libOratorServiceServerRestify = require('orator-serviceserver-restify');
const EndpointServerInfo = require('./Endpoint-ServerInfo.js');

let _Fable = new libFable({ Product: 'My Service', ProductVersion: '1.0.0', APIServerPort: 8080 });

// Pick a service server implementation (Restify here)
_Fable.serviceManager.addServiceType('OratorServiceServer', libOratorServiceServerRestify);
_Fable.serviceManager.instantiateServiceProvider('OratorServiceServer', {});

// Add and initialize the Orator service
_Fable.serviceManager.addServiceType('Orator', libOrator);
let _Orator = _Fable.serviceManager.instantiateServiceProvider('Orator', {});

let tmpAnticipate = _Fable.newAnticipate();

tmpAnticipate.anticipate(_Orator.initialize.bind(_Orator));

// Register the endpoint (maps its routes onto the running service server)
tmpAnticipate.anticipate(
	(fStageComplete) =>
	{
		EndpointServerInfo.addEndpoint('ServerInfo', EndpointServerInfo, fStageComplete, _Orator);
	});

// Start accepting requests
tmpAnticipate.anticipate(_Orator.startService.bind(_Orator));

tmpAnticipate.wait(
	(pError) =>
	{
		if (pError)
		{
			_Fable.log.error(`Error starting service: ${pError.message}`, pError);
			return;
		}
		_Fable.log.info('Service started.');
	});
```

`GET /1.0/ServerInfo` now returns the product/version JSON.

> **About the registration entry point:** the `addEndpoint(pEndpointHash, pEndpointClass, fCallback, pOrator)` signature above reflects how endpoints are added in the demonstrated pattern. The exact entry point provided by the published base class lives in its source (`source/Orator-Endpoint-Base.js`) and is not reproduced in this checkout &mdash; confirm the precise registration call against the source if it differs.

## Next Steps

- Read the [API Reference](api-reference.md) for the evidenced public surface.
- Browse the endpoints in the `parime` server for multi-route examples (record/binary/combined lakes, a WebSocket upgrade endpoint, and a server-info endpoint).
