const Discord = require("discord.js");
const data = require("../data.json");

module.exports.run = async (bot, message, args) => {
  var koleCheck = message.author.id == '247498651859943425';
  if(!koleCheck) return message.reply("Only the corn master may use such a prestigous command.");

  const list = data.cancer;
  let num = Math.floor(Math.random() * list.length);
  const quote = statuses[num];
  message.reply(quote + " **[#" + (num+1) + "]**");
};

module.exports.help = {
  name: "cancer",
};
