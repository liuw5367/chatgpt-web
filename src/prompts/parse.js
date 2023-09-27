import fs from 'node:fs';

const data = fs.readFileSync('./en.csv');
const text = String(data);

const json = text
  .split('\n')
  .filter((line, index) => index !== 0 && line.length > 0)
  .map((line) => {
    const index = line.indexOf(',');
    const act = line.slice(1, index - 1);
    const prompt = line.slice(index + 2, -1);
    return { act, prompt };
  });

fs.writeFileSync('./en.json', JSON.stringify(json, null, 2));
