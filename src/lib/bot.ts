//Copyright © alejandro0619 alejandrolpz0619@gmail.com
//Code under MIT license.

import TlgBot from 'node-telegram-bot-api';
import { getAPIKEY } from '../utils/get_keys.js';
import Controllers from './controllers.js';
import * as dotenv from 'dotenv'

dotenv.config()
const controllers: Controllers = new Controllers();

//This class is in charge of the bot's logic.

export default class TelegramBot {
  // you can use your own token to host this bot on your own.
  private TOKEN: string = getAPIKEY() as string;

  private bot: TlgBot = new TlgBot(process.env.TELEGRAM_BOT_API_KEY, { polling: true });

  public run() {
    this.bot.onText(/\/start/, (msg: TlgBot.Message) => {
      this.bot.sendMessage(msg.chat.id, '📍 Use @vid inline bot to search a song, or send me a link to the video. \n 📍 Type /info to get the info about this bot.')
    });
    this.bot.onText(/\/info/, (msg: TlgBot.Message) => {
      this.bot.sendMessage(msg.chat.id, '📍 This is an open source bot, feel free to contribute https://github.com/not-ytdl/not/ytdl-bot and leavea start if you found it useful!')
    });
    this.bot.on('message', async  (msg: TlgBot.Message): Promise<void> => {
      if (msg.text && msg.text !== '/start' && msg.text !== '/info') {
        
        this.bot.sendMessage(msg.chat.id, '⌚ Searching the song, please wait.');
        // fetch data
        const fetch = await controllers.fetch(msg.text, 'mp3');
        // check if links exists
        if (fetch.links) {
          // convert the link
          const convertData = await controllers.convert(fetch.vid, fetch.links[4].k);
          // download it:
          await controllers.download(convertData.dlink, undefined, fetch.title, this.bot, msg);
          return;
 
        } else {
          this.bot.sendMessage(msg.chat.id, '⚠ Couldn\'t get data from youtube, try again later.');
          return;
        }
      }
    }
  
    )

  }
}

