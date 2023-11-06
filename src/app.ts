import cors from "cors";
import "dotenv/config";
import express from "express";
import routes from "./routes";

const app = express();

app.use(cors());
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log("Server Running on Port " + PORT));
