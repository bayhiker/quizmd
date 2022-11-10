import { quizmd } from "../index";
import { writeFileSync, readFileSync } from "fs";
import { QuizMdRenderer } from "../lib/renderers/quizmd-renderer";

const allRenderers = quizmd.getAllRenderers();
let elements = "";
for (let name in allRenderers) {
  const R: typeof QuizMdRenderer = allRenderers[name];
  const r = new R(allRenderers, {});
  let element = "";
  if (r.sample) {
    r.sample.forEach((sampleLine: string) => {
      element += `${sampleLine}\n`;
    });
  }
  element = element.replace(/,\n$/, "");
  elements += `## ${r.descShort}

${r.descLong}
\`\`\`
${element}
\`\`\`
`;
}

elements = elements.replace(/,[\r\n]*?$/, "");

// Generate ./README.md
const readmeBuffer = readFileSync("./README.template.md");
let readmeContent = readmeBuffer
  .toString()
  .replace(/\{\{quiz_elements\}\}/, elements);
writeFileSync("./README.md", readmeContent);
