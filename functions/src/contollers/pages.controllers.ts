import * as dialogflowcx from "@google-cloud/dialogflow-cx";
import {PROJECT, /* db,*/ LOCATION, Df} from "./constants";
import * as express from "express";

const client = new dialogflowcx.v3.PagesClient(
    {keyFilename: "./flowBuilder.json"}
);

export const create = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  let flowId = req.params.flowId;
  const agentId = req.params.agentId;
  flowId = "00000000-0000-0000-0000-000000000000";

  try {
    const flowPath = client.flowPath(PROJECT, LOCATION, agentId, flowId);

    const newPage = new Df.Page(req.body.page);

    const result = await client.createPage({
      parent: flowPath,
      page: newPage,
      // languageCode here
      // https://cloud.google.com/dialogflow/cx/docs/reference/language
    });

    return res.send(result);
  } catch (err) {
    return res.status(500).send(err);
  }
};

export const update = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  const client = new dialogflowcx.v3.PagesClient(
      {keyFilename: "./flowBuilder.json"}
  );

  // Default flow ID, created automatically when a project is created
  const location = "general"; // change this with dynamic agent location
  const flowId = req.params.flowId;
  const agentName = req.params.agentId;
  const pageId = req.params.pageId;

  try {
    const pagePath = client.pagePath(
        PROJECT,
        location,
        agentName,
        flowId,
        pageId
    );

    const [IPage] = await client.getPage({
      name: pagePath,
      // languageCode
    });

    const result = await client.updatePage({
      page: IPage,
      // languageCode
    });

    return res.send(result);
  } catch (err) {
    return res.status(500).send(err);
  }
};

