import { config } from "dotenv";
import { promises as fs, createReadStream } from "fs";
import readline from "readline";
config();

import { Configuration, OpenAIApi } from "openai";
let exerciseCount = 1;

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.API_KEY }));
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to generate Python code for the exercise description
async function generatePythonCode(exerciseDescription) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "I will give you some Python exercises in portuguese. You translate it and do it in the most simple way. do not output any text, only code" },
      { role: "system", content: "coment a line with the exercise input in potugese using, Exercício: description, comment above the code with #" },
      { role: "system", content: "add some simple comments, only the essencial" },
      { role: "user", content: exerciseDescription },
    ],
  });

  const generatedCode = response.data.choices[0].message.content;
  const cleanedCode = generatedCode.replace(/\\n/g, "\n").replace(/\\'/g, "'");

  return cleanedCode;
}

async function generatePythonFiles(exercisesFile) {
  const fileStream = createReadStream(exercisesFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const exerciseDescription of rl) {
    if (exerciseCount > 20) {
      break; // Break the loop if exerciseCount exceeds 20
    }

    const generatedCode = await generatePythonCode(exerciseDescription);
    const fileName = `${exerciseCount}.py`;
    await fs.writeFile(fileName, generatedCode);
    console.log(`Generated code exported to ${fileName}`);
    exerciseCount++;
  }

  console.log("All exercises processed successfully.");
}

async function main() {
  const exercisesFile = "exercises.txt";
  await generatePythonFiles(exercisesFile);
  rl.close();
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
