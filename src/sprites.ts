/**
 * Mirrored base sprite rendering system.
 * 18 species × 3 animation frames, 5 lines tall, 12 chars wide.
 * Line 0 reserved for hats, {E} placeholder for eyes.
 *
 * This is a simplified but faithful representation of the original sprite system.
 * Full ASCII art is condensed; the rendering pipeline is accurate.
 */

import type { CompanionBones, Species, Eye, Hat } from './types.js'

const SPRITE_WIDTH = 12
const SPRITE_HEIGHT = 5

// --- Sprite data: species → [frame0, frame1, frame2] ---
// Each frame is 5 lines. Line 0 = hat zone (blank by default).
// {E} = eye placeholder.

const SPRITE_DATA: Record<Species, string[][]> = {
  duck: [
    ['            ', '   >(·__·)  ', '    (    )> ', '     ^^^^   ', '            '],
    ['            ', '   >(·__·)  ', '   >(    )  ', '     ^^^^   ', '            '],
    ['            ', '   >(·__·)~ ', '    (    )> ', '     ^^^^   ', '            '],
  ],
  goose: [
    ['            ', '   >({E}__{E}) ', '   /(    )\\ ', '    |    |  ', '    ^^  ^^  '],
    ['            ', '   >({E}__{E}) ', '    (    )/ ', '    |    |  ', '    ^^  ^^  '],
    ['            ', '  ~>({E}__{E}) ', '   /(    )\\ ', '    |    |  ', '    ^^  ^^  '],
  ],
  blob: [
    ['            ', '   .-----. ', '  ( {E}   {E} ) ', '  (  ___  ) ', '   \'-----\' '],
    ['            ', '   .-----.  ', '  (  {E} {E}  ) ', '  (  ___  ) ', '   \'-----\' '],
    ['            ', '   .-----. ', '  ( {E}   {E} ) ', '  (  o_o  ) ', '   \'-----\' '],
  ],
  cat: [
    ['            ', '   /\\ /\\   ', '  ( {E} w {E} ) ', '   |    |  ', '    ~~~~   '],
    ['            ', '   /\\ /\\   ', '  ( {E} w {E} ) ', '   | .. |  ', '    ~~~~   '],
    ['            ', '   /\\ /\\   ', '  ( - w - ) ', '   |    |  ', '    ~~~~   '],
  ],
  dragon: [
    ['            ', '  /\\\\ //\\  ', '  ( {E}  {E} )> ', '  <(    )  ', '    vv vv  '],
    ['            ', '  /\\\\ //\\  ', '  ( {E}  {E} )  ', '  <(  ~ )> ', '    vv vv  '],
    ['            ', '  /\\\\ //\\  ', '  ( {E}  {E} )> ', '  <( ~~ )  ', '    vv vv  '],
  ],
  octopus: [
    ['            ', '   .---.   ', '  ( {E}  {E} )  ', '  /|/|\\|\\  ', '            '],
    ['            ', '   .---.   ', '  ( {E}  {E} )  ', '  \\|\\|/|/  ', '            '],
    ['            ', '   .---.   ', '  ( {E}  {E} )  ', '  /|\\|/|\\  ', '            '],
  ],
  owl: [
    ['            ', '   {{{{{   ', '  ({ E}{ E}) ', '   (  v  ) ', '    ^^^^   '],
    ['            ', '   {{{{{   ', '  ({E} {E} ) ', '   ( vv  ) ', '    ^^^^   '],
    ['            ', '   {{{{{   ', '  (- _ - )  ', '   (  v  ) ', '    ^^^^   '],
  ],
  penguin: [
    ['            ', '   .---.   ', '  ({E}   {E})  ', '  /(   )\\  ', '   \" \"    '],
    ['            ', '   .---.   ', '  ( {E} {E} )  ', '  /(   )\\  ', '    \" \"   '],
    ['            ', '   .---.   ', '  ({E}   {E})  ', '  \\(   )/  ', '   \" \"    '],
  ],
  turtle: [
    ['            ', '    .===.  ', '   /{E}  {E}\\  ', '  |_===_|  ', '   ^^ ^^   '],
    ['            ', '    .===.  ', '   / {E}{E} \\  ', '  |_===_|  ', '    ^^ ^^  '],
    ['            ', '    .===.  ', '   /{E}  {E}\\  ', '  |_===_|  ', '   ^^ ^^   '],
  ],
  snail: [
    ['            ', '    @      ', '   ({E}  {E})___', '  /______/ ', '   ~~~~~~  '],
    ['            ', '     @     ', '   ({E}  {E})___', '  /______/ ', '    ~~~~~~ '],
    ['            ', '    @      ', '   ({E}  {E})___', '  /______/ ', '   ~~~~~~  '],
  ],
  ghost: [
    ['            ', '   .---.   ', '  ( {E}  {E} )  ', '  |     |  ', '  ~^~^~^~  '],
    ['            ', '   .---.   ', '  (  {E}{E}  )  ', '  |     |  ', '  ^~^~^~^  '],
    ['            ', '   .---.   ', '  ( -  - )  ', '  |  O  |  ', '  ~^~^~^~  '],
  ],
  axolotl: [
    ['            ', '  \\\\(  )// ', '   ({E}  {E})  ', '   (  ~ )  ', '    ~~~~   '],
    ['            ', '  \\\\(  )// ', '   ({E}  {E})  ', '   ( ~  )  ', '     ~~~~  '],
    ['            ', '  \\\\(  )// ', '   ({E}  {E})  ', '   ( ~~ )  ', '    ~~~~   '],
  ],
  capybara: [
    ['            ', '   .---.   ', '  ({E}    {E})  ', '  ( ~~~~ ) ', '   || ||   '],
    ['            ', '   .---.   ', '  ( {E}  {E} )  ', '  ( ~~~~ ) ', '    || ||  '],
    ['            ', '   .---.   ', '  ({E}    {E})  ', '  (  ~~  ) ', '   || ||   '],
  ],
  cactus: [
    ['            ', '    |/|    ', '   ({E}  {E})  ', '   /|  |\\  ', '   ~~~~~   '],
    ['            ', '    |\\|    ', '   ({E}  {E})  ', '   \\|  |/  ', '   ~~~~~   '],
    ['            ', '    |/|    ', '   ({E}  {E})  ', '   /|  |\\  ', '   ~~~~~   '],
  ],
  robot: [
    ['            ', '  [=====]  ', '  |{E}  {E}|  ', '  |[===]|  ', '  d|   |b  '],
    ['            ', '  [=====]  ', '  |{E}  {E}|  ', '  |[=+=]|  ', '  d|   |b  '],
    ['            ', '  [=====]  ', '  |- _ -|  ', '  |[===]|  ', '  d|   |b  '],
  ],
  rabbit: [
    ['   ()  ()  ', '   |/  \\|  ', '  ({E}    {E})  ', '  ( \"\" )  ', '   () ()   '],
    ['   ()  ()  ', '   |\\  /|  ', '  ( {E}  {E} )  ', '  ( \"\" )  ', '    () ()  '],
    ['    () ()  ', '    |/ \\|  ', '  ({E}    {E})  ', '  (  \"\" )  ', '   () ()   '],
  ],
  mushroom: [
    ['            ', '  .oOOOo.  ', '  ({E}    {E})  ', '    |  |   ', '   ~~~~~   '],
    ['            ', '  .oOOOo.  ', '  ( {E}  {E} )  ', '    |  |   ', '    ~~~~~  '],
    ['            ', '  .oOOOo.  ', '  ({E}    {E})  ', '    |~~|   ', '   ~~~~~   '],
  ],
  chonk: [
    ['            ', '  .=====.  ', ' ({E}      {E}) ', ' (       ) ', '  ^^^ ^^^  '],
    ['            ', '  .=====.  ', ' ( {E}    {E} ) ', ' (       ) ', '   ^^^ ^^^ '],
    ['            ', '  .=====.  ', ' ({E}      {E}) ', ' (  ~~~  ) ', '  ^^^ ^^^  '],
  ],
}

// --- Hat rendering ---

const HAT_SPRITES: Record<Exclude<Hat, 'none'>, string> = {
  crown:     '    ♕      ',
  tophat:    '   ▄██▄    ',
  propeller: '    ⌐¬     ',
  halo:      '    ◯      ',
  wizard:    '   ▲       ',
  beanie:    '   ≡≡≡     ',
  tinyduck:  '    >.>    ',
}

// --- Face rendering (1-line compact) ---

const FACE_PATTERNS: Partial<Record<Species, string>> = {
  cat:     '({E}w{E})',
  duck:    '>({E}__{E})',
  blob:    '({E} _ {E})',
  ghost:   '({E} o {E})',
  dragon:  '({E}>{E})',
  robot:   '[{E}={E}]',
}

const DEFAULT_FACE = '({E} {E})'

// --- Rendering ---

export function spriteFrameCount(_species: Species): number {
  return 3
}

export function renderSprite(bones: CompanionBones, frameIndex: number): string[] {
  const speciesData = SPRITE_DATA[bones.species]
  if (!speciesData) return Array(SPRITE_HEIGHT).fill(' '.repeat(SPRITE_WIDTH))

  const frame = speciesData[frameIndex % speciesData.length]
  const lines = frame.map(line => line.replace(/\{E\}/g, bones.eye))

  // Apply hat on line 0
  if (bones.hat !== 'none' && HAT_SPRITES[bones.hat]) {
    lines[0] = HAT_SPRITES[bones.hat]
  }

  // Pad all lines to consistent width
  return lines.map(l => l.padEnd(SPRITE_WIDTH))
}

export function renderFace(bones: CompanionBones): string {
  const pattern = FACE_PATTERNS[bones.species] ?? DEFAULT_FACE
  return pattern.replace(/\{E\}/g, bones.eye)
}

export { SPRITE_WIDTH, SPRITE_HEIGHT, SPRITE_DATA }
