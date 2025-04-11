import dotenv from "dotenv";
dotenv.config();
import { OpenFeatureEventEmitter, StandardResolutionReasons, ErrorCode, } from "@openfeature/server-sdk";
import { typeFactory } from "./type-factory.js";
export default class SerliProvider {
    metadata = {
        name: SerliProvider.name,
    };
    runsOn = "server";
    API_URL = process.env.API_URL || "http://localhost:3333/api/flags/";
    api_key = "";
    constructor(api_key) {
        this.api_key = api_key;
        console.log("API_URL:", this.API_URL);
    }
    // emitter for provider events
    events = new OpenFeatureEventEmitter();
    resolveBooleanEvaluation(flagKey, defaultValue, context) {
        return this.evaluate(flagKey, "boolean", defaultValue);
    }
    resolveStringEvaluation(flagKey, defaultValue, context) {
        return this.evaluate(flagKey, "string", defaultValue);
    }
    resolveNumberEvaluation(flagKey, defaultValue, context) {
        return this.evaluate(flagKey, "number", defaultValue);
    }
    resolveObjectEvaluation(flagKey, defaultValue, context) {
        return this.evaluate(flagKey, "object", defaultValue);
    }
    async evaluate(flagKey, type, defaultValue) {
        return fetch(this.API_URL + flagKey, {
            method: "GET",
            headers: {
                Authorization: `${this.api_key}`,
                "Content-Type": "application/json",
            },
        })
            .then(async (response) => {
            if (!response.ok) {
                if (response.status === 404) {
                    return {
                        value: defaultValue,
                        reason: StandardResolutionReasons.ERROR,
                        errorCode: ErrorCode.FLAG_NOT_FOUND,
                        errorMessage: `flag ${flagKey} does not exist`,
                    };
                }
                throw new Error(`Failed to fetch flags: ${response.statusText}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(`Error when fetching flags: ${response.statusText}`);
            }
            const value = typeFactory(data.value, type);
            if (typeof value !== "undefined" && typeof value !== type) {
                return {
                    value: defaultValue,
                    reason: StandardResolutionReasons.CACHED,
                    errorCode: ErrorCode.TYPE_MISMATCH,
                    errorMessage: `flag key ${flagKey} is not of type ${type}`,
                };
            }
            return {
                value: (typeof value !== type ? defaultValue : value),
                reason: StandardResolutionReasons.CACHED,
            };
        })
            .catch((error) => {
            return {
                value: defaultValue,
                reason: StandardResolutionReasons.ERROR,
                errorCode: ErrorCode.PROVIDER_FATAL,
                errorMessage: error.message,
            };
        });
    }
}
