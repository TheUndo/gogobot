import { Slot, component$ } from "@builder.io/qwik";
import type { DocumentHead, RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  // Control caching for this request for best performance and to reduce hosting costs:
  // https://qwik.dev/docs/caching/
  cacheControl({
    // Always serve a cached response by default, up to a week stale
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    // Max once every 5 seconds, revalidate on the server to get a fresh version of this page
    maxAge: 5,
  });
};

export default component$(() => {
  return <Slot />;
});

export const head: DocumentHead = {
  meta: [
    {
      name: "description",
      content:
        "The best economy/clan/anime Discord bot! Official Gogoanime Discord bot.",
    },
    {
      property: "og:title",
      content: "GoGoBot",
    },
    {
      property: "og:description",
      content: "GoGoBot is an economy/clan/anime Discord bot!",
    },
    {
      property: "og:image",
      content: "/logo-small.png",
    },
    {
      property: "og:image:alt",
      content: "GoGoBot logo",
    },
  ],
};
