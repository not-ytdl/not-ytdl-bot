//Copyright © alejandro0619 alejandrolpz0619@gmail.com
//Code under MIT license.

import TlgBot from 'node-telegram-bot-api';
import { getAPIKEY } from '../utils/get_keys.js';
import Controllers from './controllers.js';
import * as dotenv from 'dotenv'

dotenv.config();
//This class is in charge of the bot's logic.
const controllers: Controllers = new Controllers();
const TOKEN = process.env.TELEGRAM_BOT_API_KEY as string;

// Youtube regex:
const YOUTUBE_URL_REGEX = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/
export default class TelegramBot {
  // you can use your own token to host this bot on your own.
  //private TOKEN: string = getAPIKEY() as string;

  private bot: TlgBot = new TlgBot(TOKEN, { polling: true });

  public async  run() {
    this.bot.onText(/\/start/, async (msg: TlgBot.Message) => {
      await this.bot.sendMessage(msg.chat.id, '📍 Use @vid inline bot to search a song, or send me a link to the video. \n 📍 Type /info to get the info about this bot.')
    });
    this.bot.onText(/\/info/, async (msg: TlgBot.Message) => {
      await this.bot.sendMessage(msg.chat.id, '📍 This is an open source bot, feel free to contribute https://github.com/not-ytdl/not-ytdl-bot and leave star if you found it useful!')
    });
    this.bot.onText(YOUTUBE_URL_REGEX, async (msg: TlgBot.Message): Promise<void> => {
       // check if the message contains text
      if (msg.text) {
        // send a message and save the message id and chad id to edit the text within it later.
        const { message_id, chat } = await this.bot.sendMessage(msg.chat.id, '⌚ Searching the song, please wait.');
        // fetch data
        const fetch = await controllers.fetch(msg.text, 'mp3');
        // check if links exists
        if (fetch.links) {
          // convert the link
          const convertData = await controllers.convert(fetch.vid, fetch.links[4].k);
          // download it (this function will execute another function to send the file automatically after it's downloaded):
          // TODO: pass a object as a param and deconstruct it later.
          await controllers.download(convertData.dlink, undefined, fetch.title, fetch.a, this.bot, msg, message_id);
          // This will edit the message text sent before so we are going to pass the message id too:
          await this.bot.editMessageText('✔ Sending', { message_id: message_id, chat_id: chat.id });
          return;
        } else {
          await this.bot.editMessageText('⚠ Couldn\'t fetch data from youtube', { message_id: message_id, chat_id: chat.id })
          return;
        }
      } else {
        await this.bot.sendMessage(msg.chat.id, 'The message is empty, try sending an URL or a command')
      }
    }
    );

  }
}

