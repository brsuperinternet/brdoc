import { marked, Token } from "marked";

interface MathBlockToken {
  raw: string;
  text: string;
  type: "mathBlock";
}

export const mathBlockExtension = {
  level: "block",
  name: "mathBlock",
  renderer(token: Token) {
    const mathBlockToken = token as MathBlockToken;
    // parse to prevent escaping slashes
    const latex = marked
      .parse(mathBlockToken.text)
      .toString()
      .replace(/<(\/)?p>/g, "");

    return `<div data-type="${mathBlockToken.type}" data-katex="true">${latex}</div>`;
  },
  start(src: string) {
    return src.match(/\$\$/)?.index ?? -1;
  },
  tokenizer(src: string): MathBlockToken | undefined {
    const rule = /^\$\$(?!(\$))([\s\S]+?)\$\$/;
    const match = rule.exec(src);

    if (match) {
      return {
        raw: match[0],
        text: match[2]?.trim(),
        type: "mathBlock",
      };
    }
  },
};
