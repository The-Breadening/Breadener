import { Events, type Message, TextChannel } from "discord.js";
import { nonSlashCommands } from "../collectCommands.ts";
import { BotEvent } from "../types.ts";

export const nonSlashCommandEvent = new BotEvent<Events.MessageCreate>({
  type: Events.MessageCreate,
  once: false,
  execute: async (message: Message) => {
    if (!(message.channel instanceof TextChannel)) return;

    for (const nonSlashCommand of nonSlashCommands) {
      if (nonSlashCommand.match(message)) {
        const logMessage = await nonSlashCommand.execute(message);
        console.log(
          new Date().toISOString() + `\x1b[36m > \x1b[0m${logMessage}`,
        );
      }
    }
  },
});
