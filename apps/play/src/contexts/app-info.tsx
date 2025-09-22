export interface AppInfo {
  name: string;
  version: string;
  description: string;
  urls: {
    main: string;
    github: string;
    docs: string;
    demo: string;
    editor: string;
  };
}

const appInfo: AppInfo = {
  name: 'ZFlo',
  version: '0.1.0',
  description:
    'A flow execution engine for building stateful, rule-driven applications, deterministic chat bots, step-by-step troubleshooting guides, interactive fictions, and more.',
  urls: {
    main: 'https://zflo.vercel.app',
    github: 'https://github.com/exavolt/zflo',
    docs: 'https://zflo.vercel.app/docs',
    demo: 'https://zflo-play.vercel.app',
    editor: 'https://zflo-editor.vercel.app',
  },
};

export function useAppInfo() {
  return appInfo;
}
