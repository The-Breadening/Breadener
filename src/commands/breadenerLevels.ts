import breadenerLevels from "$static/breadenerLevels.json" with {
  type: "json",
};
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types.ts";
import { validGuildGuard } from "../utils.ts";

export const slashGetBreadenerLevel = new SlashCommand({
  data: new SlashCommandBuilder()
    .setName("get-breadener-level")
    .setDescription("See the breadener level of someone")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("give the username of the infector")
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const logMessageBase =
      `${interaction.user.username} used /get-breadener-level: `;

    if (!validGuildGuard(interaction)) {
      await interaction.reply({
        content: "You cannot run this command here.",
        withResponse: true,
      }).catch(console.error);
      return logMessageBase + "Location not permitted.";
    }

    const user = interaction.options.getUser("user", true);
    const db = await Deno.openKv();
    const infectionCount = (await db.get<number>([
      "infectionCounts",
      user.id,
    ])).value ?? 0;

    db.close();

    const index = Math.floor(Math.min(infectionCount, 48) / 12);
    const levelProgress = infectionCount % 12;
    const progressText = index === 5
      ? "📊 You are at the maximum level!\n📈 ████████████ 100%\n"
      : `📊 Progress: ${infectionCount}/${
        breadenerLevels[index].threshold
      } until ${breadenerLevels[index + 1] ?? ""}\n📈 ${
        "█".repeat(levelProgress)
        + "░".repeat(12 - levelProgress)
      } ${Math.floor(levelProgress / 12 * 100)}%\n`;

    await interaction.reply({
      content:
        `**${user}** is a **${breadenerLevels[index].emoji} ${
          breadenerLevels[index].level
        }**!\n`
        + progressText
        + `🍞 Total breaded: **${infectionCount}** people`,
      flags: MessageFlags.SuppressNotifications,
      withResponse: true,
    }).catch(console.error);
    return logMessageBase + "Command succesful.";
  },
});

export const slashGetBreadenerLevels = new SlashCommand({
  data: new SlashCommandBuilder()
    .setName("breadener-levels")
    .setDescription(
      "Show all available breadener levels and their requirements",
    ),
  execute: async (interaction) => {
    let message = "🍞 **Breadener Levels** 🍞\n\n";

    for (const breadLevel of breadenerLevels) {
      message += breadLevel.threshold
        ? `${breadLevel.emoji} ${breadLevel.level}: ${
          breadLevel.threshold - 12
        } - ${breadLevel.threshold} people Breadened!\n`
        : message +=
          `${breadLevel.emoji} ${breadLevel.level}: 48+ people Breadened!\n`;
    }

    message +=
      "\n🎯 Use `/get-breadener-level <username>` to check someone's level!";

    await interaction.reply({
      content: message,
      withResponse: true,
    }).catch(console.error);
    return `${interaction.user.username} used /breadener-levels: Command successful`;
  },
});
