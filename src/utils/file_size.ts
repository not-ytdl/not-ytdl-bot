import { stat } from "fs/promises";

export default async function getFileSize(path: string): Promise<number> {
  return ((await stat(path)).size)
}