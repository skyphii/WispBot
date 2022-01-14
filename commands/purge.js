const Discord = require("discord.js");
const { Collection } = require('discord.js');

module.exports.run = async (bot, message, args) => {
  if(!message.member.permissions.has('MANAGE_MESSAGES')) return message.reply("You are not allowed to use **Purge**.");
  if(args.length < 1 || isNaN(args[0])) return message.reply("**Purge** requires a number.");
  var numMsgs = parseInt(args[0]);
  var channel = message.channel;

  message.delete();
  if(numMsgs > 100) return message.reply("**Purge** is limited to 100 messages.");
  
  var messages = await channel.messages.fetch({ limit:numMsgs });
  messages.forEach(function(msg) {
    msg.delete();
  });
};

module.exports.help = {
  name: "purge",
};
