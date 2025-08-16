export interface PromptEntry {
  title: string;
  content: string;
  userMeta: Record<string, any>;
  systemMeta: SystemMeta;
}

export interface SystemMeta {
  created: string;
  updated: string;
  cwd: string;
}

export interface PMCConfig {
  settings: {
    colorEnabled: boolean;
    ignoreKeysDuplicatesWarning: boolean;
  };
  git: {
    enabled: boolean;
    autoCommit: boolean;
    commitMessageFormat: string;
  };
}

export interface SearchOptions {
  dir?: string;
  text?: string;
  textRegexOff?: boolean;
  textInverse?: boolean;
  meta?: string;
  metaInverse?: boolean;
  title?: string;
  dateAfter?: string;
  dateBefore?: string;
  contentMaxLength?: number;
}

export interface ShowOptions {
  title: string;
}

export interface ListOptions {
  onlyTitles?: boolean;
}

export interface EditOptions {
  title?: string;
  text?: string;
}

export interface GenerateOptions {
  sample?: boolean;
}

export interface UninstallOptions {
  confirm?: boolean;
}

export interface CreateOptions {
  ignoreKeysDuplicatesWarning?: boolean;
}

export interface WatchOptions {
  verbose?: boolean;
}

export interface HistoryOptions {
  title?: string;
  count?: number;
}

export interface DiffOptions {
  title: string;
  version1?: string;
  version2?: string;
}

export interface RestoreOptions {
  title: string;
  version: string;
  confirm?: boolean;
}

export interface VersionsOptions {
  count?: number;
}