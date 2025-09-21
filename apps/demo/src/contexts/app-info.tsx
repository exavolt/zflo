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
    main: 'https://github.com/exavolt/zflo',
    github: 'https://github.com/xsys-dev/zflo',
    docs: 'https://zflo-docs.vercel.app/docs',
    demo: 'https://zflo-demo.vercel.app',
    editor: 'https://zflo-editor.vercel.app',
  },
};

export function useAppInfo() {
  return appInfo;
}
