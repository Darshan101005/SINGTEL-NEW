import express from 'express';
import https from 'https';
import path from 'path';

const app = express();

// Function to format KID
function formatKID(kid) {
    const upperKid = kid.toUpperCase();
    return upperKid.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
}

// Reformat default_KID values in the XML response
function reformatKIDInResponse(response) {
    return response.replace(/default_KID="([a-fA-F0-9]{32})"/g, (match, p1) => {
        return `default_KID="${formatKID(p1)}"`;
    });
}

// Modify initialization and media attributes in XML
function modifySegmentAttributes(response, id) {
    const initializationPattern = /initialization="([^"]*)"/g;
    const mediaPattern = /media="([^"]*)"/g;

    return response
        .replace(initializationPattern, (match, p1) => {
            return `initialization="${id}/vxfmt=dp/${p1.split('/').pop()}"`;
        })
        .replace(mediaPattern, (match, p1) => {
            return `media="${id}/vxfmt=dp/${p1.split('/').pop()}"`;
        });
}

// Route for MPD files
app.get('/:id.mpd', (req, res) => {
    const id = req.params.id;
    const externalUrl = `https://channel.singteltvgo.com/wp/liveorigincluster.poster.iptv.singnet.public/${id}/vxfmt=dp/manifest.mpd?device_profile=DASH_OTT_ENC_CENC_AXINOM`;

    https.get(externalUrl, (externalRes) => {
        let data = '';

        // Handle the data chunks
        externalRes.on('data', (chunk) => {
            data += chunk;
        });

        // Process and send the data once completely received
        externalRes.on('end', () => {
            // Apply XML modifications
            const modifiedData = reformatKIDInResponse(data);
            const finalData = modifySegmentAttributes(modifiedData, id);

            // Set the correct content type and send the modified data
            res.setHeader('Content-Type', 'application/xml');
            res.status(200).send(finalData);
        });

    }).on('error', (err) => {
        console.error('Error fetching the URL:', err.message);
        res.status(500).send('Error fetching the URL');
    });
});

// Serve static files and other routes if necessary
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
