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

  log(settings, ...messages) {
    this._emit(console.log, settings, messages);
  }

  error(settings, ...messages) {
    this._emit(console.error, settings, messages);
  }

  warn(settings, ...messages) {
    this._emit(console.warn, settings, messages);
  }

  _emit(fn, settings, messages) {
    // Ensure settings is processed as an object
    if (settings === null || settings === undefined || typeof settings !== 'object' || Array.isArray(settings)) {
      console.warn('[Logger] Settings parameter should be an object. Received:', typeof settings, settings);
    }

    const { tags, label, colors } = this._normalizeTags(settings);
    if (!this._shouldLog(tags)) {
      return;
    }

    // Apply colors if specified
    if (colors.color1 && colors.color2) {
      const tagPart = `%c[${label}]%c`;
      const messagePart = messages.map(msg => `%c${msg}%c`).join(' ');

      const styles = [
        `color: ${colors.color1}`, // Tag opening bracket and label
        `color: ${colors.color2}`, // Reset for space after tag
      ];

      // Add styles for each message part
      messages.forEach(() => {
        styles.push(`color: ${colors.color2}`); // Message color
        styles.push(''); // Reset
      });

      fn(tagPart + ' ' + messagePart, ...styles);
    } else {
      // No colors specified, use default
      fn(`[${label}]`, ...messages);
    }
  }

  _shouldLog(tags) {
    if (!this._tagEvaluator) {
      return true;
    }

    return this._tagEvaluator(tags);
  }

  _normalizeTags(tagInput) {
    let tags = new Set();
    let label = "untagged";
    let colors = { color1: "white", color2: "white" };

    // Handle object input with tag and color properties
    if (tagInput && typeof tagInput === 'object' && !Array.isArray(tagInput) && !(tagInput instanceof Set)) {
      // Extract tag information
      const tagValue = tagInput.tag || tagInput.tags;
      if (tagValue) {
        if (tagValue instanceof Set) {
          tags = new Set(Array.from(tagValue).map((tag) => String(tag).trim()).filter(Boolean));
        } else if (Array.isArray(tagValue)) {
          tags = new Set(tagValue.map((tag) => String(tag).trim()).filter(Boolean));
        } else {
          const raw = String(tagValue).split("|");
          tags = new Set(raw.map((tag) => String(tag).trim()).filter(Boolean));
        }
      }

      // Extract color information
      if (tagInput.color) {
        colors.color1 = tagInput.color;
        colors.color2 = tagInput.color;
      }
      if (tagInput.color1) {
        colors.color1 = tagInput.color1;
      }
      if (tagInput.color2) {
        colors.color2 = tagInput.color2;
      }

      label = tags.size > 0 ? Array.from(tags).join("|") : "untagged";
    }
    // Handle legacy Set input
    else if (tagInput instanceof Set) {
      const tagArray = Array.from(tagInput).map((tag) => String(tag).trim());
      const filtered = tagArray.filter(Boolean);
      tags = new Set(filtered);
      label = filtered.length ? filtered.join("|") : "untagged";
    }
    // Handle legacy array/string input
    else {
      const raw = Array.isArray(tagInput)
        ? tagInput
        : String(tagInput ?? "").split("|");

      const tagArray = raw
        .map((tag) => String(tag).trim())
        .filter(Boolean);

      tags = new Set(tagArray);
      label = tagArray.length > 0 ? tagArray.join("|") : String(tagInput ?? "").trim() || "untagged";
    }

    return { tags, label, colors };
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
