import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";
import * as dialogflowcx from "@google-cloud/dialogflow-cx";
import * as swaggerJsdoc from "swagger-jsdoc";
import * as swaggerUi from "swagger-ui-express";

const app = express();
app.use(express.json());
app.use(cors());

admin.initializeApp();

// Create firestore alias
const db = admin.firestore();

// Static project name
const project = "flowbuilder-857d5";

// app.get('/generate', async (req, res) => {
//   await db.collection('users').doc('jumo').set({
//     agents: db.collection
//   });
//   res.send('created')
// });

/*
  body:
    "agent": {
      "parent": "parent path",
      "displayName": "name of the agent",
      "defaultLanguageCode": "en",
      "timeZone": "America/Los_Angeles"
      },
    "location": "location of the agent",
    "credentials": {
        "email": "email that the agent is going to"
    }
*/
app.post("/agents", async (req, res) => {
  const client = new dialogflowcx.v3.AgentsClient(
      {keyFilename: "./flowBuilder.json"}
  );

  // Gets email from body json
  const email = req.body.credentials.email;
  const displayName = req.body.agent.displayName;
  const location = req.body.location;

  if (displayName === "") {
    res.status(400).send({error: `${displayName} can not be empty`});
    return;
  }

  // Check if agent name is already in the database
  try {
    const newAgent = await db.collection("users")
        .doc(email).collection("agents")
        .doc(displayName).get();

    if (newAgent.exists) {
      // Change status to error X
      res.status(400).send({error: "Agent with the same name already created"});
      return;
    }
  } catch (err) {
    res.send(err);
  }

  const agent = req.body.agent;
  console.log(agent);
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

    console.log(response[0]);
    await db.collection("users")
        .doc(email).collection("agents").doc(displayName).set({
          id: String(response[0].name).split("/")[5],
          location: location
        });

    res.send(response);
  } catch (err) {
    console.error("El error es de la creación!" + err);
    res.status(500).send(err);
  }
});

/*
 Creates a page for the given agent
*/
app.post("/agents/:agentId/flows/:flowId/pages", async (req, res) => {
  const client = new dialogflowcx.v3.PagesClient(
      {keyFilename: "./flowBuilder.json"}
  );

  const email = req.body.credentials.email;

  // Default flow ID, created automatically when a project is created
  const flowID = '00000000-0000-0000-0000-000000000000';
  const agentName = req.params.agentId;

  try {
    // Get the agent id and location
    const snapshot = await db.collection('users').doc(email)
    .collection('agents').doc(agentName).get();

    console.log(snapshot);
    
    // Tokenize the id element of the whole path, id will always be on 6th position
    // ex: projects/flowbuilder-857d5/locations/global/agents/4276b117-7ebf-40bc-9264-cb376d64e0d5
    const id = snapshot.get('id');
    const location = snapshot.get('location');

    const pagePath = client.flowPath(project, location, id, flowID);

    const newPage = req.body.page
      // displayName: 'AlejoPage',
      // entryFulfillment
      // form
      // transitionRouteGroups
      // transitionRoutes
      // eventHandlers

    const promisePage = await client.createPage({
      parent: pagePath,
      page: newPage,
      // languageCode here
      // https://cloud.google.com/dialogflow/cx/docs/reference/language
    });

    res.send(promisePage);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Swagger set up
const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Time to document that Express API you built",
      version: "1.0.0",
      description:
        "A test project to understand how easy it is to document and Express API",
      license: {
        name: "MIT",
        url: "https://choosealicense.com/licenses/mit/"
      },
      contact: {
        name: "Swagger",
        url: "https://swagger.io",
        email: "Info@SmartBear.com"
      }
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1"
      }
    ]
  },
  apis: []
};
const specs = swaggerJsdoc(options);
app.use("/docs", swaggerUi.serve);
app.get(
  "/docs",
  swaggerUi.setup(specs, {
    explorer: true
  })
);

exports.app = functions.https.onRequest(app);
