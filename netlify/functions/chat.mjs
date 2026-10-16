// POST /api/chat  { message, history }  ->  streamed plain-text answer from Groq.
// GET  /api/chat                          ->  { ok, configured } (used by the widget).
// Needs the environment variable GROQ_API_KEY (Netlify: Site configuration → Environment variables).
import { PROFILE } from './profile.mjs';

const MODELS = [
  process.env.GROQ_MODEL,
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'llama-3.1-8b-instant',
].filter(Boolean);
const EMAIL = 'prashanthnaga24@gmail.com';
const MAX_MESSAGE = 500;
const MAX_HISTORY = 6;

const SYSTEM = `You are Prashanth Nagarajan's AI assistant on his portfolio website, speaking as Prashanth (a QA Engineering Lead) in the first person.
- Answer ONLY from the knowledge base below. Never invent or guess information.
- If the answer is not in the knowledge base, say you don't know and suggest emailing ${EMAIL}.
- Never share personal details such as age, date of birth, phone number, home address or salary expectations.
- Be professional, friendly and concise: under about 120 words unless the user asks for detail.
- Format with short paragraphs or bullet points and **bold** for key facts. Do not use tables or headings.

Knowledge base:
${PROFILE}`;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// Only answer browsers on this site (or a local preview). This blocks casual
// reuse from other websites; it is not a substitute for a rate limit.
function originAllowed(req) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const self = new URL(req.url);
    if (o.host === self.host) return true;
    if (o.hostname === 'localhost' || o.hostname === '127.0.0.1') return true;
    const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    return extra.includes(origin);
  } catch {
    return false;
  }
}

function cleanHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
}

async function openStream(key, messages) {
  for (const model of MODELS) {
    const payload = { model, messages, temperature: 0.4, max_tokens: 700, stream: true };
    if (model.startsWith('openai/gpt-oss')) payload.reasoning_effort = 'low';
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(25000),
      });
      if (r.ok && r.body) return r;
      // Rate limited / retired model / outage: try the next model straight away
      console.log(`Groq ${model} failed: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
    } catch (e) {
      console.log(`Groq ${model} error: ${e.message}`);
    }
  }
  return null;
}

// Turn Groq's OpenAI-style SSE into a plain text stream of the answer.
function toTextStream(upstream) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  return new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      let buffer = '';
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const data = t.slice(5).trim();
            if (data === '[DONE]') continue;
            try {
              const delta = JSON.parse(data).choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(enc.encode(delta));
            } catch {
              /* ignore keep-alive or partial lines */
            }
          }
        }
      } catch (e) {
        console.log('stream error:', e.message);
      }
      controller.close();
    },
  });
}

export default async (req) => {
  if (req.method === 'GET') return json({ ok: true, configured: Boolean(process.env.GROQ_API_KEY) });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!originAllowed(req)) return json({ error: 'forbidden' }, 403);

  const key = process.env.GROQ_API_KEY;
  if (!key) return json({ error: 'not_configured' }, 503);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const message = String(body?.message ?? '').trim().slice(0, MAX_MESSAGE);
  if (!message) return json({ error: 'empty_message' }, 400);

  const messages = [{ role: 'system', content: SYSTEM }, ...cleanHistory(body.history), { role: 'user', content: message }];
  const upstream = await openStream(key, messages);
  if (!upstream) return json({ error: 'upstream_unavailable' }, 502);

  return new Response(toTextStream(upstream), {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
};

export const config = { path: '/api/chat' };
