import https from 'https';
import express from 'express';

const app = express();

// Route to fetch file contents
app.get('/:id/*', (req, res) => {
    const id = req.params.id;
    const filePath = req.params[0]; // Capture everything after the ID
    const externalUrl = `https://channel.singteltvgo.com/wp/liveorigincluster.poster.iptv.singnet.public/${id}/${filePath}?device_profile=dash_cenc_axinom&seg_size=2`;

    https.get(externalUrl, (externalRes) => {
        // Set the same headers from the external response to the client
        res.status(externalRes.statusCode);
        res.setHeader('Content-Type', externalRes.headers['content-type'] || 'application/octet-stream');

        // Stream the data directly to the client as it comes in
        externalRes.pipe(res);

    }).on('error', (err) => {
        console.error('Error fetching the file:', err.message);
        res.status(500).send('Error fetching the file');
    });
});

// Define the port to listen on
const port = 3000;

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
