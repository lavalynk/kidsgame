// =====================================================================
// Piano Star — the song book.
//
// Every song is an old song that belongs to everyone (traditional folk
// songs, nursery rhymes, carols and famous classical tunes).
//
// How a song is written:
//   notes:  note name + octave + length, "|" = a bar line.
//           Lengths: w (whole, 4 beats)  h (half, 2)  q (quarter, 1)  e (eighth, ½)
//           s (sixteenth, ¼). Add "." for a dotted note (1½ times as long).
//           A "#" after the letter is a black key: F#4, G#4, D#5...
//   lyrics: one word-piece per note ("_" = no word under that note), or '' for none.
//   d:      'easy' | 'normal' | 'challenge'  (how much help the glowing key gives)
//   clef:   'bass' for songs written in the bass clef (they use the low piano,
//           from the C below middle C up to G above it). Leave it out for treble.
//   pic:    which little picture the song gets in the song list (see PICS in piano.js)
//   tempo:  beats per minute when the piano plays it to you
// tests/test_piano.py checks that every song's words line up with its notes and
// that every note is on the piano.
// =====================================================================
window.PianoSongs = [
  // ---------------- Easy ----------------
  { id: 'buns', name: 'Hot Cross Buns', tempo: 100, time: '4/4', d: 'easy', pic: 'buns',
    notes: 'E4q D4q C4h | E4q D4q C4h | C4e C4e C4e C4e D4e D4e D4e D4e | E4q D4q C4h',
    lyrics: 'Hot cross buns, Hot cross buns, One a pen- ny, two a pen- ny, Hot cross buns!' },
  { id: 'mary', name: 'Mary Had a Little Lamb', tempo: 110, time: '4/4', d: 'easy', pic: 'mary',
    notes: 'E4q D4q C4q D4q | E4q E4q E4h | D4q D4q D4h | E4q G4q G4h | E4q D4q C4q D4q | E4q E4q E4q E4q | D4q D4q E4q D4q | C4w',
    lyrics: 'Ma- ry had a lit- tle lamb, lit- tle lamb, lit- tle lamb, Ma- ry had a lit- tle lamb, its fleece was white as snow.' },
  { id: 'twinkle', name: 'Twinkle Twinkle Little Star', tempo: 100, time: '4/4', d: 'easy', pic: 'twinkle',
    notes: 'C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4q D4q C4h | G4q G4q F4q F4q | E4q E4q D4h | G4q G4q F4q F4q | E4q E4q D4h | C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4q D4q C4h',
    lyrics: 'Twin- kle twin- kle lit- tle star, how I won- der what you are. Up a- bove the world so high, like a dia- mond in the sky. Twin- kle twin- kle lit- tle star, how I won- der what you are.' },
  { id: 'rain', name: 'Rain Rain Go Away', tempo: 100, time: '4/4', d: 'easy', pic: 'rain',
    notes: 'G4h E4h | G4q G4q E4h | G4q G4q E4q A4q | G4q G4q E4h',
    lyrics: 'Rain, rain, go a- way, come a- gain an- oth- er day.' },
  { id: 'ducklings', name: 'All My Little Ducklings', tempo: 108, time: '4/4', d: 'easy', pic: 'duck',
    notes: 'C4q D4q E4q F4q | G4h G4h | A4q A4q A4q A4q | G4w | A4q A4q A4q A4q | G4w | F4q F4q F4q F4q | E4h E4h | D4q D4q D4q D4q | C4w',
    lyrics: 'All my lit- tle duck- lings swim- ming on the lake, swim- ming on the lake, heads are in the wa- ter, tails up in the air!' },
  { id: 'frog', name: 'The Frog Song', tempo: 104, time: '4/4', d: 'easy', pic: 'frog',
    notes: 'C4q D4q E4q F4q | E4q D4q C4h | E4q F4q G4q A4q | G4q F4q E4h | C4h C4h | C4h C4h | C4e C4e D4e D4e E4e E4e F4e F4e | E4q D4q C4h',
    lyrics: 'I can hear the frog- gies sing, sing- ing in the pond to- day. Croak, croak, croak, croak, rib- bit rib- bit rib- bit rib- bit, croak croak croak!' },
  { id: 'abc', name: 'The Alphabet Song', tempo: 100, time: '4/4', d: 'easy', pic: 'abc',
    notes: 'C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4e D4e D4e D4e C4h | G4q G4q F4h | E4q E4q D4h | G4e G4e G4q F4h | E4q E4q D4h | C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4q D4q C4h',
    lyrics: 'A B C D E F G, H I J K L M N O P, Q R S, T U V, dou- ble- U X, Y and Z. Now I know my A B Cs, next time won\'t you sing with me?' },
  { id: 'frere', name: 'Are You Sleeping (Frère Jacques)', tempo: 110, time: '4/4', d: 'easy', pic: 'bell',
    notes: 'G4q A4q B4q G4q | G4q A4q B4q G4q | B4q C5q D5h | B4q C5q D5h | D5e E5e D5e C5e B4q G4q | D5e E5e D5e C5e B4q G4q | G4q D4q G4h | G4q D4q G4h',
    lyrics: 'Are you sleep- ing, are you sleep- ing, Bro- ther John, Bro- ther John? Morn- ing bells are ring- ing, morn- ing bells are ring- ing, ding, dang, dong, ding, dang, dong.' },
  { id: 'bigben', name: 'Big Ben Clock Chimes', tempo: 90, time: '3/4', d: 'easy', pic: 'clock',
    notes: 'E5q D5q C5q | G4h. | C5q E5q D5q | G4h. | C5q D5q E5q | C5h. | E5q C5q D5q | G4h. | G4q D5q E5q | C5h. | C4h. | C4h. | C4h.',
    lyrics: 'Ding dong ding dong, dong ding dong ding, ding dong ding dong, ding ding dong dong, dong ding dong ding. Bong! Bong! Bong!' },
  { id: 'oldmac', name: 'Old MacDonald Had a Farm', tempo: 120, time: '4/4', d: 'easy', pic: 'duck',
    notes: 'G4q G4q G4q D4q | E4q E4q D4h | B4q B4q A4q A4q | G4h. D4q | G4q G4q G4q D4q | E4q E4q D4h | B4q B4q A4q A4q | G4h. D4e D4e | G4q G4q G4q D4e D4e | G4q G4q G4h | G4e G4e G4q G4e G4e G4q | G4e G4e G4e G4e G4q G4q | G4q G4q G4q D4q | E4q E4q D4h | B4q B4q A4q A4q | G4w',
    lyrics: 'Old Mac- Don- ald had a farm, E- I- E- I- O! And on his farm he had a cow, E- I- E- I- O! With a moo moo here and a moo moo there, here a moo, there a moo, ev- ery- where a moo moo. Old Mac- Don- ald had a farm, E- I- E- I- O!' },

  // ---------------- Medium ----------------
  { id: 'london', name: 'London Bridge', tempo: 112, time: '4/4', d: 'normal', pic: 'london',
    notes: 'G4q. A4e G4q F4q | E4q F4q G4h | D4q E4q F4h | E4q F4q G4h | G4q. A4e G4q F4q | E4q F4q G4h | D4h G4h | E4q C4h.',
    lyrics: 'Lon- don bridge is fall- ing down, fall- ing down, fall- ing down. Lon- don bridge is fall- ing down, my fair la- dy!' },
  { id: 'jingle', name: 'Jingle Bells', tempo: 120, time: '4/4', d: 'normal', pic: 'jingle',
    notes: 'E4q E4q E4h | E4q E4q E4h | E4q G4q C4q. D4e | E4w | F4q F4q F4q. F4e | F4q E4q E4q E4e E4e | E4q D4q D4q E4q | D4h G4h | ' +
           'E4q E4q E4h | E4q E4q E4h | E4q G4q C4q. D4e | E4w | F4q F4q F4q. F4e | F4q E4q E4q E4e E4e | G4q G4q F4q D4q | C4w',
    lyrics: 'Jin- gle bells, jin- gle bells, jin- gle all the way! Oh what fun it is to ride in a one- horse o- pen sleigh, hey! ' +
            'Jin- gle bells, jin- gle bells, jin- gle all the way! Oh what fun it is to ride in a one- horse o- pen sleigh!' },
  { id: 'ode', name: 'Ode to Joy', tempo: 104, time: '4/4', d: 'normal', pic: 'ode',
    notes: 'E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | E4q. D4e D4h | E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | D4q. C4e C4h',
    lyrics: '' },
  { id: 'itsy', name: 'The Itsy Bitsy Spider', tempo: 100, time: '6/8', d: 'normal', pic: 'spider',
    notes: 'G4e | C5q C5e C5q D5e | E5q. E5q E5e | D5q C5e D5q E5e | C5h. | E5q. E5q F5e | G5h. | G5q F5e E5q F5e | G5q. E5q. | C5q. C5q D5e | E5h. | E5q D5e C5q D5e | E5q. C5q G4e | G4q C5e C5q C5e | D5q E5e E5q E5e | D5q C5e D5q E5e | C5h.',
    lyrics: 'The it- sy bit- sy spi- der climbed up the wa- ter spout. Down came the rain and washed the spi- der out. Out came the sun and dried up all the rain, and the it- sy bit- sy spi- der climbed up the spout a- gain.' },
  { id: 'yankee', name: 'Yankee Doodle', tempo: 120, time: '4/4', d: 'normal', pic: 'note',
    notes: 'C5e C5e D5e E5e C5e E5e D5e G4e | C5e C5e D5e E5e C5q B4q | C5e C5e D5e E5e F5e E5e D5e C5e | B4e G4e A4e B4e C5q C5q',
    lyrics: 'Yan- kee Doo- dle went to town a- rid- ing on a po- ny, stuck a fea- ther in his cap and called it mac- a- ro- ni.' },
  { id: 'camptown', name: 'Camptown Races', tempo: 120, time: '4/4', d: 'normal', pic: 'note',
    notes: 'G4e G4e E4e G4e A4e G4e E4q | E4q D4q E4q D4q | G4e G4e E4e G4e A4e G4e E4q | D4q E4e D4e C4h',
    lyrics: 'Camp- town la- dies sing this song, doo- dah! doo- dah! Camp- town race- track five miles long, oh, doo- dah day!' },
  { id: 'michael', name: 'Michael, Row the Boat Ashore', tempo: 100, time: '4/4', d: 'normal', pic: 'row',
    notes: 'C4q E4q G4h | E4q G4q A4q G4q | E4q G4q A4h | G4w | E4q G4q G4h | E4q F4q E4q D4q | C4q D4q E4h | D4q C4h.',
    lyrics: 'Mi- chael, row the boat a- shore, Hal- le- lu- jah! Mi- chael, row the boat a- shore, Hal- le- lu- jah! _' },
  { id: 'farmer', name: 'The Farmer in the Dell', tempo: 100, time: '6/8', d: 'normal', pic: 'duck',
    notes: 'C4e | F4q F4e F4q F4e | F4h G4q | A4q A4e A4q A4e | A4h. | C5q. C5q D5e | C5q A4e F4q. | G4q A4e A4q G4e | G4q F4h',
    lyrics: 'The farm- er in the dell, the farm- er in the dell, hi- ho, the der- ry- o, the farm- er in the dell.' },
  { id: 'deck', name: 'Deck the Halls', tempo: 112, time: '4/4', d: 'normal', pic: 'tree',
    notes: 'D5q. C5e B4q A4q | G4q A4q B4q G4q | A4e B4e C5e A4e B4q. A4e | G4q F#4q G4h | ' +
           'D5q. C5e B4q A4q | G4q A4q B4q G4q | A4e B4e C5e A4e B4q. A4e | G4q F#4q G4h | ' +
           'D5q. C5e B4q A4q | G4q A4q B4q G4q | A4e B4e C5e A4e B4q. A4e | G4q F#4q G4h',
    lyrics: 'Deck the halls with boughs of hol- ly, fa la la la la, la la la la! \'Tis the sea- son to be jol- ly, fa la la la la, la la la la! ' +
            'Troll the an- cient Yule- tide car- ol, fa la la la la, la la la la!' },
  { id: 'wewish', name: 'We Wish You a Merry Christmas', tempo: 120, time: '3/4', d: 'normal', pic: 'bell',
    notes: 'G4q | C5q C5e D5e C5e B4e | A4q A4q A4q | D5q D5e E5e D5e C5e | B4q G4q G4q | E5q E5e F5e E5e D5e | C5q A4q G4e G4e | A4q D5q B4q | C5h.',
    lyrics: 'We wish you a mer- ry Christ- mas, we wish you a mer- ry Christ- mas, we wish you a mer- ry Christ- mas and a hap- py new year!' },
  { id: 'xmastree', name: 'O Christmas Tree', tempo: 92, time: '3/4', d: 'normal', pic: 'tree',
    notes: 'D4q | G4q. G4e G4q. A4e | B4q. B4e B4q. B4e | A4q B4q C5q F#4q | A4h G4q D4q | G4q. G4e G4q. A4e | B4q. B4e B4q. B4e | A4q B4q C5q F#4q | A4h G4h',
    lyrics: 'O Christ- mas tree, O Christ- mas tree, how love- ly are thy branch- es! O Christ- mas tree, O Christ- mas tree, how love- ly are thy branch- es!' },
  { id: 'bonnie', name: 'My Bonnie Lies Over the Ocean', tempo: 112, time: '3/4', d: 'normal', pic: 'row',
    notes: 'G4q | E5q. D5e C5q | D5q C5q A4q | G4q E4h | G4q | E5q. D5e C5q | C5q B4q C5q | D5h. | G4q | E5q. D5e C5q | D5q C5q A4q | G4q E4h | G4q | A4q D5q C5q | B4q A4q B4q | C5h.',
    lyrics: 'My Bon- nie lies o- ver the o- cean, my Bon- nie lies o- ver the sea, my Bon- nie lies o- ver the o- cean, oh bring back my Bon- nie to me!' },
  { id: 'daisy', name: 'Daisy Bell (Bicycle Built for Two)', tempo: 120, time: '3/4', d: 'normal', pic: 'flower',
    notes: 'D5h. | B4h. | G4h. | D4h. | E4q F#4q G4q | E4h G4q | D4h. | A4h. | D5h. | B4h. | G4h. | E4q F#4q G4q | A4h B4q | A4h.',
    lyrics: 'Dai- sy, Dai- sy, give me your an- swer, do! I\'m half cra- zy, all for the love of you!' },
  { id: 'clementine', name: 'Oh My Darling, Clementine', tempo: 108, time: '3/4', d: 'normal', pic: 'heart',
    notes: 'G4e G4e G4q D4q | B4e B4e B4q G4q | G4e B4e D5q. D5e | C5e B4e A4h | A4e B4e C5q C5q | B4e A4e B4q G4q | G4e B4e A4q. D4e | F#4e A4e G4h',
    lyrics: 'In a cav- ern, in a can- yon, ex- ca- vat- ing for a mine, dwelt a min- er, for- ty- nin- er, and his daugh- ter Clem- en- tine.' },
  { id: 'auldlang', name: 'Auld Lang Syne', tempo: 92, time: '4/4', d: 'normal', pic: 'heart',
    notes: 'D4q | G4q. F#4e G4q B4q | A4q. G4e A4q B4q | G4q. G4e B4q D5q | E5h. E5q | D5q. B4e B4q G4q | A4q. G4e A4q B4q | G4q. E4e E4q D4q | G4h.',
    lyrics: 'Should auld ac- quain- tance be for- got and nev- er brought to mind? Should auld ac- quain- tance be for- got and days of auld lang syne?' },
  { id: 'wenceslas', name: 'Good King Wenceslas', tempo: 112, time: '4/4', d: 'normal', pic: 'twinkle',
    notes: 'G4q G4q G4q A4q | G4q G4q D4h | E4q D4q E4q F#4q | G4h G4h | G4q G4q G4q A4q | G4q G4q D4h | E4q D4q E4q F#4q | G4h G4h | ' +
           'D5q C5q B4q A4q | B4q A4q G4h | E4q D4q E4q F#4q | G4h G4h | D4q D4q E4q F#4q | G4q G4q A4h | D5q C5q B4q A4q | G4h C5h | G4w',
    lyrics: 'Good King Wen- ces- las looked out on the feast of Ste- phen, when the snow lay round a- bout, deep and crisp and e- ven. ' +
            'Bright- ly shone the moon that night, though the frost was cru- el, when a poor man came in sight, gath- \'ring win- ter fu- el. _' },
  { id: 'aura', name: 'Aura Lee', tempo: 92, time: '4/4', d: 'normal', pic: 'note',
    notes: 'G4q C5q B4q C5q | D5q A4q D5h | C5q B4q A4q B4q | C5w | G4q C5q B4q C5q | D5q A4q D5h | C5q B4q A4q B4q | C5w | ' +
           'E5q E5q E5q E5q | E5q E5q E5h | E5q D5q C5q D5q | E5w | E5q E5q F5q E5q | D5q A4q D5h | C5q B4q A4q B4q | C5w',
    lyrics: '' },
  { id: 'mice', name: 'Three Blind Mice', tempo: 100, time: '6/8', d: 'normal', pic: 'mouse',
    notes: 'E4q. D4q. | C4h. | E4q. D4q. | C4h. | G4q. F4e F4q | E4h. | G4q. F4e F4q | E4h G4q | C5q C5e B4e A4e B4e | C5e G4e G4q G4q | C5q C5e C5e B4e A4e | B4e C5e G4e G4q G4e | C5q C5e B4e A4e B4e | C5e G4e G4q G4e F4e | E4q. D4q. | C4h.',
    lyrics: '' },
  { id: 'pop', name: 'Pop! Goes the Weasel', tempo: 104, time: '6/8', d: 'normal', pic: 'note',
    notes: 'C4q C4e D4q D4e | E4e G4e E4e C4q. | C4q C4e D4q D4e | E4h C4q | C4q C4e D4q D4e | E4e G4e E4e C4q. | A4h. | D4q F4e E4q. | C4h.',
    lyrics: '' },
  { id: 'korobeiniki', name: 'Korobeiniki (Russian folk song)', tempo: 132, time: '4/4', d: 'normal', pic: 'blocks',
    notes: 'B4q F#4e G4e A4q G4e F#4e | E4q E4e G4e B4q A4e G4e | F#4q. G4e A4q B4q | G4q E4q E4h | A4q. C5e E5q D5e C5e | B4q. G4e B4q A4e G4e | F#4q F#4e G4e A4q B4q | G4q E4q E4h',
    lyrics: '' },
  { id: 'danube', name: 'The Blue Danube Waltz', tempo: 132, time: '3/4', d: 'normal', pic: 'wave',
    notes: 'C4q | C4q E4q G4q | G4h G5q | G5h E5q | E5h C4q | C4q E4q G4q | G4h G5q | G5h F5q | F5h.',
    lyrics: '' },
  { id: 'brahms', name: 'Brahms\' Lullaby', tempo: 76, time: '3/4', d: 'normal', pic: 'twinkle',
    notes: 'E4e E4e | G4h E4e E4e | G4h E4e G4e | C5q. B4e A4q | A4q G4h | D4e E4e F4q D4q | D4e E4e F4h | D4e F4e B4q. A4e | G4q B4q | C5h.',
    lyrics: '' },
  { id: 'scarborough', name: 'Scarborough Fair', tempo: 96, time: '3/4', d: 'normal', pic: 'flower',
    notes: 'D4h D4q | A4h A4q | E4q. F4e E4q | D4h. | A4q C5h | D5q C5q A4q | B4q G4h | A4h. | D5h D5q | D5q C5q A4q | A4q G4q F4q | E4q C4h | D4h A4q | G4q F4q E4q | D4h C4q | D4h.',
    lyrics: '' },

  // ---------------- Tricky ----------------
  { id: 'row', name: 'Row Row Row Your Boat', tempo: 96, time: '6/8', d: 'challenge', pic: 'row',
    notes: 'C4q. C4q. | C4q D4e E4q. | E4q D4e E4q F4e | G4h. | C5e C5e C5e G4e G4e G4e | E4e E4e E4e C4e C4e C4e | G4q F4e E4q D4e | C4h.',
    lyrics: 'Row, row, row your boat, gent- ly down the stream. Mer- ri- ly, mer- ri- ly, mer- ri- ly, mer- ri- ly, life is but a dream.' },
  { id: 'birthday', name: 'Happy Birthday', tempo: 96, time: '3/4', d: 'challenge', pic: 'birthday',
    notes: 'G4e. G4s | A4q G4q C5q | B4h G4e. G4s | A4q G4q D5q | C5h G4e. G4s | G5q E5q C5q | B4q A4q F5e. F5s | E5q C5q D5q | C5h.',
    lyrics: 'Hap- py birth- day to you, hap- py birth- day to you, hap- py birth- day dear some- one, hap- py birth- day to you!' },
  { id: 'susanna', name: 'Oh! Susanna', tempo: 120, time: '4/4', d: 'challenge', pic: 'note',
    notes: 'C4e D4e | E4q G4q G4q. A4e | G4q E4q C4q. D4e | E4q E4q D4q C4q | D4h. C4e D4e | E4q G4q G4q. A4e | G4q E4q C4q. D4e | E4q E4q D4q D4q | C4h. | ' +
           'F4h A4h | A4h. A4q | G4q G4q E4q C4q | D4h. C4e D4e | E4q G4q G4q. A4e | G4q E4q C4q. D4e | E4q E4q D4q D4q | C4w',
    lyrics: '' },
  { id: 'minuet', name: 'Minuet in G', tempo: 108, time: '3/4', d: 'challenge', pic: 'note',
    notes: 'D5q G4e A4e B4e C5e | D5q G4q G4q | E5q C5e D5e E5e F#5e | G5q G4q G4q | C5q D5e C5e B4e A4e | B4q C5e B4e A4e G4e | F#4q G4e A4e B4e G4e | A4h. | ' +
           'D5q G4e A4e B4e C5e | D5q G4q G4q | E5q C5e D5e E5e F#5e | G5q G4q G4q | C5q D5e C5e B4e A4e | B4q C5e B4e A4e G4e | A4q B4e A4e G4e F#4e | G4h.',
    lyrics: '' },
  { id: 'elise', name: 'Für Elise', tempo: 100, time: '3/8', d: 'challenge', pic: 'flower',
    notes: 'E5e D#5e | E5e D#5e E5e B4e D5e C5e | A4q. C4e E4e A4e | B4q. E4e G#4e B4e | C5q. E4e E5e D#5e | E5e D#5e E5e B4e D5e C5e | A4q. C4e E4e A4e | B4q. E4e C5e B4e | A4h.',
    lyrics: '' },
  { id: 'silent', name: 'Silent Night', tempo: 72, time: '3/4', d: 'challenge', pic: 'twinkle',
    notes: 'G4q. A4e G4q | E4h. | G4q. A4e G4q | E4h. | D5h D5q | B4h. | C5h C5q | G4h. | A4h A4q | C5q. B4e A4q | G4q. A4e G4q | E4h. | ' +
           'A4h A4q | C5q. B4e A4q | G4q. A4e G4q | E4h. | D5h D5q | F5q. D5e B4q | C5h. | E5h. | C5q G4q E4q | G4q. F4e D4q | C4h.',
    lyrics: '' },
  { id: 'joy', name: 'Joy to the World', tempo: 100, time: '4/4', d: 'challenge', pic: 'bell',
    notes: 'C5h B4q. A4e | G4h. F4q | E4h D4h | C4h. G4q | A4h. A4q | B4h. B4q | C5h. C5q | C5q B4q A4q G4q | G4q. F4e E4q C5q | C5q B4q A4q G4q | G4q. F4e E4q E4q | ' +
           'E4q E4q E4q E4e F4e | G4h. F4e E4e | D4q D4q D4q D4e E4e | F4h. E4e D4e | C4q C5h A4q | G4q. F4e E4q F4q | E4h D4h | C4w',
    lyrics: '' },
  { id: 'greensleeves', name: 'Greensleeves', tempo: 96, time: '6/8', d: 'challenge', pic: 'note',
    notes: 'A4q | C5h D5q | E5q. F5e E5q | D5h B4q | G4q. A4e B4q | C5h A4q | A4q. G#4e A4q | B4h G#4q | E4h A4q | C5h D5q | E5q. F5e E5q | D5h B4q | G4q. A4e B4q | C5q. B4e A4q | G#4q. F#4e G#4q | A4h.',
    lyrics: '' },
  { id: 'nachtmusik', name: 'Eine kleine Nachtmusik', tempo: 112, time: '4/4', d: 'challenge', pic: 'note',
    notes: 'G4q. D4e G4q. D4e | G4e D4e G4e B4e D5h | C5q. A4e C5q. A4e | C5e A4e F#4e A4e D4h',
    lyrics: '' },
  { id: 'mozart40', name: 'Mozart: Symphony No. 40', tempo: 112, time: '4/4', d: 'challenge', pic: 'note',
    notes: 'C5e B4e B4q C5e B4e B4q | C5e B4e B4q G5h | G5e F#5e E5q E5e D5e C5q | C5e B4e A4q A4h',
    lyrics: '' },
  { id: 'america', name: 'My Country, \'Tis of Thee', tempo: 96, time: '3/4', d: 'challenge', pic: 'note',
    notes: 'G4q G4q A4q | F#4q. G4e A4q | B4q B4q C5q | B4q. A4e G4q | A4q G4q F#4q | G4h. | D5q D5q D5q | D5q. C5e B4q | C5q C5q C5q | C5q. B4e A4q | B4q C5e B4e A4e G4e | B4q. C5e D5q | E5e C5e B4q A4q | G4h.',
    lyrics: '' },
  { id: 'entertainer', name: 'The Entertainer', tempo: 100, time: '4/4', d: 'challenge', pic: 'note',
    notes: 'D4e D#4e | E4e C5q E4e C5q E4e C5e | C5h. C5e D5e | D#5e E5e C5e D5e E5q B4e D5e | C5h. D4e D#4e | E4e C5q E4e C5q E4e C5e | C5h. A4e G4e | F#4e A4e C5e E5q D5e C5e A4e | D5h. D4e D#4e | ' +
           'E4e C5q E4e C5q E4e C5e | C5h. C5e D5e | D#5e E5e C5e D5e E5q B4e D5e | C5h.',
    lyrics: '' },
  { id: 'cancan', name: 'The Can-Can', tempo: 140, time: '2/4', d: 'challenge', pic: 'note',
    notes: 'C4q D4e F4e E4e D4e | G4q G4q G4e A4e E4e F4e | D4q D4q D4e F4e E4e D4e | C4e C5e B4e A4e G4e F4e E4e D4e | C4q D4e F4e E4e D4e | G4q G4q G4e A4e E4e F4e | D4q D4q D4e F4e E4e D4e | C4e G4e D4e E4e C4h',
    lyrics: '' },
  { id: 'threekings', name: 'We Three Kings', tempo: 96, time: '3/4', d: 'challenge', pic: 'twinkle',
    notes: 'B4h A4q | G4h E4q | F#4q G4q F#4q | E4h. | B4h A4q | G4h E4q | F#4q G4q F#4q | E4h. | G4q G4q A4q | A4q B4q B4q | D5q C5q B4q | A4q B4q A4q | G4q F#4q | E4h.',
    lyrics: '' },
  { id: 'auclair', name: 'Au Clair de la Lune', tempo: 100, time: '4/4', d: 'challenge', pic: 'moon',
    notes: 'G4q G4q G4q A4q | B4h A4h | G4q B4q A4q A4q | G4w | G4q G4q G4q A4q | B4h A4h | G4q B4q A4q A4q | G4w | ' +
           'A4q A4q A4q A4q | E4h E4h | A4q G4q F#4q E4q | D4w | G4q G4q G4q A4q | B4h A4h | G4q B4q A4q A4q | G4w',
    lyrics: '' },

  // ---------------- Bass clef (the low notes) ----------------
  { id: 'b-baa', name: 'Baa Baa Black Sheep', tempo: 100, time: '4/4', d: 'easy', clef: 'bass', pic: 'bass',
    notes: 'C3q C3q G3q G3q | A3e A3e A3e A3e G3h | F3q F3q E3q E3q | D3q D3q C3h | C3q C3q G3q G3q | A3e A3e A3e A3e G3h | F3q F3q E3q E3q | D3q D3q C3h',
    lyrics: 'Baa, baa, black sheep, have you an- y wool? Yes sir, yes sir, three bags full! Baa, baa, black sheep, have you an- y wool? Yes sir, yes sir, three bags full!' },
  { id: 'b-oldman', name: 'This Old Man', tempo: 112, time: '4/4', d: 'easy', clef: 'bass', pic: 'bass',
    notes: 'G3q E3q G3h | G3q E3q G3h | A3q G3q F3q E3q | D3q E3q F3h | E3e F3e G3q C3q C3e C3e | C3q C3e D3e E3e F3e G3q | G3q D3q D3q F3q | E3q D3q C3h',
    lyrics: 'This old man, he played one, he played knick- knack on my thumb, with a knick- knack pad- dy whack, give a dog a bone, this old man came roll- ing home.' },
  { id: 'b-lightly', name: 'Lightly Row', tempo: 104, time: '4/4', d: 'easy', clef: 'bass', pic: 'bass',
    notes: 'G3q E3q E3h | F3q D3q D3h | C3q D3q E3q F3q | G3q G3q G3h | G3q E3q E3h | F3q D3q D3h | C3q E3q G3q G3q | C3w | ' +
           'D3q D3q D3q D3q | D3q E3q F3h | E3q E3q E3q E3q | E3q F3q G3h | G3q E3q E3h | F3q D3q D3h | C3q E3q G3q G3q | C3w',
    lyrics: '' },
  { id: 'b-rhody', name: 'Go Tell Aunt Rhody', tempo: 100, time: '4/4', d: 'easy', clef: 'bass', pic: 'bass',
    notes: 'E3h E3q D3q | C3h C3h | D3h D3q F3q | E3q D3q C3h | G3h G3q F3q | E3h E3h | D3q C3q D3q E3q | C3w',
    lyrics: '' },
  { id: 'b-kumbaya', name: 'Kumbaya', tempo: 80, time: '4/4', d: 'normal', clef: 'bass', pic: 'bass',
    notes: 'C3q E3q G3h | G3q G3q A3q A3q | G3w | C3q E3q G3h | G3q G3q F3q E3q | D3w | C3q E3q G3h | G3q G3q A3q A3q | G3w | F3h E3h | D3h. D3q | C3w',
    lyrics: 'Kum- ba- yah, my Lord, kum- ba- yah! Kum- ba- yah, my Lord, kum- ba- yah! Kum- ba- yah, my Lord, kum- ba- yah! Oh Lord, kum- ba- yah.' },
  { id: 'b-saints', name: 'When the Saints Go Marching In', tempo: 120, time: '4/4', d: 'normal', clef: 'bass', pic: 'bass',
    notes: 'C3q E3q F3q | G3w | C3q E3q F3q | G3w | C3q E3q F3q | G3h E3h | C3h E3h | D3w | E3q E3q D3q C3q | C3q E3q G3q G3q | F3h F3h | E3q F3q G3h | E3h C3h | D3h | C3w',
    lyrics: 'Oh when the saints go march- ing in, oh when the saints go march- ing in, oh Lord I want to be in that num- ber, when the saints go march- ing in.' },
  { id: 'b-goinghome', name: 'Going Home (New World Symphony)', tempo: 66, time: '4/4', d: 'normal', clef: 'bass', pic: 'bass',
    notes: 'E3h G3q G3q | E3h D3q C3q | D3q E3q G3q E3q | D3w | E3h G3q G3q | E3h D3q C3q | D3q E3q D3q C3q | C3w',
    lyrics: '' },
  { id: 'b-canon', name: 'Pachelbel\'s Canon', tempo: 70, time: '4/4', d: 'normal', clef: 'bass', pic: 'bass',
    notes: 'C4h G3h | A3h E3h | F3h C3h | F3h G3h | E4h D4h | C4h B3h | A3h G3h | A3h B3h | C4h B3h | A3h G3h | F3h E3h | F3h D3h | C4h G3h | A3h E3h | F3h C3h | F3h G3h | C3w',
    lyrics: '' },
  { id: 'b-mountainking', name: 'In the Hall of the Mountain King', tempo: 120, time: '4/4', d: 'challenge', clef: 'bass', pic: 'bass',
    notes: 'D3e E3e F3e G3e A3e F3e A3q | G#3e E3e G#3q G3e D#3e G3q | D3e E3e F3e G3e A3e F3e A3e D4e | C4e A3e F3e A3e C4h | ' +
           'D3e E3e F3e G3e A3e F3e A3q | G#3e E3e G#3q G3e D#3e G3q | D3e E3e F3e G3e A3e F3e A3e D4e | C4e A3e F3e A3e D3h',
    lyrics: '' },
  { id: 'b-fifth', name: 'Beethoven\'s Fifth Symphony', tempo: 108, time: '2/4', d: 'challenge', clef: 'bass', pic: 'bass',
    notes: 'G3e G3e G3e D#3q. | F3e F3e F3e D3h | G3e G3e G3e D#3e G#3e G#3e G#3e G3e | D#4e D#4e D#4e C4q. | G3e G3e G3e D3e G#3e G#3e G#3e G3e | F4e F4e F4e D4q. | G3e G3e G3e D#3q. | F3e F3e F3e D3q. | C3h',
    lyrics: '' },
];
