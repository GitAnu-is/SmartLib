function assertFetch() {
  if (typeof fetch !== 'function') {
    throw new Error(
      'Global fetch() is not available. Please use Node.js 18+ or add a fetch polyfill.'
    );
  }
}

function withTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, cancel: () => clearTimeout(id) };
}

async function ollamaChat({
  baseUrl,
  model,
  messages,
  temperature = 0.2,
  top_p = 0.9,
  num_predict,
  timeoutMs = 30000,
}) {
  assertFetch();

  const url = `${String(baseUrl || 'http://127.0.0.1:11434').replace(/\/$/, '')}/api/chat`;

  const { controller, cancel } = withTimeout(timeoutMs);
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages,
        options: {
          temperature,
          top_p,
          ...(typeof num_predict === 'number' ? { num_predict } : null),
        },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Ollama error ${resp.status}: ${text || resp.statusText}`);
    }

    const data = await resp.json();
    return {
      content: data?.message?.content || '',
      raw: data,
    };
  } finally {
    cancel();
  }
}

module.exports = {
  ollamaChat,
};
