import * as functions from "firebase-functions";
// import * as admin from "firebase-admin";
import * as dialogflow from "@google-cloud/dialogflow";
import * as express from "express";
import * as cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.route("/agents/:id")
    .get((req, res) => {
      res.send("You send a get request to agents");
    })
    .post(async (req, res) => {
      const client = new dialogflow.v2beta1.IntentsClient(
          {keyFilename: "./flowBuilder.json"}
      );
      try {
        // Create the path of the parent project
        const formattedParent = client.projectAgentPath(req.params.id);

        // Setup intent for the agent
        const intent = req.body;

        const resp = await client.createIntent({
          parent: formattedParent,
          intent: intent,
        });
        res.send(resp);
      } catch (err) {
        res.status(500).send(err);
        console.error(err);
      }
    });

app.post("/agents", async (req, res) => {
  const client = new dialogflow.v2.AgentsClient(
      {keyFilename: "./flowBuilder.json"}
  );
  try {
    const resp = await client.setAgent({agent: req.body});
    res.send(resp);
  } catch (err) {
    res.status(500).send(err);
    console.error(err);
  }
});

exports.app = functions.https.onRequest(app);
