import { generateInputVariations } from "./utils.js"

describe('Generates input variations', () => {
  it('parses multiple phrases', () => {
    const result = generateInputVariations("a ; b/c ; d")
    expect(result).toEqual(["a", "b", "c", "d"])
  })
  it('parses multiple word variations', () => {
    const result = generateInputVariations("a foo/bar; b bar/baz")
    expect(result).toEqual(["a foo", "a bar", "b bar", "b baz"])
  })
  it('parses word sufix variations', () => {
    const result = generateInputVariations("a foo/bar(s)/baz")
    expect(result).toEqual(["a foo", "a bar", "a bars", "a baz"])
  })
  it('parses optional word variations', () => {
    const result = generateInputVariations("a/ foo/bar")
    expect(result).toEqual(["a foo", "a bar", "foo", "bar"])
  })
})
