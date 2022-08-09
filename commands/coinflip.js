const Discord = require("discord.js");
const currency = require("../currency.js");

winMessages = [
  "The coin landed on one of its sides!",
  "The coin did the thing!",
  "The coin says you're a winner!",
  "The coin multiplied mid-air!",
  "You lost, but the coin felt bad for you so you actually win.",
  "You win! You probably cheated though.",
  "Winner winner chicken dinner! I don't like PUBG."
];

lossMessages = [
  "The coin became sentient, thanked you, and ran away.",
  "The coin says you're a loser.",
  "The coin did in fact land somewhere...",
  "The coin disappeared mid-air...",
  "The coin did not do the thing.",
  "The coin landed on its edge. Impressive, but you still lose.",
  "The *coincil* has decided your fate.",
  "You lost, BUT... Yeah sorry no good news, you just lose.",
  "Lahoo-zaaherr."
];

module.exports.run = async (bot, message, args) => {
  if(args.length < 1) return message.reply("You must specify a bet amount.");
  var user = message.author;
  var balance = currency.getCurrency(user.id);
  var bet = parseInt(args[0]);
  if(isNaN(bet) || bet > balance || bet <= 0) return message.reply("The bet must be a number that is less than or equal to your balance, and greater than zero.");
  await currency.addCurrency(user.id, -bet);

  var winnings = 0;
  let roll = Math.floor(Math.random() * 101);
  if(roll == 0) {
    let multiplier = 4 + Math.floor(Math.random() * 7); // 4-10 multiplier
    winnings = bet * multiplier;
    message.reply(`The coin landed on a side that was hidden in the 6th dimension! **[+${winnings} ${currency.cname()}]**`);
  }else if(roll <= 40) {
    winnings = bet * 2;
    message.reply(`${winMessages[Math.floor(Math.random() * winMessages.length)]} **[+${winnings} ${currency.cname()}]**`);
  }else {
    message.reply(`${lossMessages[Math.floor(Math.random() * lossMessages.length)]} **[+0 ${currency.cname()}]**`);
  }

  if(winnings != 0) {
    await currency.addCurrency(user.id, winnings);
  }
};

module.exports.help = {
  name: "coinflip",
  aliases: ["flip", "cf"],
};
