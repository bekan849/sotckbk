const fs = require("fs");
const path = require("path");

const filesToCopy = [
  { from: "src/config/firebaseServiceAccount.json", to: "dist/config/firebaseServiceAccount.json" }
];

filesToCopy.forEach(({ from, to }) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`Copied ${from} → ${to}`);
});
