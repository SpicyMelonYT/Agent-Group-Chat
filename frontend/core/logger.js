const OPERATOR_TOKENS = new Set(["+", "-", "*", "&", "|", "(", ")", "!"]);

export class Logger {
  constructor() {
    this.tagPattern = null;
    this._tagEvaluator = null;
  }

  setTagPattern(pattern) {
    if (!pattern) {
      this.tagPattern = null;
      this._tagEvaluator = null;
      return;
    }

    const normalized =
      typeof pattern === "string" ? pattern.trim() : String(pattern).trim();

    if (!normalized) {
      this.tagPattern = null;
      this._tagEvaluator = null;
      return;
    }

    this.tagPattern = normalized;
    this._tagEvaluator = this._compilePattern(normalized);
  }

  log(tagInput, ...messages) {
    this._emit(console.log, tagInput, messages);
  }

  error(tagInput, ...messages) {
    this._emit(console.error, tagInput, messages);
  }

  warn(tagInput, ...messages) {
    this._emit(console.warn, tagInput, messages);
  }

  _emit(fn, tagInput, messages) {
    const { tags, label } = this._normalizeTags(tagInput);
    if (!this._shouldLog(tags)) {
      return;
    }

    fn(`[${label}]`, ...messages);
  }

  _shouldLog(tags) {
    if (!this._tagEvaluator) {
      return true;
    }

    return this._tagEvaluator(tags);
  }

  _normalizeTags(tagInput) {
    if (tagInput instanceof Set) {
      const tags = Array.from(tagInput).map((tag) => String(tag).trim());
      const filtered = tags.filter(Boolean);
      return {
        tags: new Set(filtered),
        label: filtered.length ? filtered.join("|") : "untagged",
      };
    }

    const raw = Array.isArray(tagInput)
      ? tagInput
      : String(tagInput ?? "").split("|");

    const tags = raw
      .map((tag) => String(tag).trim())
      .filter(Boolean);

    const label =
      tags.length > 0 ? tags.join("|") : String(tagInput ?? "").trim() || "untagged";

    return { tags: new Set(tags), label };
  }

  _compilePattern(pattern) {
    const tokens = this._tokenizePattern(pattern);
    let index = 0;

    const peek = () => tokens[index];
    const consume = () => tokens[index++];

    const parseExpression = () => {
      let node = parseTerm();
      while (peek() === "+" || peek() === "-" || peek() === "|") {
        const op = consume();
        const rhs = parseTerm();
        if (op === "+" || op === "|") {
          node = { type: "or", left: node, right: rhs };
        } else {
          node = { type: "andNot", left: node, right: rhs };
        }
      }

      return node;
    };

    const parseTerm = () => {
      let node = parseFactor();
      while (peek() === "*" || peek() === "&") {
        consume();
        const rhs = parseFactor();
        node = { type: "and", left: node, right: rhs };
      }

      return node;
    };

    const parseFactor = () => {
      const token = peek();

      if (!token) {
        throw new Error("Unexpected end of tag pattern");
      }

      if (token === "!") {
        consume();
        return { type: "not", value: parseFactor() };
      }

      if (token === "(") {
        consume();
        const expr = parseExpression();
        if (consume() !== ")") {
          throw new Error("Unmatched parenthesis in tag pattern");
        }

        return expr;
      }

      if (OPERATOR_TOKENS.has(token)) {
        throw new Error(`Unexpected operator "${token}" in tag pattern`);
      }

      consume();
      return { type: "tag", value: token };
    };

    const ast = parseExpression();

    if (index !== tokens.length) {
      throw new Error("Could not completely parse tag pattern");
    }

    return this._buildEvaluator(ast);
  }

  _tokenizePattern(pattern) {
    const tokens = [];
    let buffer = "";

    const flushBuffer = () => {
      if (buffer) {
        tokens.push(buffer);
        buffer = "";
      }
    };

    for (let i = 0; i < pattern.length; i += 1) {
      const char = pattern[i];

      if (/\s/.test(char)) {
        flushBuffer();
        continue;
      }

      if (OPERATOR_TOKENS.has(char)) {
        flushBuffer();
        tokens.push(char);
        continue;
      }

      buffer += char;
    }

    flushBuffer();
    return tokens;
  }

  _buildEvaluator(node) {
    switch (node.type) {
      case "tag":
        return (tags) => tags.has(node.value);
      case "or": {
        const left = this._buildEvaluator(node.left);
        const right = this._buildEvaluator(node.right);
        return (tags) => left(tags) || right(tags);
      }
      case "and": {
        const left = this._buildEvaluator(node.left);
        const right = this._buildEvaluator(node.right);
        return (tags) => left(tags) && right(tags);
      }
      case "andNot": {
        const left = this._buildEvaluator(node.left);
        const right = this._buildEvaluator(node.right);
        return (tags) => left(tags) && !right(tags);
      }
      case "not": {
        const value = this._buildEvaluator(node.value);
        return (tags) => !value(tags);
      }
      default:
        throw new Error(`Unsupported pattern node "${node.type}"`);
    }
  }
}
