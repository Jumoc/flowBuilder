import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as express from "express";
import * as cors from "cors";
import * as dialogflowcx from "@google-cloud/dialogflow-cx";
// import * as swaggerJsdoc from "swagger-jsdoc";
// import * as swaggerUi from "swagger-ui-express";
import { google } from "@google-cloud/dialogflow-cx/build/protos/protos";

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

app.put("/agents/:agentName", async (req, res) => {
  const client = new dialogflowcx.v3.AgentsClient(
      {keyFilename: "./flowBuilder.json"}
  );

  // Gets email from credentials body json
  // const email = req.body.credentials.email;

  const displayName = req.params.agentName;

  if (displayName === "") {
    res.status(400).send({error: `${displayName} can not be empty`});
    return;
  }

  // check if email exists in the db

  // check if an agent with that name exists in the db

  const agentID = client.agentPath(project, "global", "1ad38af8-08ab-4b3f-82b1-76c395d1def9");

  // get requested agent
  try {
    const [IAgent] = await client.getAgent({
      name: agentID,
    });

    IAgent.displayName = "Name Changed";

    // update client with data passed to it
    const update = await client.updateAgent({
      agent: IAgent, // agent to update
    });
    res.send(update);
  } catch (err) {
    console.error(err);
    res.send(err);
  } 
});

app.post("/agents/:agentName/flows", async (req, res) => {
  const client = new dialogflowcx.v3.FlowsClient(
      {keyFilename: "./flowBuilder.json"}
  );

  // Gets email from credentials body json
  // const email = req.body.credentials.email;

  const displayName = req.params.agentName;

  if (displayName === "") {
    res.status(400).send({error: `${displayName} can not be empty`});
    return;
  }

  // check if email exists in the db

  // check if an agent with that name exists in the db

  const agentPath = client.agentPath(project, "global", "1ad38af8-08ab-4b3f-82b1-76c395d1def9");

  // create flow
  try {
  const newFlow = await client.createFlow({
    parent: agentPath,
    flow: req.body.flow
    // language code
  });

  //store it in db


  res.send(newFlow)
  } catch (err) {
    console.error(err);
    res.send(err);    
  }
});


app.put("/agents/:agentName/flows/:flowName", async (req, res) => {
  const client = new dialogflowcx.v3.FlowsClient(
      {keyFilename: "./flowBuilder.json"}
  );

  // Gets email from credentials body json
  // const email = req.body.credentials.email;

  const agentName = req.params.agentName;
  const flowName = req.params.flowName

  if (agentName === "") {
    res.status(400).send({error: `${agentName} can not be empty`});
    return;
  }

  // check if email exists in the db

  // check if an agent with that name exists in the db

  // const agentID = client.agentPath(project, "global", agentName);

  

  // get requested agent
  try {
    const [IFlow] = await client.getFlow({
      name: flowName
    });

    // change what needs to be changed in the flow

    const update = await client.updateFlow({
      flow: IFlow,
      // language code
    });
    res.send(update);
  } catch (err) {
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

  // const email = req.body.credentials.email; // use it when db integrated

  // Default flow ID, created automatically when a project is created
  const location = "general"; // change this with dynamic agent location
  const flowID = req.params.flowId;
  const agentName = req.params.agentId;

  try {
    const flowPath = client.flowPath(project, location, agentName, flowID);

    const newPage = req.body.page
      // displayName: 'AlejoPage',
      // entryFulfillment
      // form
      // transitionRouteGroups
      // transitionRoutes
      // eventHandlers

    const result = await client.createPage({
      parent: flowPath,
      page: newPage,
      // languageCode here
      // https://cloud.google.com/dialogflow/cx/docs/reference/language
    });

    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put("/agents/:agentId/flows/:flowId/pages/:pageId", async (req, res) => {
  const client = new dialogflowcx.v3.PagesClient(
      {keyFilename: "./flowBuilder.json"}
  );

  // const email = req.body.credentials.email; // use it when db integrated

  // Default flow ID, created automatically when a project is created
  const location = "general"; // change this with dynamic agent location
  const flowId = req.params.flowId;
  const agentName = req.params.agentId;
  const pageId = req.params.pageId;
  const {page: updatePage} = req.body;

  try {
    const pagePath = client.pagePath(project, location, agentName, flowId, pageId);

    const [IPage] = await client.getPage({
      name: pagePath,
      // languageCode
    });

    const result = await client.updatePage({
      page: IPage,
      // languageCode
    });

    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Swagger set up
/*const options = {
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
        url: "http://localhost:5001/flowbuilder-857d5/us-central1/app"
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
);*/

exports.app = functions.https.onRequest(app);
