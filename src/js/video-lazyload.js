
const VIDEO_SOURCE = "./src/videos/oggle-web-promo-smaller-cropped.mp4";

//Load video once dom content has loaded...
document.addEventListener('DOMContentLoaded', function() {


    
    //begin to load video once dom content has loaded.
    const video = document.getElementById('hero-vid');
    video.addEventListener('canplay', () => {

        console.log('hero video is ready for playback...');

        //hide video loading text, once video is ready for play back.
        const loading = document.getElementById("hero-loading-text");
        loading.style.opacity = 0;

    });
    video.src = VIDEO_SOURCE;


 
  });