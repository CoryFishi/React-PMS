// Test API call
const test = (req, res) => {
  console.log("Test");
  res.json("Test is working");
};

// Exports
module.exports = {
  test
};
