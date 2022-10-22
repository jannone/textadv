#!/usr/bin/env node

import { cac } from 'cac'
import { writeFileSync } from 'fs';
import { Engine } from './engine.js';
import { generateBasic } from './gen-basic.js';
import { generateJson } from './gen-json.js';
import { parseFile, validateProject } from './parser.js';
import * as readline from 'readline';

const cli = cac('textadv')

cli.command('gen <file>', 'Generates Text Adventure from a Markdown file')
  .option('--target <target>', 'Target language', {default: 'basic'})
  .option('--output <file>', 'Output file path')
  .action(async (file, options) => {
    const { project, mdAST } = await parseFile(file)
    const errors = validateProject(project)
    if (errors.length > 0) {
      throw new Error(`Error(s): ${errors.join("\n")}`)
    }
    let generate
    switch (options.target) {
      case 'ast':
        generate = () => JSON.stringify(mdAST, null, 3)
        break
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

cli.command('run <file>', 'Runs Text Adventure from a Markdown file')
  .option('--debug', 'Debug internal states')
  .action(async (file, options) => {
    const { project } = await parseFile(file)
    const engine = new Engine(project)
    let state = engine.start()
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    function prompt() {
      rl.question('> ', (input) => {
        if (input === '/quit') {
          return rl.close();
        }
        const roomIndex = state.roomIndex
        state = engine.input(input, state)
        const { output, ...other } = state
        if (options.debug) {
          console.debug('[state]', JSON.stringify(other))
        }
        if (output.length > 0) {
          console.log(output.join("\n"))
        }
        if (state.roomIndex !== roomIndex) {
          console.log(engine.getRoomIntro(state.roomIndex).join("\n\n"))
        }
        prompt()
      });
    }
    console.log(`[${project.name}]\n`)    
    console.log(project.intro.join("\n\n"))
    console.log("\n---\n")
    console.log(engine.getRoomIntro(state.roomIndex).join("\n\n"))
    prompt()
  })

cli.help()

cli.parse()
