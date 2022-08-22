const config = require("./config.json");
const token = require("./token.json");
const streamers = require("./streamers.json");
const data = require("./data.json");
const userList = require("./userList.json");
const Discord = require("discord.js");
const fs = require("fs");
const { GatewayIntentBits, Partials, ActivityType } = require('discord.js');
const bot = new Discord.Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences], partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User] });
bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

const { SlashCommandBuilder } = require('@discordjs/builders');
const { Console } = require("console");

fs.readdir("./commands/", (err, files) => {
    if (err) console.log(err);

    let jsfile = files.filter((f) => f.split(".").pop() === "js");
    if (jsfile.length <= 0) {
        console.log("Couldn't find commands.");
        return;
    }

    jsfile.forEach((f, i) => {
        let props = require(`./commands/${f}`);
        console.log(`${f} loaded!`);
        bot.commands.set(props.help.name, props);
        if (props.help.aliases) {
            props.help.aliases.forEach(alias => {
                bot.aliases.set(alias, props);
            });
        }
    });
});

// Bot ready
bot.on("ready", async () => {
    console.log(
        `${bot.user.username} is online!`
    );

    // register new slash command
    // registerSlashCommand()

    setRandomActivity();
    setInterval(setRandomActivity, 60000); // new status every minute
});

bot.ws.on('INTERACTION_CREATE', async (interaction) => {
    const command = interaction.data.name.toLowerCase();
    // const args = interaction.data.options;

    let commandFile = bot.commands.get(command);
    if (commandFile) commandFile.run(bot, interaction);
});

// Message
bot.on("messageCreate", async (message) => {
    // bot check
    botCheck(message);

    // ignored user check
    var ignore = userList.ignored;
    var doIgnore = false;
    ignore.forEach((u)=>{
        if(message.author.id == u.id) doIgnore = true;
    });
    if(doIgnore) return;

    handleResponses(message);

    if(message.channel.type === "DM" || message.author.bot) return;

    let mentions = message.mentions.users;
    if(mentions.size > 0 && mentions.first().id == bot.user.id) {
        let split = message.content.split(" ").slice(1);
        handleGuildSettings(message, split);
    }

    handleCommand(message);
});

var lastSilence = new Date();
lastSilence.setHours(lastSilence.getHours()+12);
function botCheck(message) {
    if(message.author.bot && message.author.id != bot.user.id) {
        message.channel.messages.fetch({ limit: 2 })
            .then(messages => {
                if(messages.at(0).channelId === messages.at(1).channelId && messages.at(1).author.id != bot.user.id) {
                    var r = Math.floor(Math.random() * (100 - 1 + 1) + 1);
                    const date = new Date();
                    const difference = Math.abs(date-lastSilence) / (60*60*1000);   // difference in hours
                    if(r <= 25 && difference >= 0.5) {                              // 30m cooldown
                        message.channel.send("**Silence, bots.**");
                        lastSilence = date;
                    }
                }
            })
            .catch(console.error);
    }
}

function handleCommand(message) {
    let prefix = config.prefix;
    let messageArray = message.content.split(" ");
    let cmd = messageArray[0];
    let args = messageArray.slice(1);

    // Check for prefix
    if (!cmd.startsWith(prefix)) return;

    var userCmd = cmd.slice(prefix.length);
    let commandfile = bot.commands.get(userCmd) || bot.aliases.get(userCmd);
    if (commandfile) commandfile.run(bot, message, args);
}

function handleResponses(message) {
    data.conversations.forEach((c)=>{
        if(message.content.toLowerCase().includes(c.prompt)) {
            if(c.response != "") message.reply(c.response);
            else if(c.reactions.length != 0) {
                c.reactions.forEach(async (r)=> {
                    await message.react(r);
                });
            }
        }
    });
}

// check for streaming status
global.streamActive = false;
bot.on('presenceUpdate', (oldPresence, newPresence) => {
    const member = newPresence.member;
    const streamer = streamers.streamers.find(s => s.id === member.id);
    if(!streamer) return;

    // check if user is streaming
    for(let i = 0; i < newPresence.activities.length; i++) {
        if(newPresence.activities[i].type == ActivityType.Streaming) {
            streamActive = true;
            bot.user.setActivity(streamer.name, { type: ActivityType.Streaming, url: streamer.link });
            return;
        }
    }

    // check if user stopped streaming
    if(!oldPresence) return;
    for(let i = 0; i < oldPresence.activities.length; i++) {
        if(oldPresence.activities[i].type == ActivityType.Streaming) {
            // ensure no activity is still streaming
            for(let j = 0; j < newPresence.activities.length; j++) {
                if(newPresence.activities[j].type == ActivityType.Streaming) return;
            }
            streamActive = false;
        }
    }
});

// reaction event
bot.on('messageReactionAdd', async (reaction, user) => {
    reaction = await reaction.fetch();
    let guild = reaction.message.channel.guild;
    let member = await guild.members.fetch({user, cache:false});
    if (reaction.emoji.name == '⚠️' && member.permissions.has('MANAGE_MESSAGES')) {
        // warning
        reaction.remove();
        let offenderMsg = reaction.message;
        let offender = offenderMsg.author;
        let guild = offenderMsg.channel.guild;
        await user.send(`Sending warning to ${offender}. What would you like it to say?`);
        user.dmChannel.awaitMessages({filter: f=>true, max: 1, time: 60_000, errors: ['time']}).then((collected) => {
                let response = collected.first();
                response.reply(`Sending warning to ${offender}.`);
                offender.send(`You have received a warning from a moderator on **${guild.name}**.\n\`\`\`${response.content}\`\`\``);
            }).catch(() => {
                user.send('**Timeout**');
        });
    }
});

function handleGuildSettings(message, split) {
    if(split.length == 1) {
        if(split[0] == 'prefix') message.reply(`My prefix in this server is \`${getGuildSetting(message, 'prefix')}\``);
    }else if(split.length > 1) {
        if(split[0] == 'prefix') {
            setGuildSetting(message, 'prefix', split[1]);
            message.reply(`I set my prefix in this server to \`${split[1]}\``);
        }
    }
}

function setGuildSetting(message, key, value) {
    var guild = data.guilds.filter(g => g.id === message.channel.guildId)[0];
    guild[key] = value;
    fs.writeFile('./data.json', JSON.stringify(data, null, '\t'), function writeJSON(err) {
        if(err) return console.log(err);
    });
}

function getGuildSetting(message, key) {
    var guild = data.guilds.filter(g => g.id === message.channel.guildId)[0];
    return guild[key];
}

const checkStreams = require('./commands/checkStreams.js');
async function setRandomActivity() {
    await checkStreams.run(bot, null);
    if(streamActive) return;

    const statuses = data.statuses;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    bot.user.setActivity(status.msg, { type: status.type });
}

function registerSlashCommand() {
    // const data = new SlashCommandBuilder()
    //     .setName('flip')
    //     .setDescription('Host/join a coinflip!')
    //     .addIntegerOption(option => option.setName('amount').setDescription('Amount of bread to gamble.'))
    //     .addUserOption(option => option.setName('user').setDescription('The user whose coinflip you would like to join.'));
    // .addStringOption(option =>
    //   option.setName('amount')
    //     .setDescription('Amount of bread to give.')
    //     .setRequired(true))
    // .addUserOption(option =>
    //   option.setName('user')
    //     .setDescription('User to give bread to.')
    //     .setRequired(true))
    // .setDefaultPermission(false);

    // var x = await bot.api.applications(bot.user.id).guilds(config.guildID).commands.post({
    //     data
    // });
    // console.log(x);

    // const permissions = [
    //   {
    //     id: '800576146743623701', // mod role id
    //     type: 1,
    //     permission: true,
    //   },
    // ];

    // bot.api.applications(bot.user.id).guilds(config.guildID).commands('890083702288310322').permissions.put({
    //   data: {
    //       permissions
    //   }
    // });
}

bot.login(token.token);