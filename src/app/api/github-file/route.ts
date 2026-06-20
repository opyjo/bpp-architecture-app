import { executeTool } from "@/lib/ai/tools";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();
  const path: string = body.path ?? "";

  if (!path.trim()) {
    return Response.json({ error: "No file path provided" }, { status: 400 });
  }

  try {
    const rawOutput = await executeTool("read_file", { path });

    if (rawOutput.startsWith("Error:") || rawOutput.startsWith("File not found:")) {
      return Response.json({ error: rawOutput }, { status: 404 });
    }

    // Strip the header line and line-number prefixes
    const lines = rawOutput.split("\n");
    // First line is the header like "File: ... (N lines total, showing ...)"
    const contentLines = lines.slice(1).map((line) => {
      // Remove line-number prefix like "123: "
      return line.replace(/^\d+: /, "");
    });

    return Response.json({ content: contentLines.join("\n") });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read file";
    return Response.json({ error: message }, { status: 500 });
  }
}
