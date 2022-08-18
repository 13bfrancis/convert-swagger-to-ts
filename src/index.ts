#!/usr/bin/env node
import axios from "axios";
import fs from "fs";

const generateType = ({ name, schema }) => {
  const convertTypes = (type, currProp) => {
    console.log(type);
    if (type.includes("#")) {
      return `${type.split("/schemas/")[1]}`;
    }
    if (type === "integer") return "number";
    console.log({ currProp });
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
  const rawData = fs.readFileSync("openapi.json") as unknown as string;
  const jsonData = JSON.parse(rawData);

  const schemas = jsonData.components.schemas;

  const typesFileContent = Object.keys(schemas).reduce((prev, curr) => {
    return prev + generateType({ name: curr, schema: schemas[curr] });
  }, "");

  fs.writeFileSync("test.ts", typesFileContent);
})();
