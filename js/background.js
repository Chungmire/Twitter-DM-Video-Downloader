let videoUrls = {};

function parseVideoUrl(url) {
  const videoIdPattern = /dm_video\/(\d+)/;
  const videoResolutionPattern = /avc1\/(\d+x\d+)/;
  const audioPattern = /mp4a\/128000/;

  const videoIdMatch = url.match(videoIdPattern);
  const videoResolutionMatch = url.match(videoResolutionPattern);
  const isAudio = audioPattern.test(url);

  if (isAudio) {
    // Handle audio URL
    return {
      url,
      videoId: videoIdMatch ? videoIdMatch[1] : null,
      type: 'audio',
    };
  } else if (videoResolutionMatch) {
    // Handle video URL
    return {
      url,
      videoId: videoIdMatch ? videoIdMatch[1] : null,
      type: 'video',
      resolution: videoResolutionMatch ? videoResolutionMatch[1] : null,
      width: videoResolutionMatch ? parseInt(videoResolutionMatch[1].split('x')[0], 10) : 0,
      height: videoResolutionMatch ? parseInt(videoResolutionMatch[1].split('x')[1], 10) : 0,
    };
  }

  return null; // Return null if the URL doesn't match the expected patterns
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const parsed = parseVideoUrl(details.url);
    if (parsed && parsed.videoId) {
      // Initialize the videoId entry if it doesn't exist
      if (!videoUrls[parsed.videoId]) {
        videoUrls[parsed.videoId] = { video: null, audio: null };
      }

      // Update the best video or set the audio URL
      if (parsed.type === 'video') {
        const currentBest = videoUrls[parsed.videoId].video;
        if (!currentBest || (parsed.width * parsed.height > currentBest.width * currentBest.height)) {
          videoUrls[parsed.videoId].video = parsed; // Store the best resolution video
        }
      } else if (parsed.type === 'audio') {
        videoUrls[parsed.videoId].audio = parsed; // Store the audio track
      }
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'requestURLs' && request.videoId) {
    const videoAudioPair = videoUrls[request.videoId];
    
    // Initialize an array to hold the URLs for transcoding
    const urlsToTranscode = [];
    
    // Check if there is a video URL and add it to the array
    if (videoAudioPair && videoAudioPair.video) {
      urlsToTranscode.push(videoAudioPair.video.url);
    }
    
    // Check if there is an audio URL and add it to the array
    if (videoAudioPair && videoAudioPair.audio) {
      urlsToTranscode.push(videoAudioPair.audio.url);
    }

    if (urlsToTranscode.length > 0) {
      sendResponse({ action: 'transcodeURLs', urls: urlsToTranscode });
      transcode(urlsToTranscode);
    } else {
      // console.log("No URLs found for the given videoId:", request.videoId);
      sendResponse({ action: 'error', message: 'No URLs found for videoId: ' + request.videoId });
    }
  }
  return true;
});

function transcode(urls) {
  chrome.storage.local.set({ urlsToTranscode: urls }, () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('html/transcode.html') });
  });
}
