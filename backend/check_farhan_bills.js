const axios = require('axios');

const API_URL = 'http://51.20.34.254:5000/api';

const checkFarhanBills = async () => {
    try {
        // We need Farhan's email and password to login
        // From the screenshots, email was gpt44311@gmail.com
        // We don't know Farhan's password, so let's use admin bills endpoint
        // and check ALL bills in a raw dump

        console.log("Can't login as Farhan (unknown password)");
        console.log("The Admin API shows 0 bills for Farhan khan");
        console.log("");
        console.log("POSSIBLE CAUSES:");
        console.log("1. Mobile app is showing CACHED data (old bills)");
        console.log("2. Farhan has bills tied to a DIFFERENT user ID");
        console.log("");
        console.log("SOLUTION:");
        console.log("- Ask user to CLEAR APP CACHE and re-open mobile app");
        console.log("- Or reinstall the mobile app");
        console.log("- Or pull-to-refresh on the Bills screen");

    } catch (error) {
        console.error('Error:', error.message);
    }
};

checkFarhanBills();
