const REQUIRED_CLASSES = ["mx-auto", "w-full", "px-6", "py-10", "md:px-10"];

function findDefaultExportFunction(programNode) {
  for (const stmt of programNode.body) {
    if (stmt.type !== "ExportDefaultDeclaration") continue;
    const decl = stmt.declaration;
    if (decl.type === "FunctionDeclaration" || decl.type === "ArrowFunctionExpression") {
      return decl;
    }
    if (decl.type === "Identifier") {
      const target = programNode.body.find(
        (node) => node.type === "FunctionDeclaration" && node.id && node.id.name === decl.name,
      );
      if (target) return target;
      const declarator = programNode.body
        .filter((node) => node.type === "VariableDeclaration")
        .flatMap((node) => node.declarations)
        .find(
          (node) =>
            node.id.type === "Identifier" &&
            node.id.name === decl.name &&
            node.init &&
            (node.init.type === "ArrowFunctionExpression" ||
              node.init.type === "FunctionExpression"),
        );
      if (declarator) return declarator.init;
    }
  }
  return null;
}

function findTopLevelReturn(fnNode) {
  const body = fnNode.body;
  if (!body) return null;
  if (body.type !== "BlockStatement") {
    if (body.type === "JSXElement" || body.type === "JSXFragment") {
      return { argument: body };
    }
    return null;
  }
  const stack = [...body.body];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;
    if (node.type === "ReturnStatement") return node;
    const skip = new Set([
      "FunctionDeclaration",
      "FunctionExpression",
      "ArrowFunctionExpression",
      "ClassDeclaration",
      "ClassExpression",
    ]);
    if (skip.has(node.type)) continue;
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (Array.isArray(value)) stack.push(...value);
      else if (value && typeof value.type === "string") stack.push(value);
    }
  }
  return null;
}

function collectJsxOpeningElements(node, out, seen) {
  if (!node || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  if (
    node.type === "FunctionDeclaration" ||
    node.type === "FunctionExpression" ||
    node.type === "ArrowFunctionExpression"
  ) {
    return;
  }
  if (node.type === "JSXElement") {
    out.push(node.openingElement);
    for (const child of node.children || []) {
      collectJsxOpeningElements(child, out, seen);
    }
    return;
  }
  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const value = node[key];
    if (Array.isArray(value)) {
      for (const item of value) collectJsxOpeningElements(item, out, seen);
    } else if (value && typeof value.type === "string") {
      collectJsxOpeningElements(value, out, seen);
    }
  }
}

function getClassNameString(openingElement) {
  const attribute = openingElement.attributes.find(
    (attribute) =>
      attribute.type === "JSXAttribute" &&
      attribute.name &&
      attribute.name.name === "className",
  );
  if (!attribute || !attribute.value) return null;
  if (attribute.value.type === "Literal" && typeof attribute.value.value === "string") {
    return attribute.value.value;
  }
  if (
    attribute.value.type === "JSXExpressionContainer" &&
    attribute.value.expression.type === "Literal" &&
    typeof attribute.value.expression.value === "string"
  ) {
    return attribute.value.expression.value;
  }
  return null;
}

function hasAllClasses(className) {
  const tokens = new Set(className.split(/\s+/).filter(Boolean));
  return REQUIRED_CLASSES.every((required) => tokens.has(required));
}

const pageContainerRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require the standard page container contract (root <main> with mx-auto, w-full, px-6, py-10, md:px-10) on every page of the authenticated app shell.",
    },
    messages: {
      standardContainer:
        "Page root must be a <main> element with the standard container classes: mx-auto, w-full, px-6, py-10, md:px-10 (see design-system spec 'Consistent page container').",
    },
  },
  create(context) {
    return {
      Program(node) {
        const pageFunction = findDefaultExportFunction(node);
        if (!pageFunction) return;
        const returnStatement = findTopLevelReturn(pageFunction);
        const openingElements = [];
        if (returnStatement && returnStatement.argument) {
          collectJsxOpeningElements(returnStatement.argument, openingElements, new Set());
        }
        const root = openingElements[0];
        const isMain =
          root && root.name && root.name.type === "JSXIdentifier" && root.name.name === "main";
        if (!isMain) {
          context.report({ node: root ?? node, messageId: "standardContainer" });
          return;
        }
        const className = getClassNameString(root);
        if (!className || !hasAllClasses(className)) {
          context.report({ node: root, messageId: "standardContainer" });
        }
      },
    };
  },
};

export default pageContainerRule;
