import { Code, Project } from './types';
import { hyphenate, removeDiacritics } from './utils.js';

class BasicWriter {
  lines: string[] = []

  escape(s: string) {
    return '"' + 
      removeDiacritics(s).
      replaceAll('"', '"CHR$(34)"').replaceAll("\n", '"CHR$(10)CHR$(13)"') + '"'
  }

  print(s: string) {
    const endsWithEnter = s.endsWith("\n")
    const paragraphs = s.split(/\n/g)

    for (let i=0; i<paragraphs.length; i++) {
      if (i > 0) {
        this.write('?')
      }
      const paragraph = paragraphs[i];
      const hyphenatedLines = hyphenate(paragraph)
      for (const line of hyphenatedLines) {
        if (line.endsWith("\n")) {
          this.write(`?${this.escape(line.trimEnd())}`)
        } else {
          this.write(`?${this.escape(line)};`)
        }
      }
      if (paragraphs.length === 1 && endsWithEnter) {
        this.write('?')
      }

      // const hyphenated = hyphenatedLines.join("")
      // for (let i=0; i<hyphenated.length; i++) {
      //   const char = hyphenated.charAt(i)
      //   if (char === "\n") {
      //     this.write(`?${this.escape(current)}`)
      //     current = ""
      //     continue
      //   }
      //   current += char
      //   if (current.length > 100) {
      //     this.write(`?${this.escape(current)};`)
      //     current = ""
      //   }
      // }
      // if (current.length > 0) {
      //   this.write(`?${this.escape(current)}`)
      // }  
    }
  }

  printLn(s: string) {
    return this.print(`${s}\n`)
  }

  write(s: string) {
    this.lines.push(s)
  }

  getLineRef() {
    return this.lines.length + 1
  }

  setLine(ref: number, s: string) {
    this.lines[ref - 1] = s
  }

  replaceLineToken(ref: number, token: string, value: string|number) {
    this.lines[ref - 1] = this.lines[ref - 1].replace(token, String(value))
  }

  render() {
    const output = []
    for (let i=0; i<this.lines.length; i++) {
      output.push(`${i+1} ${this.lines[i]}`)
    }
    return output.join("\n")
  }
}

export function generateBasic(project: Project) {
  const basic = new BasicWriter();
  basic.write("DEFINTA-Z:COLOR15,1,1:SCREEN0,,0:KEYOFF:WIDTH40")
  basic.write(`RM=${project.initialRoomIndex}`)
  basic.printLn(project.name)
  basic.printLn("")
  basic.printLn(project.intro.join("\n\n"))
  basic.printLn("")
  basic.printLn("")
  basic.write("LINE INPUT\"[Tecle ENTER]\";I$:CLS")
  const roomsOnGosubRef = basic.getLineRef()
  basic.write("?:ON RM+1 GOSUB ...")
  const parseInputGosubRef = basic.getLineRef()
  basic.write("GOSUB ...")
  const roomCmdOnGosubRef = basic.getLineRef()
  basic.write("ON RM+1 GOSUB ...")
  basic.write(`IF RZ<>RM THEN RZ=RM:GOTO ${roomsOnGosubRef}`)
  basic.write(`GOTO ${parseInputGosubRef}`)

  // input parser
  basic.setLine(parseInputGosubRef, `GOSUB ${basic.getLineRef()}`)
  basic.write("PRINT:INPUT I$:PRINT")
  basic.write("RETURN")

  // project codes
  basic.write("REM project codes")
  const projectCodesRef = basic.getLineRef()
  generateCodes(project.postInput, basic, project, roomsOnGosubRef)
  basic.write("RETURN")

  // rooms intros
  const roomsIntroLines = []
  for (const room of project.rooms) {
    roomsIntroLines.push(basic.getLineRef())
    basic.printLn(`[${room.name}]`)
    basic.printLn("")
    basic.printLn(room.intro.join("\n\n"))
    basic.write("RETURN")
  }
  basic.setLine(roomsOnGosubRef, "?:ON RM+1 GOSUB " + roomsIntroLines.join(","))
  // rooms commands
  const roomsCommandLines = []
  for (const room of project.rooms) {
    roomsCommandLines.push(basic.getLineRef())
    basic.write(`REM room ${room.id} codes`)
    generateCodes(room.postInput, basic, project, roomsOnGosubRef)
    basic.write(`GOTO ${projectCodesRef}`)
  }
  basic.setLine(roomCmdOnGosubRef, "ON RM+1 GOSUB " + roomsCommandLines.join(","))

  return basic.render()
}

function generateCodes(codes: Code[], basic: BasicWriter, project: Project, checkRoomLine: number) {
  for (const code of codes) {
    const lineRef = basic.getLineRef();
    const linesWithSkipping = [];
    basic.write("IF ...");
    // ops
    for (const op of code.ops) {
      switch (op.cmd) {
        case "print":
          basic.printLn(String(op.params[0]));
          break
        case "check-room":
          basic.write(`RETURN ${checkRoomLine}`);
          break
        case "goto":
          const roomIndex = project.rooms.findIndex((room) => room.id === op.params[0]);
          if (roomIndex === -1) {
            throw new Error(`could not find room "${op.params[0]}"`);
          }
          basic.write(`RM=${roomIndex}`);
          break
        case "set":
          // TODO: flag allocation
          basic.write(`${op.params[0]}=1`);
          break
        case "clear":
          // TODO: flag allocation
          basic.write(`${op.params[0]}=0`);
          break
        case "zero":
          linesWithSkipping.push(basic.getLineRef());
          basic.write(`IF ${op.params[0]}<>0 THEN @`);
          break
        case "notzero":
          linesWithSkipping.push(basic.getLineRef());
          basic.write(`IF ${op.params[0]}=0 THEN @`);
          break
        case "continue":
          linesWithSkipping.push(basic.getLineRef());
          basic.write(`GOTO @`);
          break
        default:
          basic.write(`REM TODO: ${JSON.stringify(op)}`);
      }
    }
    // end of ops
    basic.write("RETURN"); // TODO: allow skip when declared
    for (const lineToReplace of linesWithSkipping) {
      basic.replaceLineToken(lineToReplace, '@', basic.getLineRef());
    }
    if (code.on.endsWith('*')) {
      if (code.on === '*') {
        // default fallback for any input
        basic.setLine(lineRef, 'REM fallback');
      } else {
        const codeOnStart = code.on.replace('*', '').trim().split(/ +/g).join(' ');
        basic.setLine(lineRef, `IF LEFT$(I$, ${codeOnStart.length})<>${basic.escape(codeOnStart)} THEN ${basic.getLineRef()}`);
      }
    } else {
      const inputs = generateInputVariations(code.on).map((input) => `I$<>${basic.escape(input)}`);
      basic.setLine(lineRef, `IF ${inputs.join(" AND ")} THEN ${basic.getLineRef()}`);
    }
  }
}

function generateInputVariations(on: string) {
  const words = on.trim().split(/ +/g)
  if (words.length === 0) {
    return []
  }

  function generateWordVariations(word: string) {
    const variations = []
    const manualVariations = word.split('/')
    for (const manualVariation of manualVariations) {
      // match expression with format: "book(s)"
      const autoVariations = manualVariation.match(/^(.+)\((.+)\)$/)
      if (!autoVariations) {
        variations.push(manualVariation)
      } else {
        // example: "read book" and "read books", very simple
        variations.push(autoVariations[1])
        variations.push(autoVariations[1] + autoVariations[2])
      }
    }
    return variations
  }

  let variations: string[] = []
  for (const word of words) {
    const wordVariations = generateWordVariations(word)
    if (variations.length === 0) {
      variations = wordVariations
      continue
    }
    const newVariations = []
    for (const variation of variations) {
      for (const wordVariation of wordVariations) {
        newVariations.push(`${variation} ${wordVariation}`)
      }
    }
    variations = newVariations
  }
  return variations
}
