// Skills in the Agent Skills format (NAL-B3, https://agentskills.io/specification): a folder with SKILL.md and
// optional files, imported, versioned and assigned to agents in one fixed version. The runtime enforces every rule
// (nodestro-api: nodestro_api/api_skills.py; nodestro-runtime: skills.py); scripts inside a skill are never run.
// Also the library's building blocks (parts) as gallery entries of their own.

import { useQuery } from "@tanstack/react-query";

import { request } from "./client";
import type { WorkflowIn } from "./types";

export type SkillStatus = "active" | "disabled" | "archived";
export type SkillMode = "always" | "on_demand";

/** A skill assigned to an agent in one fixed version; a newer version is never used automatically. */
export interface SkillBinding {
  skill_id: string;
  version: number;
  mode: SkillMode;
}

/** A skill of the workspace in its latest version. */
export interface Skill {
  id: string;
  name: string;
  description: string;
  status: SkillStatus;
  version: number;
  language: string | null;
  /** user, import:<sha256> or builtin:nodestro-examples@<version>/<name>. */
  origin: string;
  has_scripts: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkillFileRef {
  path: string;
  size: number;
  sha256: string;
}

export interface SkillVersion {
  skill_id: string;
  version: number;
  digest: string;
  name: string;
  description: string;
  license: string | null;
  compatibility: string | null;
  metadata: Record<string, string>;
  allowed_tools: string | null;
  files: SkillFileRef[];
  origin: string;
  note: string;
  created_at: string;
  created_by: string;
}

export interface SkillFileInfo {
  path: string;
  size: number;
  /** Text a model may read; other files are listed only. */
  text: boolean;
  script: boolean;
}

export interface SkillIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  path: string | null;
  field: string | null;
  params: Record<string, string | number>;
}

export interface SkillDetail {
  skill: Skill;
  version: SkillVersion;
  body: string;
  files: SkillFileInfo[];
  issues: SkillIssue[];
}

/** What an import would store, without storing it. */
export interface SkillCheck {
  name: string;
  description: string;
  license: string | null;
  compatibility: string | null;
  metadata: Record<string, string>;
  allowed_tools: string | null;
  body: string;
  files: SkillFileInfo[];
  issues: SkillIssue[];
  /** A skill of the workspace with the same name. */
  existing: Skill | null;
}

export interface SkillImportResult {
  skill: Skill | null;
  check: SkillCheck;
}

export interface SkillFileText {
  path: string;
  size: number;
  text: string;
  truncated: boolean;
}

export interface SkillUser {
  kind: "workflow" | "template" | string;
  id: string;
  name: string;
  agent: string;
  version: number;
}

/** A file of an edited package: new text, new bytes (base64) or the stored file unchanged (keep). */
export interface SkillFileIn {
  path: string;
  text?: string;
  base64?: string;
  keep?: boolean;
}

export interface LibrarySkill {
  name: string;
  family: string;
  language: string;
  description: string;
  version: string;
  files: SkillFileInfo[];
}

export interface LibrarySkillDetail extends LibrarySkill {
  body: string;
}

/** A building block: a small workflow that templates run as a team or sub-workflow. */
export interface PartSummary {
  id: string;
  language: string;
  name: string;
  description: string;
  capabilities: string[];
  agents: number;
  /** Parts this part runs; a copy stores them first. */
  parts: string[];
  /** Templates (examples) that use the part. */
  templates: string[];
}

export interface PartDetail extends PartSummary {
  workflow: WorkflowIn;
}

const enc = encodeURIComponent;
const lang = (language?: string) =>
  language ? `?language=${enc(language)}` : "";

export const skillsApi = {
  list: () => request<Skill[]>("GET", "/skills"),
  get: (id: string, version?: number) =>
    request<SkillDetail>(
      "GET",
      `/skills/${enc(id)}${version ? `?version=${version}` : ""}`,
    ),
  versions: (id: string) =>
    request<SkillVersion[]>("GET", `/skills/${enc(id)}/versions`),
  file: (id: string, version: number, path: string) =>
    request<SkillFileText>(
      "GET",
      `/skills/${enc(id)}/versions/${version}/file?path=${enc(path)}`,
    ),
  usage: (id: string) =>
    request<SkillUser[]>("GET", `/skills/${enc(id)}/usage`),
  /** The download URL of a version as a standard Agent Skills ZIP. */
  exportUrl: (id: string, version?: number) =>
    `/api/skills/${enc(id)}/export${version ? `?version=${version}` : ""}`,
  /** Reads a ZIP or a single SKILL.md; ``dryRun`` only checks; ``skillId`` stores it as the next version of that skill. */
  import: (
    file: File,
    options: { dryRun?: boolean; skillId?: string } = {},
  ) => {
    const form = new FormData();
    form.append("file", file);
    if (options.dryRun) form.append("dry_run", "true");
    if (options.skillId) form.append("skill_id", options.skillId);
    return request<SkillImportResult>("POST", "/skills/import", form);
  },
  check: (files: Record<string, string>) =>
    request<SkillCheck>("POST", "/skills/check", { files }),
  create: (files: SkillFileIn[], note = "") =>
    request<Skill>("POST", "/skills", { files, note }),
  update: (id: string, files: SkillFileIn[], note = "") =>
    request<Skill>("PUT", `/skills/${enc(id)}`, { files, note }),
  copy: (id: string, name: string) =>
    request<Skill>("POST", `/skills/${enc(id)}/copy`, { name }),
  setStatus: (id: string, status: "active" | "disabled") =>
    request<Skill>("POST", `/skills/${enc(id)}/status`, { status }),
  archive: (id: string) => request<Skill>("POST", `/skills/${enc(id)}/archive`),
  remove: (id: string) => request<void>("DELETE", `/skills/${enc(id)}`),
  library: (language?: string) =>
    request<LibrarySkill[]>("GET", `/library/skills${lang(language)}`),
  librarySkill: (name: string) =>
    request<LibrarySkillDetail>("GET", `/library/skills/${enc(name)}`),
  copyLibrary: (name: string) =>
    request<Skill>("POST", `/library/skills/${enc(name)}/copy`),
  parts: (language?: string) =>
    request<PartSummary[]>("GET", `/library/parts${lang(language)}`),
  part: (id: string, language?: string) =>
    request<PartDetail>("GET", `/library/parts/${enc(id)}${lang(language)}`),
  copyPart: (id: string, language?: string) =>
    request<{ id: string; name: string }>(
      "POST",
      `/library/parts/${enc(id)}/copy`,
      { language },
    ),
};

export const skillKeys = {
  all: ["skills"] as const,
  detail: (id: string, version?: number) =>
    ["skills", id, version ?? "latest"] as const,
  versions: (id: string) => ["skills", id, "versions"] as const,
  usage: (id: string) => ["skills", id, "usage"] as const,
  library: (language: string) => ["library-skills", language] as const,
  parts: (language: string) => ["library-parts", language] as const,
};

export const useSkills = () =>
  useQuery({ queryKey: skillKeys.all, queryFn: skillsApi.list });
export const useSkill = (id: string | null, version?: number) =>
  useQuery({
    queryKey: skillKeys.detail(id ?? "", version),
    queryFn: () => skillsApi.get(id!, version),
    enabled: Boolean(id),
  });
export const useSkillVersions = (id: string | null) =>
  useQuery({
    queryKey: skillKeys.versions(id ?? ""),
    queryFn: () => skillsApi.versions(id!),
    enabled: Boolean(id),
  });
export const useSkillUsage = (id: string | null) =>
  useQuery({
    queryKey: skillKeys.usage(id ?? ""),
    queryFn: () => skillsApi.usage(id!),
    enabled: Boolean(id),
  });
export const useLibrarySkills = (language: string) =>
  useQuery({
    queryKey: skillKeys.library(language),
    queryFn: () => skillsApi.library(language),
    staleTime: Infinity,
  });
export const useLibraryParts = (language: string) =>
  useQuery({
    queryKey: skillKeys.parts(language),
    queryFn: () => skillsApi.parts(language),
    staleTime: Infinity,
  });

/** Whether a skill's origin says it came from a file of unknown origin (the import warns about it). */
export const isImported = (origin: string) => origin.startsWith("import:");
export const isBuiltin = (origin: string) => origin.startsWith("builtin:");
