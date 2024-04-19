import { component$ } from "@builder.io/qwik";

const features = [
  {
    title: "Economy",
    description:
      "Powerful economy system with robbing, shopping, gambling, leader boards, working and much more.",
  },
  {
    title: "Clans",
    description:
      "Create, compete and grow your clan. Earn money for your clan and wage war against the others! Each clan is customizable and has ranking systems.",
  },
  {
    title: "Anime",
    description:
      "Get anime info, get notified when new episodes are released and much more.",
  },
  {
    title: "Mini Games",
    description:
      "Play games like rock connect 4, paper scissors, tic tac toe, and more!",
  },
] satisfies {
  title: string;
  description: string;
}[];

export default component$(() => {
  return (
    <ul class="list-disc pl-7">
      {features.map((feature) => (
        <li class="mb-2">
          <h3 class="font-semibold">{feature.title}</h3>
          <p>{feature.description}</p>
        </li>
      ))}
    </ul>
  );
});
