import cors from "cors";
import "dotenv/config";
import express from "express";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebase";
import errorHandler from "./middlewares/errorHandlers";
import routes from "./routes";

const app = express();
initializeApp(firebaseConfig);

app.use(cors());
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", routes);
app.use(errorHandler);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log("Server Running on Port " + PORT));
