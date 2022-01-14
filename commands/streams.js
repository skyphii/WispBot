const Discord = require("discord.js");
const streamers = require("../streamers.json");

module.exports.run = async (bot, message) => {
  var msg = "Here are the links to affiliated streams!\n";
  var unused = streamers.streamers.slice();
  var length = unused.length;
  for(let i = 0; i < length; i++) {
    var s = unused.splice(Math.floor(Math.random()*unused.length), 1)[0];
    msg += "• <" + s.link + ">\n";
  }
  msg += '||I randomize the order of this list because equality! Woo!||';
  message.reply(msg);
};

module.exports.help = {
  name: "streams",
};
