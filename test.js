import { OpenFeature } from "@openfeature/server-sdk";
import SerliProvider from "./dist/index.js";

OpenFeature.setProvider(
  new SerliProvider(
    "b7f52e9092f744299fd5bdae115faeb11abbf819fd8e40d0a1cb72057a937b70",
    "d2af1c3b-d96f-44d5-a676-a23b064f6d68",
  ),
);
const client = OpenFeature.getClient();

console.log(await client.getBooleanValue("bu", false));
console.log(await client.getBooleanDetails("bu", false));

console.log(
  await client.getStringValue("new-flag-3", "default resolved value"),
);
console.log(
  await client.getStringDetails("new-flag-3", "default resolved value"),
);

console.log(await client.getNumberValue("number", 0));
console.log(await client.getNumberDetails("number", 0));

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
