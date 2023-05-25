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

// Function to prompt the user for the exercise description
function promptExerciseDescription() {
  return new Promise((resolve) => {
    rl.question("Enter the exercise description: ", (description) => {
      resolve(description);
    });
  });
}

// Function to generate Python code for the exercise description
async function generatePythonCode(exerciseDescription) {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "Act as an computer science student in the first semester, in a class about: lists"},
      { role: "system", content: "I will give you some Python exercises in portuguese. You translate it and do it in the most optimized way. Use CamelCase in the variable names, do not output any text, only code" },
      { role: "system", content: "coment a line with a resume of the exercise input in potugese using, Exercício: description, comment above the code with the # tag" },
      { role: "system", content: "add some simple comments, not for all the lines, only the essencial" },
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
    if (exerciseCount > 10) {
      break; // Break the loop if exerciseCount exceeds 10
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
