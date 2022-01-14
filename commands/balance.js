const Discord = require("discord.js");
const currency = require("../currency.js");

module.exports.run = async (bot, message, args) => {
  var mention = message.mentions.users.first();
  var user = message.author;
  if(mention) user = mention;

  var amount = currency.getCurrency(user.id);
  message.reply(`${user} has **${amount}** ${currency.cname()}!`)
};

module.exports.help = {
  name: "balance",
  aliases: ["bal", "money", "coins"],
};
