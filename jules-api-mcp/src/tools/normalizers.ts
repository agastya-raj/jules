import type { JulesActivity, JulesSession, JulesSource } from '../types.js';

export interface NormalizedSource {
  resourceName: string;
  displayName?: string;
  provider?: string;
  repository?: string;
}

export interface NormalizedSession {
  resourceName: string;
  title?: string;
  state?: string;
  requirePlanApproval?: boolean;
  automationMode?: string;
  createTime?: string;
  updateTime?: string;
  prUrl?: string;
}

export interface NormalizedActivity {
  resourceName: string;
  createTime?: string;
  updateTime?: string;
  summary?: string;
}

export interface SessionResultSummary {
  resourceName: string;
  state?: string;
  prUrl?: string;
  latestActivity?: NormalizedActivity;
}

function asString(input: unknown): string | undefined {
  return typeof input === 'string' ? input : undefined;
}

function asObject(input: unknown): Record<string, unknown> | undefined {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)
    : undefined;
}

function extractRepositoryFromSource(source: JulesSource): string | undefined {
  const githubSource = asObject(source.githubSource);
  if (!githubSource) {
    return undefined;
  }
  const owner = asString(githubSource.owner);
  const repository = asString(githubSource.repository);
  if (owner && repository) {
    return `${owner}/${repository}`;
  }
  return repository;
}

export function normalizeSource(source: JulesSource): NormalizedSource {
  const resourceName = asString(source.name) ?? '';
  const provider = resourceName.split('/')[1];
  return {
    resourceName,
    displayName: asString(source.displayName),
    provider,
    repository: extractRepositoryFromSource(source),
  };
}

function extractPullRequestUrl(session: JulesSession): string | undefined {
  const outputs = Array.isArray(session.outputs) ? session.outputs : [];
  for (const output of outputs) {
    const pullRequest = asObject(output.pullRequest);
    const url = pullRequest ? asString(pullRequest.url) : undefined;
    if (url) {
      return url;
    }
  }
  return undefined;
}

export function normalizeSession(session: JulesSession): NormalizedSession {
  return {
    resourceName: asString(session.name) ?? '',
    title: asString(session.title),
    state: asString(session.state),
    requirePlanApproval:
      typeof session.requirePlanApproval === 'boolean'
        ? session.requirePlanApproval
        : undefined,
    automationMode: asString(session.automationMode),
    createTime: asString(session.createTime),
    updateTime: asString(session.updateTime),
    prUrl: extractPullRequestUrl(session),
  };
}

export function normalizeActivity(activity: JulesActivity): NormalizedActivity {
  return {
    resourceName: asString(activity.name) ?? '',
    createTime: asString(activity.createTime),
    updateTime: asString(activity.updateTime),
    summary: asString((activity as Record<string, unknown>).summary),
  };
}

export function summarizeSessionResult(
  session: JulesSession,
  activities: JulesActivity[] = []
): SessionResultSummary {
  const normalizedActivities = activities.map(normalizeActivity);
  const latestActivity = normalizedActivities.at(-1);
  const normalizedSession = normalizeSession(session);
  return {
    resourceName: normalizedSession.resourceName,
    state: normalizedSession.state,
    prUrl: normalizedSession.prUrl,
    latestActivity,
  };
}

