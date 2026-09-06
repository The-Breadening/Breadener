import breadenerLevels from "$static/breadenerLevels.json" with {
  type: "json",
};
import {
  type GuildMember,
  GuildMemberRoleManager,
  type InteractionReplyOptions,
  MessageFlags,
  SlashCommandBuilder,
  type User,
} from "discord.js";
import { SlashCommand } from "../types.ts";
import { validGuildGuard } from "../utils.ts";

interface DatabaseActionResult {
  logMessageExtension: string;
  replyOptions: InteractionReplyOptions;
}

async function registerInfection(
  db: Deno.Kv,
  infector: GuildMember,
  infected: User,
): Promise<DatabaseActionResult> {
  if (infector.user.id === infected.id) {
    return {
      logMessageExtension: `user tried to register themselves`,
      replyOptions: {
        content: "You can't register yourself as yours infector buddy!",
        withResponse: true,
      },
    };
  }

  const isRegistered = await db.get<string>(
    ["infections", infected.id],
  );

  // Check whether infected already has an entry
  if (isRegistered.value) {
    return {
      logMessageExtension: `user already had an entry.`,
      replyOptions: {
        content: "You can't register an infector twice buddy!",
        flags: MessageFlags.SuppressNotifications,
        withResponse: true,
      },
    };
  }

  const insertInfection = await db.set(
    ["infections", infected.id],
    infector.id,
  );

  if (!insertInfection.ok) {
    return {
      logMessageExtension: `Something went wrong while writing infection data.`,
      replyOptions: {
        content:
          `Something went wrong while writing to database values: infections ${infected.id} ${infector.id}`,
        withResponse: true,
      },
    };
  }

  const getAllInfections = await db.get<number>(
    ["infectionCounts", infector.id],
  );
  const newInfectionsCount = getAllInfections.value === null
    ? 1
    : getAllInfections.value + 1;
  const updateInfectionCount = await db.set(
    ["infectionCounts", infector.id],
    newInfectionsCount,
  );

  if (!updateInfectionCount.ok) {
    return {
      logMessageExtension:
        `Something went wrong while writing infection count data`,
      replyOptions: {
        content: "Something went wrong while updating infection count.",
        withResponse: true,
      },
    };
  }

  const index = Math.floor(Math.min(newInfectionsCount, 48) / 12);

  try {
    // Give the new Breadener role
    const newRoleId = breadenerLevels[index].id;
    infector.roles.add(newRoleId);

    // Removes all Breadener Roles except the correct one / the one we just assigned
    for (let i = 0; i <= 4; i++) {
      if (breadenerLevels[i].id !== newRoleId) {
        infector.roles.remove(breadenerLevels[i].id);
      }
    }
  } catch (err) {
    console.error(err);
    return {
      logMessageExtension:
        `Something went wrong while updating roles of ${infector.user.username}`,
      replyOptions: {
        content:
          `Something went wrong while updating roles! The infector count has been updated.`,
        flags: MessageFlags.SuppressNotifications,
        withResponse: true,
      },
    };
  }

  return {
    logMessageExtension:
      `Registered <${infector.user.username}> as the infector of <${infected.username}>`,
    replyOptions: {
      content:
        `Registered <@${infector.id}> as the infector of <@${infected.id}>.`,
      flags: MessageFlags.SuppressNotifications,
      withResponse: true,
    },
  };
}

export const slashRegisterInfector = new SlashCommand({
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your infector!")
    .addUserOption((option) =>
      option
        .setName("infector")
        .setDescription("give the preferred username")
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const logMessageBase =
      `${interaction.user.username} used /register <${interaction.user.username}>: `;

    if (!validGuildGuard(interaction)) {
      await interaction.reply({
        content: "You cannot run this command here!",
        withResponse: true,
      }).catch(console.error);
      return logMessageBase + "Location not permitted";
    }

    const infector = await interaction.guild!.members.fetch(
      interaction.options.getUser("infector", true).id,
    );
    const db = await Deno.openKv();
    const { logMessageExtension, replyOptions } = await registerInfection(
      db,
      infector,
      interaction.user,
    );

    db.close();

    await interaction.reply(replyOptions).catch(console.error);
    return logMessageBase + logMessageExtension;
  },
});

export const slashRegisterInfected = new SlashCommand({
  data: new SlashCommandBuilder()
    .setName("register-non-joiner")
    .setDescription("Register someone you infected but didn't join!")
    .addUserOption((option) =>
      option
        .setName("infector")
        .setDescription("give the infector user")
        .setRequired(true)
    ).addStringOption((option) =>
      option
        .setName("infected_id")
        .setDescription("give the user id")
        .setRequired(true)
    ),
  execute: async (interaction) => {
    const logMessageBase =
      `${interaction.user.username} used /register-non-joiner: `;

    if (!validGuildGuard(interaction)) {
      await interaction.reply({
        content: "You cannot run this command here!",
        withResponse: true,
      }).catch(console.error);
      return logMessageBase + "Location not permitted.";
    }

    // Collects all role IDs
    if (!(interaction.member?.roles instanceof GuildMemberRoleManager)) {
      await interaction.reply({
        content: "Something went wrong!",
        withResponse: true,
      }).catch(console.error);
      return logMessageBase
        + "Something went wrong while checking their permissions.";
    }

    const roleIDs = interaction.member.roles.cache.map((role) => role.id);

    // Checks whether command is being ran by a mod
    if (
      !(roleIDs.includes("1383472356319559731") // Todo: move these ID's from code to .env
        || roleIDs.includes("1408239632822304900"))
    ) {
      await interaction.reply({
        content:
          "You are not permitted to use this command! Perhaps you meant to run `/register` instead?",
        withResponse: true,
      }).catch(console.error);
      return logMessageBase + "Permission denied.";
    }

    const infectedUserId = interaction.options.getString("infected_id", true);
    const infected = await interaction.client.users.fetch(infectedUserId)
      .catch(() => null);

    if (!infected) {
      await interaction.reply({
        content: `There is no user with user id ${infectedUserId}`,
      }).catch(console.error);
      return logMessageBase + "Infected user does not exist.";
    }

    const infector = await interaction.guild?.members.fetch(
      interaction.options.getUser("infector", true).id,
    );

    if (!infector) {
      await interaction
        .reply({ content: "Your infector isn't in the server!" })
        .catch(console.error);
      return logMessageBase + "Infector isn't in server.";
    }

    const db = await Deno.openKv();

    const {
      logMessageExtension,
      replyOptions,
    } = await registerInfection(db, infector, infected);

    db.close();

    await interaction.reply(replyOptions).catch(console.error);
    return logMessageBase + logMessageExtension;
  },
});

async function deleteInfection(
  db: Deno.Kv,
  infected: User,
): Promise<DatabaseActionResult> {
  const infectionEntry = await db.get<string>(
    ["infections", infected.id],
  );

  if (!infectionEntry.versionstamp) {
    return {
      replyOptions: {
        content: "Your entry cannot be removed if it doesn't exist!",
        flags: MessageFlags.SuppressNotifications,
        withResponse: true,
      },
      logMessageExtension:
        `${infected.username} doesn't have an infection entry`,
    };
  }

  await db.delete(["infections", infected.id]);

  const infectionCount = await db.get<number>(
    ["infectionCounts", infectionEntry.value],
  );

  if (!infectionCount.versionstamp) {
    return {
      replyOptions: {
        content: "What the fuck this shouldn't ever happen",
        flags: MessageFlags.SuppressNotifications,
        withResponse: true,
      },
      logMessageExtension: `Shit happens`,
    };
  }

  const newInfectionsCount = infectionCount.value - 1;
  const updateInfectionCount = await db.set(
    ["infectionCounts", infectionEntry.value],
    newInfectionsCount,
  );

  return updateInfectionCount.versionstamp
    ? {
      replyOptions: {
        content:
          `Entry successfully removed! You can now reassign your infector.`,
        flags: MessageFlags.SuppressNotifications,
        withResponse: true,
      },
      logMessageExtension: "Command successful",
    }
    : {
      replyOptions: {
        content:
          `Something went wrong while decrementing ${infectionEntry.value}'s infection count.`,
        flags: MessageFlags.SuppressNotifications,
        withResponse: true,
      },
      logMessageExtension:
        `Something went wrong while decrementing ${infectionEntry.value}'s infection count.`,
    };
}

export const slashDeregister = new SlashCommand({
  data: new SlashCommandBuilder()
    .setName("deregister")
    .setDescription(
      "deregister your infector in case you made a mistake or something",
    ),
  execute: async (interaction) => {
    const logMessageBase = `${interaction.user.username} used /deregister: `;

    if (!validGuildGuard(interaction)) {
      await interaction.reply({
        content: "You cannot run this command here!",
        withResponse: true,
      }).catch(console.error);
      return logMessageBase + "Location not permitted";
    }

    const db = await Deno.openKv();
    const {
      logMessageExtension,
      replyOptions,
    } = await deleteInfection(db, interaction.user);

    db.close();

    await interaction.reply(replyOptions).catch(console.error);
    return logMessageBase + logMessageExtension;
  },
});
