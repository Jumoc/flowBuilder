import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";
import * as dialogflowcx from "@google-cloud/dialogflow-cx";

const app = express();
app.use(express.json());
app.use(cors());

admin.initializeApp();

// Static project name
const project = "flowbuilder-857d5";

app.post("/agents", async (req, res) => {
  const client = new dialogflowcx.v3.AgentsClient(
      {keyFilename: "./flowBuilder.json"}
  );

  // Gets email from body json
  const email = req.body.credentials.email;
  const displayName = req.body.agent.displayName;
  const location = req.body.location;

  // Refactor this
  if (checkEmail(email) === null) {
    res.status(404).send({error: `${email} does not exist`});
    return;
  }

  if (displayName === "") {
    res.status(400).send({error: `${displayName} can not be empty`});
    return;
  }

  // Check if agent name is already in the database
  try {
    const newAgent = await admin.firestore().collection("users")
        .doc(email).collection("agents")
        .doc(displayName).get();

    if (newAgent.exists) {
    // Change status to error
      res.status(400).send({error: "Agent with the same name already created"});
      return;
    }
  } catch (err) {
    res.send(err);
  }

  const agent = req.body.agent;
  agent.displayName = agent.displayName + "." + email;

  const formattedAgentLocation = client.locationPath(
      project,
      location
  );
  console.log(`Location path: ${formattedAgentLocation}`);

  try {
    const response = await client.createAgent({
      parent: formattedAgentLocation,
      agent: agent,
    });

    await admin.firestore().collection("users")
        .doc(email).collection("agents").doc(displayName).set({
          id: String(response[0].name).split("/")[6],
          location: location
        });

    res.send(response);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

app.post("/agents/:id", async (req, res) => {
  const client = new dialogflowcx.v3.PagesClient(
      {keyFilename: "./flowBuilder.json"}
  );

  const email = req.body.credentials.email;

  // Default flow ID, created automatically when a project is created
  const flowID = '00000000-0000-0000-0000-000000000000';
  const agentName = req.params.id;
  console.log(location);

  try {
    // Get the agent id and location
    const snapshot = await admin.firestore().collection('users').doc(email)
    .collection('agents').doc(agentName).get();

    // Tokenize the id element of the whole path, id will always be on 6th position
    // ex: projects/flowbuilder-857d5/locations/global/agents/4276b117-7ebf-40bc-9264-cb376d64e0d5
    const id = snapshot.get('id').split('/')[6];
    const location = snapshot.get('location');

  }
});

const checkEmail = async (email: string) => {
  // Refactor this!
  try {
    const snapshot = await admin.firestore().collection("users")
        .doc(email).get();
    if (!snapshot.exists) {
      return null;
    }
  } catch (err) {
    console.error(err);
    return err;
  }
};

exports.app = functions.https.onRequest(app);
