import { Slot, component$ } from "@builder.io/qwik";

export default component$(
  ({
    href,
  }: {
    href?: string;
  }) => {
    const Cmp = href ? "a" : "button";
    return (
      <Cmp
        role="button"
        href={href}
        type="button"
        class="py-1 px-3 cursor-pointer hover:bg-gray-100 border-2 border-gray-700 rounded-lg"
      >
        <Slot />
      </Cmp>
    );
  },
);
