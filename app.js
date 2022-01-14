const config = require("./config.json");
const token = require("./token.json");
const streamers = require("./streamers.json");
const data = require("./data.json");
const Discord = require("discord.js");
const fs = require("fs");
const bot = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Discord.Intents.FLAGS.GUILD_MEMBERS, Discord.Intents.FLAGS.DIRECT_MESSAGES], partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'USER'] });
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
    if(message.author.bot && message.author.id != bot.user.id) {
        var r = Math.floor(Math.random() * (100 - 1 + 1) + 1);
        if(r <= 25) {
            message.channel.send("**Silence, bots.**");
        }
    }
    if(message.channel.type === "DM") return;

    handleResponses(message);

    let mentions = message.mentions.users;
    if(mentions > 0 && mentions.first().id == bot.user.id) {
        let split = message.content.split(" ").slice(1);
        handleGuildSettings(message, split);
    }

    handleCommand(message);
});

function handleCommand(message) {
    let prefix = config.prefix;
    let messageArray = message.content.split(" ");
    let cmd = messageArray[0];
    let args = messageArray.slice(1);

    // Check for prefix
    if (!cmd.startsWith(config.prefix)) return;

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
bot.on('presenceUpdate', (oldMember, newMember) => {
    var id = newMember.id;
    var valid = false;
    for(let i = 0; i < streamers.streamers.length; i++) {
        if(id == streamers.streamers[i].id) {
            valid = true;
            break;
        }
    }
    if(valid &&
        oldMember.presence.activities[0].type != bot.ActivityType.Streaming &&
        newMember.presence.activities[0].type == bot.ActivityType.Streaming) {
        bot.user.setActivity(newMember.displayName, { type: "WATCHING", url: newMember.presence.activities[0].url });
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

function setRandomActivity() {
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