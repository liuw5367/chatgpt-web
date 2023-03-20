import fs from "fs";

const data = fs.readFileSync("./en.csv");
const text = new String(data);

const json = text
  .split("\n")
  .filter((line, index) => index !== 0 && line.length > 0)
  .map((line) => {
    const index = line.indexOf(",");
    const act = line.substring(1, index - 1);
    const prompt = line.substring(index + 2, line.length - 1);
    return { act, prompt };
  });

fs.writeFileSync("./en.json", JSON.stringify(json, null, 2));
