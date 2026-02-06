import { slashCommands } from "./collectCommands.ts";
import { env } from "./config.ts";
import {
  type BotEvent,
  BotEventGuard,
  type SlashCommand,
} from "./customTypes.ts";
import {
  Client,
  Collection,
  GatewayIntentBits,
  REST,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { coolBanner } from "./utils.ts";

// Grab all the command folders from the commands directory you created earlier
const client: Client<boolean> = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.allowedChannels = [
  "1416897896141422784",
  "1383807467875733704",
  "1383492917498351667",
  "1388275547754463342",
];

client.commands = new Collection<string, SlashCommand>();

// This type name is fucking brilliant
const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
for (const slashCommand of slashCommands) {
  commands.push(slashCommand.data.toJSON());
  client.commands.set(slashCommand.data.name, slashCommand);
}

// Construct and prepare an instance of the REST module
const rest: REST = new REST().setToken(env.TOKEN);

// and deploy your commands!
try {
  console.log(
    `Started refreshing ${commands.length} application (/) commands.`,
  );

  // The put method is used to fully refresh all commands in the guild with the current set
  await rest.put(Routes.applicationCommands(env.CLIENTID), {
    body: commands,
  });

  console.log(`Successfully reloaded application (/) commands.`);
} catch (error: unknown) {
  console.error(error);
}

const eventsPath: string = path.join(import.meta.dirname ?? "", "events");
const eventFiles: string[] = fs
  .readdirSync(eventsPath)
  .filter((file: string) => file.endsWith(".ts"));

for (const file of eventFiles) {
  const filePath: string = path.join(eventsPath, file);
  const module: object = await import(`file:///${filePath}`);

  for (const entry of Object.entries(module)) {
    if (BotEventGuard(entry[1])) {
      const event: BotEvent = entry[1] as BotEvent;

      if (event.once) {
        client.once(event.type as string, (...args) => event.execute(...args));
        continue;
      }

      client.on(event.type as string, (...args) => event.execute(...args));
      continue;
    }

    console.error(
      `[WARNING] The module at ${filePath} is doesn't really look like an event..`,
    );
  }
}

// Dit runt
client.login(env.TOKEN);
coolBanner();
