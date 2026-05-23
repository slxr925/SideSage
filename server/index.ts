import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatRequest = {
  apiKey?: string;
  model?: string;
  providerBaseUrl?: string;
  language?: string;
  messages?: ChatMessage[];
};

const port = Number(process.env.PORT ?? 8787);
const defaultModel = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
const defaultProviderBaseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "POST" && request.url === "/api/chat") {
    await handleChat(request, response);
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`SideSage proxy listening on http://127.0.0.1:${port}`);
});

async function handleChat(request: IncomingMessage, response: ServerResponse) {
  let body: ChatRequest;
  try {
    body = JSON.parse(await readBody(request)) as ChatRequest;
  } catch {
    sendJson(response, 400, { error: "Invalid JSON body" });
    return;
  }

  const apiKey = body.apiKey?.trim() || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    sendJson(response, 500, {
      error: "Missing API key. Set it in SideSage settings or start the server with OPENAI_API_KEY=..."
    });
    return;
  }

  const messages = body.messages ?? [];
  if (!Array.isArray(messages) || messages.length === 0) {
    sendJson(response, 400, { error: "messages must contain at least one item" });
    return;
  }

  if (
    messages.some(
      (message) =>
        (message.role !== "user" && message.role !== "assistant") ||
        typeof message.content !== "string" ||
        !message.content.trim()
    )
  ) {
    sendJson(response, 400, {
      error: "messages must be user or assistant objects with non-empty content"
    });
    return;
  }

  let providerBaseUrl: string;
  try {
    providerBaseUrl = normalizeProviderBaseUrl(body.providerBaseUrl || defaultProviderBaseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid provider base URL";
    sendJson(response, 400, { error: message });
    return;
  }

  const openaiResponse = await fetch(`${providerBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: body.model || defaultModel,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are a concise, helpful assistant embedded in a browser side panel. Answer clearly and preserve important details from selected webpage text."
            + (body.language === "zh" ? " Always respond in Simplified Chinese (简体中文)." : "")
        },
        ...messages
      ]
    })
  });

  if (!openaiResponse.ok || !openaiResponse.body) {
    const detail = await openaiResponse.text();
    sendJson(response, openaiResponse.status, {
      error: detail || `Provider request failed with ${openaiResponse.status}`
    });
    return;
  }

  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });

  try {
    await forwardOpenAIStream(openaiResponse.body, response);
    response.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stream failed";
    response.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
  } finally {
    response.end();
  }
}

async function forwardOpenAIStream(stream: ReadableStream<Uint8Array>, response: ServerResponse) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const dataLine = chunk
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!dataLine) {
        continue;
      }

      const data = dataLine.slice(5).trim();
      if (!data || data === "[DONE]") {
        continue;
      }

      const event = JSON.parse(data) as {
        choices?: Array<{
          delta?: {
            content?: string;
          };
          finish_reason?: string | null;
        }>;
        error?: { message?: string };
      };

      if (event.error?.message) {
        throw new Error(event.error.message);
      }

      const delta = event.choices?.[0]?.delta?.content;
      if (delta) {
        response.write(`data: ${JSON.stringify({ type: "delta", delta })}\n\n`);
      }
    }
  }
}

function normalizeProviderBaseUrl(rawBaseUrl: string): string {
  const baseUrl = rawBaseUrl.trim().replace(/\/$/, "");
  const parsed = new URL(baseUrl);

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Provider base URL must start with http:// or https://");
  }

  return parsed.toString().replace(/\/$/, "");
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function setCorsHeaders(response: ServerResponse) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(response: ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}
