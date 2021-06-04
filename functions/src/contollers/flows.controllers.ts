import * as dialogflowcx from "@google-cloud/dialogflow-cx";
import {db, PROJECT, LOCATION} from "./constants";
import * as express from "express";

const client = new dialogflowcx.v3.FlowsClient(
    {keyFilename: "./flowBuilder.json"}
);

export const create = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  // Gets email from credentials body json
  // const email = req.body.credentials.email;
  const agentId = req.params.agentId;
  const displayName = req.params.agentName;

  if (displayName === "") {
    return res.status(400).send(
        {
          error: `${displayName} can not be empty`,
        });
  }

  // check if email exists in the db

  // check if an agent with that name exists in the db

  const agentPath = client.agentPath(
      PROJECT,
      LOCATION,
      agentId,
  );

  // create flow
  try {
    const newFlow = await client.createFlow({
      parent: agentPath,
      flow: req.body.flow,
      // language code
    });

    // store it in db


    return res.send(newFlow);
  } catch (err) {
    console.error(err);
    return res.send(err);
  }
};

export const update = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  const client = new dialogflowcx.v3.FlowsClient(
      {keyFilename: "./flowBuilder.json"}
  );

  // Gets email from credentials body json
  // const email = req.body.credentials.email;

  const agentName = req.params.agentName;
  const flowName = req.params.flowName;

  if (agentName === "") {
    return res.status(400).send(
        {
          error: `${agentName} can not be empty`,
        });
  }

  // check if email exists in the db

  // check if an agent with that name exists in the db

  // const agentID = client.agentPath(project, "global", agentName);


  // get requested agent
  try {
    const [IFlow] = await client.getFlow({
      name: flowName,
    });

    // change what needs to be changed in the flow

    const update = await client.updateFlow({
      flow: IFlow,
      // language code
    });
    return res.send(update);
  } catch (err) {
    return res.status(500).send(err);
  }
};

export const remove = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  // const agentId = req.params.agentId;
  const flowId = req.params.flowId;
  // const flowPath = client.flowPath(PROJECT, "global", agentId, flowId);

  try {
    // const response = await client.deleteFlow({name: flowPath});

    const document = await db.collection("flows")
        .where("flowId", "==", flowId).get();

    // console.log(response);
    document.docs.forEach((value) => {
      console.log(value);
    });

    return res.send(document.docs);
  } catch (err) {
    console.error(err);
    return res.status(400).send(err);
  }
};
