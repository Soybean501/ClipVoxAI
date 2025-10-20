import express from "express";

const app = express();

app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

app.get("*", (req, res) => {
  res.type("text/plain").send("ClipVox clean deployment placeholder");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
