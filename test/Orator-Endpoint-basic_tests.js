/**
 * Unit tests for Orator
 * @license     MIT
 * @author      Steven Velozo <steven@velozo.com>
 */

const Chai = require("chai");
const Expect = Chai.expect;
const Assert = Chai.assert;

const libFable = require("fable");
const libOrator = require("orator");

suite("Orator Endpoint Base Class", () =>
{
	suite("Object Sanity", () =>
	{
		test("The class should initialize itself into a happy little object.", function (fDone)
		{
			// Initialize fable
			let tmpFable = new libFable();
			// Add Orator as a service
			tmpFable.addServiceType("Orator", libOrator);
			// Initialize the Orator service
			let tmpOrator = tmpFable.instantiateServiceProvider("Orator", {});
			// Sanity check Orator
			Expect(tmpOrator).to.be.an(
				"object",
				"Orator should initialize as an object directly from the require statement.",
			);

			tmpOrator.initialize((pError) =>
			{
				Expect(tmpOrator.startService).to.be.an("function");
				Expect(tmpOrator.serviceServer.ServiceServerType).to.equal(
					"IPC",
					"The service server is the built-in ipc mechanism for this test.",
				);
				fDone();
			});
		});
	});
});
