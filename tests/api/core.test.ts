import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { HttpError } from '../../src/server/lib/errors.js';
import { AUTH, fakeAi, testApp } from '../helpers.js';

describe('core behaviour', () => {
  it('serves health without auth', async () => {
    const res = await request(testApp(fakeAi())).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('sets security headers including a strict CSP', async () => {
    const res = await request(testApp(fakeAi())).get('/api/health');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).toContain("object-src 'none'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('sends a strict CSP without inline-style allowance, a permissions policy, and no-store on the API', async () => {
    const res = await request(testApp(fakeAi())).get('/api/health');
    const csp = String(res.headers['content-security-policy']);
    expect(csp).toContain("style-src 'self';");
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).toContain('upgrade-insecure-requests');
    expect(res.headers['permissions-policy']).toContain('payment=()');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('rejects AI routes without a token (401)', async () => {
    const res = await request(testApp(fakeAi())).post('/api/safety').send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('rejects an invalid token (401)', async () => {
    const res = await request(testApp(fakeAi())).post('/api/safety').set('Authorization', 'Bearer nope').send({});
    expect(res.status).toBe(401);
  });

  it('returns 400 with a message for invalid input', async () => {
    const res = await request(testApp(fakeAi())).post('/api/safety').set(AUTH).send({ situation: 'flying' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('bad_request');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(testApp(fakeAi())).post('/api/safety').set(AUTH).set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
  });

  it('rejects oversized JSON bodies (413)', async () => {
    const res = await request(testApp(fakeAi())).post('/api/grievance/draft').set(AUTH).send({ story: 'x'.repeat(200_000) });
    expect(res.status).toBe(413);
  });

  it('surfaces AI failures as a friendly 502 without internals', async () => {
    const ai = fakeAi({ fail: new HttpError('ai_unavailable', 'Saathi is very busy right now. Please try again in a minute.') });
    const res = await request(testApp(ai)).post('/api/safety').set(AUTH).send({ situation: 'heat', work_type: null, state: null, language: 'en' });
    expect(res.status).toBe(502);
    expect(res.body.error.message).toMatch(/busy/);
  });

  it('hides unexpected errors behind a generic 500', async () => {
    const ai = fakeAi({ fail: new Error('secret stack detail') });
    const res = await request(testApp(ai)).post('/api/safety').set(AUTH).send({ situation: 'heat', work_type: null, state: null, language: 'en' });
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it('rate limits AI routes per user (429)', async () => {
    const ai = fakeAi({ json: () => ({ summary: 's', do_now: ['a'], avoid: [], get_help: [] }) });
    const app = testApp(ai);
    const body = { situation: 'heat', work_type: null, state: null, language: 'en' };
    let last = 0;
    for (let i = 0; i < 22; i++) last = (await request(app).post('/api/safety').set(AUTH).send(body)).status;
    expect(last).toBe(429);
  });
});
