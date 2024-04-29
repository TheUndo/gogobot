import { Colors, type Command } from "!/bot/types";
import {
  EmbedBuilder,
  type Interaction,
  SlashCommandBuilder,
} from "discord.js";
import { sprintf } from "sprintf-js";

const hugGifs = [
  "https://gifdb.com/images/high/anime-hug-himouto-umaru-chan-4tqcvdscmhxje0rn.gif",
  "https://gifdb.com/images/high/anime-hug-horimiya-e7d8x5azzo1sfufo.gif",
  "https://gifdb.com/images/high/anime-hug-sakurako-himawari-yuruyuri-z74rw1c95q5t5lxi.gif",
  "https://gifdb.com/images/high/anime-hug-toilet-bound-hanako-kun-79p54apam6d5ye6x.gif",
  "https://gifdb.com/images/high/anime-hug-himouto-umaru-chan-4tqcvdscmhxje0rn.gif",
  "https://gifdb.com/images/high/anime-hug-nagisa-haruka-free-le02k8mejon6ad8x.gif",
  "https://gifdb.com/images/high/anime-hug-chino-and-cocoa-hoto-xna393ybuslvuhq5.gif",
  "https://gifdb.com/images/high/anime-hug-yato-yukine-noragami-18lpzknet9ir9v63.gif",
  "https://gifdb.com/images/high/anime-hug-place-to-place-h1p5rob98pbfn0ya.gif",
  "https://gifdb.com/images/high/anime-hug-constanze-akko-ckpz3d1ia0qua40k.gif"
];

const patGifs = [
  "https://gifdb.com/images/high/cute-anime-couple-head-pat-hw2hz0irnu1f5eqa.gif",
  "https://gifdb.com/images/high/rem-re-zero-anime-blush-head-pat-97eh0hxn28eoicim.gif",
  "https://gifdb.com/images/high/hellsing-anime-alucard-head-pat-seras-victoria-e477wd1d6cqx0um9.gif",
  "https://gifdb.com/images/high/cute-anime-umaru-head-pat-rabcmvfkpeuteckt.gif",
  "https://gifdb.com/images/high/sister-head-pat-anime-loop-qdhlnp1zthpr11qd.gif",
  "https://gifdb.com/images/high/hanako-kun-patting-nene-yashiro-7qj3oa9b1gf6089i.gif",
  "https://gifdb.com/images/high/yakuza-anime-sleeping-with-someone-patting-her-head-ynnrs7hdsolc6nhz.gif"
]

const kissGifs = [
  "https://gifdb.com/images/high/anime-kissing-498-x-278-gif-srvx1mau6f5dd3kj.gif",
  "https://gifdb.com/images/high/anime-kissing-498-x-280-gif-h9dpoyzyiwm4okco.gif",
  "https://gifdb.com/images/high/anime-kissing-498-x-286-gif-r8s18iti2x86fhka.gif",
  "https://gifdb.com/images/high/anime-kissing-445-x-498-gif-uwqgyxa35zd16wnj.gif",
  "https://gifdb.com/images/high/anime-kissing-498-x-273-gif-c8moblgjxczuagjc.gif",
  "https://gifdb.com/images/high/anime-kissing-498-x-280-gif-veasxgw1rdayk5z8.gif",
  "https://gifdb.com/images/high/anime-kissing-498-x-267-gif-z1vgw7s50sta4hqy.gif",
  "https://gifdb.com/images/high/anime-kissing-498-x-278-gif-o0055bjqc2ms6u3z.gif",
  "https://gifdb.com/images/high/anime-kissing-498-x-277-gif-clgqs0v7l8tq41bz.gif",
  "https://gifdb.com/images/high/anime-kissing-498-x-261-gif-8puhneqnl555kt6a.gif"
]

export const fun = {
  data: new SlashCommandBuilder()
    .setName("fun")
    .setDescription("Try it out to find out")
    .addSubcommand((subCommand) =>
      subCommand
        .setName("hug")
        .setDescription("Hug your friends")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to hug"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("kiss")
        .setDescription("Kiss your friends")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to kiss"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("pat")
        .setDescription("Pat your friends")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to pat"),
        ),
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName("diss")
        .setDescription("Diss your friends")
        .addUserOption((option) =>
          option
            .setRequired(true)
            .setName("user")
            .setDescription("User to diss"),
        ),
    ),
  async execute(interaction: Interaction) {
    if (!interaction.isRepliable() || !interaction.isChatInputCommand()) {
      return;
    }
    const query = interaction.options.getSubcommand();
    const id = interaction.options.getUser("user");

    if (query === "hug") {
      const embed = new EmbedBuilder()
        .setDescription("***HUGGIES!!***")
        .setImage(sprintf(
          "%s",
          hugGifs[getRandomArrayIndex(hugGifs.length)]
        ))
        .setColor(Colors.Info);
      return await interaction.reply({
        content: `### ${interaction.user.displayName} hugs ${id}`,
        embeds: [embed],
      });
    }
    if (query === "kiss") {
      const embed = new EmbedBuilder()
        .setDescription("***KISSIES!!!***")
        .setImage(sprintf(
          "%s",
          kissGifs[getRandomArrayIndex(kissGifs.length)]
        ))
        .setColor(Colors.Info);
      return await interaction.reply({
        content: `### ${interaction.user.displayName} kisses ${id}`,
        embeds: [embed],
      });
    }
    if (query === "pat") {
      const embed = new EmbedBuilder()
        .setDescription("***Pat Pat!***")
        .setImage(sprintf(
          "%s",
          patGifs[getRandomArrayIndex(patGifs.length)]
        ))
        .setColor(Colors.Info);
      return await interaction.reply({
        content: `### ${interaction.user.displayName} pats ${id}`,
        embeds: [embed],
      });
    }
    if (query === "diss") {
      return await interaction.reply(`**Suggondese Nutz!!! BEETCHH ${id} **`);
    }

    return await interaction.reply({
      ephemeral: true,
      content: "Invalid option",
    });
  },
} satisfies Command;

const getRandomArrayIndex = (max: number) => {
  return Math.floor(Math.random() * max)
}
