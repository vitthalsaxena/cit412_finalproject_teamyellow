const {BigQuery}=require('@google-cloud/bigquery');
const {Firestore}=require('@google-cloud/firestore');

//Loading into BigQuery
const bq=new BigQuery();
const projId = 'cit412-final-project';
const datasetId='us_accidents';
const tableId='source-data';
const locations = [];
let curr_lat = 0;
let dest_lat = 0;
let curr_long = 0;
let dest_long = 0;

exports.getLoc = async (event,context) => {
    //Helper function to get the location data from BigQuery
    const scanLoc = async () => {
        const query = `SELECT Start_Lat,Start_Lng FROM ${projId}.${datasetId}.${tableId}`;
        const options = {
            query: query
        };

        queryFS();

        const [rows] = await bq.query(options);
        rows.forEach(row => {
            // Check if the start or end points of the entry fall within the range
            if ((row.Start_Lat >= curr_lat && row.Start_Lat <= dest_lat)) {
                if ((row.Start_Lng >= curr_long && row.Start_Lng <= dest_long)) {
                    locations.push(row);
                }
            }
        });

        //console.log(locations);
    }

    async function queryFS(){
        //Connect to the database
        const db = new Firestore({
            projectId: 'cit412-final-project'
        });
    
        const subInfo = db.collection('markers');
    
        //Query the 'markers' collection
        const queryRef = subInfo;

        //Retrieve the query
        queryRef.get().then((querySnapshot) => {
            //Loop through the documents in the snapshot
            querySnapshot.forEach((doc) => {
                curr_lat = doc.data().currLat;
                dest_lat = doc.data().destLat;
                curr_long = doc.data().currLong;
                dest_long = doc.data().destLong;
            });
        });
    }

    scanLoc();
}
