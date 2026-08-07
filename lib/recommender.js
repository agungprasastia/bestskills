import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cacheQuery, getCachedQuery } from './cache.js';

const execFileAsync = promisify(execFile);

const QUERY_MAP = {
  react: ['react'],
  nextjs: ['nextjs'],
  vue: ['vue'],
  nuxt: ['nuxt'],
  svelte: ['svelte'],
  sveltekit: ['svelte'],
  astro: ['astro'],
  angular: ['angular'],
  typescript: ['typescript'],
  tailwind: ['tailwind'],
  prisma: ['prisma'],
  drizzle: ['drizzle'],
  supabase: ['supabase'],
  firebase: ['firebase'],
  express: ['express'],
  fastify: ['fastify'],
  hono: ['hono'],
  remix: ['remix'],
  playwright: ['playwright'],
  jest: ['jest testing'],
  vitest: ['vitest'],
  cypress: ['cypress'],
  docker: ['docker deployment'],
  python: ['python'],
  go: ['golang'],
  rust: ['rust'],
  ruby: ['ruby'],
  php: ['php laravel'],
  'next-auth': ['next-auth'],
  authjs: ['auth'],
  clerk: ['clerk'],
  zustand: ['zustand'],
  redux: ['redux'],
  mongoose: ['mongoose mongodb'],
  vercel: ['vercel'],
  // Missing pattern queries
  'no-tests': ['testing'],
  'no-ci': ['ci-cd github actions'],
  biome: ['biome'],
  eslint: ['eslint'],
  prettier: ['prettier'],
  husky: ['git hooks'],
  lefthook: ['git hooks'],
  turbo: ['turborepo'],
  nx: ['nx monorepo'],
  'pnpm-workspace': ['pnpm workspace'],
  cloudflare: ['cloudflare workers'],
  railway: ['railway deployment'],
};

const PRIORITY_MAP = {
  // Primary frameworks get high priority
  react: 'high', nextjs: 'high', vue: 'high', nuxt: 'high', svelte: 'high',
  sveltekit: 'high', astro: 'high', angular: 'high', python: 'high', go: 'high',
  rust: 'high', ruby: 'high', remix: 'high',
  // Supporting tools get medium
  typescript: 'medium', tailwind: 'medium', prisma: 'medium', drizzle: 'medium',
  supabase: 'medium', firebase: 'medium', express: 'medium', fastify: 'medium',
  hono: 'medium', clerk: 'medium', 'next-auth': 'medium', vercel: 'medium',
  // Nice-to-haves get low
  docker: 'low', zustand: 'low', redux: 'low', jest: 'low', vitest: 'low',
  playwright: 'low', cypress: 'low', 'no-tests': 'low', 'no-ci': 'low',
  mongoose: 'low', php: 'low',
  biome: 'low', eslint: 'low', prettier: 'low', husky: 'low', lefthook: 'low',
  turbo: 'medium', nx: 'medium', 'pnpm-workspace': 'medium', cloudflare: 'medium', railway: 'medium',
};

/**
 * Parse `npx skills find <query>` output into skill entries.
 * Format per skill:
 *   <skillId>  <count> installs
 *   └ <url>
 */
function parseSkillsOutput(stdout) {
  const lines = stdout.split('\n');
  const skills = [];
  for (let i = 0; i < lines.length; i++) {
    // Strip ANSI
    const clean = lines[i].replace(/\x1b\[[0-9;]*m/g, '').trim();
    const match = clean.match(/^(.+?)\s+([\d,.]+[KMB]?)\s+installs?$/);
    if (match) {
      const skillId = match[1].trim();
      const installStr = match[2];
      let installs = parseInstallCount(installStr);

      // Next line should have URL
      let url = '';
      if (i + 1 < lines.length) {
        const nextClean = lines[i + 1].replace(/\x1b\[[0-9;]*m/g, '').trim();
        const urlMatch = nextClean.match(/└\s*(https?:\/\/.+)/);
        if (urlMatch) url = urlMatch[1].trim();
      }

      const name = skillId.includes('@') ? skillId.split('@').pop() : skillId;
      skills.push({ skillId, name, url, installs });
    }
  }
  return skills;
}

function parseInstallCount(s) {
  // "612.1K" → 612100, "1.2M" → 1200000
  const num = parseFloat(s.replace(/,/g, ''));
  if (s.endsWith('K')) return Math.round(num * 1000);
  if (s.endsWith('M')) return Math.round(num * 1000000);
  if (s.endsWith('B')) return Math.round(num * 1000000000);
  return Math.round(num);
}

function formatInstalls(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

/**
 * Search registry for a query via npx skills find.
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function searchRegistry(query) {
  try {
    const { stdout } = await execFileAsync('npx', ['skills', 'find', query], {
      timeout: 30000,
      env: { ...process.env, NO_COLOR: '1' },
    });
    return parseSkillsOutput(stdout);
  } catch {
    return [];
  }
}

/**
 * Get skill recommendations based on project profile.
 * @param {import('./types.js').ProjectProfile} profile
 * @param {{ max?: number, category?: string, useCache?: boolean, searchRegistry?: typeof searchRegistry, onProgress?: (msg: string) => void }} [options]
 * @returns {Promise<{recommendations: Array<{skillId: string, name: string, url: string, installs: number, reason: string, priority: string, category: string}>, cachedQueries: string[]}>}
 */
export async function getRecommendations(profile, {
  max = 10,
  category,
  useCache = true,
  searchRegistry: registrySearch = searchRegistry,
  onProgress,
} = {}) {
  // Collect all unique queries from detected tech
  const queryEntries = []; // { query, tech, priority }
  const seenQueries = new Set();

  const allTech = [...profile.techStack, ...profile.missingPatterns];

  for (const tech of allTech) {
    const queries = QUERY_MAP[tech];
    if (!queries) continue;
    const priority = PRIORITY_MAP[tech] || 'low';
    for (const q of queries) {
      if (!seenQueries.has(q)) {
        seenQueries.add(q);
        queryEntries.push({ query: q, tech, priority });
      }
    }
  }

  if (queryEntries.length === 0) return { recommendations: [], cachedQueries: [] };

  onProgress?.(`Searching skill registry... (${queryEntries.length} queries)`);

  // Run all queries (sequentially to avoid hammering npx)
  const allSkills = new Map(); // skillId → recommendation
  const cachedQueries = [];

  for (const { query, tech, priority } of queryEntries) {
    onProgress?.(`  Searching: ${query}`);
    let results = useCache ? await getCachedQuery(query) : null;
    if (results) {
      cachedQueries.push(query);
    } else {
      results = await registrySearch(query);
      if (useCache && results.length > 0) await cacheQuery(query, results);
    }
    for (const skill of results) {
      if (!isRelevantSkill(skill, profile.techStack)) continue;
      if (!allSkills.has(skill.skillId)) {
        const reason = profile.missingPatterns.includes(tech)
          ? `${tech.replace('no-', 'No ')} found`
          : `${tech} detected`;
        allSkills.set(skill.skillId, {
          ...skill,
          reason,
          priority,
          category: categorizeSkill(tech),
        });
      }
    }
  }

  // Sort: high → medium → low, then by install count
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const recommendations = [...allSkills.values()]
    .sort((a, b) => {
      const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      if (pDiff !== 0) return pDiff;
      return b.installs - a.installs;
    })
    .filter((item) => !category || item.category === category)
    .slice(0, max);

  return { recommendations, cachedQueries };
}

function categorizeSkill(tech) {
  if (['jest', 'vitest', 'playwright', 'cypress', 'mocha', 'no-tests'].includes(tech)) return 'testing';
  if (['biome', 'eslint', 'prettier', 'husky', 'lefthook'].includes(tech)) return 'quality';
  if (['docker', 'no-ci', 'vercel', 'turbo', 'nx', 'pnpm-workspace', 'cloudflare', 'railway'].includes(tech)) return 'devops';
  if (['clerk', 'next-auth', 'authjs', 'lucia', 'supabase-auth'].includes(tech)) return 'security';
  if (['tailwind', 'styled-components', 'emotion', 'sass'].includes(tech)) return 'design';
  return 'framework';
}

function isRelevantSkill({ skillId, name }, techStack) {
  const text = `${skillId} ${name}`.toLowerCase();
  if (!techStack.includes('react-native') && /react[- ]native/.test(text)) return false;
  if (!techStack.includes('clerk') && /clerk/.test(text)) return false;
  if (!techStack.includes('gsap') && /gsap/.test(text)) return false;
  if (!techStack.includes('react-email') && /react[- ]email/.test(text)) return false;
  return true;
}

export { formatInstalls };
