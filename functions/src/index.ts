import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";
import * as agents from "./contollers/agents.controllers";
import * as flows from "./contollers/flows.controllers";
import * as pages from "./contollers/pages.controllers";
import * as intents from "./contollers/intents.controllers";
import * as webhook from "./contollers/webhook.controllers";
// import * as swaggerJsdoc from "swagger-jsdoc";
// import * as swaggerUi from "swagger-ui-express";

const app = express();
app.use(express.json());
app.use(cors());

// Agents
app.post("/agents", agents.create);
app.put("/agents/:agentId", agents.update);
app.delete("/agents/:agentId", agents.remove);

// Flows
app.post("/agents/:agentId/flows", flows.create);
// app.put("/agents/:agentId/flows/:flowId", flows.update);
// app.delete("/agents/:agentId/flows/:flowId", flows.remove);

// Poges
app.post("/agents/:agentId/flows/:flowId/pages", pages.create);
app.put("/agents/:agentId/flows/:flowId/pages/:pageId", pages.update);

// Intents
app.post("/agents/:agentId/intents/", intents.create);

// webhook
app.post("/webhook", webhook.generateMessage);

app.post("/eventWebook", webhook.eventWelcome);

// app.put("/agents/:agentId/intents/:intentId", intents.create)
// app.delete("/agents/:agentId/intents/:intentId", intents.create)


// Swagger set up
/* const options = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Time to document that Express API you built",
      version: "1.0.0",
      description:
        "A test project to understand how easy
        it is to document and Express API",
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
