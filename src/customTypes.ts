import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  Events,
  Message,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

declare module "discord.js" {
  // Adds the type for the client.command object
  export interface Client {
    commands: Collection<string, SlashCommand>;
  }
}

export type SlashCommand = {
  // This is a slash command. every .ts file in src/commands should export default this
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder; // there are multiple kinds of slashcommand builders
  execute: (interaction: ChatInputCommandInteraction) => void; // the function that runs when the slashcommand is being executed
  autocomplete?: (interaction: AutocompleteInteraction) => void; // optional autocomplete function
  allowedChannels: readonly string[];
};

export const SlashCommandGuard = (object: object) =>
  "data" in object && "execute" in object;

export type NonSlashCommand = {
  name: string;
  match: (message: Message) => boolean;
  execute: (message: Message) => maybePromiseVoid;
};

export const NonSlashCommandGuard = (object: object) =>
  "name" in object && "match" in object && "execute" in object;

export type BotEvent = {
  type: Events;
  once?: boolean;
  // deno-lint-ignore no-explicit-any
  execute: (...args: any[]) => void;
  // These types and parameters differ wildly, I also don't want to use any but I have no choice
};

export const BotEventGuard = (object: object) =>
  "type" in object && "execute" in object;

export type maybePromiseVoid = void | Promise<void>;

export type breadRecipe = {
  breadName: string;
  ingredients: string[][];
  expectedTime: number;
  instructions: string[];
  recipeLink: string;
};

export type breadenerLevel = {
  level: string;
  id?: string;
  nextLevel?: string;
  emoji: string;
  breadCount: number;
  threshold?: number;
};

export type Repository = {
  id: number;
  name: string;
  ownerLogin: string;
  description: string;
  url: string;
  languages: Language;
  license?: {
    name: string;
  };
  stargazers_count: number;
};

// May not exactly match the github project response type.
export type GitHubRepository = {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    user_view_type: string;
    site_admin: boolean;
  };
  html_url: string;
  description: string;
  fork: boolean;
  url: string;
  forks_url: string;
  keys_url: string;
  collaborators_url: string;
  teams_url: string;
  hooks_url: string;
  issue_events_url: string;
  events_url: string;
  assignees_url: string;
  branches_url: string;
  tags_url: string;
  blobs_url: string;
  git_tags_url: string;
  git_refs_url: string;
  trees_url: string;
  statuses_url: string;
  languages_url: string;
  stargazers_url: string;
  contributors_url: string;
  subscribers_url: string;
  subscription_url: string;
  commits_url: string;
  git_commits_url: string;
  comments_url: string;
  issue_comment_url: string;
  contents_url: string;
  compare_url: string;
  merges_url: string;
  archive_url: string;
  downloads_url: string;
  issues_url: string;
  pulls_url: string;
  milestones_url: string;
  notifications_url: string;
  labels_url: string;
  releases_url: string;
  deployments_url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  mirror_url: string | null;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string;
    node_id: string;
  } | null;
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
};

export type ResponseHeaders = {
  "cache-control"?: string;
  "content-length"?: number;
  "content-type"?: string;
  date?: string;
  etag?: string;
  "last-modified"?: string;
  link?: string;
  location?: string;
  server?: string;
  status?: string;
  vary?: string;
  "x-accepted-github-permissions"?: string;
  "x-github-mediatype"?: string;
  "x-github-request-id"?: string;
  "x-oauth-scopes"?: string;
  "x-ratelimit-limit"?: string;
  "x-ratelimit-remaining"?: string;
  "x-ratelimit-reset"?: string;

  [header: string]: string | number | undefined;
};

export type Language = { [language: string]: number };

export type Url = string;

export type OctokitResponse<T, S extends number = number> = {
  headers: ResponseHeaders;
  status: S; // http response code
  url: Url; // URL of response after all redirects
  data: T; // Response data as documented in the REST API reference documentation at https://docs.github.com/rest/reference
};
