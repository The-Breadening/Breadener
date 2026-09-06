import breadRecipies from "$static/breadRecipies.json" with {
  type: "json",
};
import { SlashCommandBuilder } from "discord.js";
import { type BreadRecipe, SlashCommand } from "../types.ts";

function parseRecipe(breadType: string): BreadRecipe | null {
  const recipe = Object.entries(breadRecipies)
    .find(([name]) => name === breadType) as
      | [string, Omit<BreadRecipe, "name">]
      | undefined;

  return recipe ? { ...recipe[1], name: recipe[0] } : null;
}

export const slashGetRecipe = new SlashCommand({
  data: new SlashCommandBuilder()
    .setName("get-recipes")
    .setDescription("Get recipes for the most delicious pieces of bread!")
    .addStringOption(
      (option) =>
        option
          .setName("bread-type")
          .setDescription("give a type of bread")
          .setRequired(true)
          .setAutocomplete(true),
    ),
  execute: async (interaction) => {
    const requestedBreadType = interaction.options.getString(
      "bread-type",
      true,
    );
    const logMessage =
      `${interaction.user.username} used /get-recipe <${requestedBreadType}>: `;

    const recipe = parseRecipe(requestedBreadType);

    if (!recipe) {
      await interaction.reply({
        content:
          `It doesn't seem like we have a recipe for ${requestedBreadType}. Maybe you misspelled it, or we just dont have it yet! Don't feel bad, if you can think of a recipe, make a pull request on my repository!`,
        withResponse: true,
      }).catch(console.error);
      return logMessage + "No recipe was found.";
    }

    const { name, ingredients, expectedTime, instructions, recipeLink } =
      recipe;

    let message = `# Recipe for ${name}! \nIngredients:\n`;

    for (let i = 0; i < ingredients.length; i++) {
      message += `${i + 1}. ${ingredients[i][1]} of ${ingredients[i][0]}\n`;
    }

    message += `Expected time spent: ${expectedTime}\n## Instructions\n`;

    for (let i = 0; i < instructions.length; i++) {
      message += `${i + 1}. ${instructions[i]}\n`;
    }

    message += `## [Recipe Link](${recipeLink})\n`;

    await interaction.reply({
      content: message,
      withResponse: true,
    }).catch(console.error);
    return logMessage + "Command successful.";
  },
  autocomplete: async (interaction) => {
    const focusedValue = interaction.options.getFocused();
    const filtered = Object.keys(breadRecipies).filter((choice) =>
      choice.toLowerCase().startsWith(focusedValue.toLowerCase())
    );
    await interaction.respond(
      filtered.map((choice) => ({ name: choice, value: choice })).slice(0, 24),
    );
  },
});
