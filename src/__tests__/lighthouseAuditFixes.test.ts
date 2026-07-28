import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Lighthouse Audit Fixes Verification', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const robotsTxtPath = path.join(rootDir, 'public/robots.txt');

  it('index.html has meta description tag', () => {
    const html = fs.readFileSync(indexHtmlPath, 'utf-8');
    expect(html).toMatch(/name="description"/);
  });

  it('index.html viewport does not disable user scaling', () => {
    const html = fs.readFileSync(indexHtmlPath, 'utf-8');
    expect(html).not.toContain('user-scalable=no');
    expect(html).not.toContain('maximum-scale=1.0');
  });

  it('public/robots.txt exists and has valid syntax', () => {
    expect(fs.existsSync(robotsTxtPath)).toBe(true);
    const content = fs.readFileSync(robotsTxtPath, 'utf-8');
    expect(content).toContain('User-agent:');
    expect(content).not.toContain('<!doctype html>');
  });
});
