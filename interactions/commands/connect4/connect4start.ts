import { prisma } from "!/prisma";
import { sprintf } from "sprintf-js";

type Options = {
  guildId: string;
  channelId: string;
  authorId: string;
  mentionedId: string;
};

export async function connect4start({
  guildId,
  /* channelId, */
  authorId,
  mentionedId,
}: Options) {
  const authorCurrentGame = await prisma.connect4Game.findFirst({
    where: {
      guildId,
      challenger: authorId,
    },
  });

  if (authorCurrentGame) {
    return {
      ephemeral: true,
      content: sprintf(
        "You're already in a game with <@%s> in <#%s>. You can forfeit with `/connect4 end`",
        authorCurrentGame.opponent,
        authorCurrentGame.channelId,
      ),
    };
  }

  const mentionedCurrentGame = await prisma.connect4Game.findFirst({
    where: {
      guildId,
      challenger: mentionedId,
    },
  });

  if (mentionedCurrentGame) {
    return {
      ephemeral: true,
      content: sprintf(
        "<@%s> is already in a game with someone else in <#%s>",
        mentionedId,
        mentionedCurrentGame.channelId,
      ),
    };
  }

  return "";
}
