const Discord = require("discord.js");
const currency = require("../currency.js");

module.exports.run = async (bot, message, args) => {
  if(message.author.id != '208026547557236736') return message.reply("You're not allowed to do that.");
  if(args.length < 2) return message.reply("You need to specify a user and amount.");
  var amount = parseInt(args[0]);
  var user = message.mentions.users.first();
  if(isNaN(amount)) {
    amount = parseInt(args[1]);
    if(isNaN(amount)) return message.reply("**Something went wrong.** Check for extra spaces in your command usage.")
  }
  message.delete();
  await currency.addCurrency(user.id, amount);
};

module.exports.help = {
  name: "add",
};
