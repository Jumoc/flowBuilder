/*
    File to manage all operations regarding an agent
*/
import * as dialogflowcx from "@google-cloud/dialogflow-cx/";
import {PROJECT, db, Df, LOCATION} from "./constants";
import {IAgent} from "../models/agent";
import * as express from "express";

const client = new dialogflowcx.v3.IntentsClient(
    {keyFilename: "./flowBuilder.json"}
);

export const create = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  // Gets email from body json
  // const email = req.body.credentials.email;
  const agentId = req.params.agentId;

  // Check if agent name is already in the database

  const newIntent = new Df.Intent(req.body.intent);
  console.log(newIntent);

  const formattedAgentLocation = client.agentPath(
      PROJECT,
      LOCATION,
      agentId
  );
  console.log(`Location path: ${formattedAgentLocation}`);
  try {
    const [response] = await client.createIntent({
      parent: formattedAgentLocation,
      intent: newIntent,
    });

    // if (response && typeof response.name === "string") {
    //   const formattedName = response.name.toString().split("/")[5];
    //   newIntent.name = formattedName;
    // } else {
    //   return res.status(400).send(
    //       {
    //         error: "Error while creating the agent",
    //       });
    // }
    // Agent that gets uploaded to firestore
    // const agent: IAgent = {
    //   agentId: newAgent.name,
    //   displayName: newAgent.displayName,
    //   location: LOCATION,
    //   createdAt: Date.now().toString(),
    //   updatedAt: Date.now().toString(),
    //   userId: email,
    // };
    console.log(response);
    // const document = await db.collection("agents").add(agent);
    // await document.collection("flows").add({
    //   flowId: "00000000-0000-0000-0000-000000000000",
    //   displayName: "default",
    // });
    // await document.collection("pages").add({
    //   pageId: "START_PAGE",
    //   displayName: "start",
    // });
    return res.send(response);
  } catch (err) {
    console.error(err);
    return res.status(500).send(err);
  }
};


export const update = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  const client = new dialogflowcx.v3.AgentsClient(
      {keyFilename: "./flowBuilder.json"}
  );

  // Gets email from credentials body json
  const {email} = req.body.credentials;
  const agentId = req.params.agentId;

  if (agentId === "") {
    return res.status(400).send(
        {
          error: `${agentId} can not be empty`,
        });
  }
  // check if email exists in the db
  // check if an agent with that name exists in the db

  const agentPath = client.agentPath(PROJECT, LOCATION, agentId);

  try {
    const [IAgent] = await client.getAgent({
      name: agentPath,
    });

    if (!IAgent) {
      return res.status(400).send(
          {
            error: "Error getting the agent, check the id",
          });
    }

    const document = await db.collection("agents").where("userId", "==", email)
        .where("agentId", "==", agentId).get();

    if (!document.docs[0]) {
      return res.status(400).send(
          {
            error: "Could not locate agent in the Database",
          });
    }

    Object.assign(IAgent, req.body.agent);

    // update client with data passed to it
    const update = await client.updateAgent({
      agent: IAgent, // agent to update
    });

    const formattedName = tokenAgentId(IAgent.name as string);

    if (formattedName === null) {
      console.error("Could not tokenize agent id " + IAgent.name);
      return res.status(500).send(
          {
            error: "Could not tokenize agent id " + IAgent.name,
          });
    }

    const agent: IAgent = {
      agentId: formattedName,
      // add user email to the displayName if not present
      displayName: IAgent.displayName as string,
      location: LOCATION,
      createdAt: document.docs[0].data().updatedAt,
      updatedAt: Date.now().toString(),
      userId: email,
    };

    await document.docs[0].ref.set(agent);

    return res.send(update);
  } catch (err) {
    console.error(err);
    return res.send(err);
  }
};

// export const remove = async (
//     req: express.Request, res: express.Response
// ): Promise<unknown> => {
//   const agentId = req.params.agentId;
//   const agentPath = client.agentPath(PROJECT, "global", agentId);
//   const {email} = req.body.credentials;

//   try {
//     const [IAgent] = await client.getAgent({
//       name: agentPath,
//     });

//     if (!IAgent) {
//       return res.status(404).send(
//           {
//             error: `No agent with that id found ${agentId}`,
//           });
//     }

//     const document = await db.collection("agents")
//      .where("userId", "==", email)
//         .where("agentId", "==", agentId).get();

//     if (!document.docs[0]) {
//       return res.status(400).send(
//           {
//             error: "Could not locate agent in the Database",
//           });
//     }

//     /* Delete flows subcollection */
//     const snapshotFlows = await document.docs[0].ref.collection("flows")
// .get();

//     snapshotFlows.docs.forEach((doc) => {
//       doc.ref.delete();
//     });

//     /* Delete pages subcollection */
//     const snapshotPages = await document.docs[0].ref.collection("pages")
// .get();

//     snapshotPages.docs.forEach((doc) => {
//       doc.ref.delete();
//     });

//     /* Delete complete document */
//     await document.docs[0].ref.delete();

//     const response = await client.deleteAgent({name: agentPath});
//     return res.send(response);
//   } catch (err) {
//     console.error(err);
//     return res.status(400).send(err);
//   }
// };

const tokenAgentId = (path: string): string | null => {
  if (!path.includes("/")) {
    return path;
  }

  const tokens = path.split("/");

  if (tokens.length < 6) {
    return null;
  }

  return tokens[5];
};

