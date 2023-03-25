import data from "./source/openprompts.json";

const prompts = data.map((item) => {
  const { name, description, prompt } = item;
  return {
    act: name,
    prompt,
    desc: description,
  };
});

export default prompts;
