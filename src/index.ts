#!/usr/bin/env node

import { cac } from 'cac'
import { writeFileSync } from 'fs';
import { generateBasic } from './gen-basic.js';
import { generateJson } from './gen-json.js';
import { parseFile } from './parser.js';

const cli = cac('textadv')

cli.command('<file>', 'Input file to generate a Text Adventure from')
  .option('--lang <lang>', 'Target language', {default: 'basic'})
  .option('--output <file>', 'Output file path')
  .action(async (file, options) => {
    const project = await parseFile(file)
    let generate
    switch (options.lang) {
      case 'basic':
        generate = generateBasic
        break
      case 'json':
        generate = generateJson
        break
      default:
        throw new Error(`Generator for lang '${options.lang}' unavailable`)
    }
    const output = generate(project)
    if (options.output) {
      writeFileSync(options.output, output, 'utf-8')
    } else {
      console.log(output)
    }
  })

cli.help()

cli.parse()
