// Amazon Bedrock model names keep every colon and slash: only the first colon separates the provider.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { keys } from "../api/hooks";
import { ModelPicker, modelName } from "../components/ModelPicker";
import i18n from "../i18n";
import { isProviderAuth, needsProviderSetup, problemCode, problemText } from "./errors";
import { providerOf, qualifyModel, sameModel, splitModel } from "./providers";

const ARN = "arn:aws:bedrock:eu-central-1:123456789012:application-inference-profile/abc123";
const VERSIONED = "anthropic.claude-3-5-sonnet-20240620-v1:0";
const PROFILE = "eu.anthropic.claude-haiku-4-5-20251001-v1:0";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Bedrock model names", () => {
  it.each([ARN, VERSIONED, PROFILE, `arn:aws:bedrock:eu-west-1:111122223333:inference-profile/${PROFILE}`])(
    "keeps %s intact",
    (id) => {
      const name = `bedrock:${id}`;
      expect(splitModel(name)).toEqual({ provider: "bedrock", id });
      expect(providerOf(name)).toBe("bedrock");
      expect(qualifyModel(name)).toBe(name);
      expect(sameModel(name, name)).toBe(true);
    },
  );

  it("does not take an unprefixed id with a colon for a provider", () => {
    // No provider is called "anthropic.claude-…-v1": the name stays Anthropic's (the runtime refuses it with
    // config.model_provider_missing), and its id is not cut.
    expect(splitModel(VERSIONED)).toEqual({ provider: "anthropic", id: VERSIONED });
  });

  it("shows the full id of a model the catalog does not know", () => {
    expect(modelName([], `bedrock:${ARN}`)).toBe(`bedrock:${ARN}`);
  });

  it("stores a typed ARN or versioned id unchanged in the model picker", () => {
    const client = new QueryClient();
    client.setQueryData(keys.meta, {
      providers: [{ id: "bedrock", label: "Amazon Bedrock (AWS)", example_model: "eu.anthropic.claude-sonnet-5-5" }],
      models: [{ id: "bedrock:eu.anthropic.claude-sonnet-5-5", provider: "bedrock", model: "eu.anthropic.claude-sonnet-5-5", label: "Claude Sonnet 5.5 (Bedrock EU)", recommended: true }],
    });
    const onChange = vi.fn();
    render(
      <QueryClientProvider client={client}>
        <ModelPicker value="bedrock:" onChange={onChange} label="model" />
      </QueryClientProvider>,
    );
    const input = screen.getByLabelText("model");
    fireEvent.change(input, { target: { value: ARN } });
    expect(onChange).toHaveBeenLastCalledWith(`bedrock:${ARN}`);
    fireEvent.change(input, { target: { value: VERSIONED } });
    expect(onChange).toHaveBeenLastCalledWith(`bedrock:${VERSIONED}`);
    // The catalog entries are offered as suggestions, not as models the account can use.
    const option = document.querySelector("datalist option") as HTMLOptionElement;
    expect(option.value).toBe("eu.anthropic.claude-sonnet-5-5");
    expect(option.textContent).toBe(i18n.t("bedrock.model.suggestedOption", { model: "Claude Sonnet 5.5 (Bedrock EU)" }));
  });
});

describe("Bedrock problems", () => {
  it("reads a refused sign-in as an AWS problem, not as an API key", () => {
    const item = { code: "run.provider_auth", params: { provider: "bedrock" } };
    expect(problemCode(item)).toBe("run.provider_auth_aws");
    expect(problemText(i18n.t, item)).toBe(i18n.t("errors.run.provider_auth_aws"));
    expect(isProviderAuth("run.provider_auth_aws")).toBe(true);
    expect(isProviderAuth("provider.aws_access_denied")).toBe(true);
  });

  it("explains a missing Bedrock setup without a base URL", () => {
    const item = { code: "provider.not_configured", params: { provider: "bedrock" } };
    expect(problemText(i18n.t, item)).toBe(i18n.t("errors.provider.bedrock_not_configured"));
    expect(needsProviderSetup({ code: "check.bedrock_not_configured" })).toBe(true);
    expect(needsProviderSetup({ code: "provider.region_missing" })).toBe(true);
    expect(needsProviderSetup({ code: "check.bedrock_not_available" })).toBe(false);
  });

  it("names the provider problem behind an invalid Bedrock setting", () => {
    const text = problemText(i18n.t, { code: "check.bedrock_settings_invalid", params: { reason: "provider.region_not_allowed", region: "us-east-1" } });
    expect(text).toContain(i18n.t("errors.provider.region_not_allowed", { region: "us-east-1" }));
  });

  it("tells an export of Bedrock that AWS credentials stay on the target machine", () => {
    const item = { code: "export.provider", params: { provider: "bedrock", variables: "AWS_REGION / AWS_DEFAULT_REGION" } };
    expect(problemCode(item)).toBe("export.provider_aws");
    expect(problemText(i18n.t, item)).toContain("AWS_REGION / AWS_DEFAULT_REGION");
    expect(problemCode({ code: "export.provider", params: { provider: "openai" } })).toBe("export.provider");
  });

  it("has a sentence for the residency violation of a run", () => {
    expect(problemText(i18n.t, { code: "provider.data_residency_violation", params: { provider: "bedrock" } })).toBe(
      i18n.t("errors.provider.data_residency_violation"),
    );
  });
});
