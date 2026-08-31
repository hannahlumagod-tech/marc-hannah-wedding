const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Marc & Hannah Wedding Website is running."
  });
});

app.listen(PORT, () => {
  console.log(`Wedding website running on port ${PORT}`);
});