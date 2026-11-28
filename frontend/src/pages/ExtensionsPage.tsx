// The data-only extension store (RT-098, nodestro-api API-081): an administrator takes a checked extension package
// into the store, sees each package's state, removes or revokes it. Packages are never installed into the backend's
// Python environment; their tools run only in the Docker sandbox and stay locked unless the backend's development
// switch is on. The page never switches anything on; the backend checks every upload and every permission again.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, PackageCheck, Trash2, Upload } from "lucide-react";
import { type FormEvent, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAccess } from "../api/access";
import { api } from "../api/client";
import { keys } from "../api/hooks";
import type { StoredExtension } from "../api/types";
import { PermissionNote } from "../components/Access";
import { Badge, Button, Callout, ConfirmIconButton, Field, PageHeader, Select, Spinner, TextInput } from "../components/ui";
import { toast } from "../components/toast";
import { type Coded, ErrorText, problemText } from "../lib/errors";
import { formatDate } from "../lib/format";

const SHA256 = /^[0-9a-f]{64}$/;

/** The reasons a package can be locked for (``reason`` of the API), each with its own text. */
export const LOCK_REASONS = ["off", "not_secured", "invalid", "pending"] as const;

/** The reason a package is locked, when the page has a sentence for it. */
export function lockReason(reason: string | null | undefined): (typeof LOCK_REASONS)[number] | undefined {
  return LOCK_REASONS.find((item) => item === reason);
}

/** The first twelve digits of a hash, for lists; the whole hash stays in the title. */
export function shortHash(sha256: string): string {
  return sha256.slice(0, 12);
}

export function ExtensionsPage() {
  const { t } = useTranslation();
  const access = useAccess();
  const known = access.profile !== "unknown";
  const admin = access.can("admin");
  const store = useQuery({ queryKey: keys.extensions, queryFn: api.extensions, retry: false, enabled: known && admin });
  return (
    <div className="page">
      <PageHeader title={t("approvals.extensions.title")} description={t("approvals.extensions.description")} />
      <div className="page__body stack">
        <p className="small">
          <Link to="/approvals">{t("approvals.access.back")}</Link>
        </p>
        {known && !admin ? <PermissionNote permission="admin" /> : null}
        {store.isLoading ? <Spinner /> : null}
        {store.error ? <ErrorText error={store.error} /> : null}
        {store.data ? (
          <>
            <Callout tone={store.data.tools_switch ? "warning" : "info"}>
              <span data-testid="extensions-locked">
                <strong>{t("approvals.extensions.lockedTitle")}</strong>{" "}
                {store.data.tools_switch ? t("approvals.extensions.switchOn") : t("approvals.extensions.switchOff")}
              </span>
            </Callout>
            <UploadForm packages={store.data.packages} maxBytes={store.data.max_bytes} />
            <PackageList packages={store.data.packages} />
            {store.data.revoked.length ? (
              <section className="stack" aria-labelledby="extensions-revoked">
                <h2 id="extensions-revoked">{t("approvals.extensions.revoked")}</h2>
                <ul data-testid="extensions-revoked">
                  {store.data.revoked.map((item) => (
                    <li key={item.sha256} className="small">
                      <code title={item.sha256}>{shortHash(item.sha256)}</code>{" "}
                      {t("approvals.extensions.revokedBy", { by: item.revoked_by, at: formatDate(item.revoked_at) })}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {store.data.host_refused.length ? (
              <Callout tone="warning">
                <span data-testid="extensions-host-refused">
                  {t("approvals.extensions.hostRefused", {
                    names: store.data.host_refused.map((item) => `${item.distribution} ${item.version}`).join(", "),
                  })}
                </span>
              </Callout>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function UploadForm({ packages, maxBytes }: { packages: StoredExtension[]; maxBytes: number }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const fileId = useId();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sha256, setSha256] = useState("");
  const [origin, setOrigin] = useState("");
  const [replaces, setReplaces] = useState("");
  const upload = useMutation({
    mutationFn: () => api.uploadExtension(file!, { sha256: sha256.trim().toLowerCase(), origin: origin.trim(), replaces: replaces || undefined }),
    onSuccess: (stored) => {
      toast.success(t("approvals.extensions.uploaded", { name: stored.distribution, version: stored.version }));
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setSha256("");
      setOrigin("");
      setReplaces("");
      void client.invalidateQueries({ queryKey: keys.extensions });
    },
  });
  const hashValid = SHA256.test(sha256.trim().toLowerCase());
  const tooLarge = file !== null && file.size > maxBytes;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (file && hashValid && origin.trim() && !tooLarge) upload.mutate();
  };
  return (
    <form className="card stack" onSubmit={submit} aria-labelledby="extensions-upload" data-testid="extension-upload">
      <h2 id="extensions-upload">{t("approvals.extensions.upload")}</h2>
      <p className="small">{t("approvals.extensions.uploadText")}</p>
      <Field label={t("approvals.extensions.file")} hint={t("approvals.extensions.fileHint", { mb: Math.floor(maxBytes / 1048576) })} htmlFor={fileId}>
        <input
          id={fileId}
          type="file"
          ref={fileInput}
          accept=".whl"
          aria-required
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          data-testid="extension-file"
        />
      </Field>
      {tooLarge ? <p role="alert" className="small">{t("approvals.extensions.tooLarge")}</p> : null}
      <Field label={t("approvals.extensions.sha256")} hint={t("approvals.extensions.sha256Hint")}>
        <TextInput
          value={sha256}
          required
          spellCheck={false}
          autoComplete="off"
          maxLength={64}
          aria-invalid={sha256 !== "" && !hashValid}
          onChange={(event) => setSha256(event.target.value)}
          data-testid="extension-sha256"
        />
      </Field>
      <Field label={t("approvals.extensions.origin")} hint={t("approvals.extensions.originHint")}>
        <TextInput value={origin} required maxLength={500} onChange={(event) => setOrigin(event.target.value)} data-testid="extension-origin" />
      </Field>
      {packages.length ? (
        <Field label={t("approvals.extensions.replaces")} hint={t("approvals.extensions.replacesHint")}>
          <Select
            value={replaces}
            onChange={setReplaces}
            placeholder={t("approvals.extensions.replacesNone")}
            options={packages.map((item) => ({ value: item.sha256, label: `${item.distribution} ${item.version} (${shortHash(item.sha256)})` }))}
            data-testid="extension-replaces"
          />
        </Field>
      ) : null}
      {upload.error ? <ErrorText error={upload.error} /> : null}
      <div>
        <Button type="submit" disabled={!file || !hashValid || !origin.trim() || tooLarge || upload.isPending} data-testid="extension-submit">
          <Upload size={16} aria-hidden /> {t("approvals.extensions.uploadButton")}
        </Button>
      </div>
    </form>
  );
}

function PackageList({ packages }: { packages: StoredExtension[] }) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const done = () => void client.invalidateQueries({ queryKey: keys.extensions });
  const failed = (error: Error) => toast.error(problemText(t, error as Coded));
  const remove = useMutation({ mutationFn: api.removeExtension, onSuccess: done, onError: failed });
  const revoke = useMutation({ mutationFn: api.revokeExtension, onSuccess: done, onError: failed });
  if (!packages.length) return <p className="small" data-testid="extensions-empty">{t("approvals.extensions.empty")}</p>;
  return (
    <section className="stack" aria-labelledby="extensions-packages">
      <h2 id="extensions-packages">{t("approvals.extensions.packages")}</h2>
      <ul className="stack" data-testid="extensions-list">
        {packages.map((item) => (
          <li key={item.sha256} className="card" data-testid="extension-row">
            <div className="row">
              <PackageCheck size={16} aria-hidden />
              <strong>
                {item.distribution} {item.version}
              </strong>
              <Badge tone={item.state === "sandboxed" ? "success" : "idle"}>
                {item.state === "sandboxed" ? t("approvals.extensions.sandboxed") : t("approvals.extensions.locked")}
              </Badge>
              <span className="row__end">
                <ConfirmIconButton
                  icon={Trash2}
                  label={t("approvals.extensions.remove", { name: item.distribution })}
                  confirmLabel={t("approvals.extensions.removeConfirm")}
                  busy={remove.isPending && remove.variables === item.sha256}
                  onConfirm={() => remove.mutate(item.sha256)}
                  data-testid="extension-remove"
                />
                <ConfirmIconButton
                  icon={Ban}
                  label={t("approvals.extensions.revoke", { name: item.distribution })}
                  confirmLabel={t("approvals.extensions.revokeConfirm")}
                  busy={revoke.isPending && revoke.variables === item.sha256}
                  onConfirm={() => revoke.mutate(item.sha256)}
                  data-testid="extension-revoke"
                />
              </span>
            </div>
            <p className="small">
              {item.state !== "sandboxed" && lockReason(item.reason) ? t(`approvals.extensions.reasons.${lockReason(item.reason)!}`) : null}
              {item.state === "sandboxed" && item.tools?.length ? t("approvals.extensions.tools", { tools: item.tools.join(", ") }) : null}
            </p>
            <dl className="small">
              <dt>{t("approvals.extensions.hash")}</dt>
              <dd>
                <code title={item.sha256}>{shortHash(item.sha256)}</code>
              </dd>
              <dt>{t("approvals.extensions.originLabel")}</dt>
              <dd>{item.origin}</dd>
              <dt>{t("approvals.extensions.installedBy")}</dt>
              <dd>
                {item.installed_by}, {formatDate(item.installed_at)}
              </dd>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ExtensionsLink() {
  const { t } = useTranslation();
  const access = useAccess();
  if (!access.can("admin") || access.profile === "server") return null;
  return (
    <p className="small" data-testid="extensions-link">
      <PackageCheck size={14} aria-hidden /> <Link to="/approvals/extensions">{t("approvals.extensions.link")}</Link>
    </p>
  );
}
