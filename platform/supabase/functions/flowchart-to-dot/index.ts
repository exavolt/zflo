// Edge Function: flowchart-to-dot
// Accepts: POST /flowchart-to-dot
// Body: multipart/form-data with file field "file" OR JSON { base64Image, mimeType }
// Auth: Optional Bearer token; if provided, validated against Supabase /auth/v1/user. Anonymous allowed.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY'); // Gemini API key (Google Cloud API key)
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not set');
}

import { corsHeaders } from '../_shared/cors.ts';

async function validateSupabaseToken(authorizationHeader: any) {
  if (!authorizationHeader) return { ok: false, user: null, status: 401 };
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        Authorization: authorizationHeader,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) return { ok: false, status: res.status };
    const user = await res.json();
    return { ok: true, user };
  } catch (e) {
    console.error('Error validating token', e);
    return { ok: false, status: 500 };
  }
}

async function parseRequest(req) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await req.json();
    if (!body.base64Image || !body.mimeType)
      throw new Error('Missing base64Image or mimeType in JSON body');
    return { base64Image: body.base64Image, mimeType: body.mimeType };
  }

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    if (!file) throw new Error('No file field in form');
    const blob = file instanceof File ? file : null;
    if (!blob) throw new Error('Invalid file upload');
    const arrayBuffer = await blob.arrayBuffer();
    const base64Image = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );
    return { base64Image, mimeType: blob.type || 'image/png' };
  }

  throw new Error(
    'Unsupported content type. Use application/json or multipart/form-data'
  );
}

// Call Gemini REST API (Generative Language) to analyze image and return DOT or NO_FLOWCHART_DETECTED
async function callGemini(base64Image: string, mimeType: string) {
  // Construct the request following the Generative Language API (v1beta2) generate endpoint.
  // We put the image as an input "content" blob in the "input" model spec.
  // Note: If your Google Cloud setup uses an OAuth token/service account, replace the API key approach.

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const prompt = `
Analyze the provided image. Your primary task is to determine if it contains a flowchart.

If the image is a flowchart, convert it into the Graphviz DOT language format. Follow these rules strictly:
1.  The output must be ONLY the Graphviz DOT code.
2.  Do not include any explanations, comments, or markdown formatting like \`\`\`dot or \`\`\`graphviz.
3.  Start the output directly with \`digraph G {\` or \`graph G {\`.
4.  End the output directly with \`}\`.
5.  Represent nodes and edges accurately based on the flowchart's structure and text. Use double quotes for labels containing spaces or special characters.
6.  Use appropriate shapes for different flowchart symbols (e.g., box for process, diamond for decision, ellipse for start/end).

If the image does NOT contain a flowchart, your ONLY output should be the exact string: "NO_FLOWCHART_DETECTED". Do not add any other text.
`;

  const textPart = {
    text: prompt,
  };

  const imagePart = {
    inlineData: {
      mimeType: mimeType,
      data: base64Image,
    },
  };

  // Build a minimal request that attaches the image as an input.
  const body = {
    model: GEMINI_MODEL,
    contents: { parts: [imagePart, textPart] },
    generationConfig: {
      candidateCount: 1,
      //maxOutputTokens: 1024,
      temperature: 0.7,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${txt}`);
  }

  const data = await res.json();
  // Response shape: look for text output in data.candidates[0].output or data.output or data.generated_text
  let text = null;
  let contentPart = null;
  if (data.candidates && data.candidates.length && data.candidates[0].content) {
    // Some variants: content is an array of parts
    const content = data.candidates[0].content;
    if (Array.isArray(content.parts)) {
      for (const part of content.parts) {
        contentPart = part;
        if ('text' in part && part.text) {
          text = part.text;
          break;
        }
      }
    }
  }

  if (!text) {
    console.log(data);
    console.log(contentPart);
    throw new Error('Empty response from Gemini');
  }
  return text;
}

console.info('Flowchart-to-DOT function started');

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST')
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders,
      });

    // Validate auth if provided; anonymous allowed
    const authHeader = req.headers.get('authorization');
    const validation = await validateSupabaseToken(authHeader);
    if (!validation.ok)
      return new Response('Unauthorized', {
        status: 401,
        headers: corsHeaders,
      });

    // Parse request
    let parsed: { base64Image: any; mimeType: any };
    try {
      parsed = await parseRequest(req);
    } catch (e) {
      return new Response(e.message || 'Bad Request', {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!GEMINI_API_KEY)
      return new Response(
        'Server configuration error: GEMINI_API_KEY not set',
        { status: 500, headers: corsHeaders }
      );

    // Call Gemini
    let resultText: string;
    try {
      resultText = await callGemini(parsed.base64Image, parsed.mimeType);
    } catch (e: unknown) {
      console.error('Gemini call failed', e);
      return new Response('Failed to process image with Gemini API', {
        status: 502,
        headers: corsHeaders,
      });
    }

    // Strict output rules: either DOT starting with digraph/graph and ending with }, or exact NO_FLOWCHART_DETECTED
    if (resultText === 'NO_FLOWCHART_DETECTED') {
      return new Response(JSON.stringify({ result: 'NO_FLOWCHART_DETECTED' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Ensure result looks like DOT
    const trimmed = resultText.trim();
    const startsProper =
      trimmed.startsWith('digraph G {') || trimmed.startsWith('graph G {');
    const endsProper = trimmed.endsWith('}');
    if (!startsProper || !endsProper) {
      // Try to extract DOT block from response
      const startIdx =
        trimmed.indexOf('digraph G {') !== -1
          ? trimmed.indexOf('digraph G {')
          : trimmed.indexOf('graph G {');
      if (startIdx !== -1) {
        const extracted = trimmed.slice(startIdx);
        // find last closing brace
        const lastBrace = extracted.lastIndexOf('}');
        if (lastBrace !== -1) {
          const dot = extracted.slice(0, lastBrace + 1).trim();
          return new Response(JSON.stringify({ data: dot }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }
      // If we get here, return the raw text but with 502 to indicate model output unexpected
      return new Response(JSON.stringify({ data: resultText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ data: trimmed }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Unhandled error', err);
    return new Response('Internal Server Error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});
