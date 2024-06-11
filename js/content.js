function requestTranscodedVideo(videoId) {
  chrome.runtime.sendMessage({action: 'requestURLs', videoId: videoId}, function(response) {
    if (response.action === 'transcodeURLs' && response.urls && response.urls.length > 0) {
      // console.log('Transcoded URLs:', response.urls);
    } else {
      // console.log('No URLs to transcode or error.');
    }
  });
}

function addMenuItemToDropdown(dropdown, eventTarget) {
  const cellInnerDiv = eventTarget.closest('[data-testid="cellInnerDiv"]');
  const embeddedVideoDiv = cellInnerDiv ? cellInnerDiv.querySelector('[aria-label="Embedded video"]') : null;
  if (!embeddedVideoDiv){
    return;}


  const posterUrl = embeddedVideoDiv.getAttribute('poster');
  const videoIdMatch = posterUrl.match(/dm_video_preview\/(\d+)\/img/);
  if (!videoIdMatch) {
    return}
  const videoId = videoIdMatch[1];
  const existingItem = dropdown.querySelector('.my-custom-menu-item');
  if (!existingItem) {
    const newMenuItem = document.createElement('div');
    newMenuItem.setAttribute('role', 'menuitem');
    newMenuItem.setAttribute('tabindex', '0');
    newMenuItem.className = 'css-175oi2r r-1loqt21 r-18u37iz r-1mmae3n r-3pj75a r-13qz1uu r-o7ynqc r-6416eg r-1ny4l3l';
    newMenuItem.classList.add('my-custom-menu-item');
    newMenuItem.style.transition = "background-color 0.2s ease";
    newMenuItem.innerHTML = `
      <div class="css-175oi2r r-1777fci r-faml9v">
      <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1nao33i r-1q142lx"><g><path d="M21,14a1,1,0,0,0-1,1v4a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V15a1,1,0,0,0-2,0v4a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V15A1,1,0,0,0,21,14Zm-9.71,1.71a1,1,0,0,0,.33.21.94.94,0,0,0,.76,0,1,1,0,0,0,.33-.21l4-4a1,1,0,0,0-1.42-1.42L13,12.59V3a1,1,0,0,0-2,0v9.59l-2.29-2.3a1,1,0,1,0-1.42,1.42Z"></path></g></svg>           
      </div>
      <div class="css-175oi2r r-16y2uox r-1wbh5a2">
        <div dir="ltr" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-b88u0q" style="text-overflow: unset; color: rgb(231, 233, 234);white-space: nowrap;">
          <span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3" style="text-overflow: unset;">Download</span>
        </div>
      </div>
      </div>
    `;

    dropdown.appendChild(newMenuItem);

      newMenuItem.addEventListener('mouseenter', () => {
        newMenuItem.style.backgroundColor = "rgb(22, 24, 28)";
    });
    
    newMenuItem.addEventListener('mouseleave', () => {
        newMenuItem.style.backgroundColor = "";
    });
  

    newMenuItem.addEventListener('click', () => {
      requestTranscodedVideo(videoId);
    });

  }
}
   
   function setupMutationObserver(eventTarget) {
    const observer = new MutationObserver((mutations, obs) => {
        const dropdown = document.querySelector('[data-testid="Dropdown"]');
        if (dropdown) {
            addMenuItemToDropdown(dropdown, eventTarget);
            obs.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

   
   document.body.addEventListener('click', (event) => {
    if (event.target.closest('[aria-label="More actions"]')) {
        setupMutationObserver(event.target);
    }
}, true);




function downloadFile(blob, fileName) {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = function() {
      const base64data = reader.result;
      chrome.runtime.sendMessage({ action: 'download', data: base64data, filename: fileName });
  };
}
