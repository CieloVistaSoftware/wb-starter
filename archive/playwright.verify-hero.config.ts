import base from './playwright.config';

const PORT = 3995;

export default {
  ...base,
  use: { ...base.use, baseURL: `http://localhost:${PORT}` },
  webServer: {
    ...(base as any).webServer,
    port: PORT,
    reuseExistingServer: false,
    env: { WB_NO_OPEN: '1', PORT: String(PORT) },
  },
};
