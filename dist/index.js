//see https://openfeature.dev/docs/reference/concepts/provider
import dotenv from "dotenv";
dotenv.config();
import { OpenFeatureEventEmitter, StandardResolutionReasons, ErrorCode, } from "@openfeature/server-sdk";
export default class SerliProvider {
    metadata = {
        name: SerliProvider.name,
    };
    runsOn = "server";
    API_URL = process.env.API_URL || "http://localhost:3333/api/flags/";
    api_key = "";
    constructor(api_key) {
        this.api_key = api_key;
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
        try {
            const response = await fetch(`${this.API_URL}${flagKey}`, {
                method: "GET",
                headers: {
                    Authorization: this.api_key,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                if (response.status === 404) {
                    return this.createErrorResolution(defaultValue, ErrorCode.FLAG_NOT_FOUND, `Flag ${flagKey} not found`, StandardResolutionReasons.ERROR);
                }
                throw new Error(`HTTP error: ${response.status}`);
            }
            const data = (await response.json());
            if (data.error)
                throw new Error(data.error);
            if (!this.isTypeCorrect(data.value, type)) {
                return this.createErrorResolution(defaultValue, ErrorCode.TYPE_MISMATCH, `Flag ${flagKey} is not of type ${type}`, StandardResolutionReasons.CACHED);
            }
            return {
                value: data.value,
                reason: StandardResolutionReasons.CACHED,
            };
        }
        catch (error) {
            return this.createErrorResolution(defaultValue, ErrorCode.PROVIDER_FATAL, error instanceof Error ? error.message : "Unknown error", StandardResolutionReasons.ERROR);
        }
    }
    isTypeCorrect(value, type) {
        if (type === "object")
            return value !== null && typeof value === "object";
        return typeof value === type;
    }
    createErrorResolution(value, errorCode, message, reason) {
        return { value, reason, errorCode, errorMessage: message };
    }
}
