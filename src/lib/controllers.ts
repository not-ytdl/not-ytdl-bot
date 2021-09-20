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
import del from 'del'

const __dirname: string = dirname(new URL(import.meta.url).pathname);

export default class Controllers {
  // Temporal path
  private _TempPath: string = join(__dirname, '../../temp').substring(1);
  
 
  public async getLinkFromTelegram(bot: TlgBot, msg: TlgBot.Message, link: string) {
    
  }
  

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
  // once a get data the key and id of the video, I can POST a given endpoint to retrieve the link of the source to download the music from.
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
        status: '',
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
  private async sendMusic(bot: TlgBot, msg: TlgBot.Message, path: string) {
    if (existsSync(path)) {
      bot.sendMessage(msg.chat.id, 'sending...')
      bot.sendAudio(msg.chat.id, path);

      //delete temp:
      await this.deleteTempFolder(join(__dirname, '../../temp').substring(1));
    } else {
      this.sendMusic(bot, msg, path)
    }
  }
  // this method will download a given video / music by url into the temp folder.
  public async download(url: string, downloadFolder: string = this._TempPath, title: string, bot: TlgBot, msg: TlgBot.Message):
    Promise<IDownloadresponse> {
    //generate random numbers
    const gnNum = genNumber();
    // this path is where it is going to be saved in:
    const oldLocalFilePath: string = resolve(__dirname, downloadFolder, `${gnNum}.mp3`);

    // remove non alpha numerical characters and replace it with spaces
    const sanitizedTitle: string = title.replace(/[^0-9a-z]/gi, ' ');
    // new path with the original title
    const newLocalFilePath: string = resolve(__dirname, downloadFolder, `${sanitizedTitle}.mp3`);
      try {
        const response: AxiosResponse<any> = await axios({
          method: 'GET',
          url: url,
          responseType: 'stream',
        });
        
        const w: fs.WriteStream = response.data.pipe(fs.createWriteStream(oldLocalFilePath));
        
        
        w.on('close', async () => {
                    
          // rename the file to the original title
          this.renameFile(oldLocalFilePath, newLocalFilePath, false);
          this.sendMusic(bot, msg, newLocalFilePath);
         // await this.deleteTempFolder(join(__dirname, '../../temp').substring(1));
          /*fs.mkdir(this._TempPath, (e) => {
            if (e) console.log('eerrrrror', e);
            console.log('redi')
          })*/
        })
        

        return {
          success: true,
          path: newLocalFilePath,
          oldPath: oldLocalFilePath
        }
    } catch (err) {
        console.error(err);
        return {
            success: false,
            err: err
        
      }
    }
  }
  // this method will rename the file 
  // reverse method is useful if you want to rename the file back down
  private renameFile(oldPath: string, newPath: string, reverse: boolean): string {
    try {
      if (!reverse) {
        fs.rename(oldPath, newPath, (e) => {
          if (e) throw e;
          return;
        });
        return newPath;
      } else {
        
        fs.rename(newPath, oldPath, (e) => {
          if (e) throw e;
          return;
        });
        return oldPath;
      }
      
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  private async deleteTempFolder(path: string) {
    try {
      await del(path);

  } catch (err) {

  }
  }

  
}


