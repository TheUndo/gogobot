import { Slot, component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export default component$(
  ({
    href,
    appearance = "default",
  }: {
    href?: string;
    appearance?: "default" | "ghost";
  }) => {
    const Cmp = href ? Link : "button";
    return (
      <Cmp
        role="button"
        href={href}
        type="button"
        class={[
          "py-1 px-3 cursor-pointer hover:bg-gray-100 active:bg-gray-200 rounded-lg",
          appearance === "default" && "border-gray-700 border-2",
          appearance === "ghost" &&
            "bg-transparent border-0 hover:underline hover:bg-transparent hover:bg-gray-100",
        ]}>
        <Slot />
      </Cmp>
    );
  },
);
