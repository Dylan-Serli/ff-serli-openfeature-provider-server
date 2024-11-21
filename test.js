import { OpenFeature } from "@openfeature/server-sdk";
import SerliProvider from "./dist/index.js";

OpenFeature.setProvider(new SerliProvider("your_api_key"));
const client = OpenFeature.getClient();

console.log(await client.getBooleanValue("my-flags", false));
console.log(await client.getBooleanDetails("my-flag", false));

console.log(await client.getStringValue("new-1", "default resolved value"));
console.log(await client.getStringDetails("new-1", "default resolved value"));

console.log(await client.getNumberValue("new-flag-2", 0));
console.log(await client.getNumberDetails("new-flag-2", 0));

// console.log(await client.getObjectValue("json-flag", { version: 4 }));
// console.log(await client.getObjectDetails("json-flag", { version: 4 }));

// console.log(
//   "non existant flag (return default value of 0): ",
//   await provider.resolveNumberEvaluation("non-existant-flag", 0, context),
// );

// console.log(
//   "type mismatch flag: ",
//   await provider.resolveNumberEvaluation("my-flag", 0, context),
// );
