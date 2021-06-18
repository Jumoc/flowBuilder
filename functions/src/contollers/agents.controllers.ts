/*
    File to manage all operations regarding an agent
*/
import * as dialogflowcx from "@google-cloud/dialogflow-cx/";
import {PROJECT, db, Df, LOCATION} from "./constants";
import {IAgent} from "../models/agent";
import * as express from "express";

const client = new dialogflowcx.v3.AgentsClient(
    {keyFilename: "./flowBuilder.json"}
);

export const create = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {

  const { email } = req.body.credentials;
  const { agent: reqAgent } = req.body;

  reqAgent.parent = "projects/democx-303803";

  const newAgent = new Df.Agent(reqAgent);
  newAgent.displayName = newAgent.displayName + "." + email;

  const formattedAgentLocation = client.locationPath(
      PROJECT,
      LOCATION
  );
  try {
    const response = await client.createAgent({
      parent: formattedAgentLocation,
      agent: newAgent,
    });

    if (response[0] && typeof response[0].name === "string") {
      const formattedName = response[0].name.toString().split("/")[5];
      newAgent.name = formattedName;
    } else {
      return res.status(400).send(
          {
            error: "Error while creating the agent",
          });
    }
    
    const agent: IAgent = {
      agentId: newAgent.name,
      displayName: newAgent.displayName,
      location: LOCATION,
      createdAt: Date.now().toString(),
      updatedAt: Date.now().toString(),
      userId: email,
    };
    await db.collection("agents").add(agent);
    return res.send(response);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
};

// Fix database query
export const update = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  const client = new dialogflowcx.v3.AgentsClient(
      {keyFilename: "./flowBuilder.json"}
  );

  const {email} = req.body.credentials;
  const agentId = req.params.agentId;
  const agentPath = client.agentPath(PROJECT, LOCATION, agentId);

  try {
    let [IAgent] = await client.getAgent({
      name: agentPath,
    });

    const document = await db.collection("agents")
        .where("agentId", "==", agentId).get();

    IAgent = Object.assign(IAgent, req.body);

    const update = await client.updateAgent({
      agent: IAgent,
    });

    const agent: IAgent = {
      agentId: document.docs[0].get("agentId"),
      displayName: IAgent.displayName as string,
      location: LOCATION,
      createdAt: document.docs[0].get("createdAt"),
      updatedAt: Date.now().toString(),
      userId: email,
    };

    await document.docs[0].ref.set(agent);

    return res.send(update);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
};

export const remove = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  const agentId = req.params.agentId;
  const agentPath = client.agentPath(PROJECT, "global", agentId);

  try {
    const document = await db.collection("agents")
        .where("agentId", "==", agentId).get();

    // Delete document
    document.forEach(async (value) => {
      await value.ref.delete();
    });

    const response = await client.deleteAgent({name: agentPath});
    return res.send(response);
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
};
