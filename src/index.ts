#!/usr/bin/env node
import axios from "axios";
import fs from "fs";
import prettier from "prettier";
import { program } from "commander";

program.option("-p, --path <string>");

program.parse();

const options = program.opts();

const generateType = ({ name, schema }) => {
  const convertTypes = (type, currProp) => {
    if (type.includes("#")) {
      return `${type.split("/schemas/")[1]}`;
    }
    if (type === "integer") return "number";
    if (type === "array") {
      if ("$ref" in currProp.items) {
        return `${currProp.items["$ref"].split("/schemas/")[1]}[]`;
      } else if ("type" in currProp.items) {
        return `${currProp.items.type}[]`;
      }
    }
    return type;
  };

  const reduceProperties = (properties) => {
    return Object.keys(properties).reduce((prev, curr) => {
      return (
        prev +
        `
      ${curr}: ${convertTypes(
          properties[curr].type || properties[curr]["$ref"],
          properties[curr]
        )};`
      );
    }, "");
  };

  return `
  interface ${name} {
    ${reduceProperties(schema.properties)}
  }
  `;
};

(async () => {
  const swaggerData = await axios.get(options.path);

  const schemas = swaggerData.data.components.schemas;

  const typesFileContent = Object.keys(schemas).reduce((prev, curr) => {
    return prev + generateType({ name: curr, schema: schemas[curr] });
  }, "");

  const finalData = prettier.format(
    `// This file is auto-generated (do not modify) ${typesFileContent}`,
    {
      parser: "babel",
    }
  );

  console.log({ options });

  fs.writeFileSync("test.ts", finalData);
})();
