export enum types {
    start = "start",
    question = "question",
    message = "message",
    end = "end"
}

/** Constructor for an agent
     * @param {types} type - type of component
     * @param {string} id - id of component
     * @param {[]} answers - answers of component
     * @param {[]} questions - questions
     * @param {any} cx - CX element attached
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
     * @param {string} id - id of component
     * @param {[]} answers - answers of component
     * @param {[]} questions - questions
     * @param {any} cx - CX element attached
*/
export class Component implements IComponent {
    type: types;
    id: string;
    answers: [];
    questions: [];
    cx: any;

    /** Constructor for an agent
     * @param {types} type - type of component
     * @param {string} id - id of component
     * @param {[]} answers - answers of component
     * @param {[]} questions - questions
     * @param {any} cx - CX element attached
*/
    constructor(type: types, id: string, answers: [], questions: [], cx: any) {
      this.type = type;
      this.id = id;
      this.answers = answers;
      this.questions = questions;
      this.cx = cx;
    }
}
