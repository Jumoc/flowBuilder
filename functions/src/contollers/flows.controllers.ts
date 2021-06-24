import * as dialogflowcx from "@google-cloud/dialogflow-cx";
import {PROJECT, LOCATION, Df} from "./constants";
import * as express from "express";
import {Component, types} from "../models/component";
import {answer, IElement} from "../models/element";

// instance to manage Dialogflow CX Pages
const pagesClient = new dialogflowcx.v3beta1.PagesClient(
    {keyFilename: "./flowBuilder.json"}
);

// instance to manage Dialogflow CX Intents
const intentsClient = new dialogflowcx.v3.IntentsClient(
    {keyFilename: "./flowBuilder.json"}
);

/**
 * Creates a start Page in DF CX passing it a question
 * @param {IElement} element
 * @param {string} agentId
 * @return {Component} component representing a DF CX Page and question
 */
const createStart = async (
    element: IElement, agentId: string
): Promise<Component> => {
  const defaultIntent = "00000000-0000-0000-0000-000000000000";
  const entityType = "projects/-/locations/-/agents/-/entityTypes/sys.any";
  const intentPath = intentsClient.intentPath(
      PROJECT, LOCATION, agentId, defaultIntent
  );

  // Create follow up page
  try {
    const component = await createQuestion(element, agentId);

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
    await intentsClient.updateIntent({
      intent: startIntent[0],
    });
    return component;
  } catch (err) {
    return err;
  }
};

/**
 * Creates a Page in DF CX given a question type
 * @param {IElement} element
 * @param {string} agentId
 * @return {Component} component representing a CX Page and question
 */
const createQuestion = async (
    element: IElement, agentId: string
): Promise<Component> => {
  const defaultFlow = "00000000-0000-0000-0000-000000000000";
  const parentPage = pagesClient.flowPath(
      PROJECT, LOCATION, agentId, defaultFlow
  );

  const page = new Df.Page({
    displayName: `${element.type}.${element.id}`,
    entryFulfillment: {
      messages: [
        {
          text: {
            text: [element.questions.content],
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
        element.type,
        element.id,
        element.answers,
        element.questions,
        newPage[0]
    );
    return component;
  } catch (err) {
    return err;
  }
};

/**
 * Generates A DF CX Page trannsition routes given a component type
 * @param {any[]} intents list of intents of the component
 * @param {Component} component component to generate its transition routes
 * @param {Component[]} components list of all components to get the
 * component target
 * @return {any[]} Object representing a Page transition routes
 */
const generateTransitionRoutes = (
    intents: any[], component: Component, components: Component[]
): any[] => {
  const routes: {
    intent?: string, condition?: string, targetPage: string
  }[] = [];

  const defaultFlow = "00000000-0000-0000-0000-000000000000";
  const endSession = pagesClient.pagePath(
      PROJECT, LOCATION, agentId, defaultFlow, "END_SESSION");

  const answers: answer[] = component.answers;

  if (component.type === types.question || component.type === types.start) {
    for (let i = 0; i < intents.length; i++) {
      const found = components.find(
          (element) => element.id === answers[i].target
      );
      const route = {
        intent: intents[i].name,
        // if no route for the page, link it with end session
        targetPage: found ? found.cx.name : endSession,
      };
      routes.push(route);
    }
  } else if (component.type === types.message) {
    answers.forEach((value: answer) => {
      const found = components.find((element) => element.id === value.target);
      routes.push({
        condition: "true",
        targetPage: found ? found.cx.name : endSession,
      });
    });
  }
  return routes;
};

/**
 * Creates instances of Intents from the question Answers locally
 * @param {IElement} element
 * @return {any[]} list of created Intents
 */
const createIntents = (element: IElement) => {
  const intents = [];
  for (const answer of element.answers) {
    const intent = new Df.Intent({
      displayName: `${answer.phrase}.${element.id}`,
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

/**
 * Creates an End component which is equivalent
 * to the end session in DF CX
 * @param {IElement} element
 * @param {string} agentId
 * @return {Component} end component
 */
const createEnd = (
    element: IElement, agentId: string
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

/**
 * Links a Component with its target
 * uploads the intents to DF CX and Updates the Page with its transition routes
 * @param {Component} component component to link with its target
 * @param {Component[]} components list of all components
 * @return {Promise<Component>} updated component with its transition routes
 */
const linkComponent = async (
    component: Component, components: Component[]
): Promise<Component> => {
  const parentIntent = pagesClient.agentPath(PROJECT, LOCATION, agentId);

  const newIntents = [];
  if (component.type !== types.message && component.type !== types.end) {
    const intents = createIntents(component);

    // Creates all intents (answers) of the component in DF CX
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

  // Update the page (component) with its corresponding transition routes
  try {
    await pagesClient.updatePage({
      page: component.cx,
    });
    return component;
  } catch (err) {
    return err;
  }
};

let agentId: string;

/**
 * Function controller for POST requests to flows endpoint
 * @param {express.Request} req request
 * @param {express.Response} res response
 * @return {Promise<Component[]>} List of all created components
 */
export const create = async (
    req: express.Request, res: express.Response
): Promise<unknown> => {
  agentId = req.params.agentId;
  const flow = req.body;

  try {
    const components: Component[] = [];
    // Create all components from the request flow
    for await (const item of flow) {
      const component = await createComponent(item);
      components.push(component as Component);
    }
    // Link all components after creating them
    for await (const component of components) {
      await linkComponent(component, components);
    }
    return res.send(components);
  } catch (err) {
    return res.status(400).send(err);
  }
};

/**
 * Determines the type of the element and creates it
 * @param {IElement} element
 * @return {Promise<Component>} created component
 */
const createComponent = async (
    element: IElement
): Promise<Component | null> => {
  try {
    let component;
    switch (element.type) {
      case types.start:
        component = await createStart(element, agentId);
        break;
      case types.question:
      case types.message:
        component = await createQuestion(element, agentId);
        break;
      case types.end:
        component = createEnd(element, agentId);
        break;
      default:
        return null;
    }

    return component;
  } catch (err) {
    return err;
  }
};
