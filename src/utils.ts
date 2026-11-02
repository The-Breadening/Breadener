import type { ChatInputCommandInteraction } from "discord.js";

export const coolBanner = " ____                     _\n"
  + "|  _ \\                   | |                     \n"
  + "| |_) |_ __ ___  __ _  __| | ___ _ __   ___ _ __\n"
  + "|  _ <| '__/ _ \\\/ _` |/ _` |/ _ \\ '_ \\ / _ \\ '__|\n"
  + "| |_) | | |  __/ (_| | (_| |  __/ | | |  __/ |   \n"
  + "|____/|_|  \\\___|\\\__,_|\\\__,_|\\\___|_| |_|\\\___|_|🍞";

export const validGuildGuard = (
  interaction: ChatInputCommandInteraction,
) => interaction.guild && interaction.guild.id === Deno.env.get("GUILDID")!;
