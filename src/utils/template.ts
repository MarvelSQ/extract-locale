import _ from "lodash";

function getNextEnd(
  template: string,
  { begin, end, escape }: { begin: string; end: string; escape?: string } = {
    begin: "{",
    end: "}",
    escape: "\\",
  }
) {
  let matchedNumber = 0;
  let endIndex = 0;

  [...template].some((char, index) => {
    if (template[index - 1] === escape) {
      return false;
    }
    if (char === end && matchedNumber === 0) {
      endIndex = index;
      return true;
    }
    if (char === begin) {
      matchedNumber++;
    }
    if (char === end) {
      matchedNumber--;
    }
  });

  return endIndex;
}
/**
 * @example "some{test?a}"
 *          "some{test?a:b}"
 */
export function renderCondition(template: string, context: any) {
  const match = template.match(/(?<!\\){([^?])(?<!\\)\?/);
  if (match) {
    const test = match[1];
    const restString = template.substring(
      (match.index as number) + match[0].length
    );
    const endIndex = getNextEnd(restString);

    const pretext = template.substring(0, match.index);
    const posttext = restString.substring(endIndex + 1);

    let consequent = restString.substring(0, endIndex);

    const hasAlternate = consequent.match(/(?<!\/):/);
    let alternate = "";
    if (hasAlternate) {
      alternate = consequent.substring((hasAlternate.index as number) + 1);
      consequent = consequent.substring(0, hasAlternate.index as number);
    }

    const testResult = _.get(context, test);

    return `${pretext}${testResult ? consequent : alternate}${posttext}`;
  }

  return template;
}

function renderHolder(template: string, context: any): string {
  const holder = template.match(/(?<!\\){([^}])(?<!\\)}/);

  if (holder) {
    const result = _.get(context, holder[1]);

    return renderHolder(template.replace(holder[0], result || ""), context);
  }

  return template;
}

/**
 * @example "{a}" => a => context.a
 *          "{a?a:c}" => a?a:c => context.a ? 'a' : 'c'
 */
function replaceHolder(holder: string, context: any): string {
  const queryMark = holder.match(/(?<!\\)\?/);

  if (queryMark) {
    let test = holder.substring(0, queryMark.index as number);
    let consequent = holder.substring((queryMark.index as number) + 1);
    let alternate = "";
    const alternateMark = consequent.match(/(?<!\\):/);
    if (alternateMark) {
      alternate = consequent.substring((alternateMark.index as number) + 1);
      consequent = consequent.substring(0, alternateMark.index as number);
    }

    return _.get(context, test) ? consequent : alternate;
  } else {
    return _.get(context, holder) || "";
  }
}

function removeEscape(template: string): string {
  return template
    .replace(/\\{/g, "{")
    .replace(/\\}/g, "}")
    .replace(/\\\?/, "?")
    .replace(/\\:/, ":");
}

export function renderTemplate(template: string, context: any): string {
  const nextStart = /(?<!\\){/.exec(template);

  if (nextStart) {
    const pretext = template.substring(0, nextStart.index);

    const resttext = template.substring((nextStart.index as number) + 1);

    const nextEnd = getNextEnd(resttext);

    const holder = resttext.substring(0, nextEnd);

    const posttext = resttext.substring(nextEnd + 1);

    return `${removeEscape(pretext)}${renderTemplate(
      `${replaceHolder(holder, context)}${posttext}`,
      context
    )}`;
  }

  return removeEscape(template);
}
