import {db} from "../contollers/constants";

export interface IAgent {
    agentId: string; // id -> name
    userId: string;
    location: string;
    displayName: string;
    createdAt: string;
    updatedAt: string;
}

/** Defines an agent */
export class Agent implements IAgent {
    agentId: string; // id -> name
    userId: string;
    location = "general";
    displayName: string;
    createdAt: string;
    updatedAt: string;

    /** Constructor for an agent
     * @param {string} agentId - id of the agent
     * @param {string} userId - id of the user
     * @param {string} location - location of the agent
     * @param {string} displayName - name of the agent
     * @param {string} createdAt - date
     * @param {string} updatedAt - date
     */
    constructor(
        agentId: string,
        userId: string,
        location: string,
        displayName: string,
        createdAt: string,
        updatedAt: string,
    ) {
      this.agentId = agentId;
      this.userId = userId;
      this.location = location;
      this.displayName = displayName;
      this.createdAt = createdAt;
      this.agentId = agentId;
      this.updatedAt = updatedAt;
    }
}

export const createAgent = async (agent: IAgent): Promise<void> => {
  const document = await db.collection("agents").add(agent);

  await document.collection("flows").add({
    flowId: "00000000-0000-0000-0000-000000000000",
    displayName: "default",
  });
  await document.collection("pages").add({
    pageId: "START_PAGE",
    displayName: "start",
  });
};

// export const updateAgent = (document: any, newData: Object) => {}

// export const deleteAgent = (document: any) => {}
