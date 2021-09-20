//Copyright © alejandro0619 alejandrolpz0619@gmail.com
//Code under MIT license.

import TlgBot from 'node-telegram-bot-api';
import { getAPIKEY } from '../utils/get_keys.js';
import Controllers from './controllers.js';

const controllers: Controllers = new Controllers();

//This class is in charge of the bot's logic.

export default class TelegramBot {
  // you can use your own token to host this bot on your own.
  private TOKEN: string = getAPIKEY() as string;

  private bot: TlgBot = new TlgBot(this.TOKEN, { polling: true });

  public run() {
    this.bot.on('message', async  (msg, match) => {
      if (msg.text) {
        
        this.bot.sendMessage(msg.chat.id, 'Searching the song');
        // fetch data
        const fetch = await controllers.fetch(msg.text, 'mp3');
        // check if links exists
        if (fetch.links) {
          // convert the link
          const convertData = await controllers.convert(fetch.vid, fetch.links[4].k);
          // download it:
          const download = await controllers.download(convertData.dlink, undefined, fetch.title, this.bot, msg);
          return download;

        } else {
          this.bot.sendMessage(msg.chat.id, 'Couldn\'t get data from youtube, try again later');
          return;
        }
      }
    }
  
    )

  }
}


new TelegramBot().run()
