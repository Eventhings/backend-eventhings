import cors from "cors";
import "dotenv/config";
import express from "express";

import { initFirebase } from "./gcloud";
import { protectEndpoint } from "./middlewares";
import errorHandler from "./middlewares/errorHandlers";
import routes from "./routes";

const app = express();

initFirebase();

app.use(cors());
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(protectEndpoint);
app.use("/", routes);
app.use(errorHandler);

const PORT = 3000;
app.listen(PORT, () => console.log("Server Running on Port " + PORT));
