const Discord = require("discord.js");
const data = require("../data.json");

module.exports.run = async (bot, message, args) => {
  var koleCheck = message.author.id === '247498651859943425';
  if(!koleCheck) return message.reply("Only the corn master may use such a prestigous command.");

  const list = data.koleQuotes;

  let num = Math.floor(Math.random() * list.length);
  if(args.length > 0) {
    const n = parseInt(args[0]);
    if(n && !isNaN(n) && n > 0 && n <= list.length) num = n-1;
  }
  const quote = list[num];
  message.reply(quote + " **[#" + (num+1) + "]**");
};

module.exports.help = {
  name: "cancer",
};
