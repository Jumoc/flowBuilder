import * as dialogflowcx from "@google-cloud/dialogflow-cx";
import {/* db,*/ PROJECT, LOCATION, Df} from "./constants";
import * as express from "express";
import {Component, types} from "../models/component";

const pagesClient = new dialogflowcx.v3beta1.PagesClient(
    {keyFilename: "./flowBuilder.json"}
);

const intentsClient = new dialogflowcx.v3.IntentsClient(
    {keyFilename: "./flowBuilder.json"}
);

// Updates the start page of dialogflow cx so first message doesn't matter
const createStart = async (question: any, agentId: string) => {
  const defaultIntent = "00000000-0000-0000-0000-000000000000";
  const entityType = "projects/-/locations/-/agents/-/entityTypes/sys.any";
  const intentPath = intentsClient.intentPath(
      PROJECT, LOCATION, agentId, defaultIntent
  );
  const pagePath = pagesClient.pagePath(
      PROJECT, LOCATION, agentId, defaultIntent, "START_PAGE"
  );

  // Create follow up page
  try {
    const component = await createQuestion(question, agentId);

    const startIntent = await intentsClient.getIntent({name: intentPath});
    startIntent[0].parameters = [
      {
        id: "any",
        entityType,
        isList: false,
        redact: false,
      },
    ];

    startIntent[0].trainingPhrases = [
      {
        parts: [
          {
            text: "any",
            parameterId: "any",
          },
        ],
        repeatCount: 1,
      },
    ];
    console.log("entré al try");
    console.log(pagePath);
    // const startPage = await pagesClient.getPage({name: pagePath});
    // console.log(startPage[0]);

    /* if (startPage[0] && startPage[0].transitionRoutes) {
      startPage[0].transitionRoutes[0].targetPage = component.cx.name;
    }*/
    await intentsClient.updateIntent({
      intent: startIntent[0],
    });
    // await pagesClient.updatePage({
    //   page: startPage[0],
    // });
    return component;
  } catch (err) {
    return err;
  }
};

// Creates a full page with intents on dialogflow
const createQuestion = async (
    question: any, agentId: string
): Promise<Component> => {
  const defaultFlow = "00000000-0000-0000-0000-000000000000";
  const parentPage = pagesClient.flowPath(
      PROJECT, LOCATION, agentId, defaultFlow
  );

  const page = new Df.Page({
    displayName: `${question.type}.${question.id}`,
    entryFulfillment: {
      messages: [
        {
          text: {
            text: [question.questions.content],
          },
        },
      ],
    },
  });

  try {
    const newPage = await pagesClient.createPage({
      parent: parentPage,
      page,
    });

    const component = new Component(
        question.type,
        question.id,
        question.answers,
        question.questions,
        newPage[0]
    );
    return component;
  } catch (err) {
    return err;
  }
};

const generateTransitionRoutes = (
    intents: any[], component: Component, components: Component[]
) => {
  // routes get duplicated
  const routes: any[] = [];

  const defaultFlow = "00000000-0000-0000-0000-000000000000";
  const endSession = pagesClient.pagePath(
      PROJECT, LOCATION, agentId, defaultFlow, "END_SESSION");

  const answers: any[] = component.answers;

  if (component.type === types.question || component.type === types.start) {
    for (let i = 0; i < intents.length; i++) {
      const found = components.find((element) => element.id === answers[i].target);
        let route = {};
        route = {
          intent: intents[i].name,
          // if no route for the page, link it with end session
          targetPage: found ? found.cx.name : endSession,
        };
        routes.push(route);
    }
  } else if (component.type === types.message) {
    answers.forEach((value: any) => {
      const found = components.find((element) => element.id === value.target);
      routes.push({
        condition: "true",
        targetPage: found ? found.cx.name : endSession,
      });
    });
  }
  return routes;
};

// Creates intents with the answers of the user
const createIntents = (question: any) => {
  const intents = [];
  for (const answer of question.answers) {
    const intent = new Df.Intent({
      displayName: `${answer.phrase}.${question.id}`,
      trainingPhrases: [
        {
          parts: [
            {text: answer.phrase},
          ],
          repeatCount: 1,
        },
      ],
    });
    intents.push({intent, target: answer.target});
  }
  return intents;
};

const createEnd = (
    element: any, agentId: string
) => {
  const defaultFlow = "00000000-0000-0000-0000-000000000000";

  const component = new Component(
      types.end,
      element.id,
      element.answers,
      element.questions,
      {
        name: pagesClient.pagePath(
            PROJECT, LOCATION, agentId, defaultFlow, "END_SESSION"
        )}
  );

  return component;
};

const linkComponent = async (component: Component, components: Component[]) => {
  const parentIntent = pagesClient.agentPath(PROJECT, LOCATION, agentId);

  const newIntents = [];
  // create answers first
  if (component.type !== types.message && component.type !== types.end) {
    const intents = createIntents(component);
    console.log('intents');
    console.log(intents);

    try {
    for await (const intent of intents) {
      try {
        const newIntent = await intentsClient.createIntent({
          parent: parentIntent,
          intent: intent.intent,
        });
        newIntents.push(newIntent[0]);
      } catch (err) {
        return err;
      }
    }
    } catch (err) {
      return err;
    }
  }

  const routes = generateTransitionRoutes(
      newIntents, component, components
  );

  component.cx.transitionRoutes = routes;
  console.log("component with transitions");
  console.log(component.cx);

  try {
    const updatedPage = await pagesClient.updatePage({
      page: component.cx,
    });
    console.log("updated page");
    console.log(updatedPage);
    return component;
  } catch (err) {
    return err;
  }
};

let agentId: string;

// Creates the flow from the flowBuilder request
export const create = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  agentId = req.params.agentId;
  const flow = req.body;

  try {
    const components: Component[] = [];
    for await (const item of flow) {
      const component = await createComponent(item);
      components.push(component);
    }
    // link every page
    for await (const component of components) {
      await linkComponent(component, components);
    }
    return res.send(components);
  } catch (err) {
    return res.status(400).send(err);
  }
};

const createComponent = (item: any) => {
  try {
    let component;
    switch (item.type) {
      case types.start:
        component = createStart(item, agentId);
        console.log("entré start");

        break;
      case types.question:
        component = createQuestion(item, agentId);
        console.log("entré question");
        break;
      case types.message:
        component = createQuestion(item, agentId);
        console.log("entré message");
        break;
      case "end":
        component = createEnd(item, agentId);
        break;
      default:
        return null;
    }

    return component;
  } catch (err) {
    return err;
  }
};
