const config = require("./config.json");
const token = require("./token.json");
const streamers = require("./streamers.json");
const data = require("./data.json");
const userList = require("./userList.json");
const Discord = require("discord.js");
const fs = require("fs");
const { GatewayIntentBits, Partials, ActivityType, Routes } = require('discord.js');
const bot = new Discord.Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildPresences], partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User] });
bot.commands = new Discord.Collection();
bot.slashCommands = new Discord.Collection();
bot.aliases = new Discord.Collection();

const { REST } = require('@discordjs/rest');
const rest = new REST({ version: '10' }).setToken(token.token);
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Console } = require("console");

// load commands
fs.readdir("./commands/", (err, files) => {
    if (err) console.log(err);

    let jsfile = files.filter((f) => f.split(".").pop() === "js");
    if (jsfile.length <= 0) {
        console.log("Couldn't find commands.");
        return;
    }

    console.log('Loading commands:');
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
// load slash-commands
const slashCommandData = [];
const slashCommandFiles = fs.readdirSync('./commands/slash').filter(file => file.endsWith('.js'));
console.log('Loading slash commands:');
for (const file of slashCommandFiles) {
	const command = require(`./commands/slash/${file}`);
    console.log(`${file} loaded!`);
	bot.slashCommands.set(command.data.name, command);
    slashCommandData.push(command.data.toJSON());
}
// post slash commands
(async () => {
	try {
		console.log(`Started refreshing ${bot.slashCommands.length} application (/) commands.`);

        // register guild command (for testing)
		// const data = await rest.put(
		// 	Routes.applicationGuildCommands(config.clientID, '611394586023034880'),
		// 	    { body: slashCommandData },
		// );

        // global registration
        const data = await rest.put(
            Routes.applicationCommands(config.clientID),
                { body: slashCommandData },
        );

        // delete guild commands by id
        // rest.delete(Routes.applicationGuildCommand(config.clientID, '611394586023034880', '1014629946070675548'))
        //     .then(() => console.log('Successfully deleted guild command'))
        //     .catch(console.error);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();

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

bot.on('interactionCreate', async (interaction) => {
    if(!interaction.isChatInputCommand()) return;

	const command = bot.slashCommands.get(interaction.commandName);
	if(!command) return;

	try {
		await command.execute(interaction);
	}catch(error) {
		console.error(error);
		// await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

// Message
bot.on("messageCreate", async (message) => {
    // ignored user check
    var ignore = userList.ignored;
    var doIgnore = false;
    if(ignore.find(user => user.id === message.author.id)) return;
    
    botCheck(message);

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
                if(messages.at(0).author.bot && messages.at(1).author.bot
                    && messages.at(0).author.id != bot.user.id && messages.at(1).author.id != bot.user.id) {
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

bot.login(token.token);