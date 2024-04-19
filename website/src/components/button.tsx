import { Slot, component$ } from "@builder.io/qwik";

export default component$(
  ({
    href,
    appearance = "default",
  }: {
    href?: string;
    appearance?: "default" | "ghost";
  }) => {
    const Cmp = href ? "a" : "button";
    return (
      <Cmp
        role="button"
        href={href}
        type="button"
        class={[
          "py-1 px-3 cursor-pointer hover:bg-gray-100 active:bg-gray-200 border-2 border-gray-700 rounded-lg",
          appearance === "ghost" && "bg-transparent border-0 hover:underline hover:bg-transparent hover:bg-gray-100",
        ]}
      >
        <Slot />
      </Cmp>
    );
  },
);
