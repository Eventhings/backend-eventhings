import cors from "cors";
import "dotenv/config";
import express from "express";

import { protectEndpoint } from "./middlewares";
import errorHandler from "./middlewares/errorHandlers";
import routes from "./routes";
import { initFirebase } from "./service";

const app = express();

initFirebase();

app.use(cors());
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(protectEndpoint);
app.use("/", routes);
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log("Server Running on Port " + PORT));
