const Discord = require("discord.js");

module.exports.run = async (bot, message) => {
  // return the callback message
  // bot.api.interactions(interaction.id, interaction.token).callback.post({
  //   data: {
  //     type: 4,
  //     data: {
  //       content: "Pong!",
  //     },
  //   },
  // });
  message.reply("Pong!");
};

module.exports.help = {
  name: "ping",
};
