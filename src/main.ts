import TelegramBot from "node-telegram-bot-api";
import Discord, { MessageSelectMenu } from "discord.js";
import { readJson } from "./open-json";
const apiKeyPath = "./data/token.json";
const telegramApiKey = readJson(apiKeyPath)['telegram'];
const discordApiKey = readJson(apiKeyPath)['discord'];
const guildId = readJson(apiKeyPath)['guildId'];

const bot = new TelegramBot(telegramApiKey, { polling: true });
const dcBot: Discord.Client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
let channelId: string = "";
let channel: Discord.TextChannel;

interface returnContent {
    [key: string]: any
}

function mergeImageUrl(url: string): string {
    return `https://api.telegram.org/file/bot${telegramApiKey}/${url}`;
};

async function getImage(msg: TelegramBot.Message): Promise<string> {
    const photo = msg.photo as TelegramBot.PhotoSize[];
    const filepath = (await bot.getFile(photo[photo.length - 1].file_id)).file_path as string;
    const imageUrl = mergeImageUrl(filepath);
    return imageUrl;
}
async function webhookSend(channelId: string, username: string, avartar: string, content: {}) {
    if (channelId === undefined) return null;
    channel = dcBot.channels.cache.get(channelId) as Discord.TextChannel;
    const webhook: Discord.Webhook = await channel.createWebhook(username, {
        avatar: avartar
    }).catch(console.error) as Discord.Webhook;
    await webhook.send(content).catch(console.error);
    await webhook.delete();
}

bot.on('message', async (msg) => {
    const author: TelegramBot.User = msg.from as TelegramBot.User;
    const username: string = author.username as string;
    const returnMessage = msg.text as string;
    const photos = await bot.getUserProfilePhotos(author.id, { limit: 1 })
    const photo = photos.photos[0][0];
    if (!(channelId !== "" && returnMessage !== undefined)) {
        return;
    }

    const file: string = (await bot.getFile(photo.file_id)).file_path as string;
    const url = mergeImageUrl(file);
    console.log(url);
    let content: returnContent = {
        content: returnMessage,
        username: username,
        avatarURL: url,
        files: []
    };
    await webhookSend(channelId, username, url, content);

});

bot.on('photo', async (msg) => {
    const author = msg.from as TelegramBot.User;
    const username = author.username as string;
    const message = msg.caption as string;
    const photos = await bot.getUserProfilePhotos(author.id, { limit: 1 })
    const photo = photos.photos[0][0];
    const avatarUrl = (mergeImageUrl((await bot.getFile(photo.file_id)).file_path as string)) as string;
    let content: returnContent = {
        content: message,
        username: username,
        avatarURL: avatarUrl,
        files: []
    };
    if (content.content === undefined) content.content = " ";
    content.files.push(await getImage(msg));
    await webhookSend(channelId, username, avatarUrl, content);

})

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
    if (!interaction.isCommand()) {
        return;
    }
    const { commandName, options } = interaction;
    if (commandName === "assign") {
        channelId = interaction.channelId;
        channel = dcBot.channels.cache.get(channelId) as Discord.TextChannel;
        interaction.reply("Channel assigned.");
    }
});
dcBot.login(discordApiKey);