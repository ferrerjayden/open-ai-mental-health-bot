import { OpenAI } from "openai";
import https from "https";
import csv from "csv-parser";
import * as fs from "fs";
import util from "util";
import stream from "stream";
import * as math from "mathjs";
import { testQuery } from "./data/test-query";

const config = { apiKey: process.env.OPENAI_API_KEY };
const openai = new OpenAI(config);

const pipeline = util.promisify(stream.pipeline);

// will generate an embedding given some text using text-embedding-ada-002 model
export const generateEmbedding = async (text: string) => {
  const response = await openai.embeddings.create({
    input: text,
    model: "text-embedding-ada-002",
    encoding_format: "float",
  });

  console.log(response.data[0].embedding);
  // returns embedding from JSON response
  return response.data[0].embedding;
};

// generates embedding for our query
export const generateQueryEmbedding = async (text: string): Promise<any[]> => {
  return generateEmbedding(text);
};

// should return an array of objects, where each object contains the title, heading, and the embedding?
export const loadDocEmbeddings = async (fname: string) => {
  const embeddings: any = {};
  const parser = csv();

  parser.on("data", (row) => {
    // const key = `${row.title}-${row.heading}`;
    const key = `${row.title}`;
    embeddings[key] = Object.keys(row)
      .filter((k) => k !== "title" && k !== "heading")
      .map((k) => parseFloat(row[k]));
  });

  await pipeline(fs.createReadStream(fname), parser);

  return embeddings;
};

// computes the consine similarity of two vectors, will compare the similarity of two vectors in the same space
const cosineSimilarity = (vecA: any[], vecB: any[]) => {
  const normal = Number(math.norm(vecA)) * Number(math.norm(vecB));
  const dp = math.dot(vecA, vecB);
  return dp / normal;
};

// pass the query and the entire document embedding
// will sort the  data we have based on the similarity scored calculated via the cosineSimilarity, will take the three top contents
// these will serve as context we will add to our prompt
export const getSimilarData = async (query: string, contents: any[]) => {
  const queryEmbedding: any[] = await generateQueryEmbedding(query);
  const similarities: any[] = [];
  for (const [docKey, documentEmbedding] of Object.entries(contents)) {
    const similarity = cosineSimilarity(documentEmbedding, queryEmbedding);
    similarities.push({ docKey, similarity });
  }

  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities;
};

// given the query and documentEmbedding, get the similar data
export const generateDynamicPrompt = async (
  query: string,
  documentEmbeddings: any[],
  csvData: any[]
) => {
  console.log("query: ", query);
  const MAX_ROWS = 3;
  const similarData = await getSimilarData(query, documentEmbeddings);

  // take the top three
  const topSimilar = similarData.slice(0, MAX_ROWS);

  console.log("relevant data: ", topSimilar);
  let questionHeader =
    'Answer the question as truthfully as possible using the context provided below, if it is not present in the context, please do not use the context and try to answer based on the question and your knowledge to avoid answering a question incorrectly. Please paraphrase if possible and answer in a nice format that is human readable! \n\n"';
  let enrichedQuery = questionHeader;

  for (const similarItem of topSimilar) {
    // will use docTitle to try and search the original csv
    const docTitle = similarItem.docKey;
    const relevantSection = csvData.find(
      (section) => section.title === docTitle
    );

    if (relevantSection) {
      enrichedQuery += " " + relevantSection.content + "\n\n";
    }
  }
  enrichedQuery += "Question: " + query;
  console.log("enriched query: ", enrichedQuery);
  return enrichedQuery;
};

// helper to parseCSV file
export const parseCSV = async (filePath: string) => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
};

export async function obtainUpdatedPrompt(userPrompt: string): Promise<string> {
  try {
    const embeddings = await loadDocEmbeddings(
      "./data/mental_health_embedding_document.csv"
    );

    const originalCSVData: any = await parseCSV(
      "./data/mental-health-data-2.csv"
    );

    const updatedQuery = await generateDynamicPrompt(
      userPrompt,
      embeddings,
      originalCSVData
    );

    return updatedQuery;
  } catch (err) {
    console.log("ERROR IN UPDAT EPROMPT", err);
    return "";
  }
}
