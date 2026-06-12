import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const REPO_ROOTS: Record<string, string> = {
  "go-repo-new": "/Users/opyjo/Desktop/go-repo-new",
  "node-mono-real": "/Users/opyjo/Desktop/node-mono-real",
};

function resolveSafePath(filePath: string): string {
  const parts = filePath.split("/");
  const repoName = parts[0];
  const root = REPO_ROOTS[repoName];
  if (!root) {
    throw new Error(
      `Path must start with "go-repo-new/" or "node-mono-real/". Got: "${filePath}"`
    );
  }
  const resolved = path.resolve(root, "..", filePath);
  const allowedBase = path.resolve(root);
  if (!resolved.startsWith(allowedBase)) {
    throw new Error("Path traversal detected");
  }
  return resolved;
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
      "Search for a pattern (regex) across files in either repo using ripgrep. Returns matching lines with file paths.",
    input_schema: {
      type: "object" as const,
      properties: {
        pattern: {
          type: "string" as const,
          description: "Regex pattern to search for",
        },
        path: {
          type: "string" as const,
          description:
            'Directory to search in, starting with "go-repo-new/" or "node-mono-real/"',
        },
        glob: {
          type: "string" as const,
          description: 'File glob filter (e.g. "*.go", "*.tsx")',
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

export function executeTool(
  name: ToolName,
  input: Record<string, unknown>
): string {
  try {
    switch (name) {
      case "read_file":
        return readFile(
          input.path as string,
          (input.offset as number) ?? 0,
          (input.limit as number) ?? 500
        );
      case "search_files":
        return searchFiles(
          input.pattern as string,
          input.path as string,
          input.glob as string | undefined
        );
      case "list_directory":
        return listDirectory(input.path as string);
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

function readFile(filePath: string, offset: number, limit: number): string {
  const resolved = resolveSafePath(filePath);
  if (!fs.existsSync(resolved)) {
    return `File not found: ${filePath}`;
  }
  const stat = fs.statSync(resolved);
  if (stat.isDirectory()) {
    return `Path is a directory, not a file: ${filePath}`;
  }
  const content = fs.readFileSync(resolved, "utf-8");
  const lines = content.split("\n");
  const sliced = lines.slice(offset, offset + limit);
  const numbered = sliced.map((line, i) => `${offset + i + 1}: ${line}`);
  const result = numbered.join("\n");
  const totalLines = lines.length;
  const header = `File: ${filePath} (${totalLines} lines total, showing ${offset + 1}-${Math.min(offset + limit, totalLines)})\n`;
  return header + result;
}

function searchFiles(
  pattern: string,
  searchPath: string,
  glob?: string
): string {
  const resolved = resolveSafePath(searchPath);
  if (!fs.existsSync(resolved)) {
    return `Path not found: ${searchPath}`;
  }

  const args = ["--no-heading", "-n", "--max-count=50"];
  if (glob) {
    args.push("--glob", glob);
  }
  args.push("--", pattern, resolved);

  try {
    const output = execFileSync("rg", args, {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
      encoding: "utf-8",
    });

    // Replace absolute paths with relative repo paths
    const repoBase = path.resolve(resolved, "..");
    const relativized = output
      .split("\n")
      .slice(0, 50)
      .map((line) => {
        for (const [repoName, root] of Object.entries(REPO_ROOTS)) {
          if (line.startsWith(root)) {
            return line.replace(root, repoName);
          }
        }
        return line.replace(repoBase + "/", "");
      })
      .join("\n");

    return relativized || "No matches found.";
  } catch (err) {
    if (
      err instanceof Error &&
      "status" in err &&
      (err as NodeJS.ErrnoException & { status: number }).status === 1
    ) {
      return "No matches found.";
    }
    return `Search error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

function listDirectory(dirPath: string): string {
  const resolved = resolveSafePath(dirPath);
  if (!fs.existsSync(resolved)) {
    return `Directory not found: ${dirPath}`;
  }
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    return `Path is a file, not a directory: ${dirPath}`;
  }

  const entries = fs.readdirSync(resolved, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => `${e.name}/`);
  const files = entries
    .filter((e) => e.isFile())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((e) => e.name);

  return `Directory: ${dirPath}\n${[...dirs, ...files].join("\n")}`;
}
