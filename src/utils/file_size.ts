//Copyright © alejandro0619 alejandrolpz0619@gmail.com
//Code under MIT license.

import { stat } from "fs/promises";

export default async function getFileSize(path: string): Promise<string> {
  return (((await stat(path)).size) / Math.pow(1024,2)).toFixed(1);
  
}