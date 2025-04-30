export const AVAILABLE_QUESTS = [
  {
    id: 'quest-1',
    mode: 'story',
    title: 'A Confused Awakening',
    recap:
      'The Kingdom of Vaedros is in peril. The balance is broken. The light is trapped. The darkness is growing.',
    durationMinutes: 3,
    reward: { xp: 100 },
    poiSlug: 'darkwood-awakening',
    audioFile: '@/../assets/audio/quest-1.mp3',
    story: `
     I wake up lying on my back, the earth cold and damp beneath me. The trees stretch high, their gnarled limbs tangled overhead, blotting out the sky. For a long moment, I don't move. Not because I'm afraid—though maybe I should be—but because I don't know who I am.
    No name. No memory. Just a dull ache behind my eyes, pulsing like the aftermath of a long-forgotten dream.
    I sit up, slow and deliberate, brushing leaves from my coat. The fabric is worn, torn at the sleeve, though I can't say if that means anything.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Check your pockets',
        nextQuestId: 'quest-1a',
      },
      {
        id: 'option-2',
        text: 'Explore the area',
        nextQuestId: 'quest-1b',
      },
    ],
  },
  {
    id: 'quest-1a',
    mode: 'story',
    title: 'Awaken in a Dark Forest',
    recap: 'I woke alone in a dark forest, my memory gone—my past a void.',
    durationMinutes: 3,
    reward: { xp: 9 },
    poiSlug: 'darkwood-awakening',
    audioFile: '@/../assets/audio/quest-1a.mp3', // @todo: add audio file
    story: `
      Then, a weight in my pocket—a piece of folded parchment. I pull it free, fingers stiff with cold. It's a map. Or part of one.
      Most of it is blank, save for a crude drawing of trees, a stretch of forest that looks too much like the one around me to be a coincidence. The rest of the map is covered in a shifting black fog, writhing at the edges of my vision, like ink that refuses to dry. I blink, shake my head. The image stays.
      I don't know what it means. I don't know what "I" mean.
      But there's only one thing to do: move. I tuck the map into my coat, push myself to my feet, and take the first step into the unknown.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Go into the fog.',
        nextQuestId: 'quest-2',
      },
    ],
  },
  {
    id: 'quest-1b',
    mode: 'story',
    title: 'Searching the Forest for Signs of Life',
    recap: 'I woke alone in a dark forest, my memory gone—my past a void.',
    durationMinutes: 3,
    reward: { xp: 9 },
    poiSlug: 'darkwood-awakening',
    audioFile: '@/../assets/audio/quest-1b.mp3', // @todo: add audio file
    story: `
      I push myself to my feet, the damp chill of the earth clinging to my skin. The silence is thick—too thick. No birds. No rustling leaves. Just my own breath, too loud in my ears.
      I step forward, careful, scanning the trees for movement. If someone—or something—is out here, I need to know before it knows me.
      One path ahead is a tangle of blackened trees, their branches knotted so thickly that even moonlight can't slip through. Something about it hums with quiet menace. I don't trust it.
      The other way is clearer, the trees thinning just enough to show a flicker of something unnatural in the distance. A shape, a structure. A building? I exhale, adjusting my coat. If I want answers, if I want shelter, that's my best shot.
      I move.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Go into the fog.',
        nextQuestId: 'quest-2',
      },
    ],
  },
  {
    id: 'quest-2',
    mode: 'story',
    title: 'Shelter of Whispers',
    recap:
      'After waking in the forest with no memory, I pressed onward through the mist in the only direction that seems to be promising.',
    durationMinutes: 6,
    reward: { xp: 18 },
    poiSlug: 'hut-of-whispers',
    audioFile: '@/../assets/audio/quest-2.mp3',
    story: `
    I move through the undergrowth, the brittle branches snapping beneath my boots. The hut appears through the mist like something forgotten—leaning slightly, its wooden door swaying on rusted hinges.
    I step inside. The air is stale, thick with dust and old wood. Whoever was here didn't take much when they left. There's no sign of struggle, no overturned furniture. Just absence.
    I find a candle and strike a match. The light flickers, stretching long shadows across the walls. Something stiff in my pocket. I pull it free—a **map**. Or part of one. Most of it is blank, except for a jagged outline of trees, a river, and a thick smear of shifting darkness at the edges. 
    I press the parchment flat on the table. I could use some supplies, but, the map beckons for me to inspect it further. What now?
    `,
    options: [
      {
        id: 'option-1',
        text: 'Search the hut',
        nextQuestId: 'quest-2a',
      },
      {
        id: 'option-2',
        text: 'Inspect the map',
        nextQuestId: 'quest-2b',
      },
    ],
  },
  {
    id: 'quest-2a',
    mode: 'story',
    title: 'Digging Through the Past',
    recap:
      'I took shelter inside the abandoned hut, finding a strange map and hints of supplies nearby.',
    durationMinutes: 6,
    reward: { xp: 18 },
    poiSlug: 'modest-hut',
    audioFile: '@/../assets/audio/quest-2a.mp3',
    story: `
      The map can wait. I need something real—food, tools, anything useful.
      I rummage through the hut, kicking aside broken furniture, prying open cabinets. Most of it is worthless—crumbled parchment, rusted tools—but in the corner, propped against the wall, I spot something unexpected.
      Fishing gear. Nets, an old rod, a tackle box left half-open. Whoever lived here fished, which means there must be water nearby.
      I step to the window, squinting through the mist. There—just past the tree line, a faint glimmer of silver. A river.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Follow the river in the morning',
        nextQuestId: 'quest-3',
      },
    ],
  },
  {
    id: 'quest-2b',
    mode: 'story',
    title: 'Faint Traces',
    recap:
      'I took shelter inside the abandoned hut, finding a strange map and hints of supplies nearby.',
    durationMinutes: 6,
    reward: { xp: 18 },
    poiSlug: 'modest-hut',
    audioFile: '@/../assets/audio/quest-2b.mp3',
    story: `
      I kneel by the fireplace, rubbing my hands together for warmth. The map rests on the floor beside me, catching the candlelight. I run my fingers over its shifting ink, tracing the barely visible lines beneath. A phrase emerges, faint but deliberate.
      Balance must be restored.
      I exhale, watching the letters waver, then fade. Just below them, another detail—a thin, winding line stretching south. A river.
      I glance toward the door, past the tangled brush. If the map is right, the water isn't far. Tomorrow, I'll find it.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Follow the river in the morning',
        nextQuestId: 'quest-3',
      },
    ],
  },
  {
    id: 'quest-3',
    mode: 'story',
    title: 'The Weary Crossing',
    recap:
      'After resting in the abandoned hut, I awoke to find my path blocked by a raging river.',
    durationMinutes: 9,
    reward: { xp: 27 },
    poiSlug: 'weary-crossing',
    audioFile: '@/../assets/audio/quest-3.mp3',
    story: `
      By morning, it's clear—I'm trapped. The river coils around this stretch of land like a noose, its current fast and merciless. The trees behind me stand thick, an impassable wall of roots and thorns. No trails. No way forward. Except through the water.
      The river churns, dark and fast, cutting me off from whatever lies beyond. I kneel at the bank, testing the water with my fingertips. Ice-cold. Deep. No chance of wading through.
      I glanced at the map, but it offers no guidance on how to cross. The hut behind me held scraps of wood, rope, even a few tools—enough to build something seaworthy, if I had time. But there's another option. 
      I could find a hollowed-out tree trunk near the river bend and ride it across. It's risky, but it might be faster.
      Either way, I need to decide.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Build a proper raft.',
        nextQuestId: 'quest-3a',
      },
      {
        id: 'option-2',
        text: 'Ride a fallen tree.',
        nextQuestId: 'quest-3b',
      },
    ],
  },
  {
    id: 'quest-3a',
    mode: 'story',
    title: 'The Raft – A Careful Crossing',
    recap:
      'Trapped by the river, I considered my options for crossing—either building a raft or risking a hollowed-out log.',
    durationMinutes: 9,
    reward: { xp: 27 },
    poiSlug: 'riverbank-crossing',
    audioFile: '@/../assets/audio/quest-3a.mp3',
    story: `
      I search the remains of the hut, scavenging planks, frayed rope, anything that might hold together long enough to keep me from drowning. My hands work without hesitation, lashing wood with knots that feel second nature. Maybe I was a sailor. Maybe I wasn't. Doesn't matter. I need to cross.
      The raft groans as I push it into the shallows. Water swirls around my boots. I step on, crouching low as the current catches hold. The river doesn't carry—it drags. The world tilts with every surge, the raft lurching beneath me, threatening to come undone.
      I grip the rope, muscles tight, jaw locked. The opposite shore inches closer. A break in the current, and I seize the moment—digging the pole deep, forcing the raft toward land.
      Wood scrapes against rock, the jolt nearly sending me overboard. I scrambled onto the bank, breath sharp, hands aching. The raft is already splintering, drifting back into the current.
      By the time I drag myself onto the far shore, the sky is black. The journey has drained me, and I don't trust the woods at night. I gathered dry branches, striking a small fire, the map beside me. Tomorrow, I'll move forward.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Continue',
        nextQuestId: 'quest-4',
      },
    ],
  },
  {
    id: 'quest-3b',
    mode: 'story',
    title: 'Hollowed Out – A Risky Crossing',
    recap:
      'Trapped by the river, I considered my options for crossing—either building a raft or risking a hollowed-out log.',
    durationMinutes: 9,
    reward: { xp: 27 },
    poiSlug: 'riverbank-crossing',
    audioFile: '@/../assets/audio/quest-3b.mp3',
    story: `
      At the river's edge lies a hollowed-out log—rotted and cracked, barely sturdy enough to hold my weight. I drag it into the shallows, water immediately seeping through its splintered sides. No time for second thoughts.
      I climbed in, crouched low, using a splintered plank to paddle furiously against the relentless current. The log spins and bobs, water rushing through widening cracks, soaking me to the bone. Halfway across, it dips sharply, nearly capsizing. Frantic, I scooped out water, fighting for every inch.
      The log collided with the far shore, jolting my bones. I scrambled onto solid ground, dripping and gasping, my makeshift boat already breaking apart behind me. Shaking from exhaustion and cold, I collapsed beneath a rocky overhang, knowing I've barely escaped disaster.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Continue',
        nextQuestId: 'quest-4',
      },
    ],
  },
  {
    id: 'quest-4',
    mode: 'story',
    title: 'Discovering the Ancient Arch with Inscriptions',
    recap:
      'The river nearly claimed me, but I reached the far side alive, emerging into a land of ancient ruins.',
    durationMinutes: 12,
    reward: { xp: 36 },
    poiSlug: 'ruined-archway',
    audioFile: '@/../assets/audio/quest-4.mp3',
    story: `
      The land changes beyond the river. The trees thin, giving way to ruins—broken stones half-swallowed by the earth, the remains of something old, something lost. I followed the path between them, stepping over shattered pillars and roots tangled with the bones of the past. Then, through the mist, I see it.
      A massive arch. Carved from stone so ancient it looks like it was born from the land itself. The surface is worn, cracked by time, but the inscriptions remain—faint spirals and twisting shapes, two forces entwined. One bright as fire, the other deep as a starless void. Opposites, locked together.
      I run my fingers over the carvings, tracing the fading grooves. Then, in the lower corner, half-buried in dust and shadow, I see it.
      My name. I remember it now.
      It's etched into the stone, as old as the rest. My mind claws for answers, but nothing comes—only the cold realization that this place, this monument, knew me before I knew myself.
      The inscription tells a story: the balance was broken. Light, once free, was trapped. Darkness grew, swallowing everything. The final image is an abyss, stretching endlessly into ruin.
      The wind shifted, rustling through the ruins. I exhaled, my breath steady, but my mind anything but. There are answers here. Maybe buried in the ruins themselves, maybe somewhere beyond them. But I can't shake the feeling that I stand at the edge of something vast.
    `,
    options: [
      {
        id: 'option-4a',
        text: 'Stay and investigate the ruins',
        nextQuestId: 'quest-4a',
      },
      {
        id: 'option-4b',
        text: 'Continue on before nightfall',
        nextQuestId: 'quest-4b',
      },
    ],
  },
  {
    id: 'quest-4a',
    mode: 'story',
    title: 'Unraveling the Inscription',
    recap:
      'Among the ruins, I discovered an ancient arch carved with strange symbols—symbols that included my own name.',
    durationMinutes: 12,
    reward: { xp: 36 },
    poiSlug: 'ruined-archway',
    audioFile: '@/../assets/audio/quest-4a.mp3',
    story: `
      I stayed. The ruins stretched wide around me, an old skeleton of something once grand.
      The arch's carvings are worn, their edges softened by centuries of wind and rain. I knelt, tracing the stone, pressing dirt-streaked fingers into the grooves, willing them to give me something. Anything.
      Time passed. The sun inches across the sky. I pried through toppled pillars, shifting stones, searching the ruins for anything else—another inscription, a clue, a scrap of history to anchor me in this place that already seemed to know me. Sweat beads on my forehead. The air thickened with the weight of time, my muscles burning as I heaved away a half-buried slab.
      And finally, I found it.
      Beneath layers of dirt and ruin, a deeper carving—faint, but intact. A phrase, etched long ago: *The King must not claim the seal.*
      The words rooted into me. I didn't understand them fully, but I knew this much—someone fought to leave this message behind. Someone wanted it remembered.
      A gust of wind rushed through the ruins, colder than before. The weight of exhaustion settled over me. I've spent too long here. I rose, my limbs aching, and glanced once more at the towering arch.
      I've given time and sweat for this knowledge, and still, I have nothing close to answers. But I have a direction. And that's enough.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Continue onward',
        nextQuestId: 'quest-5',
      },
    ],
  },
  {
    id: 'quest-4b',
    mode: 'story',
    title: 'Moving Forward Before Nightfall',
    recap:
      'Among the ruins, I discovered an ancient arch carved with strange symbols—symbols that included my own name.',
    durationMinutes: 12,
    reward: { xp: 36 },
    poiSlug: 'ruined-archway',
    audioFile: '@/../assets/audio/quest-4b.mp3',
    story: `
      The sun dipped lower, stretching the ruins into long shadows. I didn't know what the arch meant. I didn't know what *I* meant. But staying here won't help me survive.
      I pressed on, following the remnants of an old road. The ruins thinned, giving way to wind-worn hills. The air smelled of water before I saw it—the faint glimmer of a lake in the distance, its surface smooth as glass.
      A statue rose from the shallows, its features barely visible from here. A strange sense of recognition settled in my gut. I didn't know why, but I needed to get closer.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Approach the lake',
        nextQuestId: 'quest-5',
      },
    ],
  },
  {
    id: 'quest-5',
    mode: 'story',
    title: 'Rugged Outcropping',
    recap:
      'Leaving the ruins and their troubling inscriptions behind, I move onward in the direction of a lake.',
    durationMinutes: 15,
    reward: { xp: 45 },
    poiSlug: 'lake-overlook',
    audioFile: '@/../assets/audio/quest-5.mp3',
    story: `
      The land rose into a craggy overlook, the jagged rock breaking into a sheer drop where the world fell away into black water. A lake stretched wide and still, swallowing the horizon. It offered no clear way forward.
      In the distance, a statue jutted from the shallows, its face weathered, its body half-swallowed by the water. Time had not been kind to it. The details were eroded, but something about it—its presence, its sheer weight—felt important.
      I took out the map, hoping for some guidance, but the inked lines mocked me with their silence. My fingers tightened around the parchment. I've followed every damn clue, every carved whisper of a past I can't remember. And yet, I'm still lost.
      The frustration surged, quick and sharp. Before I could stop myself, I wound back my arm—ready to hurl the cursed thing into the lake and be done with it.
      But something made me hesitate.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Throw the map into the water.',
        nextQuestId: 'quest-5a',
      },
      {
        id: 'option-2',
        text: 'Climb down and inspect the statue.',
        nextQuestId: 'quest-5b',
      },
    ],
  },
  {
    id: 'quest-5a',
    mode: 'story',
    title: "The Map's Return",
    recap:
      'Blocked by the vast lake, I stood frustrated at the shore, unsure how to proceed.',
    durationMinutes: 15,
    reward: { xp: 45 },
    poiSlug: 'rugged-outcropping',
    audioFile: '@/../assets/audio/quest-5a.mp3',
    story: `
      The map left my hand with a snap of motion—spinning once, then dropping into the lake with barely a ripple. It sank quickly, disappearing beneath the surface like it was never there. No glow. No resistance. Just gone.
      For a moment, I felt relief. Then dread crept in behind it, slow and unwelcome. I stared at the water a few seconds longer, then turned and walked along the shoreline, headed back the way I came.
      But as I walked, something shifted against my coat. I stopped. Reached into the same pocket I'd pulled the map from earlier—and there it was.
      Dry. Unchanged. Real.
      I didn't know how. But I knew what it meant.
      This map wasn't something I could throw away. It's not just a guide. It's a thread—and I'm tied to whatever waits at the end of it.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Turn back',
        nextQuestId: 'quest-6',
      },
    ],
  },
  {
    id: 'quest-5b',
    mode: 'story',
    title: 'The Fallen Idol',
    recap:
      'Blocked by the vast lake, I stood frustrated at the shore, unsure how to proceed.',
    durationMinutes: 15,
    reward: { xp: 45 },
    poiSlug: 'rugged-outcropping',
    audioFile: '@/../assets/audio/quest-5b.mp3',
    story: `
      I made my way down the slope, stone biting into my palms as I lowered myself toward the water's edge. Up close, the statue was massive, its features all but lost to erosion and time. What remained was haunting: a bent crown, the shape of a robe, the trace of something once worshipped—or feared.
      At its base, nearly worn smooth, I found a line carved in jagged script: *All kings fall.*
      I stood there for a long moment. Not because I expected more. Just to let the words settle.
      Then I turned back.
      The statue offered no direction forward. The lake blocked any path. I followed the shoreline in the opposite direction, the water to my right, the land rising steep around me. Somewhere beyond this bend, I knew, the path continued.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Turn back',
        nextQuestId: 'quest-6',
      },
    ],
  },
  {
    id: 'quest-6',
    mode: 'story',
    title: 'Ancient, Empty Village',
    recap:
      'The lake blocked my path, forcing me back along the shoreline. I need to find shelter before nightfall.',
    durationMinutes: 18,
    reward: { xp: 54 },
    poiSlug: 'ancient-village', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-6.mp3',
    story: `
      At the edge of dusk, the village rose before me, skeletal houses crouching beside the water's edge. Doors hung open, windows empty, the whole place forgotten by time. As I stepped carefully between buildings, the silence seemed to watch me back, unblinking.
      Ahead was a large house, doors cracked and inviting exploration. To my right, the silhouette of stables, sagging and abandoned. Night crept closer, and I knew I'll have only enough time to search one before darkness fully descended.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Explore the houses first',
        nextQuestId: 'quest-6a',
      },
      {
        id: 'option-2',
        text: 'Check the stables',
        nextQuestId: 'quest-6b',
      },
    ],
  },
  {
    id: 'quest-6a',
    mode: 'story',
    title: 'Echoes in the Empty House',
    recap:
      'In the abandoned village, darkness fell swiftly, and I had only a little time to search for clues or shelter.',
    durationMinutes: 18,
    reward: { xp: 54 },
    poiSlug: 'ancient-village', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-6a.mp3',
    story: `
      I stepped into the nearest house, floorboards creaking beneath my weight. Dust blanketed every surface, and a table stood overturned. Beside it, a sheet of parchment caught my eye, ink faded but readable:
      *We must leave before the soldiers come back… We've heard rumors the King can—*
      The writing stopped abruptly, unfinished, the paper marked by a hurried hand. I tucked the note away, unanswered questions pressing at my mind.
      Finding a half-intact bed in a nearby room, exhaustion pulled me down into restless sleep. The world faded, only to return with a blade pressed cold against my throat. In the dark, a figure stood over me, weapon steady.
      No words—only a silent demand to rise.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Obey the stranger',
        nextQuestId: 'quest-7',
      },
    ],
  },
  {
    id: 'quest-6b',
    mode: 'story',
    title: 'Beneath the Stables',
    recap:
      'In the abandoned village, darkness fell swiftly, and I had only a little time to search for clues or shelter.',
    durationMinutes: 18,
    reward: { xp: 54 },
    poiSlug: 'ancient-village', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-6b.mp3',
    story: `
      I pushed open the creaking stable doors, the smell of rotted wood and mold heavy in the air. Straw littered the floor, undisturbed for years. As I stepped further in, my boot caught on something—a trapdoor, hidden beneath loose hay.
      The wood groaned as I lifted it, revealing a shallow cellar. In the faint twilight, shapes resolved slowly: bones, huddled together in a desperate embrace. A family—fathers, mothers, children—all hiding from something that found them anyway.
      I backed away, heart heavy, and retreated to a nearby house. Sleep came slowly, fitful and troubled. I woke sharply to the cold touch of steel at my throat, eyes opening wide to a silent figure standing above me, sword poised.
      No words—only the quiet command to stand.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Obey the stranger',
        nextQuestId: 'quest-7',
      },
    ],
  },
  {
    id: 'quest-7',
    mode: 'story',
    title: 'Forced to Walk North by the Stranger',
    recap:
      'My sleep in the village ended abruptly when I woke to a stranger holding a blade to my throat. Silently, he led me away.',
    durationMinutes: 21,
    reward: { xp: 63 },
    poiSlug: 'ancient-temple', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-7.mp3',
    story: `
      The stranger walked behind me, close enough that I could hear his breath, the scrape of boots against stone. The sword stayed at my back—not digging, not threatening, just there. A warning.
      We moved north through barren stone and shifting sand, following forgotten trails beneath a crescent moon. I tried speaking, my voice rough in the quiet.
      "Who are you?"
      No answer.
      "Where are we going?"
      Still nothing.
      Eventually, I spotted an ancient temple, massive and weathered, half-buried in the sand. Shadows danced at its entrance, inviting us closer.
      As we reached the temple steps, I spotted a narrow gap between pillars, a potential escape. It's now or never.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Try to make a run for it',
        nextQuestId: 'quest-7a',
      },
      {
        id: 'option-2',
        text: 'Accept your fate and enter quietly',
        nextQuestId: 'quest-7b',
      },
    ],
  },
  {
    id: 'quest-7a',
    mode: 'story',
    title: 'An Attempted Escape',
    recap:
      'The stranger brought me to an ancient temple, giving no answers as we approached its shadowy entrance.',
    durationMinutes: 21,
    reward: { xp: 63 },
    poiSlug: 'ancient-temple', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-7a.mp3',
    story: `
      My muscles tense, adrenaline surging—I saw my chance. Without another thought, I lunged toward the narrow gap between pillars, gravel kicking up behind me. I almost reached the shadows before Rowan grabbed my arm, twisting me sharply but without causing real harm.
      "Enough," he said softly, frustration clear in his voice but no violence behind it. "Running won't help either of us."
      He released me carefully, motioning toward the temple's interior. I hesitated, but I followed him inside. He kneeled, striking a match and lighting a few scattered candles, the dim flames flickering to life, pushing back the heavy shadows. The faint glow danced over Rowan's face, softening his hardened expression just slightly.
      With nowhere else to go, I sat down, exhaling slowly. Rowan watched me carefully, and after a moment, I spoke. Everything came out—the waking in darkness, the strange map, my empty memory. He listened quietly, lighting more candles as I continued.
      When I'm done, Rowan considered me thoughtfully, his eyes calm. "Rowan," he finally said. "My name is Rowan."
      Before I could respond, he rose, extinguishing the candles one by one. "Rest now," he whispered, leaving me alone in the dark.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Close your eyes and rest',
        nextQuestId: 'quest-8',
      },
    ],
  },
  {
    id: 'quest-7b',
    mode: 'story',
    title: 'A Moment of Trust',
    recap:
      'The stranger brought me to an ancient temple, giving no answers as we approached its shadowy entrance.',
    durationMinutes: 21,
    reward: { xp: 63 },
    poiSlug: 'ancient-temple', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-7b.mp3',
    story: `
      Rowan nudged me forward with quiet urgency, sword lowered but still close enough to discourage resistance. We stepped through the temple's weathered entrance, the air thick with dust and echoes of time. 
      Without a word, Rowan kneeled, lighting several candles scattered across the stone floor, their flames weak but enough to cast flickering light across his tired face. He gestures silently, urging me to speak.
      The story tumbled from me—the confusion, the map, the emptiness in my memory. Rowan listened patiently, lighting another candle each time my voice faltered.
      Finally, he nodded, satisfied. "Rowan," he said simply, meeting my eyes. "My name is Rowan."
      He rose slowly, extinguishing each candle in turn. "You need sleep," he muttered softly, darkness enveloping us once more.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Close your eyes and rest',
        nextQuestId: 'quest-8',
      },
    ],
  },
  {
    id: 'quest-8',
    mode: 'story',
    title: 'Rowan Shares Context',
    recap:
      'Inside the temple, the stranger revealed his name—Rowan—and began explaining the fall of Vaedros.',
    durationMinutes: 24,
    reward: { xp: 72 },
    poiSlug: 'shrine-camp', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-8.mp3',
    story: `
  I woke to a dusty sunbeam passing over my eyes. A shadow moved in the doorway. Rowan. He jerks his chin toward the outside, a silent command.
  We climbed a wooded path, damp with morning mist, the temple fading behind. Ahead, a stone shrine appeared—small, ancient, edges worn smooth by countless seasons. Rowan crouched by a shallow fire pit, coaxing weak flames to life.
  "This place was called Vaedros," he said, voice raw from disuse. "It was alive, once. Rivers clear as glass, villages thriving. Then the light was taken. Everything decayed."
  Rowan glanced at me, then at the meager flames.
  "We'll need firewood," he said, "and water to boil."
    `,
    options: [
      {
        id: 'option-1',
        text: 'Gather wood for the fire',
        nextQuestId: 'quest-8a',
      },
      {
        id: 'option-2',
        text: 'Collect water to boil',
        nextQuestId: 'quest-8b',
      },
    ],
  },
  {
    id: 'quest-8a',
    mode: 'story',
    title: 'Collecting Firewood',
    recap:
      'Rowan paused his story about Vaedros, suggesting we needed fire and water before continuing.',
    durationMinutes: 24,
    reward: { xp: 72 },
    poiSlug: 'shrine-camp', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-8a.mp3',
    story: `
  I gathered fallen branches from beneath hollow trees, wondering again if I should run. But Rowan's words held me—something about them rings true. I'm not ready to leave yet.
  When I returned, Rowan fed the fire slowly, sparks rising into the cool air. He sat back and continued, "Now Vaedros is broken. Fading. And no one knows how to fix it." He met my eyes steadily. "I've seen you before."
  "Where?" I asked quietly.
  "Don't know," he said, frowning into the flames. "Don't know when either. Just...seen you."
  Silence returned, heavy with unanswered questions. Later, lying beneath an open sky, sleep was slow to come and uneasy when it did.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Rest by the fire',
        nextQuestId: 'quest-9',
      },
    ],
  },
  {
    id: 'quest-8b',
    mode: 'story',
    title: 'Fetching Water',
    recap:
      'Rowan paused his story about Vaedros, suggesting we needed fire and water before continuing.',
    durationMinutes: 24,
    reward: { xp: 72 },
    poiSlug: 'shrine-camp', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-8b.mp3',
    story: `
  I filled a dented pot from a nearby stream, water trickling gently over moss-covered stones. It occurred to me briefly—I could run, disappear now—but something held me here. Rowan seemed to know more than he was saying.
  Back at the shrine, Rowan hung the pot above the fire, the water hissing softly as it warmed. He leaned back and spoke again.
  "Now Vaedros is broken. Fading. No one knows how to fix it." His eyes found mine in the dim light. "But I know I've seen you before."
  "Where?" I asked, voice catching slightly.
  He shook his head slowly. "Not sure. Not sure when, either. Just know I've seen you."
  I sat in silence, listening to the water boil, questions piling like kindling. Later, under the stars, sleep came slowly and left too soon.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Rest by the fire',
        nextQuestId: 'quest-9',
      },
    ],
  },
  {
    id: 'quest-9',
    mode: 'story',
    title: 'Soldiers Raid the Campsite',
    recap:
      'Rowan spoke of Vaedros’s fall and hinted we might have met before. Under the stars, sleep eventually came, although my mind was teeming with questions.',
    durationMinutes: 27,
    reward: { xp: 81 },
    poiSlug: 'glass-building', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-9.mp3',
    story: `
  I woke to a hand clamped over my mouth.
  Rowan's face loomed close, eyes sharp, body coiled tight. He jerks his head toward the trees, and I heard it seconds later—the heavy tread of boots, the scrape of armor.
  Soldiers.
  We moved fast, keeping low, scrambling uphill. A strange structure appeared ahead—dark glass, sharp angles, out of place among trees. We slipped inside, crouching behind a half-broken wall as soldiers stormed our camp below.
  They tore through our things, kicking over embers. My map—*shit*—sits plainly in the dirt. A soldier snatched it, barking orders.
  One of them looked up, his gaze locking onto the glass ruin. He pointed.
  Rowan shifted beside me, breath steady. He whispered sharply, "Can you fight?"
  My eyes darted around, searching desperately for something—anything—to wield.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Grab the iron candlestick',
        nextQuestId: 'quest-9a',
      },
      {
        id: 'option-2',
        text: 'Pick up a broken glass shard',
        nextQuestId: 'quest-9b',
      },
    ],
  },
  {
    id: 'quest-9a',
    mode: 'story',
    title: 'An Iron Grip',
    recap:
      'Cornered by soldiers with no way out, Rowan and I prepared for a desperate fight.',
    durationMinutes: 27,
    reward: { xp: 81 },
    poiSlug: 'glass-building', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-9a.mp3',
    story: `
  I gripped the candleholder, its iron base thick with years of melted wax, its weight unfamiliar in my hands.
  "Why don't we just run?" I whispered. "We can't survive this."
  Rowan didn't take his eyes off the doorway. "There's nowhere to run. We need that map."
  The soldiers stepped inside, moving slow, sure of their numbers. We struck first.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Attack the soldiers',
        nextQuestId: 'quest-10',
      },
    ],
  },
  {
    id: 'quest-9b',
    mode: 'story',
    title: 'Wood and Splinters',
    recap:
      'Cornered by soldiers with no way out, Rowan and I prepared for a desperate fight.',
    durationMinutes: 27,
    reward: { xp: 81 },
    poiSlug: 'glass-building', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-9b.mp3',
    story: `
  I gripped the table leg, splintered wood rough against my palm, its heft oddly comforting despite our odds.
  "Why don't we just run?" I whispered. "We can't survive this."
  Rowan didn't take his eyes off the doorway. "There's nowhere to run. We need that map."
  The soldiers stepped inside, moving slow, sure of their numbers. We struck first.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Attack the soldiers',
        nextQuestId: 'quest-10',
      },
    ],
  },
  {
    id: 'quest-10',
    mode: 'story',
    title: 'The Fight for Survival',
    recap:
      "Discovered by soldiers, Rowan and I brace ourselves for a fight we can't avoid. Our only advantage is surprise—and desperation.",
    durationMinutes: 30,
    reward: { xp: 90 },
    poiSlug: 'escape-forest', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-10.mp3',
    story: `
      I gripped my makeshift weapon tighter, knuckles white. The soldiers entered cautiously, eyes scanning the shadows.  
      Rowan lunged first, driving his sword into one soldier's side—but the blade caught, trapped in armor. I swung wildly at another, the impact jarring up my arm as the man stumbled, stunned but not down.
      A third soldier emerged, untouched and deadly, blade slicing toward Rowan.
      There's no time to think—only react.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Shout a warning to Rowan.',
        nextQuestId: 'quest-10a',
      },
      {
        id: 'option-2',
        text: 'Shield Rowan from the attack yourself.',
        nextQuestId: 'quest-10b',
      },
    ],
  },

  {
    id: 'quest-10a',
    mode: 'story',
    title: 'A Timely Warning',
    recap:
      "The fight erupted quickly, and Rowan faced certain death—I reacted instinctively, discovering power I didn't know I had.",
    durationMinutes: 30,
    reward: { xp: 90 },
    poiSlug: 'escape-forest', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-10a.mp3',
    story: `
      The soldier raised his blade behind Rowan, poised for a killing blow.  
      "Rowan, behind you!" I shouted, my voice raw.
      Rowan spun just fast enough to avoid death, but the sword grazed his arm, drawing blood. He stumbled, his balance thrown off, blade momentarily lowered.
      The attacker stepped in again, readying a final strike. My heart froze—I raised my hand, desperation igniting something inside me. Power surged, fierce and raw, erupting outward.
      The soldier flew backward, crashing violently into the far wall. Silence followed, heavy and strange.
      Rowan stared at me, hand pressed against the shallow cut on his arm. His voice was quiet, awed.  
      "Who the hell are you?"
      I looked down at my shaking hand, wishing I had an answer.
      In the distance, voices rose—more soldiers coming. Rowan grabbed my arm, urgency in his eyes. "Come on—we have to run."
      We plunged into the woods, leaving the battlefield behind.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Escape into the forest.',
        nextQuestId: 'quest-11',
      },
    ],
  },
  {
    id: 'quest-10b',
    mode: 'story',
    title: 'Taking the Blow',
    recap:
      "The fight erupted quickly, and Rowan faced certain death—I reacted instinctively, discovering power I didn't know I had.",
    durationMinutes: 30,
    reward: { xp: 90 },
    poiSlug: 'escape-forest', // @todo: add slug when map has 10 POIs
    audioFile: '@/../assets/audio/quest-10b.mp3',
    story: `
      Without thinking, I shoved Rowan aside, feeling the sting of a blade grazing my shoulder. Warmth spread down my sleeve—blood, sharp and real—but I'm alive.
      The soldier snarled, repositioning himself, blade raised to finish what he started. Fear twisted into defiance—I lifted my hand, feeling something ignite within me.
      A scream ripped from my throat, unleashing a surge of force that slammed the soldier into the stone wall, crumpling him to the floor.
      Rowan pulled himself up beside me, eyes wide, breath coming hard. He saw the blood on my shoulder, but it's not that he's staring at. It's my hand.
      "Who the hell are you?" he whispered, stunned.
      I have no answer, only questions of my own.
      In the silence, distant shouts rang out—reinforcements. Rowan nodded urgently toward the trees. "We need to move—now."
      We ran, pushing through underbrush and shadows, leaving the fight behind us.
    `,
    options: [
      {
        id: 'option-1',
        text: 'Escape into the forest.',
        nextQuestId: 'quest-11',
      },
    ],
  },
];
