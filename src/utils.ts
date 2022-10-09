import Hypher from 'hypher';
import hypherPT from 'hyphenation.pt'

const h = new Hypher(hypherPT);

export function removeDiacritics(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function hyphenate(s: string) {
  let current = "";
  const words = s.split(/ +/g);

  const hyphenatedLines = [];
  for (const word of words) {
    if (current.length > 0) {
      current += " ";
    }
    const parts = h.hyphenate(word);
    for (const part of parts) {
      if (current.length + part.length >= 40) {
        if (!current.endsWith(' ')) {
          current += "-";
        }
        if (current.length < 40) {
          current += "\n";
        }
        hyphenatedLines.push(current);
        current = "";
      }
      current += part;
    }
  }
  if (current.length > 0) {
    hyphenatedLines.push(current);
  }
  return hyphenatedLines
}

export function generateInputVariations(on: string) {
  const phrases = on.trim().split(/;/g)
  return phrases.reduce((prev, cur) => {
    prev = prev.concat(generatePhraseVariations(cur))
    return prev
  }, [] as string[])
}

function generatePhraseVariations(phrase: string): string[] {
  const words = phrase.trim().split(/ +/g)
  if (words.length === 0) {
    return []
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
        const prefix = variation.trim().length > 0 ? `${variation} ` : ''
        newVariations.push(`${prefix}${wordVariation}`)
      }
    }
    variations = newVariations
  }
  return variations
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
      // example: "book(s)"
      variations.push(autoVariations[1]) // "book"
      variations.push(autoVariations[1] + autoVariations[2]) // "books"
    }
  }
  return variations
}
