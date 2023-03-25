import data from "./source/openprompts.json";

const openPrompts = data.map((item) => {
  const { name, description, prompt } = item;
  return {
    act: name,
    prompt,
    desc: description,
  };
});

export { openPrompts };
