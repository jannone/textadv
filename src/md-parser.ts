import { unified } from 'unified'
import remarkParse from 'remark-parse'

export function parseMarkdown(src: string) {
  const mdAST = unified()
    .use(remarkParse)
    .parse(src);
  return mdAST  
}
