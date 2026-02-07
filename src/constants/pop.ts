import { Pop1MP3, Pop2MP3, Pop3MP3, Pop4MP3, Pop5MP3 } from "@/assets";

export const popSoundEffect = [Pop1MP3, Pop2MP3, Pop3MP3, Pop4MP3, Pop5MP3];

export const popSound = ():string => {
  return  popSoundEffect[Math.ceil(Math.random() * popSoundEffect.length)]
}