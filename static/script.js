// Image slider for thumbnail
function imgSlider(link) {
    const currentImage = document.querySelector('.food');
    const newImage = new Image();
    newImage.src = link;
    newImage.onload = function() {
        currentImage.style.opacity = 0;
        setTimeout(() => {
            currentImage.src = link;
            currentImage.style.opacity = 1;
        }, 300);
    };
}

// TypeIt script
new TypeIt("#typeIt-Element", {
    speed: 80,
    startDelay: 900,
})
    .type('Feeling <strong>HANGRY?</strong>', { delay: 150 })
    .delete(1)
    .pause(200)
    .delete(1)
    .pause(200)
    .delete(1)
    .pause(200)
    .delete(1)
    .pause(200)
    .delete(1)
    .pause(200)
    .delete(1)
    .pause(200)
    .delete(1)
    .pause(200)
    .type('<strong>HUNGRY?</strong>', { delay: 150 })
    .break()
    .pause()
    .type('Which dish below describe your mood?', {
        speed: 100,
    })
    .go();