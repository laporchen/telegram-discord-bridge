import TelegramBot from "node-telegram-bot-api";
import Discord, { MessageSelectMenu } from "discord.js";
import {readJson} from "./open-json";
const apiKeyPath = "./data/token.json";
const telegramApiKey = readJson(apiKeyPath)['telegram'];
const discordApiKey = readJson(apiKeyPath)['discord'];
const guildId = readJson(apiKeyPath)['guildId'];

const bot = new TelegramBot(telegramApiKey, {polling: true});
const dcBot : Discord.Client= new Discord.Client({intents: [Discord.Intents.FLAGS.GUILDS]});
let channelId : string = "";
let channel : Discord.TextChannel; 

function mergeAvatarUrl(url : string) : string{
    return `https://api.telegram.org/file/bot${telegramApiKey}/${url}`;
};
bot.on('message', async (msg) => {
    const author: TelegramBot.User = msg.from as TelegramBot.User;
    const username :string = author.username as string;
    const returnMessage = msg.text as string;
    const photos = await bot.getUserProfilePhotos(author.id, {limit: 1})
    const photo = photos.photos[0][0];
    const length = msg.text?.length as number;
    if (channelId !== "" && length> 0) {
        const file :string = (await bot.getFile(photo.file_id)).file_path as string;
        const url = mergeAvatarUrl(file);
        const webhook : Discord.Webhook= await channel.createWebhook(username,{
            avatar:url 
        }).catch(console.error) as Discord.Webhook;
        await webhook.send({
            content: returnMessage,
            username: username,
            avatarURL: url
        });
        await webhook.delete();
    }
});

dcBot.on('ready', () => {
    console.log(`Logged in as ${dcBot.user?.tag}!`);
    const guild = dcBot.guilds.cache.get(guildId);
    let commands;
    if (guild) {
        commands = guild.commands;
    }
    else {
        commands = dcBot.application?.commands;
    }
    commands?.create({
        name: "assign",
        description: "Assign a channel to recieve telegram messages.",
    });
});
dcBot.on('interactionCreate', async (interaction) => {
    if(!interaction.isCommand()){
        return;
    }
    const {commandName, options} = interaction;
    if(commandName === "assign"){
        channelId = interaction.channelId;
        channel = dcBot.channels.cache.get(channelId) as Discord.TextChannel;
        interaction.reply("Channel assigned.");
    }
});
dcBot.login(discordApiKey);