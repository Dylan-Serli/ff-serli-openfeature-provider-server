//see https://openfeature.dev/docs/reference/concepts/provider
import dotenv from "dotenv";
dotenv.config();
import {
  Provider,
  ResolutionDetails,
  EvaluationContext,
  OpenFeatureEventEmitter,
  FlagValue,
  StandardResolutionReasons,
  ErrorCode,
} from "@openfeature/server-sdk";
import { FlagType, typeFactory } from "./type-factory.js";

export default class SerliProvider implements Provider {
  readonly metadata = {
    name: SerliProvider.name,
  } as const;

  readonly runsOn = "server";
  private readonly API_URL =
    process.env.API_URL || "http://localhost:3333/api/flags/";
  private api_key = "";

  constructor(api_key: string) {
    this.api_key = api_key;
  }
  // emitter for provider events
  events = new OpenFeatureEventEmitter();

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<boolean>> {
    return this.evaluate(flagKey, "boolean", defaultValue);
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<string>> {
    return this.evaluate<string>(flagKey, "string", defaultValue);
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<number>> {
    return this.evaluate<number>(flagKey, "number", defaultValue);
  }

  resolveObjectEvaluation<JsonValue extends FlagValue>(
    flagKey: string,
    defaultValue: JsonValue,
    context: EvaluationContext,
  ): Promise<ResolutionDetails<JsonValue>> {
    return this.evaluate<JsonValue>(flagKey, "object", defaultValue);
  }

  private async evaluate<T extends FlagValue>(
    flagKey: string,
    type: FlagType,
    defaultValue: T,
  ) {
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
            } as ResolutionDetails<T>;
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
          } as ResolutionDetails<T>;
        }
        return {
          value: (typeof value !== type ? defaultValue : value) as T,
          reason: StandardResolutionReasons.CACHED,
        } as ResolutionDetails<T>;
      })
      .catch((error) => {
        return {
          value: defaultValue,
          reason: StandardResolutionReasons.ERROR,
          errorCode: ErrorCode.PROVIDER_FATAL,
          errorMessage: error.message,
        } as ResolutionDetails<T>;
      });
  }
}
