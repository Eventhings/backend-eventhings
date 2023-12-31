import cors from "cors";
import "dotenv/config";
import express from "express";

import { createServer } from "http";
import errorHandler from "./middlewares/errorHandlers";
import routes from "./routes";
import { initFirebase } from "./service";
import { socketConnection } from "./service/socket";

const app = express();
const server = createServer(app);

initFirebase();
socketConnection(server);

app.use(cors({ origin: "*" }));
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// app.use(protectEndpoint);
app.use("/", routes);
app.use(errorHandler);

const port = parseInt(process.env.PORT ?? "8080");

server.listen(port, () => {
	console.log(`listening on port ${port}`);
});
