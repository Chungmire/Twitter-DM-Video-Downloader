const { createFFmpeg, fetchFile } = FFmpeg;

const ffmpeg = createFFmpeg({
    corePath: chrome.runtime.getURL("lib/ffmpeg-core.js"),
    log: true,
    mainName: 'main'
});

async function convertM3U8ToMP4(urls) {
    console.log(`Converting M3U8 to MP4: ${urls}`)
    const videoTrack = urls[0]
    const audioTrack = urls[1]

    const videoBlob = await processTrack(videoTrack, 'video');
    const audioBlob = await processTrack(audioTrack, 'audio');

    await combineVideoAndAudioBlobs(videoBlob, audioBlob);

}

async function processTrack(trackURL, trackType) {
    console.log(`Processing ${trackType} track: ${trackURL}`)

    if (ffmpeg.isLoaded()) await ffmpeg.exit();
    await ffmpeg.load();

    const response = await fetch(trackURL);
    if (!response.ok) throw new Error(`Failed to fetch the file: ${trackURL}`);
    const arrayBuffer = await response.arrayBuffer();
    const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
    let modifiedText = text.replace(/\/dm_video\//g, "https://video.twimg.com/dm_video/");
    modifiedText = await downloadInitializationSegment(modifiedText, trackType);
    const replacements = prepareSegmentReplacements(modifiedText, trackType);
    await fetchAndWriteSegments(replacements);
    const finalM3U8Content = replaceUrlsWithLocalFilenames(modifiedText, replacements);
    const localInputFileName = `${trackType}Track.m3u8`;
    const outputFileName = `${trackType}Track.mp4`;
    ffmpeg.FS('writeFile', localInputFileName, new TextEncoder().encode(finalM3U8Content));

    const commandStr = `-protocol_whitelist file,tls,tcp,https,crypto -allowed_extensions ALL -i ${localInputFileName} -c copy ${outputFileName}`;
    await ffmpeg.run(...commandStr.split(' '));

    try {
        const data = ffmpeg.FS('readFile', outputFileName);
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        await ffmpeg.exit();
        return blob;
    } catch (error) {
        console.error(`Error converting ${trackType} track:`, error);
        return null;
    }
}

async function combineVideoAndAudioBlobs(videoBlob, audioBlob) {
    if (ffmpeg.isLoaded()) await ffmpeg.exit();
    await ffmpeg.load();

    const videoArrayBuffer = await videoBlob.arrayBuffer();
    const videoUint8Array = new Uint8Array(videoArrayBuffer);
    ffmpeg.FS('writeFile', 'video.mp4', videoUint8Array);

    const audioArrayBuffer = await audioBlob.arrayBuffer();
    const audioUint8Array = new Uint8Array(audioArrayBuffer);
    ffmpeg.FS('writeFile', 'audio.mp4', audioUint8Array);

    // Combine video and audio into a final MP4 file
    const outputFileName = 'output.mp4';
    try {
        await ffmpeg.run('-i', 'video.mp4', '-i', 'audio.mp4', '-c', 'copy', outputFileName);
        const data = ffmpeg.FS('readFile', outputFileName);

        // Download the combined MP4 file
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        downloadFile(blob, outputFileName);
    } catch (error) {
        console.error('Error during track combination:', error);
    }
}

function prepareSegmentReplacements(m3u8Content, trackType) {
    console.log("m3u8Content:", m3u8Content); // Log the m3u8 content
    const lines = m3u8Content.split('\n');
    const segmentUrls = lines.filter(line => line.startsWith('https://') && line.endsWith('.m4s'));
    console.log("segmentUrls:", segmentUrls); // Log the matched URLs

    if (segmentUrls.length === 0) {
        console.error("No segment URLs found in the m3u8 content.");
        return [];
    }

    const replacements = segmentUrls.map((url, index) => ({
        originalUrl: url,
        localFilename: `segment${index + 1}_${trackType}.m4s`
    }));
    return replacements;
}





async function fetchAndWriteSegments(replacements) {
    for (const { originalUrl, localFilename } of replacements) {
        const response = await fetch(originalUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch segment: ${originalUrl}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        ffmpeg.FS('writeFile', localFilename, new Uint8Array(arrayBuffer));
    }
}

function replaceUrlsWithLocalFilenames(m3u8Content, replacements) {
    let modifiedM3u8 = m3u8Content;
    for (const { originalUrl, localFilename } of replacements) {
        modifiedM3u8 = modifiedM3u8.replace(originalUrl, localFilename);
    }
    return modifiedM3u8;
}

async function downloadInitializationSegment(m3u8Content, trackType) {
    const initSegmentMatch = m3u8Content.match(/#EXT-X-MAP:URI="([^"]+)"/);
    if (initSegmentMatch) {
        const initSegmentUrl = initSegmentMatch[1]; // URL to be fetched
        const localInitFileName = `initSegment${trackType}.mp4`;

        // Fetch and write the initialization segment to FFmpeg's VFS
        const response = await fetch(initSegmentUrl);
        const buffer = await response.arrayBuffer();
        ffmpeg.FS('writeFile', localInitFileName, new Uint8Array(buffer));

        // Replace the EXT-X-MAP URI in the M3U8 content with the local filename
        const updatedM3u8Content = m3u8Content.replace(initSegmentMatch[0], `#EXT-X-MAP:URI="${localInitFileName}"`);
        return updatedM3u8Content; // Return the updated M3U8 content
    }
    return m3u8Content; // Return original content if no initialization segment is found (will cause error when transcoding.)
}

function downloadFile(blob, fileName) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
}

//This runs when the page opens.
chrome.storage.local.get('urlsToTranscode', async ({ urlsToTranscode }) => {
    if (urlsToTranscode) {
        console.log(`Transcoding URLs: ${urlsToTranscode}`)
        await convertM3U8ToMP4(urlsToTranscode);
        chrome.storage.local.remove('urlsToTranscode', () => {
            window.close();
        });
    }
});
