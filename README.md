# Twitter DM Video Downloader

Twitter does not natively include a download function for videos sent in direct messages and groupchats. Additionally, there were no existing extensions that added such a feature, nor were there any relevant code snippets for the core steps involved. The extent of the advice regarding this was limited to "use devtools + ffmpeg or vlc". Real convenient, especially when you realize there's more. Many such cases with StackOverflow. After a few days of dealing with manifest v3 and nondescript error messages from ffmpeg.wasm (admittedly a slightly outdated version), a button can now do it all for you. If this tells you anything, ChatGPT said it wasn't possible. Alright, enough yapping from me.

![](https://github.com/Chungmire/Twitter-DM-Video-Downloader-Extension/blob/main/download.gif)

## Usage

1. Download from [Releases](https://github.com/Chungmire/Twitter-DM-Video-Downloader-Extension/releases/download/current/TwitterDMDownloader.zip).
2. Unzip. Result should be just the `TwitterDMDownloader` folder.
3. Navigate to [extensions](chrome://extensions/).
4. Toggle on `Developer Mode` in the top right.
5. Click `Load Unpacked` in the top left.
6. Find the `TwitterDMDownloader` folder and double click it.
7. Refresh any twitter pages.
<br>



---
