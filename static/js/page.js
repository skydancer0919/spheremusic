/*global $ MIDI */
var sat_data,
    notes = [],
    piano_minor = [0, 3, 7, 12, 15, 19, 24, 27, 31, 36, 39, 43, 48, 51, 55, 60, 63, 67, 72, 75, 79, 84, 87, 91, 96, 99, 103, 108, 111, 115, 120, 123, 127],
    drums = [36];

function getRandomArbitary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

var playNoteAt = function(n) {
    $.each(notes, function(i, e) {
        var note_data = e[0],
            note_instrument = e[1];
        var velocity = getRandomArbitary(0, 127);

        var value = note_data[n];
        if (note_instrument == "acoustic_grand_piano") {
            value = value + MIDI.pianoKeyOffset;
            MIDI.programChange(0, 0);
        } else {
            MIDI.programChange(0, 118);
        }
        MIDI.noteOn(0, value, velocity);
    });
    noteEmitter.createParticle();
};

var playMusic = function () {

    MIDI.Player.addListener(function(data) { // set it to your own function!

        var now = data.now; // where we are now
        var end = data.end; // time when song ends
        var channel = data.channel; // channel note is playing on
        var message = data.message; // 128 is noteOff, 144 is noteOn
        var note = data.note; // the note
        var velocity = data.velocity; // the velocity of the note
        // then do whatever you want with the information!

        console.log(note);
        console.log(velocity);

    });

    var n = 0;
    playNoteAt(n);
    n = (n + 1) % 16;
    setTimeout(playMusic, 250);
};

var fetch_satellites = function() {
    $.get('/ajax/satellites', function(data) {
        sat_data = data;
        play_satellites();
    });
};

setInterval(fetch_satellites, 1000);

var arrayOf = function(n, times) {
    Array.apply(null, new Array(times)).map(Number.prototype.valueOf,n);
};

var play_satellites = function() {
    notes = [];
    var note_buckets = piano_minor.length - 1,
        note_bucket_width = (sat_data.max_velocity - sat_data.min_velocity) / note_buckets,
        tempo_buckets = 4,
        tempo_bucket_width = (sat_data.max_range - sat_data.min_range) / tempo_buckets;

    $.each(sat_data.satellites, function(i, sat) {
        var note_bucket = Math.floor((Math.abs(sat.velocity) - sat_data.min_velocity) / note_bucket_width),
            tempo_bucket = Math.floor((sat.range - sat_data.min_range) / tempo_bucket_width);
        var note;

        var instrument = "acoustic_grand_piano";
        var this_note = piano_minor[note_bucket];
        if (Math.random() < 0.15) {
            this_note = 36 + getRandomArbitary(0, 25);
            instrument = "synth_drum";
        }
        if (tempo_bucket == 4) {
            note = Array.apply(null, new Array(16)).map(Number.prototype.valueOf,this_note);
        } else if (tempo_bucket == 3) {
            note = [this_note, -1,this_note, -1,this_note, -1,this_note, -1,this_note, -1,this_note, -1,this_note, -1,this_note, -1];
        } else if (tempo_bucket == 2) {
            note = [this_note, -1,-1,-1,this_note, -1,-1,-1,this_note, -1,-1,-1,this_note, -1,-1,-1];
        } else if (tempo_bucket == 1) {
            note = [this_note, -1,-1, -1,-1, -1,-1, -1,this_note, -1,-1, -1,-1, -1, -1, -1];
        } else if (tempo_bucket == 0) {
            note = [this_note, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
        }
        notes.push([note, instrument]);
    });
};

$(document).ready(function() {

    MIDI.loadPlugin({
        soundfontUrl: "/static/soundfont/",
        instruments: [ "acoustic_grand_piano", "synth_drum" ],
        callback: function() {
            $('#play').html('\u25B6 Play');
            $('#play').removeClass('pure-button-disabled');
            $('#play').addClass('pure-button-primary');
        }
    });

    $('#play').click(function() {
        playMusic();
    });

});