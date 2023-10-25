import express from "express";

const app = express();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => console.log("Server Running on Port " + PORT));
