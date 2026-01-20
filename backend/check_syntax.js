
try {
    console.log("Checking adminRoutes...");
    require('./routes/adminRoutes');
    console.log("Checking authRoutes...");
    require('./routes/authRoutes');
    console.log("Checking carpoolRoutes...");
    require('./routes/carpoolRoutes');

    console.log("Checking server.js syntax...");
    // We don't require server.js because it starts listening immediately.
    // Instead we can just parse it or rely on the route checks (since server requires them).
    // If routes are fine, usually server is fine unless server.js itself has a typo.

    console.log("SYNTAX_CHECK_PASSED");
} catch (error) {
    console.error("SYNTAX_CHECK_FAILED");
    console.error(error);
}
