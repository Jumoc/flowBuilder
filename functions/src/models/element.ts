import {types} from "./component";

export interface questions {
    type: string
    content: string
}

export interface answer {
    phrase: string
    target: string
}

export interface IElement {
    type: types
    id: string
    answers: answer[]
    questions: questions
}
