import fs from "node:fs/promises";
import path from "node:path";

const API = "https://api.github.com";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const perQuery = Number(process.env.HUNT_PER_QUERY || 12);
const maxCandidates = Number(process.env.HUNT_MAX_CANDIDATES || 80);

const queries = [
  "phaser typescript vite game template",
  "phaser typescript mobile game",
  "phaser typescript starter game",
  "phaser playable ad typescript",
  "phaser infinite runner typescript",
  "playcanvas typescript vite game",
  "playcanvas mobile game typescript",
  "html5 game typescript phaser"
];

const permissive = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "Unlicense"
]);

function headers() {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Oddropdev-game-factory-skeleton-hunt",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function api(url) {
  const response = await fetch(url, { headers: headers() });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 300)}`);
  }
  return response.json();
}

async function optionalContent(repo, file) {
  const url = `${API}/repos/${repo}/contents/${encodeURIComponent(file)}`;
  const response = await fetch(url, { headers: headers() });
  if (response.status === 404) return null;
  if (!response.ok) return null;
  const json = await response.json();
  if (!json?.content || json.encoding !== "base64") return null;
  return Buffer.from(json.content.replace(/\n/g, ""), "base64").toString("utf8");
}

function parsePackage(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function dependencyVersion(pkg, name) {
  return pkg?.dependencies?.[name] || pkg?.devDependencies?.[name] || null;
}

function scoreCandidate(candidate) {
  const pkg = candidate.packageJson;
  const readme = (candidate.readme || "").toLowerCase();
  const license = candidate.licenseSpdx;
  const phaser = dependencyVersion(pkg, "phaser");
  const playcanvas =
    dependencyVersion(pkg, "playcanvas") ||
    dependencyVersion(pkg, "@playcanvas/engine");
  const vite = dependencyVersion(pkg, "vite");
  const ts = dependencyVersion(pkg, "typescript");

  const gate =
    candidate.archived ? "FAIL_ARCHIVED" :
    !license ? "REVIEW_LICENSE" :
    permissive.has(license) ? "PASS_LICENSE" :
    "REVIEW_LICENSE";

  let score = 0;

  // Commercial/license safety — 15
  if (permissive.has(license)) score += 15;
  else if (license) score += 5;

  // Architecture/tooling proxy — 15
  if (phaser || playcanvas) score += 7;
  if (ts) score += 4;
  if (vite) score += 4;

  // Mobile/responsive proxy — 12
  if (/mobile|touch|pointer/.test(readme)) score += 6;
  if (/responsive|resize|portrait|landscape/.test(readme)) score += 6;

  // Build-health proxy — 10. Real build is a later gate.
  if (pkg?.scripts?.build) score += 6;
  if (pkg?.scripts?.dev || pkg?.scripts?.start) score += 4;

  // Data-driven/content proxy — 10
  if (/level|scene|state|json|data-driven|data driven/.test(readme)) score += 5;
  if (/asset|preload|loader/.test(readme)) score += 5;

  // Bundle/startup proxy — 10
  if (vite) score += 6;
  if (/bundle|size|performance|lightweight|fast/.test(readme)) score += 4;

  // TypeScript/tooling — 8
  if (ts) score += 5;
  if (/eslint|prettier|lint|format/.test(JSON.stringify(pkg || {}).toLowerCase())) score += 3;

  // Asset separation — 7
  if (/assets\//.test(readme) || /public\/assets/.test(readme)) score += 7;

  // Testability — 5
  if (pkg?.scripts?.test || /playwright|vitest|jest/.test(JSON.stringify(pkg || {}).toLowerCase())) score += 5;

  // Maintenance proxy — 4
  if (!candidate.archived) score += 2;
  const pushed = candidate.pushedAt ? Date.parse(candidate.pushedAt) : 0;
  if (pushed && Date.now() - pushed < 1000 * 60 * 60 * 24 * 365 * 2) score += 2;

  // AI-agent friendliness — 4
  if (/agent|mcp|claude|codex|cursor|skill/.test(readme)) score += 4;

  return {
    score,
    gate,
    signals: {
      license,
      phaser,
      playcanvas,
      vite,
      typescript: ts,
      hasBuild: Boolean(pkg?.scripts?.build),
      hasTests: Boolean(pkg?.scripts?.test)
    }
  };
}

async function main() {
  const discovered = new Map();

  for (const q of queries) {
    const url = `${API}/search/repositories?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=${perQuery}`;
    const data = await api(url);
    for (const repo of data.items || []) {
      if (discovered.size >= maxCandidates) break;
      if (!discovered.has(repo.full_name)) {
        discovered.set(repo.full_name, {
          repo: repo.full_name,
          htmlUrl: repo.html_url,
          description: repo.description,
          defaultBranch: repo.default_branch,
          archived: repo.archived,
          pushedAt: repo.pushed_at,
          sizeKb: repo.size,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          licenseSpdx: repo.license?.spdx_id || null,
          discoveredBy: q
        });
      }
    }
  }

  // Always include official anchors even if search rank changes.
  for (const repoName of [
    "phaserjs/template-vite-ts",
    "phaserjs/examples",
    "playcanvas/create-playcanvas"
  ]) {
    if (!discovered.has(repoName)) {
      const r = await api(`${API}/repos/${repoName}`);
      discovered.set(repoName, {
        repo: r.full_name,
        htmlUrl: r.html_url,
        description: r.description,
        defaultBranch: r.default_branch,
        archived: r.archived,
        pushedAt: r.pushed_at,
        sizeKb: r.size,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        licenseSpdx: r.license?.spdx_id || null,
        discoveredBy: "official-anchor"
      });
    }
  }

  const queue = [...discovered.values()];
  const enriched = new Array(queue.length);
  const concurrency = Math.min(12, Math.max(1, Number(process.env.HUNT_CONCURRENCY || 8)));
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= queue.length) return;
      const candidate = queue[index];
      const [packageText, readme] = await Promise.all([
        optionalContent(candidate.repo, "package.json"),
        optionalContent(candidate.repo, "README.md")
      ]);
      const packageJson = parsePackage(packageText);
      const scored = scoreCandidate({ ...candidate, packageJson, readme });
      enriched[index] = {
        ...candidate,
        ...scored,
        packageJson: packageJson
          ? {
              scripts: packageJson.scripts || {},
              dependencies: packageJson.dependencies || {},
              devDependencies: packageJson.devDependencies || {},
              engines: packageJson.engines || {}
            }
          : null
      };
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  enriched.sort((a, b) => b.score - a.score || b.stars - a.stars);

  const outDir = path.resolve("research/generated");
  await fs.mkdir(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);

  await fs.writeFile(
    path.join(outDir, `skeleton-hunt-${stamp}.json`),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      methodologyVersion: 1,
      queries,
      candidateCount: enriched.length,
      candidates: enriched
    }, null, 2) + "\n"
  );

  const md = [
    `# Skeleton Hunt — ${stamp}`,
    "",
    `Candidates: **${enriched.length}**`,
    "",
    "> Preliminary static score only. Build execution, code-architecture inspection, asset-license review and browser QA are separate gates.",
    "",
    "| Rank | Repo | Score | Gate | License | Engine | TS | Vite |",
    "|---:|---|---:|---|---|---|---|---|",
    ...enriched.slice(0, 25).map((c, i) =>
      `| ${i + 1} | ${c.repo} | ${c.score} | ${c.gate} | ${c.licenseSpdx || "?"} | ${c.signals.phaser ? "Phaser " + c.signals.phaser : c.signals.playcanvas ? "PlayCanvas " + c.signals.playcanvas : "?"} | ${c.signals.typescript || "—"} | ${c.signals.vite || "—"} |`
    ),
    "",
    "## Next gate",
    "",
    "Deep-inspect the top candidates plus official anchors. Do not execute untrusted third-party install/build scripts in CI. Verify architecture, source-license scope, asset licensing, mobile/responsive behavior and current maintenance before adoption.",
    ""
  ].join("\n");

  await fs.writeFile(path.join(outDir, `skeleton-hunt-${stamp}.md`), md);
  console.log(`Wrote ${enriched.length} candidates to ${outDir}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
