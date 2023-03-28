const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
let sleep = async (ms) => await new Promise(r => setTimeout(r,ms));

module.exports = {
	data: new SlashCommandBuilder()
		.setName('countdown')
		.setDescription('Starts a countdown!')
        .addIntegerOption(option => 
            option.setName('length')
                .setDescription('Length of time')
                .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('unit')
                .setDescription('Unit of time')
                .setRequired(true)
                .addChoices(
                    { name: 'Seconds', value: 'unit_seconds' },
                    { name: 'Minutes', value: 'unit_minutes' },
                    { name: 'Hours',   value: 'unit_hours' }
                )
        )
        .addStringOption(option =>
            option.setName('end_image_url')
                .setDescription('Image to display at the end of the countdown')
        )
};

module.exports.execute = async (interaction) => {
    const length = interaction.options.getInteger('length');
    const unit = interaction.options.getString('unit');
    let endImage = interaction.options.getString('end_image_url');
    if(!endImage) endImage = 'https://i.imgur.com/qdwQiGE.png';

    let seconds = length;
    switch(unit) {
        case 'unit_seconds':
            break;
        case 'unit_minutes':
            seconds *= 60;
            break;
        case 'unit_hours':
            seconds *= 60*60;
            break;
    }

    let embed = getEmbed(getTimeString(seconds, unit), interaction, endImage, false);

    // reply
    await interaction.reply(data={embeds: [embed], ephemeral: false});
    while(seconds != 0) {
        await sleep(1000);
        seconds--;
        embed = getEmbed(getTimeString(seconds, unit), interaction, endImage, seconds==0);
        interaction.editReply({embeds: [embed]});
    }
}

function getEmbed(timeString, interaction, endImage, done) {
    return new EmbedBuilder()
        .setColor(done?0x00ff00:0x00ffff)
        .setTitle('Countdown')
        .setThumbnail(done?endImage:'https://i.imgur.com/igv65iG.gif')
        // .setThumbnail(done?'https://i.imgur.com/qdwQiGE.png':'https://i.imgur.com/igv65iG.gif')
        .addFields(
            { name: 'Time Remaining', value: timeString },
            { name: 'Started by', value: interaction.user.username },
            { name: 'Started at', value: interaction.createdAt.toLocaleDateString() }
        );
        // .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
}

function getTimeString(seconds, unit) {
    let hours = 0;
    let minutes = 0;
    let s = seconds;
    switch(unit) {
        case 'unit_seconds':
            break;
        case 'unit_minutes':
            // s *= 60;
            minutes = Math.floor(s / 60);
            s = s % 60;
            break;
        case 'unit_hours':
            // s *= 60*60;
            hours = Math.floor(s / 3600);
            s %= 3600;
            minutes = Math.floor(s / 60);
            s = s % 60;
            break;
    }

    // format
    hours = hours.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
    minutes = minutes.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });
    s = s.toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false
    });

    return `**${hours}:${minutes}:${s}**`;
}
