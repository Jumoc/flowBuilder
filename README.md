# FlowBuilder Backend

[![N|Solid](https://atomchat.io/wp-content/uploads/2021/02/logo-atom.png)](https://atomchat.io/wp-content/uploads/2021/02/logo-atom.png)

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

FlowBuilder is a visual tool that allows to create chat agents in Dialogflow CX easily.
## Features

- Create agents without needing to know how to code just drag and drop what you want your agent to do
- Easily export and import flows
- Scale your flow as much as you want
- Create as many agents as you want

## How it works
We created some endpoints so the aplication can create agents and its flows.
The process its really simple, just choose a name for your agent and start building your flow. When you save the flow that you've created the API process the entire flow and translates it to the Dialogflow API and constructs what you built there, and thats it, you have your own chat bot created.

## Tech

- Node.js - JavaScript runtime built on Chrome's V8 JavaScript engine
- Express.js - Node.js web application framework
- Dialogflow CX API - Dialogflow CX is a virtual agent that handles conversations with your end-users.
- Firestore - Cloud Firestore is a cloud-hosted, NoSQL database
- Google Cloud Functions - Google Cloud Functions is a serverless execution environment

## Endpoints

**Agents**
  Manage your agents 

* **URL**

  /agents/?{agentId}

* **Method:**

  `POST` | `DELETE` | `PUT`
  
* **Data Params**

  **POST**:
    URL: /agents/
```
    "agent": {
        "displayName": string,
        "defaultLanguageCode": string,
        "timeZone": string
    }
    "credentials": {
        "email": string
    }
```

  **PUT**
  URL: /agents/?{agentId}
  ```
    "agent": {
        "displayName": string,
    }
```
  
  **DELETE**
    URL: /agents/?{agentId}
  
* **Success Response:**
  
  Array of objects containing where the first object is an instance of the created or updated agent

  or 
  
  Empy object if deleted

  * **Code:** 200
 
* **Error Response:**

  Agent with the same name already created
  
  or
  
  No Agent with that name

  * **Code:** 400 BAD REQUEST <br />

* **Sample Call:**
 URL: url/agents
 Method: POST
```
{
    "agent": {
        "displayName": "BakeryAgent",
        "defaultLanguageCode": "en",
        "timeZone": "America/Los_Angeles"
      },
      "credentials": {
        "email": "realemail@flowbuilder.com
      }
}
```

**Flows**
----
  Manage your agent's flows

* **URL**

  /agents/?{agentId}/flows

* **Method:**

  `POST` | `DELETE` | `PUT`
  
* **Data Params**

    There are four types of elements they are:
  1. start
  2. question
  3. message
  4. end
  
  All of them have the same content inside but its treated differently for each one

  **POST**:
    URL: /agents/?{agentId}/flows
    An example of all the elements used in a single request
  ```
    [
        {
            "type":"start",
            "id":"c061447e-9621-49f3-a31e-4598897a8fc2",
            "answers":[
                {
                    "phrase":"here goes an answer the user can give",
                    "target":"89e62a3b-7f33-4898-a24a-890bc4f34ae0"
                }
            ],
            "questions":{
                "type":"text",
                "content":"here goes an question the bot will ask"
            }
        },
        {
            "type":"question",
            "id":"89e62a3b-7f33-4898-a24a-890bc4f34ae0",
            "answers":[
                {
                "phrase":"here goes another answer the user can give",
                "target":"f639b0b6-b022-4a56-9e00-2391d81d1f61"
                }
            ],
            "questions":{
                "type":"text",
                "content":"here goes another question the bot will ask"
            }
        },
        {
            "type":"message",
            "id":"f639b0b6-b022-4a56-9e00-2391d81d1f61",
            "answers":[
                {
                    "phrase":"", 
                    "target":"c5fc31e0-fa83-4bb5-a39c-0d7ad46c0144"
                }
            ],
            "questions":{
                "type":"text",
                "content":"here goes again another question the bot will ask"
            }
        },
        {
            "type":"end",
            "id":"c5fc31e0-fa83-4bb5-a39c-0d7ad46c0144",
            "answers":[],
            "questions":{}
        }
    ]
  ```

  **PUT**
  URL: /agents/?{agentId}/flows/?{elementId}
  ```
    "id": string,
    "type": string,
    "content": string
  ```
  
  **DELETE**
    URL: /agents/?{agentId}/flows/?{elementId}
  
* **Success Response:**
  
  Array of objects containing where the first object is an instance of the created or updated flow or element

  or 
  
  Empy object if deleted

* **Code:** 200
 
* **Error Response:**

  One element of the flow has incorrect syntax
  
  or
  
  No flow given

* **Code:** 400 BAD REQUEST <br />

## Contributors
* Juan Pablo Montoya Caicedo (**jumoc**) [Github](https://github.com/jumoc) | [Twitter](https://twitter.com/Jumoc0) | [LinkedIn](https://www.linkedin.com/in/jumoc/)