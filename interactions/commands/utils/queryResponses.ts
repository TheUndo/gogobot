import { EmbedBuilder } from "discord.js";
import { Colors } from "../../../common/types";

export const multipleAnimeFound = (query: string, verb: string) =>
  new EmbedBuilder()
    .setTitle(`🔎 Search Results for "${query}"`)
    .setDescription(
      `Multiple anime found, select the anime you want to ${verb} to.`,
    )
    .setColor(Colors.Info);

export const noAnimeFound = (query: string) =>
  new EmbedBuilder()
    .setTitle(`🔎 Search Results for "${query}"`)
    .setDescription("No anime found. Try again with a different query.")
    .setColor(Colors.Error);
