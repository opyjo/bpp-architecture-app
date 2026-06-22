import { GITHUB_REPOS } from "@/lib/ai/tools";
import { allServiceDeepDives } from "@/data/service-deep-dives";
import { kafkaEvents } from "@/data/events";
import { lambdaFunctions } from "@/data/lambdas";

export const runtime = "nodejs";

const REPO_FULL_NAME = GITHUB_REPOS["go-repo-new"] ?? "opyjo/mygorepo";
const [REPO_OWNER, REPO_NAME] = REPO_FULL_NAME.split("/");

const SKIP_DIRS = new Set(["vendor", "testdata", "mocks", "mock"]);

/**
 * Normalize a service name for fair comparison: lowercase and strip a single
 * trailing "-api" or "-service" suffix. Originals are kept separately for display.
 */
function normalizeServiceName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/-(api|service)$/i, "");
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      { error: "GITHUB_TOKEN is not configured. Add it to .env.local" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        // The recursive tree response exceeds Next's 2MB fetch-cache limit,
        // so skip the data cache (drift is an explicit, on-demand check anyway).
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return Response.json(
        { error: `GitHub API error: ${res.status}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const tree: { path: string; type: string }[] = data.tree ?? [];

    // Derive the set of immediate child directory names under "services/".
    // Display map keeps the original casing/name keyed by normalized name.
    const codeDisplayByNorm = new Map<string, string>();
    for (const item of tree) {
      if (!item.path.startsWith("services/")) continue;
      const segments = item.path.split("/");
      const serviceDir = segments[1];
      if (!serviceDir) continue;
      if (SKIP_DIRS.has(serviceDir.toLowerCase())) continue;
      // Skip if any path segment is a vendor/testdata/mock dir
      if (segments.some((s) => SKIP_DIRS.has(s.toLowerCase()))) continue;
      const norm = normalizeServiceName(serviceDir);
      if (!norm) continue;
      if (!codeDisplayByNorm.has(norm)) {
        codeDisplayByNorm.set(norm, serviceDir);
      }
    }

    // Build the set of documented service names from curated deep dives.
    const docDisplayByNorm = new Map<string, string>();
    for (const svc of allServiceDeepDives) {
      const norm = normalizeServiceName(svc.name);
      if (!norm) continue;
      if (!docDisplayByNorm.has(norm)) {
        docDisplayByNorm.set(norm, svc.name);
      }
    }

    const matched: string[] = [];
    const inCodeOnly: string[] = [];
    const inDocsOnly: string[] = [];

    for (const [norm, display] of codeDisplayByNorm) {
      if (docDisplayByNorm.has(norm)) {
        matched.push(display);
      } else {
        inCodeOnly.push(display);
      }
    }

    for (const [norm, display] of docDisplayByNorm) {
      if (!codeDisplayByNorm.has(norm)) {
        inDocsOnly.push(display);
      }
    }

    matched.sort((a, b) => a.localeCompare(b));
    inCodeOnly.sort((a, b) => a.localeCompare(b));
    inDocsOnly.sort((a, b) => a.localeCompare(b));

    return Response.json({
      repo: REPO_FULL_NAME,
      generatedAt: new Date().toISOString(),
      services: { matched, inCodeOnly, inDocsOnly },
      counts: {
        codeServices: codeDisplayByNorm.size,
        docServices: docDisplayByNorm.size,
        events: kafkaEvents.length,
        lambdas: lambdaFunctions.length,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to check drift";
    return Response.json({ error: message }, { status: 500 });
  }
}
