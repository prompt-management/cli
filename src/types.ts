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