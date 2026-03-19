import path from 'node:path';
import { z } from 'zod';
import { readJsonFile } from '../utils/filesystem.js';
import { normalizeRelativePath, relativeToRoot } from '../utils/paths.js';
import { dedupeStrings } from '../utils/text.js';
import type { NormalizedTaskSource } from './source-types.js';

const GitHubIssueLabelSchema = z.union([
  z.string(),
  z
    .object({
      name: z.string(),
    })
    .passthrough(),
]);

export const GitHubIssuePayloadSchema = z
  .object({
    title: z.string(),
    body: z.string().nullable().optional(),
    html_url: z.string().optional(),
    url: z.string().optional(),
    repository_url: z.string().optional(),
    number: z.number().int().positive().optional(),
    labels: z.array(GitHubIssueLabelSchema).default([]),
    pull_request: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type GitHubIssuePayload = z.infer<typeof GitHubIssuePayloadSchema>;

export interface GitHubIssueReference {
  owner: string;
  repo: string;
  number: number;
  ref: string;
  htmlUrl: string;
  apiUrl: string;
}

const SHORT_REF_PATTERN = /^(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)#(?<number>\d+)$/;
const HTML_URL_PATTERN =
  /^https?:\/\/github\.com\/(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)\/issues\/(?<number>\d+)(?:[/?#].*)?$/i;
const API_URL_PATTERN =
  /^https?:\/\/api\.github\.com\/repos\/(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)\/issues\/(?<number>\d+)(?:[/?#].*)?$/i;
const REPOSITORY_URL_PATTERN =
  /^https?:\/\/api\.github\.com\/repos\/(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+)(?:[/?#].*)?$/i;

function buildGitHubIssueRef(owner: string, repo: string, number: number): GitHubIssueReference {
  const ref = `${owner}/${repo}#${number}`;
  return {
    owner,
    repo,
    number,
    ref,
    htmlUrl: `https://github.com/${owner}/${repo}/issues/${number}`,
    apiUrl: `https://api.github.com/repos/${owner}/${repo}/issues/${number}`,
  };
}

function extractLabels(labels: GitHubIssuePayload['labels']): string[] {
  return dedupeStrings(
    labels
      .map((label) => (typeof label === 'string' ? label : label.name))
      .filter((label): label is string => Boolean(label && label.trim())),
  );
}

function deriveReferenceFromPayload(payload: GitHubIssuePayload): GitHubIssueReference | null {
  const htmlUrlMatch = payload.html_url?.match(HTML_URL_PATTERN);
  if (htmlUrlMatch?.groups) {
    const { owner, repo, number } = htmlUrlMatch.groups;
    if (owner && repo && number) {
      return buildGitHubIssueRef(owner, repo, Number(number));
    }
  }

  const repositoryUrlMatch = payload.repository_url?.match(REPOSITORY_URL_PATTERN);
  if (repositoryUrlMatch?.groups && payload.number) {
    const { owner, repo } = repositoryUrlMatch.groups;
    if (owner && repo) {
      return buildGitHubIssueRef(owner, repo, payload.number);
    }
  }

  const apiUrlMatch = payload.url?.match(API_URL_PATTERN);
  if (apiUrlMatch?.groups) {
    const { owner, repo, number } = apiUrlMatch.groups;
    if (owner && repo && number) {
      return buildGitHubIssueRef(owner, repo, Number(number));
    }
  }

  return null;
}

function renderGitHubIssueMarkdown(
  issue: Pick<NormalizedTaskSource, 'title' | 'labels' | 'ref' | 'url'> & { body: string },
): string {
  const lines = [`# ${issue.title}`, ''];

  if (issue.labels.length > 0) {
    lines.push('## Labels', '');
    lines.push(...issue.labels.map((label) => `- ${label}`));
    lines.push('');
  }

  lines.push('## Context', '');
  lines.push(issue.body.trim() || 'No issue body was provided.');
  lines.push('', '## Source', '', `- GitHub issue: ${issue.ref}`);

  if (issue.url) {
    lines.push(`- URL: ${issue.url}`);
  }

  return lines.join('\n');
}

function normalizeGitHubIssueSource(
  payload: GitHubIssuePayload,
  options: {
    fallbackRef: string;
    sourceTaskPath: string;
    sourceType: 'github_issue' | 'github_issue_json';
  },
): NormalizedTaskSource {
  if (payload.pull_request) {
    throw new Error(
      'GitHub pull request payloads are not supported yet. Use the linked issue, `--github-issue-json` with an issue export, or paste the content into markdown via `--input`.',
    );
  }

  const derivedRef = deriveReferenceFromPayload(payload);
  const ref = derivedRef?.ref ?? options.fallbackRef;
  const url = payload.html_url ?? derivedRef?.htmlUrl ?? null;
  const labels = extractLabels(payload.labels);

  return {
    type: options.sourceType,
    ref,
    title: payload.title.trim(),
    labels,
    url,
    taskMarkdown: renderGitHubIssueMarkdown({
      title: payload.title.trim(),
      labels,
      ref,
      url,
      body: payload.body ?? '',
    }),
    sourceTaskPath: options.sourceTaskPath,
  };
}

export function parseGitHubIssueReference(value: string): GitHubIssueReference {
  const trimmedValue = value.trim();

  const shortRefMatch = trimmedValue.match(SHORT_REF_PATTERN);
  if (shortRefMatch?.groups) {
    const { owner, repo, number } = shortRefMatch.groups;
    if (owner && repo && number) {
      return buildGitHubIssueRef(owner, repo, Number(number));
    }
  }

  const htmlUrlMatch = trimmedValue.match(HTML_URL_PATTERN);
  if (htmlUrlMatch?.groups) {
    const { owner, repo, number } = htmlUrlMatch.groups;
    if (owner && repo && number) {
      return buildGitHubIssueRef(owner, repo, Number(number));
    }
  }

  throw new Error(
    'Invalid GitHub issue reference. Use a full issue URL like `https://github.com/owner/repo/issues/123` or a short ref like `owner/repo#123`.',
  );
}

export async function loadGitHubIssueJsonSource(
  rootDir: string,
  jsonPath: string,
): Promise<NormalizedTaskSource> {
  const absoluteJsonPath = path.resolve(rootDir, jsonPath);
  const sourceTaskPath = normalizeRelativePath(relativeToRoot(rootDir, absoluteJsonPath));
  const payload = GitHubIssuePayloadSchema.parse(await readJsonFile<GitHubIssuePayload>(absoluteJsonPath));

  return normalizeGitHubIssueSource(payload, {
    fallbackRef: sourceTaskPath,
    sourceTaskPath,
    sourceType: 'github_issue_json',
  });
}

export async function fetchGitHubIssueSource(options: {
  issue: string;
  githubToken?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<NormalizedTaskSource> {
  const reference = parseGitHubIssueReference(options.issue);
  const fetchImpl = options.fetchImpl ?? fetch;
  const headers = new Headers({
    Accept: 'application/vnd.github+json',
    'User-Agent': 'contextforge',
  });

  const token = options.githubToken?.trim();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetchImpl(reference.apiUrl, {
    headers,
  });

  if (!response.ok) {
    throw new Error(
      [
        `Failed to fetch GitHub issue ${reference.ref}: ${response.status} ${response.statusText}`.trim(),
        'Try one of:',
        '- set `GITHUB_TOKEN` and try `--github-issue` again',
        '- export the issue JSON and use `--github-issue-json <path>`',
        '- paste the issue into markdown and use `--input <file>`',
      ].join('\n'),
    );
  }

  const payload = GitHubIssuePayloadSchema.parse((await response.json()) as unknown);
  return normalizeGitHubIssueSource(payload, {
    fallbackRef: reference.ref,
    sourceTaskPath: `github://${reference.ref}`,
    sourceType: 'github_issue',
  });
}
