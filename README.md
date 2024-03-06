# Twitter DM Video Downloader


Save those 💎s with the click of a button! Adds a function Twitter should have natively but doesn't. I searched far and wide for an existing solution to no avail, so this undertaking required a little inguinuity. In short, it fetches the encoded .m3u8 playlist and all of its contained .m4s segments for the video and audio tracks, then uses [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm) to combine these tracks into a single playable .mp4

## Usage

1. Download from [Releases](https://github.com/Chungmire/Twitter-DM-Video-Downloader-Extension/releases/download/current/TwitterDMDownloader.zip).
2. Unzip. Result should be just the `TwitterDMDownloader` folder.
3. Navigate to [extensions](chrome://extensions/).
4. Toggle on `Developer Mode` in the top right.
5. Click `Load Unpacked` in the top left.
6. Find the `TwitterDMDownloader` folder and double click it.
7. Refresh any twitter pages.
<br>

![](https://github.com/Chungmire/Twitter-DM-Video-Downloader-Extension/blob/main/download.gif)


---
