import { GITHUB_REPOS } from "@/lib/ai/tools";

export const runtime = "nodejs";

const REPO_FULL_NAME = GITHUB_REPOS["go-repo-new"] ?? "opyjo/mygorepo";
const [REPO_OWNER, REPO_NAME] = REPO_FULL_NAME.split("/");

/** Curated list of the 10 most important subscription manager services */
const KEY_SERVICES = [
  { dir: "services/reseller-service", label: "reseller-service" },
  { dir: "services/subscriptions-aggregator-api", label: "subscriptions-aggregator-api" },
  { dir: "services/subscriber-manager-api", label: "subscriber-manager-api" },
  { dir: "services/catalog-api", label: "catalog-api" },
  { dir: "services/order-api", label: "order-api" },
  { dir: "services/auth-api", label: "auth-api" },
  { dir: "services/session-api", label: "session-api" },
  { dir: "services/token-api", label: "token-api" },
  { dir: "services/flow-runner-api", label: "flow-runner-api" },
  { dir: "services/core-processor-api-v1", label: "core-processor-api" },
];

const HANDLER_PATTERNS = [
  /handler\.go$/,
  /handlers\.go$/,
  /router\.go$/,
  /routes\.go$/,
  /server\.go$/,
  /api\.go$/,
  /endpoint\.go$/,
  /endpoints\.go$/,
  /controller\.go$/,
  /transport\.go$/,
];

const SKIP_DIRS = ["vendor", "testdata", "mocks", "mock"];

function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not configured");
  return token;
}

export async function GET() {
  try {
    const token = getGitHubToken();

    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return Response.json(
        { error: `GitHub API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const tree: { path: string; type: string }[] = data.tree ?? [];

    // Only include files under the curated service directories
    const allowedPrefixes = KEY_SERVICES.map((s) => s.dir + "/");

    const handlers = tree
      .filter((item) => {
        if (item.type !== "blob" || !item.path.endsWith(".go")) return false;
        if (!allowedPrefixes.some((p) => item.path.startsWith(p))) return false;
        const fileName = item.path.split("/").pop() ?? "";
        if (fileName.endsWith("_test.go")) return false;
        if (item.path.split("/").some((p) => SKIP_DIRS.includes(p))) return false;
        return HANDLER_PATTERNS.some((p) => p.test(fileName));
      })
      .map((item) => {
        const fullPath = `go-repo-new/${item.path}`;
        const parts = item.path.split("/");
        const service =
          KEY_SERVICES.find((s) => item.path.startsWith(s.dir + "/"))?.label ??
          parts[1];
        return {
          path: fullPath,
          fileName: parts[parts.length - 1],
          service,
          relativePath: item.path,
        };
      })
      .sort(
        (a, b) =>
          a.service.localeCompare(b.service) ||
          a.fileName.localeCompare(b.fileName)
      );

    return Response.json({ handlers });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list handlers";
    return Response.json({ error: message }, { status: 500 });
  }
}
