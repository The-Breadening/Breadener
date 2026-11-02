import { type Message, SlashCommandBuilder } from "discord.js";
import { NonSlashCommand, SlashCommand } from "./types.ts";

const slashCommands: SlashCommand[] = [];
const nonSlashCommands: NonSlashCommand[] = [];

// Grabs all files in commands/
const commandFiles = Deno
  .readDirSync("src/commands/")
  .filter((file) => file.name.endsWith(".ts"));

for (const commandFile of commandFiles) {
  const module = await import(`./commands/${commandFile.name}`) as object;

  for (const [name, command] of Object.entries(module)) {
    if (command instanceof SlashCommand) {
      slashCommands.push(command);
    } else if (command instanceof NonSlashCommand) {
      nonSlashCommands.push(command);
    } else {
      console.warn(
        `[WARNING] The export ${name} in module ${commandFile.name} doesn't really look like a command..`,
      );
    }
  }
}

let helpMessage = "";
for (const nonSlashCommand of nonSlashCommands) {
  if (nonSlashCommand.showInHelp) {
    helpMessage +=
      `**${nonSlashCommand.name}** (\`\`${nonSlashCommand.command.toString()}\`\`): ${nonSlashCommand.description}\n`;
  }
}

nonSlashCommands.push(
  new NonSlashCommand({
    name: "help",
    description: "check all available commands",
    command: ".help",
    showInHelp: true,
    match: (message: Message) => message.content === ".help",
    execute: async (message: Message) => {
      await message.reply({ content: helpMessage });
      return `${message.author.username} used .help`;
    },
  }),
);

slashCommands.push(
  new SlashCommand({
    data: new SlashCommandBuilder()
      .setName("help")
      .setDescription("helps!"),
    execute: async (interaction) => {
      await interaction.reply({ content: helpMessage, withResponse: true });
      return `${interaction.user.username} used /help`;
    },
  }),
);

console.log(
  "\x1b[34mSlashCommands: \x1b[0m\n",
  slashCommands.map((command) => command.data.name),
  "\x1b[34mNonSlashCommands: \x1b[0m\n",
  nonSlashCommands.map((command) => command.name),
);

export { nonSlashCommands, slashCommands };
