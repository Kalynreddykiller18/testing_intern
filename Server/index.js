const express = require("express");
const dotenv = require("dotenv");
const connectionDB = require("./config/db");
const cors = require("cors");

// Load Config
dotenv.config({ path: "./config/.env" });

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectionDB();

// Loading routes
app.use("/user", require("./routes/user"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server is Running on port ${PORT}`));
