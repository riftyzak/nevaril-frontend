import "../src/app/globals.css"
import { StoryProviders } from "../src/stories/story-providers"

const preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      defaultValue: "light",
      toolbar: {
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
      },
    },
    tenantSlug: {
      name: "Tenant",
      defaultValue: "barber",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "barber", title: "barber" },
          { value: "carservice", title: "carservice" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => (
      <StoryProviders theme={context.globals.theme} tenantSlug={context.globals.tenantSlug}>
        <Story />
      </StoryProviders>
    ),
  ],
}

export default preview
