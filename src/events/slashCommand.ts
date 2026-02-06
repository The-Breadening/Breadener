import { Events, type Interaction, MessageFlags } from "discord.js";
import type { BotEvent, SlashCommand } from "$src/customTypes.ts";

export const slashCommandEvent: BotEvent = {
  type: Events.InteractionCreate,
  execute: async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    if (!interaction.client.allowedChannelIds.includes(interaction.channelId)) {
      await interaction.reply({
        content: "Nuh-Uh, you cannot run this in this channel.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const command: SlashCommand | undefined = interaction.client.commands.get(
      interaction.commandName,
    );

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`,
      );
      return;
    }

    try {
      command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
