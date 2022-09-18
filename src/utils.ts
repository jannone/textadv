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
