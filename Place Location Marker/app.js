// Import packages
const express = require('express');
const path = require('path');
const Multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const { Firestore } = require('@google-cloud/firestore');
// Set the port
const port = 8080;

// Create instances of necessary packages
const app = express();
const storage = new Storage();
const firestore = new Firestore(); 

// Set the identifier for the GCS bucket where the file will be stored
const bucket = storage.bucket('sp24-41200-danish-gj-uploads');

// Configure an instance of multer
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024
  }
});

// Middleware
app.use(express.json()); // Add this line to parse JSON data in the request body
// app.use('/js', express.static(__dirname + '/public/js'));
// app.use('/css', express.static(__dirname + '/public/css'));
// app.use('/images', express.static(__dirname + '/public/images'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

let startingMarker = null;
let destinationMarker = null;

app.post('/marker', async (req, res) => {
  const { lat, lng } = req.body;
  console.log(`Received marker data - Latitude: ${lat}, Longitude: ${lng}`);

  try {
    if (!startingMarker) {
      startingMarker = { lat, lng };
      console.log('Starting marker added:', startingMarker);
    } else if (!destinationMarker) {
      destinationMarker = { lat, lng };
      console.log('Destination marker added:', destinationMarker);

      // Update Firestore with the coordinates of both markers
      await updateFirestoreWithMarkers(startingMarker, destinationMarker);

      // Reset markers after updating Firestore
      startingMarker = null;
      destinationMarker = null;
    } else {
      console.log('Maximum number of markers reached. Ignoring additional marker.');
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling marker:', error);
    res.status(500).send('Error handling marker');
  }
});

async function updateFirestoreWithMarkers(startingMarker, destinationMarker) {
  try {
    // Update Firestore with the coordinates of both markers
    const docRef = await firestore.collection('markers').doc('marker');
    await docRef.set({
      currLat: startingMarker.lat,
      currLong: startingMarker.lng,
      destLat: destinationMarker.lat,
      destLong: destinationMarker.lng
    });

    console.log('Markers data updated in Firestore');
  } catch (error) {
    console.error('Error updating markers data in Firestore:', error);
    throw error;
  }
}



app.listen(port, () => {
  console.log(`GlobalJags Web App listening on port ${port}`);
});
