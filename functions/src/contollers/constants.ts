import * as admin from "firebase-admin";
import * as dialogflowcx from "@google-cloud/dialogflow-cx";

admin.initializeApp();

export const PROJECT = "flowbuilder-857d5";
export const db = admin.firestore();
export const keyFilename = "";
export const Df = dialogflowcx.protos.google.cloud.dialogflow.cx.v3;
export const agentsRef = db.collection("agents");
export const LOCATION = "global";
