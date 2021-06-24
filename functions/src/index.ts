import * as functions from "firebase-functions";
import * as express from "express";
import * as cors from "cors";
import * as agents from "./contollers/agents.controllers";
import * as flows from "./contollers/flows.controllers";

const app = express();
app.use(express.json());
app.use(cors());

// Agents
app.post("/agents", agents.create);
app.put("/agents/:agentId", agents.update);
app.delete("/agents/:agentId", agents.remove);

// Flows
app.post("/agents/:agentId/flows", flows.create);

exports.app = functions.https.onRequest(app);
