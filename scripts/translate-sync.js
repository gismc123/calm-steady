#!/usr/bin/env node
'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');

const EN_PATH = path.join(__dirname, '..', 'locales', 'en.json');
const ES_PATH = path.join(__dirname, '..', 'locales', 'es.json');
const OLLAMA_HOST = 'localhost';
const OLLAMA_PORT = 11434;
const MODEL = 'qwen3:8b';

const CHECK_MODE = process.argv.includes('--check');

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ollamaTranslate(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      stream: false,
      messages: [
        {
          role: 'system',
          content: 'You are a professional Spanish translator. This app helps people manage anxiety and relationship stress. Translate naturally and warmly. Return ONLY the translated text with no explanation, no quotes, no extra formatting. Preserve any HTML tags exactly as-is. Preserve any placeholders like {level}, {n}, {total}, {prev}, {time}, {s} exactly as-is.'
        },
        {
          role: 'user',
          content: `Translate to Spanish: ${text}`
        }
      ]
    });

    const req = http.request(
      { host: OLLAMA_HOST, port: OLLAMA_PORT, path: '/v1/chat/completions', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const translated = parsed.choices?.[0]?.message?.content?.trim();
            if (!translated) reject(new Error('Empty response from Ollama'));
            else resolve(translated);
          } catch (e) {
            reject(new Error('Failed to parse Ollama response: ' + e.message));
          }
        });
      }
    );

    req.on('error', err => {
      if (err.code === 'ECONNREFUSED') {
        reject(new Error('OLLAMA_OFFLINE'));
      } else {
        reject(err);
      }
    });

    req.write(body);
    req.end();
  });
}

async function main() {
  const en = loadJSON(EN_PATH);
  const es = loadJSON(ES_PATH);

  const missingKeys = Object.keys(en).filter(k => !(k in es));

  if (missingKeys.length === 0) {
    console.log('✓ No drift detected. locales/es.json is fully in sync.');
    return;
  }

  if (CHECK_MODE) {
    console.log(`⚠ Drift detected: ${missingKeys.length} key(s) in en.json are missing from es.json:`);
    missingKeys.forEach(k => console.log(`  - ${k}: "${en[k]}"`));
    return;
  }

  console.log(`Translating ${missingKeys.length} missing key(s) via Ollama (${MODEL})...`);

  let added = 0;
  for (const key of missingKeys) {
    const value = en[key];
    if (typeof value !== 'string') {
      es[key] = value;
      added++;
      continue;
    }
    try {
      const translated = await ollamaTranslate(value);
      es[key] = translated;
      added++;
      console.log(`  ✓ ${key}`);
    } catch (err) {
      if (err.message === 'OLLAMA_OFFLINE') {
        console.warn('\n⚠ Warning: Ollama is not reachable (connection refused).');
        console.warn('  Run "ollama serve" and retry to translate missing keys.');
        console.warn(`  ${missingKeys.length - added} key(s) were not translated.`);
        process.exit(0);
      }
      console.error(`  ✗ Failed to translate "${key}": ${err.message}`);
    }
  }

  fs.writeFileSync(ES_PATH, JSON.stringify(es, null, 2) + '\n', 'utf8');
  console.log(`\n✓ Done. ${added} key(s) added to locales/es.json.`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
