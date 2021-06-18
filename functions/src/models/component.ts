export enum types {
    start = "start",
    question = "question",
    message = "message",
    end = "end"
}

/** Constructor for an agent
     * @param {types} type - type of component
     * @param {string} id - type of component
     * @param {[]} answers - id of the user
     * @param {[]} questions - location of the agent
     * @param {any} cx - name of the agent
*/
interface IComponent {
    type: types
    id: string
    answers: []
    questions: []
    cx: any
}
/** Constructor for an agent
     * @param {types} type - type of component
     * @param {string} id - type of component
     * @param {[]} answers - id of the user
     * @param {[]} questions - location of the agent
     * @param {any} cx - name of the agent
*/
export class Component implements IComponent {
    type: types;
    id: string;
    answers: [];
    questions: [];
    cx: any;

    /** Constructor for an agent
     * @param {types} type - type of component
     * @param {string} id - type of component
     * @param {[]} answers - id of the user
     * @param {[]} questions - location of the agent
     * @param {any} cx - name of the agent
*/
    constructor(type: types, id: string, answers: [], questions: [], cx: any) {
      this.type = type;
      this.id = id;
      this.answers = answers;
      this.questions = questions;
      this.cx = cx;
    }
}
