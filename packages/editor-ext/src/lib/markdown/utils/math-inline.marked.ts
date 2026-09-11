import { marked, Token } from "marked";

interface MathInlineToken {
  raw: string;
  text: string;
  type: "mathInline";
}

const inlineMathRegex = /^\$(?!\s)(.+?)(?<!\s)\$(?!\d)/;

export const mathInlineExtension = {
  level: "inline",
  name: "mathInline",
  renderer(token: Token) {
    const mathInlineToken = token as MathInlineToken;
    // parse to prevent escaping slashes
    const latex = marked
      .parse(mathInlineToken.text)
      .toString()
      .replace(/<(\/)?p>/g, "");

    return `<span data-type="${mathInlineToken.type}" data-katex="true">${latex}</span>`;
  },
  start(src: string) {
    let index: number;
    let indexSrc = src;

    while (indexSrc) {
      index = indexSrc.indexOf("$");
      if (index === -1) {
        return;
      }
      const f = index === 0 || indexSrc.charAt(index - 1) === " ";
      if (f) {
        const possibleKatex = indexSrc.substring(index);
        if (possibleKatex.match(inlineMathRegex)) {
          return index;
        }
      }

      indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, "");
    }
  },
  tokenizer(src: string): MathInlineToken | undefined {
    const match = inlineMathRegex.exec(src);

    if (match) {
      return {
        raw: match[0],
        text: match[1]?.trim(),
        type: "mathInline",
      };
    }
  },
};
