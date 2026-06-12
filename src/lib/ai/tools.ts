const GITHUB_REPOS: Record<string, string> = {
  "go-repo-new": "opyjo/mygorepo",
  "node-mono-real": "opyjo/node_mono0906",
};

function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is not configured. Add it to .env.local");
  }
  return token;
}

function githubHeaders(accept?: string): Record<string, string> {
  return {
    Authorization: `Bearer ${getGitHubToken()}`,
    Accept: accept ?? "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function parseRepoPath(filePath: string): { owner: string; repo: string; path: string } {
  const parts = filePath.split("/");
  const repoName = parts[0];
  const fullName = GITHUB_REPOS[repoName];
  if (!fullName) {
    throw new Error(
      `Path must start with "go-repo-new/" or "node-mono-real/". Got: "${filePath}"`
    );
  }
  const [owner, repo] = fullName.split("/");
  const repoPath = parts.slice(1).join("/");
  return { owner, repo, path: repoPath };
}

export const toolDefinitions = [
  {
    name: "read_file" as const,
    description:
      "Read the contents of a file from either go-repo-new or node-mono-real. Path must start with the repo name (e.g. go-repo-new/services/reseller-service/cmd/main.go).",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string" as const,
          description:
            'File path starting with "go-repo-new/" or "node-mono-real/"',
        },
        offset: {
          type: "number" as const,
          description: "Line number to start reading from (0-indexed, default 0)",
        },
        limit: {
          type: "number" as const,
          description: "Maximum number of lines to read (default 500)",
        },
      },
      required: ["path"] as const,
    },
  },
  {
    name: "search_files" as const,
    description:
      "Search for a text pattern across files in either repo using GitHub Code Search. Returns matching file paths with text fragments. Note: only plain text queries are supported (no regex). Use read_file to see exact line numbers.",
    input_schema: {
      type: "object" as const,
      properties: {
        pattern: {
          type: "string" as const,
          description: "Text pattern to search for (plain text, not regex)",
        },
        path: {
          type: "string" as const,
          description:
            'Directory to search in, starting with "go-repo-new/" or "node-mono-real/"',
        },
        glob: {
          type: "string" as const,
          description: 'File extension filter (e.g. "*.go", "*.tsx")',
        },
      },
      required: ["pattern", "path"] as const,
    },
  },
  {
    name: "list_directory" as const,
    description:
      "List the contents of a directory in either repo. Returns file and directory names with type indicators.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: {
          type: "string" as const,
          description:
            'Directory path starting with "go-repo-new/" or "node-mono-real/"',
        },
      },
      required: ["path"] as const,
    },
  },
];

export type ToolName = (typeof toolDefinitions)[number]["name"];

export async function executeTool(
  name: ToolName,
  input: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      case "read_file":
        return await readFile(
          input.path as string,
          (input.offset as number) ?? 0,
          (input.limit as number) ?? 500
        );
      case "search_files":
        return await searchFiles(
          input.pattern as string,
          input.path as string,
          input.glob as string | undefined
        );
      case "list_directory":
        return await listDirectory(input.path as string);
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

async function readFile(filePath: string, offset: number, limit: number): Promise<string> {
  const { owner, repo, path } = parseRepoPath(filePath);
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, { headers: githubHeaders() });

  if (res.status === 404) {
    return `File not found: ${filePath}`;
  }
  if (!res.ok) {
    return `GitHub API error (${res.status}): ${await res.text()}`;
  }

  const data = await res.json();

  if (Array.isArray(data)) {
    return `Path is a directory, not a file: ${filePath}`;
  }

  if (data.type !== "file" || !data.content) {
    return `Path is not a readable file: ${filePath}`;
  }

  const content = Buffer.from(data.content, "base64").toString("utf-8");
  const lines = content.split("\n");
  const sliced = lines.slice(offset, offset + limit);
  const numbered = sliced.map((line: string, i: number) => `${offset + i + 1}: ${line}`);
  const result = numbered.join("\n");
  const totalLines = lines.length;
  const header = `File: ${filePath} (${totalLines} lines total, showing ${offset + 1}-${Math.min(offset + limit, totalLines)})\n`;
  return header + result;
}

async function searchFiles(
  pattern: string,
  searchPath: string,
  glob?: string
): Promise<string> {
  const parts = searchPath.split("/");
  const repoName = parts[0];
  const fullName = GITHUB_REPOS[repoName];
  if (!fullName) {
    throw new Error(
      `Path must start with "go-repo-new/" or "node-mono-real/". Got: "${searchPath}"`
    );
  }

  // Build GitHub Code Search query
  let query = `${pattern} repo:${fullName}`;

  // Add path qualifier if searching in a subdirectory
  const subPath = parts.slice(1).join("/");
  if (subPath) {
    query += ` path:${subPath}`;
  }

  // Map glob pattern to extension qualifier
  if (glob) {
    const extMatch = glob.match(/^\*\.(\w+)$/);
    if (extMatch) {
      query += ` extension:${extMatch[1]}`;
    }
  }

  const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=50`;
  const res = await fetch(url, {
    headers: githubHeaders("application/vnd.github.text-match+json"),
  });

  if (res.status === 403 || res.status === 429) {
    return `GitHub API rate limit exceeded. Please wait a moment and try again.`;
  }
  if (!res.ok) {
    return `GitHub Search API error (${res.status}): ${await res.text()}`;
  }

  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    return "No matches found.";
  }

  const lines: string[] = [];
  for (const item of data.items.slice(0, 50)) {
    const filePath = `${repoName}/${item.path}`;
    if (item.text_matches && item.text_matches.length > 0) {
      for (const match of item.text_matches) {
        const fragment = (match.fragment as string)
          .split("\n")
          .map((l: string) => l.trim())
          .filter((l: string) => l.length > 0)
          .join(" | ");
        lines.push(`${filePath}: ${fragment}`);
      }
    } else {
      lines.push(filePath);
    }
  }

  return lines.join("\n") || "No matches found.";
}

async function listDirectory(dirPath: string): Promise<string> {
  const { owner, repo, path } = parseRepoPath(dirPath);
  const url = path
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    : `https://api.github.com/repos/${owner}/${repo}/contents`;
  const res = await fetch(url, { headers: githubHeaders() });

  if (res.status === 404) {
    return `Directory not found: ${dirPath}`;
  }
  if (!res.ok) {
    return `GitHub API error (${res.status}): ${await res.text()}`;
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    return `Path is a file, not a directory: ${dirPath}`;
  }

  const dirs = data
    .filter((e: { type: string }) => e.type === "dir")
    .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
    .map((e: { name: string }) => `${e.name}/`);
  const files = data
    .filter((e: { type: string }) => e.type === "file")
    .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
    .map((e: { name: string }) => e.name);

  return `Directory: ${dirPath}\n${[...dirs, ...files].join("\n")}`;
}
