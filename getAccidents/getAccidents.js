// Import packages
const {BigQuery} = require('@google-cloud/bigquery');
const readline = require('readline');

const bigquery = new BigQuery();

//the function to calculate bounding box for a given radius (in miles)
function calculateAreaAccident(latitude, longitude, radiusInMiles) {

    // approximate conversion for latitude & longtitude
    //69 miles in 1 degree
    const milesToDegrees = 1 / 69;
    const latDelta = radiusInMiles * milesToDegrees;
    const lngDelta = radiusInMiles * milesToDegrees / Math.cos(latitude * Math.PI / 180);

    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLng = longitude - lngDelta;
    const maxLng = longitude + lngDelta;

    return {
        minLat,
        maxLat,
        minLng,
        maxLng
    };
}

//the function to query BigQuery and count accidents within the area of coordinates
async function countAccidents(latitude, longitude, radiusInMiles) {
    try {
        const {minLat, maxLat, minLng, maxLng} = calculateAreaAccident(latitude, longitude, radiusInMiles);

        const query = `
            SELECT COUNT(*) as accidentCount
            FROM \`cit412-final-project.us_accidents.source-data\`
            WHERE 
                Start_Lat BETWEEN ${minLat} AND ${maxLat}
                AND Start_Lng BETWEEN ${minLng} AND ${maxLng}
        `;

        const options = {
            query: query
        };

        // run query
        const [rows] = await bigquery.query(options);

        if (rows.length > 0) {
            console.log(`Total accidents within ${radiusInMiles} miles: ${rows[0].accidentCount}`);
        } else {
            console.log('No accidents found within the specified radius.');
        }
    } catch (error) {
        console.error('Error running BigQuery:', error);
    }
}

// the function to ask user for latitude, longitude, and radius input using readline
function promptForInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter latitude: ', (latitude) => {
        rl.question('Enter longitude: ', (longitude) => {
            rl.question('Enter radius (in miles): ', (radius) => {
                rl.close();
                const parsedLatitude = parseFloat(latitude);
                const parsedLongitude = parseFloat(longitude);
                const parsedRadius = parseFloat(radius);

                // Call the function to count accidents within the desired radius
                countAccidents(parsedLatitude, parsedLongitude, parsedRadius);
            });
        });
    });
}

// Run the accident counter by prompting for user input
promptForInput();