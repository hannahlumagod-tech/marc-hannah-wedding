const bcrypt = require("bcrypt");

const password = "CHANGE_THIS_TO_YOUR_PASSWORD";

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, 10);

    console.log("\nPassword Hash:\n");
    console.log(hash);
  } catch (error) {
    console.error("Error generating hash:", error);
  }
}

generateHash();