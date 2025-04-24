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
import { FlagType } from "./type-factory.js";

export default class SerliProvider implements Provider {
  readonly metadata = {
    name: SerliProvider.name,
  } as const;

  readonly runsOn = "server";
  private readonly API_URL =
    process.env.API_URL || "http://localhost:3333/api/flags";
  private api_key = "";
  private project_id = "";

  constructor(api_key: string, project_id: string) {
    this.api_key = api_key;
    this.project_id = project_id;
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
  ): Promise<ResolutionDetails<T>> {
    try {
      const response = await fetch(
        `${this.API_URL}/${this.project_id}/${flagKey}`,
        {
          method: "GET",
          headers: {
            Authorization: this.api_key,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          return this.createErrorResolution(
            defaultValue,
            ErrorCode.FLAG_NOT_FOUND,
            `Flag ${flagKey} not found`,
            StandardResolutionReasons.ERROR,
          );
        }
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data = (await response.json()) as FlagResponse;
      if (data.error) throw new Error(data.error);

      if (!this.isTypeCorrect(data.value, type)) {
        return this.createErrorResolution(
          defaultValue,
          ErrorCode.TYPE_MISMATCH,
          `Flag ${flagKey} is not of type ${type}`,
          StandardResolutionReasons.CACHED,
        );
      }

      return {
        value: data.value as T,
        reason: StandardResolutionReasons.CACHED,
      };
    } catch (error) {
      return this.createErrorResolution(
        defaultValue,
        ErrorCode.PROVIDER_FATAL,
        error instanceof Error ? error.message : "Unknown error",
        StandardResolutionReasons.ERROR,
      );
    }
  }

  private isTypeCorrect(value: unknown, type: FlagType): boolean {
    if (type === "object") return value !== null && typeof value === "object";
    return typeof value === type;
  }

  private createErrorResolution<T>(
    value: T,
    errorCode: ErrorCode,
    message: string,
    reason: any,
  ): ResolutionDetails<T> {
    return { value, reason, errorCode, errorMessage: message };
  }
}

interface FlagResponse {
  value: unknown;
  error?: string;
}
