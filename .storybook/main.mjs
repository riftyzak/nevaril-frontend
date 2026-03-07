// .storybook/main.mjs
import tsconfigPaths from "vite-tsconfig-paths";
import { mergeConfig } from "vite";
import path from "node:path";

/** @type {import('storybook').StorybookConfig} */
const config = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
  addons: ["@storybook/addon-onboarding", "@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  async viteFinal(viteConfig) {
    return mergeConfig(viteConfig, {
      plugins: [tsconfigPaths()],
      resolve: {
        alias: {
          "@": path.resolve(process.cwd(), "src"),
        },
      },
    });
  },
};

export default config;