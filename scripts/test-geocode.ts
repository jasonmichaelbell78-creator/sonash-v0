
import fetch from 'node-fetch';

// Load from environment - never hardcode API keys
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "";
if (!API_KEY) {
    console.error("ERROR: NEXT_PUBLIC_FIREBASE_API_KEY not set in environment");
    process.exit(1);
}
const ADDRESS = "123 Main St, Nashville, TN";

async function testGeocode() {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(ADDRESS)}&key=${API_KEY}`;
    console.log(`Testing URL: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("Status:", data.status);
        if (data.status === 'OK') {
            console.log("Success! Coordinates:", data.results[0].geometry.location);
        } else {
            console.log("Error Message:", data.error_message);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testGeocode();
