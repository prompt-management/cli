export interface PromptEntry {
  id: string;
  timestamp: string;
  cwd: string;
  prompt: string;
  config: Record<string, string>;
}

export interface PMCConfig {
  data: PromptEntry[];
  settings: {
    colorEnabled: boolean;
    defaultEditor: string;
    fallbackEditor: string;
  };
}

export interface SearchOptions {
  dir?: string;
  text?: string;
  textRegexOff?: boolean;
  textInverse?: boolean;
  meta?: string;
  metaInverse?: boolean;
}

export interface EditOptions {
  id?: string;
  text?: string;
}

export interface GenerateOptions {
  sample?: boolean;
}

export interface UninstallOptions {
  confirm?: boolean;
}