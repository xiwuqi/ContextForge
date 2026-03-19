export type CompileSourceType = 'markdown_file' | 'github_issue' | 'github_issue_json';

export interface NormalizedTaskSource {
  type: CompileSourceType;
  ref: string;
  title: string;
  labels: string[];
  url: string | null;
  taskMarkdown: string;
  sourceTaskPath: string;
}
