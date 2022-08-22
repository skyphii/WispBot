const { ActivityType } = require("discord.js");
const Discord = require("discord.js");
const streamers = require("../streamers.json");

const streams = streamers.streamers;

module.exports.run = async (bot, message) => {
    const guild = bot.guilds.cache.find(g => g.id === "333354810646593537");
    var streamFound = false;
    for(let i = 0; i < streams.length; i++) {
        const streamer = streams[i];
        var member;
        try {
            member = await guild.members.fetch(streamer.id);
        }catch {}

        if(member && member.presence) {
            const activity = member.presence.activities.find(a => a.type == ActivityType.Streaming);
            if(activity) {
                streamFound = true;
                streamActive = true;
                bot.user.setActivity(streamer.name, { type: ActivityType.Streaming, url: streamer.link });
            }
        }
        if(!streamFound) streamActive = false;
    }
};

module.exports.help = {
    name: "checkstreams",
    aliases: [ "streamcheck", "sc" ],
};
