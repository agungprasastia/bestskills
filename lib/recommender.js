import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

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
 * @param {(msg: string) => void} [onProgress]
 * @returns {Promise<Array<{skillId: string, name: string, url: string, installs: number, reason: string, priority: string, category: string}>>}
 */
export async function getRecommendations(profile, onProgress) {
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

  if (queryEntries.length === 0) return [];

  onProgress?.(`Searching skill registry... (${queryEntries.length} queries)`);

  // Run all queries (sequentially to avoid hammering npx)
  const allSkills = new Map(); // skillId → recommendation

  for (const { query, tech, priority } of queryEntries) {
    onProgress?.(`  Searching: ${query}`);
    const results = await searchRegistry(query);
    for (const skill of results) {
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
    .slice(0, 20);

  return recommendations;
}

function categorizeSkill(tech) {
  if (['jest', 'vitest', 'playwright', 'cypress', 'mocha', 'no-tests'].includes(tech)) return 'testing';
  if (['docker', 'no-ci', 'vercel'].includes(tech)) return 'devops';
  if (['tailwind', 'styled-components', 'emotion', 'sass'].includes(tech)) return 'design';
  return 'framework';
}

export { formatInstalls };
