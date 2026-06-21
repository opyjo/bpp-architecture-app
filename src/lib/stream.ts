/**
 * Streams an NDJSON endpoint and calls handlers for each event.
 */
export async function streamNDJSON(
  url: string,
  body: Record<string, unknown>,
  signal: AbortSignal,
  onChunk: (text: string, accumulated: string) => void,
  onError: (message: string) => void,
  onDone?: (accumulated: string) => void
): Promise<string> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `API error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      let event: { type: string; text?: string; message?: string };
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }

      switch (event.type) {
        case "text_delta":
          accumulated += event.text ?? "";
          onChunk(event.text ?? "", accumulated);
          break;
        case "error":
          onError(event.message ?? "Unknown error");
          break;
        case "done":
          onDone?.(accumulated);
          break;
      }
    }
  }

  return accumulated;
}
