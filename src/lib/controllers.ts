//Copyright © alejandro0619 alejandrolpz0619@gmail.com
//Code under MIT license.

import TlgBot from 'node-telegram-bot-api';
import axios, { AxiosResponse } from 'axios';
import { dirname, join, resolve } from 'path';
import { URL } from 'url';
import fs, { existsSync } from 'fs';
import qs from 'qs';
import { IFetch, ILinks, IConvertResponse, IDownloadresponse } from '../interfaces/Controllers_interface.js';
import genNumber from '../utils/name_file.js';
import del from 'del';

const __dirname: string = dirname(new URL(import.meta.url).pathname);

export default class Controllers {
  // Temporal folder path
  private _TempPath: string = join(__dirname, '../../temp').substring(1);
  
  //* The methods below this comment are meant to manage the 9 convert API
  // this method will fetch data from 9convert.com to get the links and the different quality
  public async fetch(url: string, vt: string): Promise<IFetch> {
    try {
      const response: AxiosResponse<any> = await axios({
        method: 'POST',
        url: 'https://9convert.com/api/ajaxSearch/index',
        data: qs.stringify({
          query: url,
          vt: vt
        }),
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      });
     
      //getting the links of the video depending on quality of the audio
      let links: ILinks[] = [];
      if (response.data.links.mp3) {
        for (let l in response.data.links) {
          if (response.data.links.hasOwnProperty(l)) {
            const linkArrayIndex = Object.keys(response.data.links[l]);
            for (let i = 0; i <= linkArrayIndex.length -1; i++){
              const index = linkArrayIndex[i]
              const linkObject: ILinks = {
                f: response.data.links['mp3'][index].f,
                q: response.data.links['mp3'][index].q,
                k: response.data.links['mp3'][index].k
              }
              links.push(linkObject);
            }
          }
        }
      }
      
      return {
        status_code: 1,
        status: response.data.status,
        title: response.data.title,
        vid: response.data.vid,
        a: response.data.a,
        links: links,
        mess: response.data.mess,
      }
    } catch (e) {
      
      return {
        status_code: 0,
        status: 'Error, something  related to the request failed, check logs',
        title: '',
        vid: '',
        a: '',
        mess: '',
        
      }
    }
  }
  // once I get data the key and id of the video, I can POST a given endpoint to retrieve the link of the source to download the music from.
  public async convert(vid_id: string, k: string): Promise<IConvertResponse> {
    try {
      const response = await axios({
        method: 'POST',
        url: 'https://9convert.com/api/ajaxConvert/convert',
        data: qs.stringify({
          vid: vid_id,
          k: k
        }),
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      });
      return {
        status_code: 1,
        status: response.data.status,
        mess: response.data.mess,
        c_status: response.data.c_status,
        vid: response.data.vid,
        title: response.data.title,
        ftype: response.data.ftype,
        fquality: response.data.fquality,
        dlink: response.data.dlink
  
      }
    } catch (e) {
      console.error(e);
      return {
        status_code: 0,
        status: 'Error, something  related to the request failed, check logs',
        mess: '',
        c_status: '',
        vid: '',
        title: '',
        ftype: '',
        fquality: '',
        dlink: ''
  
      }
    }
  }
  private async sendMusic(bot: TlgBot, msg: TlgBot.Message, opt: {
    path: string,
    title: string,
    caption: string,
    artist: string
  }, msg_id: number) {
    const { path, title, caption, artist } = opt
    if (existsSync(path)) {
      
      await bot.sendAudio(msg.chat.id, path, {title, caption, performer: artist});
      //delete temp:
      await this.deleteTempFolder(join(__dirname, '../../temp').substring(1));
      fs.mkdir(this._TempPath, { recursive: false }, e => {});
    } else {
      await this.sendMusic(bot, msg, opt, msg_id);
     await bot.sendMessage(msg.chat.id, 'Couldn\'t be sent')

    }
  }
  // this method will download a given video / music by, url into the temp folder.
  public async download(url: string, downloadFolder: string = this._TempPath, title: string, account: string, bot: TlgBot, msg: TlgBot.Message, msg_id: number):
    Promise<IDownloadresponse> {
    //generate random numbers
    const gnNum: number = genNumber();
    // this path is where it is going to be saved in:
    const localFilePath: string = resolve(__dirname, downloadFolder, `${gnNum}`);
      try {
        const response: AxiosResponse<any> = await axios({
          method: 'GET',
          url: url,
          responseType: 'stream',
        });
        
        if (existsSync(this._TempPath)) {
          
          const w: fs.WriteStream = response.data.pipe(fs.createWriteStream(localFilePath));
        
          w.on('close', async () => {
            await this.sendMusic(bot, msg, { title, artist: account, caption: `@not_ytdl_bot`, path: localFilePath }, msg_id);
          });
        
        } else {
          
          fs.mkdirSync(this._TempPath);
          this.download(url, downloadFolder, title, account, bot, msg, msg_id);
        }

        return {
          success: true,
          path: localFilePath,
        }
    } catch (err) {
        console.error(err);
        return {
            success: false,
            err: err
        
      }
    }
  }
  private async deleteTempFolder(path: string) {
    try {
      await del(path);

  } catch (err) {
    console.log(err)
  }
  }

}


