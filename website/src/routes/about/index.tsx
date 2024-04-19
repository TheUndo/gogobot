import { component$ } from "@builder.io/qwik";
import { type DocumentHead, Link } from "@builder.io/qwik-city";
import Features from "~/components/features";

export default component$(() => {
  return (
    <div class="mx-auto w-[min(100%_-_48px,500px)]">
      <div class="h-20" />
      <Link class="link" href="/">
        Back
      </Link>
      <div class="h-5" />
      <h1 class="text-2xl font-medium">GoGoBot</h1>
      <div class="h-3" />
      <p>
        GoGoBot is an{" "}
        <a class="link" href="https://github.com/TheUndo/gogobot/">
          open source
        </a>{" "}
        multi-purpose Discord Robot. It was originally created to allow{" "}
        <a class="link" href="https://anitaku.so">
          Gogoanime
        </a>{" "}
        users to subscribe to anime updates, but it has since grown to include a
        variety of features:
      </p>
      <div class="h-5" />
      <Features />
      <div class="h-10" />
      <h2 class="text-xl font-medium">Technology Overview</h2>
      <div class="h-3" />
      <p>
        The bot is written in
        <a class="link" href="https://typescriptlang.org">
          TypeScript
        </a>{" "}
        and runs on{" "}
        <a class="link" href="https://bun.sh">
          Bun
        </a>
        . It currently uses{" "}
        <a class="link" href="https://discord.js.org">
          Discord.js
        </a>{" "}
        but I plan on migrating to{" "}
        <a class="link" href="https://discordeno.js.org">
          Discordeno
        </a>{" "}
        in the future.
      </p>
      <div class="h-2" />
      <p>
        The database is SQLite with{" "}
        <a class="link" href="https://prisma.io">
          Prisma
        </a>{" "}
        as the ORM. I think this works well for the bot's current scale, but if
        it grows a lot more I will simply migrate to MySQL.
      </p>
      <div class="h-10" />
      <h2 class="text-xl font-medium">This Website</h2>
      <div class="h-3" />
      <p>
        This website is built with{" "}
        <a class="link" href="https://qwik.dev">
          Qwik
        </a>{" "}
        and styled with{" "}
        <a class="link" href="https://tailwindcss.com">
          Tailwind CSS
        </a>
        . It is hosted on{" "}
        <a class="link" href="https://pages.dev">
          Cloudflare Pages
        </a>
        . You can find the source code in <code class="code">website/</code>{" "}
        directory in the{" "}
        <a class="link" href="https://github.com/TheUndo/gogobot/">
          GitHub repository
        </a>
        .
      </p>
      <div class="h-10" />
      <h2 class="text-xl font-medium">History</h2>
      <div class="h-3" />
      <p>GoGoBot was created by Undo (@undo__) in March 2024.</p>
      <div class="h-20" />
    </div>
  );
});

export const head: DocumentHead = {
  title: "About | GoGoBot",
  meta: [
    {
      name: "About | GoGoBot",
      content: "GoGoBot is an open source multi-purpose Discord bot!",
    },
  ],
};
