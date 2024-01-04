import { OpenAI } from "openai";
import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import {
  loadDocEmbeddings,
  parseCSV,
  generateDynamicPrompt,
  obtainUpdatedPrompt,
} from "./generate-embedding";
import { ChatCompletionMessageParam } from "openai/resources";
const port = process.env.PORT || 3000;
const app = express();
const config = { apiKey: process.env.OPENAI_API_KEY };
const openai = new OpenAI(config);

app.use(cors());
app.use(bodyParser.json());

app.get("/", async (req, res) => {
  res.send("api is up");
});

// req to send mesasge to bot (completion)
app.post("/message", async (req, res) => {
  try {
    // send request to POST /message, and expect the data to be in a json object { message: "message hereß"}
    const prompt = req.body.message;

    // take prompt, intercept, update prompt with context using the embedding code
    const updatedPrompt = await obtainUpdatedPrompt(prompt.messages[0].content);
    console.log(updatedPrompt);

    const updateMessage: ChatCompletionMessageParam[] = [
      { role: "user", content: updatedPrompt },
    ];

    const openAIRes = await openai.chat.completions.create({
      messages: updateMessage,
      model: "gpt-3.5-turbo",
    });
    res.status(200).json({ result: openAIRes.choices[0] });
  } catch (err) {
    console.log("error");
    res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
