const { test, expect } = require('@playwright/test');
const http = require('http');

let server;
let baseURL;
const records = new Map();

function keyOf(body) {
  return `${body.deviceId}:${body.localSurveyId}`;
}

test.beforeAll(async () => {
  server = http.createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/sync-survey') {
      response.writeHead(404).end();
      return;
    }
    let raw = '';
    for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw);
    if (!body.deviceId || !body.localSurveyId || !body.payload) {
      response.writeHead(400, { 'content-type': 'application/json' }).end(JSON.stringify({ error: 'invalid request' }));
      return;
    }
    const key = keyOf(body);
    const prior = records.get(key);
    if (prior) {
      response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ...prior, duplicate: true }));
      return;
    }
    const created = { serverSurveyId: `srv-${records.size + 1}`, deviceId: body.deviceId, localSurveyId: body.localSurveyId, payload: body.payload };
    records.set(key, created);
    response.writeHead(201, { 'content-type': 'application/json' }).end(JSON.stringify(created));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(() => server.close());

test('namespaces duplicate offline IDs by device and makes retries idempotent', async ({ request }) => {
  const ankit = { deviceId: 'ankit-device', localSurveyId: 'School_1', payload: { school: 'Govt Primary School', respondent: 'A' } };
  const pooja = { deviceId: 'pooja-device', localSurveyId: 'School_1', payload: { school: 'Govt Primary School', respondent: 'P' } };

  const first = await request.post(`${baseURL}/sync-survey`, { data: ankit });
  const second = await request.post(`${baseURL}/sync-survey`, { data: pooja });
  const retry = await request.post(`${baseURL}/sync-survey`, { data: ankit });

  expect(first.status()).toBe(201);
  expect(second.status()).toBe(201);
  expect((await first.json()).serverSurveyId).not.toBe((await second.json()).serverSurveyId);
  expect(retry.status()).toBe(200);
  expect((await retry.json()).duplicate).toBe(true);
  expect(records.size).toBe(2);
});

test('rejects an incomplete sync payload without creating a record', async ({ request }) => {
  const response = await request.post(`${baseURL}/sync-survey`, { data: { deviceId: 'test-device', localSurveyId: 'School_2' } });
  expect(response.status()).toBe(400);
  expect(records.has('test-device:School_2')).toBe(false);
});
