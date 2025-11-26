const OPERATOR_TOKENS = new Set(["+", "-", "*", "&", "|", "(", ")", "!"]);

// ANSI color codes for Node.js console
const ANSI_COLORS = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  reset: '\x1b[0m'
};

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

    const { tags, colors, includeSource, sourceDepth, sourcePosition } = this._normalizeTags(settings);
    if (!this._shouldLog(tags)) {
      return;
    }

    // Filter displayed tags to only show those that match the current pattern (if any)
    const displayLabel = this._getDisplayLabel(tags);

    const callerInfo = includeSource ? this._getCallerInfo(sourceDepth) : null;

    // Apply ANSI colors if specified
    if (colors.color1 && colors.color2) {
      let output = '';

      // Add source info at start if requested (before tag)
      if (callerInfo && sourcePosition === "start") {
        output += `${ANSI_COLORS.gray}${callerInfo}${ANSI_COLORS.reset} `;
      }

      output += `${this._getAnsiColor(colors.color1)}[${displayLabel}]${ANSI_COLORS.reset}`;

      // Add messages with color
      messages.forEach((msg) => {
        output += ` ${this._getAnsiColor(colors.color2)}${msg}${ANSI_COLORS.reset}`;
      });

      // Add source info at end (default) if present
      if (callerInfo && sourcePosition === "end") {
        output += ` ${ANSI_COLORS.gray}${callerInfo}${ANSI_COLORS.reset}`;
      }

      fn(output);
    } else {
      // No colors specified, use default
      const args = [];
      if (callerInfo && sourcePosition === "start") {
        args.push(callerInfo, `[${displayLabel}]`);
      } else {
        args.push(`[${displayLabel}]`);
      }
      args.push(...messages);
      if (callerInfo && sourcePosition === "end") {
        args.push(callerInfo);
      }
      fn(...args);
    }
  }

  _shouldLog(tags) {
    if (!this._tagEvaluator) {
      return true;
    }

    return this._tagEvaluator(tags);
  }

  _getDisplayLabel(tags) {
    // If no pattern is set, show all tags
    if (!this._tagEvaluator) {
      return tags.size > 0 ? Array.from(tags).join("|") : "untagged";
    }

    // Filter tags to only include those that would individually match the pattern
    const matchingTags = [];
    for (const tag of tags) {
      // Test each tag individually against the pattern
      const singleTagSet = new Set([tag]);
      if (this._tagEvaluator(singleTagSet)) {
        matchingTags.push(tag);
      }
    }

    // If no individual tags matched but the full set did, fall back to showing all tags
    // This handles complex patterns where tags work together
    return matchingTags.length > 0 ? matchingTags.join("|") : Array.from(tags).join("|");
  }

  _normalizeTags(tagInput) {
    let tags = new Set();
    let colors = { color1: "white", color2: "white" };
    let includeSource = false;
    let sourceDepth = 0;
    let sourcePosition = "end";

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

      // Extract source inclusion setting
      if (tagInput.includeSource !== undefined) {
        includeSource = Boolean(tagInput.includeSource);
      }

      // Extract source depth setting
      if (tagInput.sourceDepth !== undefined) {
        sourceDepth = Math.max(0, parseInt(tagInput.sourceDepth, 10) || 0);
      }

      // Extract source position setting
      if (tagInput.sourcePosition !== undefined) {
        const pos = String(tagInput.sourcePosition).toLowerCase().trim();
        sourcePosition = pos === "start" ? "start" : "end";
      }
    }
    // Handle legacy Set input
    else if (tagInput instanceof Set) {
      const tagArray = Array.from(tagInput).map((tag) => String(tag).trim());
      const filtered = tagArray.filter(Boolean);
      tags = new Set(filtered);
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
    }

    return { tags, colors, includeSource, sourceDepth, sourcePosition };
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

  // Attempts to capture the original callsite so devtools still hints at the source file.
  _getCallerInfo(depth = 0) {
    const error = new Error();
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(error, this._emit);
    }

    const rawStack = typeof error.stack === "string" ? error.stack : "";
    if (!rawStack) {
      return null;
    }

    const lines = rawStack
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && line !== "Error");

    if (!lines.length) {
      return null;
    }

    // Find all external lines (not from Logger)
    const externalLines = lines.filter(
      (line) => !line.includes("Logger._emit") && !line.includes("logging.js")
    );

    // Select the line at the specified depth, or fall back to first external or first line
    const targetLine = externalLines[depth] || externalLines[0] || lines[0];
    const callerLine = targetLine.replace(/^at\s+/, "");

    const pathSegment = callerLine.includes("(")
      ? callerLine.slice(callerLine.indexOf("(") + 1, callerLine.lastIndexOf(")"))
      : callerLine;

    const match = pathSegment.match(/^(.*):(\d+)(?::(\d+))?$/);
    if (!match) {
      return `(source: ${pathSegment})`;
    }

    const [, filePath, line, column] = match;

    // Extract relative path from project root (agent-group-chat folder)
    let relativePath = filePath;
    const projectRootIndex = filePath.indexOf('agent-group-chat');
    if (projectRootIndex !== -1) {
      relativePath = filePath.substring(projectRootIndex + 'agent-group-chat'.length + 1); // +1 for the separator
    }

    const location = [line, column].filter(Boolean).join(":");
    return `(source: ${relativePath}${location ? `:${location}` : ""})`;
  }

  _getAnsiColor(colorName) {
    // Map common color names to ANSI colors
    const colorMap = {
      'black': 'black',
      'red': 'red',
      'green': 'green',
      'yellow': 'yellow',
      'blue': 'blue',
      'magenta': 'magenta',
      'cyan': 'cyan',
      'white': 'white',
      'gray': 'gray',
      'grey': 'gray',
      'brightred': 'brightRed',
      'brightgreen': 'brightGreen',
      'brightyellow': 'brightYellow',
      'brightblue': 'brightBlue',
      'brightmagenta': 'brightMagenta',
      'brightcyan': 'brightCyan',
      'brightwhite': 'brightWhite',
      'lime': 'brightGreen',
      'orange': 'brightYellow',
      'purple': 'magenta',
      'pink': 'brightMagenta'
    };

    const normalizedColor = String(colorName).toLowerCase().replace(/[^a-z]/g, '');
    const ansiColor = colorMap[normalizedColor] || 'white';

    return ANSI_COLORS[ansiColor] || ANSI_COLORS.white;
  }
}
