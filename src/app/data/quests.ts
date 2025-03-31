import Constants from 'expo-constants';

import {
  type CustomQuestTemplate,
  type StoryQuestTemplate,
} from '@/store/types';

export const AVAILABLE_QUESTS: (CustomQuestTemplate | StoryQuestTemplate)[] = [
  {
    id: 'quest-1',
    mode: 'story',
    title: 'A Confused Awakening',
    recap:
      'The Kingdom of Vaedros is in peril. The balance is broken. The light is trapped. The darkness is growing.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 3,
    reward: { xp: 100 },
    poiSlug: 'darkwood-awakening',
    audioFile: require('@/../assets/audio/quest-1.mp3'),
    story: `
     I wake up lying on my back, the earth cold and damp beneath me. The trees stretch high, their gnarled limbs tangled overhead, blotting out the sky. For a long moment, I don’t move. Not because I’m afraid—though maybe I should be—but because I don’t know who I am.
    No name. No memory. Just a dull ache behind my eyes, pulsing like the aftermath of a long-forgotten dream.
    I sit up, slow and deliberate, brushing leaves from my coat. The fabric is worn, torn at the sleeve, though I can’t say if that means anything.
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
    recap: 'You awoke alone in a dark forest with no memory of who you are.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 3,
    reward: { xp: 100 },
    poiSlug: 'darkwood-awakening',
    audioFile: require('@/../assets/audio/quest-1a.mp3'), // @todo: add audio file
    story: `
      Then, a weight in my pocket—a piece of folded parchment. I pull it free, fingers stiff with cold. It’s a map. Or part of one.
      Most of it is blank, save for a crude drawing of trees, a stretch of forest that looks too much like the one around me to be a coincidence. The rest of the map is covered in a shifting black fog, writhing at the edges of my vision, like ink that refuses to dry. I blink, shake my head. The image stays.
      I don’t know what it means. I don’t know what "I" mean.
      But there’s only one thing to do: move. I tuck the map into my coat, push myself to my feet, and take the first step into the unknown.
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
    recap:
      'You awoke in a dense, unfamiliar forest with no memory of how you got there. After scouting the area for danger, you spotted a structure in the distance and made your way toward it.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 3,
    reward: { xp: 100 },
    poiSlug: 'darkwood-awakening',
    audioFile: require('@/../assets/audio/quest-1b.mp3'), // @todo: add audio file
    story: `
      I push myself to my feet, the damp chill of the earth clinging to my skin. The silence is thick—too thick. No birds. No rustling leaves. Just my own breath, too loud in my ears.
      I step forward, careful, scanning the trees for movement. If someone—or something—is out here, I need to know before it knows me.
      One path ahead is a tangle of blackened trees, their branches knotted so thickly that even moonlight can’t slip through. Something about it hums with quiet menace. I don’t trust it.
      The other way is clearer, the trees thinning just enough to show a flicker of something unnatural in the distance. A shape, a structure. A building? I exhale, adjusting my coat. If I want answers, if I want shelter, that’s my best shot.
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
      'After waking in the forest with no memory, you followed a mysterious map and discovered a small abandoned hut where you found shelter for the night.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 6,
    reward: { xp: 120 },
    poiSlug: 'hut-of-whispers',
    audioFile: require('@/../assets/audio/quest-2.mp3'),
    story: `
    I move through the undergrowth, the brittle branches snapping beneath my boots. The hut appears through the mist like something forgotten—leaning slightly, its wooden door swaying on rusted hinges.
    I step inside. The air is stale, thick with dust and old wood. Whoever was here didn’t take much when they left. There’s no sign of struggle, no overturned furniture. Just absence.
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
      'You uncovered an old fishing pole and supplies, hinting at a water source nearby. Peering through the window, you caught a faint glimmer in the distance—a river, your best lead forward.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 6,
    reward: { xp: 100 },
    poiSlug: 'modest-hut',
    audioFile: require('@/../assets/audio/quest-2a.mp3'),
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
      "Inside the hut, you studied the mysterious map, its strange ink revealing an unsettling phrase: 'Balance must be restored.' Beneath it, a faint winding line pointed south—a river, hidden beyond the trees, waiting to be found.",
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 6,
    reward: { xp: 100 },
    poiSlug: 'modest-hut',
    audioFile: require('@/../assets/audio/quest-2b.mp3'),
    story: `
      I kneel by the fireplace, rubbing my hands together for warmth. The map rests on the floor beside me, catching the candlelight. I run my fingers over its shifting ink, tracing the barely visible lines beneath. A phrase emerges, faint but deliberate.
      Balance must be restored.
      I exhale, watching the letters waver, then fade. Just below them, another detail—a thin, winding line stretching south. A river.
      I glance toward the door, past the tangled brush. If the map is right, the water isn’t far. Tomorrow, I’ll find it.
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
      'In the weathered hut, you discovered cryptic words on your map about restoring balance. Morning revealed you were at the edge of a raging river.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 9,
    reward: { xp: 150 },
    poiSlug: 'weary-crossing',
    audioFile: require('@/../assets/audio/quest-3.mp3'),
    story: `
      By morning, it’s clear—I’m trapped. The river coils around this stretch of land like a noose, its current fast and merciless. The trees behind me stand thick, an impassable wall of roots and thorns. No trails. No way forward. Except through the water.
      The river churns, dark and fast, cutting me off from whatever lies beyond. I kneel at the bank, testing the water with my fingertips. Ice-cold. Deep. No chance of wading through.
      I glance at the map, but it offers no guidance on how to cross. The hut behind me held scraps of wood, rope, even a few tools—enough to build something seaworthy, if I had time. But there’s another option. 
      I could find a hollowed-out tree trunk near the river bend and ride it across. It’s risky, but it might be faster.
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
      'Rather than risk a reckless attempt, you decide to construct a proper raft. The work takes time, but with careful planning, you prepare for a controlled crossing.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 9,
    reward: { xp: 100 },
    poiSlug: 'riverbank-crossing',
    audioFile: require('@/../assets/audio/quest-3a.mp3'),
    story: `
      I search the remains of the hut, scavenging planks, frayed rope, anything that might hold together long enough to keep me from drowning. My hands work without hesitation, lashing wood with knots that feel second nature. Maybe I was a sailor. Maybe I wasn’t. Doesn’t matter. I need to cross.
      The raft groans as I push it into the shallows. Water swirls around my boots. I step on, crouching low as the current catches hold. The river doesn’t carry—it drags. The world tilts with every surge, the raft lurching beneath me, threatening to come undone.
      I grip the rope, muscles tight, jaw locked. The opposite shore inches closer. A break in the current, and I seize the moment—digging the pole deep, forcing the raft toward land.
      Wood scrapes against rock, the jolt nearly sending me overboard. I scramble onto the bank, breath sharp, hands aching. The raft is already splintering, drifting back into the current.
      By the time I drag myself onto the far shore, the sky is black. The journey has drained me, and I don’t trust the woods at night. I gather dry branches, striking a small fire, the map beside me. Tomorrow, I’ll move forward.
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
      'Rather than spending precious time crafting a proper raft, you chose to risk crossing the river in a hollowed log, hoping speed would compensate for caution.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 9,
    reward: { xp: 100 },
    poiSlug: 'riverbank-crossing',
    audioFile: require('@/../assets/audio/quest-3b.mp3'),
    story: `
      At the river’s edge lies a hollowed-out log—rotted and cracked, barely sturdy enough to hold my weight. I drag it into the shallows, water immediately seeping through its splintered sides. No time for second thoughts.
      I climb in, crouched low, using a splintered plank to paddle furiously against the relentless current. The log spins and bobs, water rushing through widening cracks, soaking me to the bone. Halfway across, it dips sharply, nearly capsizing. Frantic, I scoop out water, fighting for every inch.
      The log collides with the far shore, jolting my bones. I scramble onto solid ground, dripping and gasping, my makeshift boat already breaking apart behind me. Shaking from exhaustion and cold, I collapse beneath a rocky overhang, knowing I've barely escaped disaster.
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
      'The river was the only way forward. After a harrowing crossing, I reached the other side—only to find a land scattered with ruins, remnants of something long forgotten.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 12,
    reward: { xp: 100 },
    poiSlug: 'ruined-archway',
    audioFile: require('@/../assets/audio/quest-4.mp3'),
    story: `
      The land changes beyond the river. The trees thin, giving way to ruins—broken stones half-swallowed by the earth, the remains of something old, something lost. I follow the path between them, stepping over shattered pillars and roots tangled with the bones of the past. Then, through the mist, I see it.
      A massive arch. Carved from stone so ancient it looks like it was born from the land itself. The surface is worn, cracked by time, but the inscriptions remain—faint spirals and twisting shapes, two forces entwined. One bright as fire, the other deep as a starless void. Opposites, locked together.
      I run my fingers over the carvings, tracing the fading grooves. Then, in the lower corner, half-buried in dust and shadow, I see it.
      My name. I remember it now.
      It’s etched into the stone, as old as the rest. My mind claws for answers, but nothing comes—only the cold realization that this place, this monument, knew me before I knew myself.
      The inscription tells a story: the balance was broken. Light, once free, was trapped. Darkness grew, swallowing everything. The final image is an abyss, stretching endlessly into ruin.
      The wind shifts, rustling through the ruins. I exhale, my breath steady, but my mind anything but. There are answers here. Maybe buried in the ruins themselves, maybe somewhere beyond them. But I can’t shake the feeling that I stand at the edge of something vast.
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
      'The arch held a message—one about balance, light, and darkness. And somehow, impossibly, my name was carved into its surface. I couldn’t leave without learning more.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 12,
    reward: { xp: 100 },
    poiSlug: 'ruined-archway',
    audioFile: require('@/../assets/audio/quest-4a.mp3'),
    story: `
      I stay. The ruins stretch wide around me, an old skeleton of something once grand.
      The arch’s carvings are worn, their edges softened by centuries of wind and rain. I kneel, tracing the stone, pressing dirt-streaked fingers into the grooves, willing them to give me something. Anything.
      Time passes. The sun inches across the sky. I pry through toppled pillars, shifting stones, searching the ruins for anything else—another inscription, a clue, a scrap of history to anchor me in this place that already seems to know me. Sweat beads on my forehead. The air thickens with the weight of time, my muscles burning as I heave away a half-buried slab.
      And finally, I find it.
      Beneath layers of dirt and ruin, a deeper carving—faint, but intact. A phrase, etched long ago: *The King must not claim the seal.*
      The words root into me. I don’t understand them fully, but I know this much—someone fought to leave this message behind. Someone wanted it remembered.
      A gust of wind rushes through the ruins, colder than before. The weight of exhaustion settles over me. I’ve spent too long here. I rise, my limbs aching, and glance once more at the towering arch.
      I’ve given time and sweat for this knowledge, and still, I have nothing close to answers. But I have a direction. And that’s enough.
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
      'The arch held carvings of light and darkness, of balance broken. My name was there, carved into its surface like a relic of the past. But answers wouldn’t keep me warm at night, so I chose to move on.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 12,
    reward: { xp: 100 },
    poiSlug: 'ruined-archway',
    audioFile: require('@/../assets/audio/quest-4b.mp3'),
    story: `
      The sun dips lower, stretching the ruins into long shadows. I don’t know what the arch means. I don’t know what *I* mean. But staying here won’t help me survive.
      I press on, following the remnants of an old road. The ruins thin, giving way to wind-worn hills. The air smells of water before I see it—the faint glimmer of a lake in the distance, its surface smooth as glass.
      A statue rises from the shallows, its features barely visible from here. A strange sense of recognition settles in my gut. I don’t know why, but I need to get closer.
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
      "The arch held more than just old carvings. It held my name. It held warnings. *The King must not claim the seal.* I don't know what it means, but I left the ruins with more questions than answers.",
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 15,
    reward: { xp: 100 },
    poiSlug: 'lake-overlook',
    audioFile: require('@/../assets/audio/quest-5.mp3'),
    story: `
      The land rises into a craggy overlook, the jagged rock breaking into a sheer drop where the world falls away into black water. A lake stretches wide and still, swallowing the horizon. It offers no clear way forward.
      In the distance, a statue juts from the shallows, its face weathered, its body half-swallowed by the water. Time has not been kind to it. The details are eroded, but something about it—its presence, its sheer weight—feels important.
      I take out the map, hoping for some guidance, but the inked lines mock me with their silence. My fingers tighten around the parchment. I’ve followed every damn clue, every carved whisper of a past I can’t remember. And yet, I’m still lost.
      The frustration surges, quick and sharp. Before I can stop myself, I wind back my arm—ready to hurl the cursed thing into the lake and be done with it.
      But something makes me hesitate.
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
    title: 'The Map’s Return',
    recap:
      'Frustrated by the endless questions without answers, I stood at the edge of the lake, tempted to toss the map away and be done with it.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 15,
    reward: { xp: 100 },
    poiSlug: 'rugged-outcropping',
    audioFile: require('@/../assets/audio/quest-5a.mp3'),
    story: `
      The map leaves my hand with a snap of motion—spinning once, then dropping into the lake with barely a ripple. It sinks quickly, disappearing beneath the surface like it was never there. No glow. No resistance. Just gone.
      For a moment, I feel relief. Then dread creeps in behind it, slow and unwelcome. I stare at the water a few seconds longer, then turn and walk along the shoreline, headed back the way I came.
      But as I walk, something shifts against my coat. I stop. Reach into the same pocket I'd pulled the map from earlier—and there it is.
      Dry. Unchanged. Real.
      I don't know how. But I know what it means.
      This map isn't something I can throw away. It's not just a guide. It's a thread—and I'm tied to whatever waits at the end of it.
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
      'Blocked by the lake, I noticed a crumbling statue half-submerged in the shallows and decided it might hold some answers.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 15,
    reward: { xp: 100 },
    poiSlug: 'rugged-outcropping',
    audioFile: require('@/../assets/audio/quest-5b.mp3'),
    story: `
      I make my way down the slope, stone biting into my palms as I lower myself toward the water's edge. Up close, the statue is massive, its features all but lost to erosion and time. What remains is haunting: a bent crown, the shape of a robe, the trace of something once worshipped—or feared.
      At its base, nearly worn smooth, I find a line carved in jagged script: *All kings fall.*
      I stand there for a long moment. Not because I expect more. Just to let the words settle.
      Then I turn back.
      The statue offers no direction forward. The lake blocks any path. I follow the shoreline in the opposite direction, the water to my right, the land rising steep around me. Somewhere beyond this bend, I know, the path continues.
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
      'The lake blocked my path, forcing me back along the shoreline. As darkness fell, an abandoned village appeared—silent, still, but perhaps not as empty as it seems.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 18,
    reward: { xp: 100 },
    poiSlug: 'empty-village',
    audioFile: require('@/../assets/audio/quest-6.mp3'),
    story: `
      At the edge of dusk, the village rises before me, skeletal houses crouching beside the water's edge. Doors hang open, windows empty, the whole place forgotten by time. As I step carefully between buildings, the silence seems to watch me back, unblinking.
      Ahead is a large house, doors cracked and inviting exploration. To my right, the silhouette of stables, sagging and abandoned. Night creeps closer, and I know I'll have only enough time to search one before darkness fully descends.
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
      'The village sat silent and abandoned, holding secrets that demanded exploration. With darkness falling, I chose to investigate the homes first.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 18,
    reward: { xp: 100 },
    poiSlug: 'empty-village',
    audioFile: require('@/../assets/audio/quest-6a.mp3'),
    story: `
      I step into the nearest house, floorboards creaking beneath my weight. Dust blankets every surface, and a table stands overturned. Beside it, a sheet of parchment catches my eye, ink faded but readable:
      *We must leave before the soldiers come back… We’ve heard rumors the King can—*
      The writing stops abruptly, unfinished, the paper marked by a hurried hand. I tuck the note away, unanswered questions pressing at my mind.
      Finding a half-intact bed in a nearby room, exhaustion pulls me down into restless sleep. The world fades, only to return with a blade pressed cold against my throat. In the dark, a figure stands over me, weapon steady.
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
      'With darkness pressing close, I chose to inspect the village stables, hoping to find some useful clue to this place’s abandonment.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 18,
    reward: { xp: 100 },
    poiSlug: 'empty-village',
    audioFile: require('@/../assets/audio/quest-6b.mp3'),
    story: `
      I push open the creaking stable doors, the smell of rotted wood and mold heavy in the air. Straw litters the floor, undisturbed for years. As I step further in, my boot catches on something—a trapdoor, hidden beneath loose hay.
      The wood groans as I lift it, revealing a shallow cellar. In the faint twilight, shapes resolve slowly: bones, huddled together in a desperate embrace. A family—fathers, mothers, children—all hiding from something that found them anyway.
      I back away, heart heavy, and retreat to a nearby house. Sleep comes slowly, fitful and troubled. I wake sharply to the cold touch of steel at my throat, eyes opening wide to a silent figure standing above me, sword poised.
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
      'I woke in the dead of night, a stranger holding a blade to my throat. With no words exchanged, he silently forced me from the village into the darkness.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 21,
    reward: { xp: 100 },
    poiSlug: 'ancient-temple',
    audioFile: require('@/../assets/audio/quest-7.mp3'),
    story: `
      The stranger walks behind me, close enough that I can hear his breath, the scrape of boots against stone. The sword stays at my back—not digging, not threatening, just there. A warning.
      We move north through barren stone and shifting sand, following forgotten trails beneath a crescent moon. I try speaking, my voice rough in the quiet.
      "Who are you?"
      No answer.
      "Where are we going?"
      Still nothing.
      Eventually, I spot an ancient temple, massive and weathered, half-buried in the sand. Shadows dance at its entrance, inviting us closer.
      As we reach the temple steps, I spot a narrow gap between pillars, a potential escape. It's now or never.
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
      'The stranger leads me to a half-buried temple. I decided not to trust the stranger, making a desperate dash for freedom.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 21,
    reward: { xp: 50 },
    poiSlug: 'ancient-temple',
    audioFile: require('@/../assets/audio/quest-7a.mp3'),
    story: `
      My muscles tense, adrenaline surging—I see my chance. Without another thought, I lunge toward the narrow gap between pillars, gravel kicking up behind me. I almost reach the shadows before Rowan grabs my arm, twisting me sharply but without causing real harm.
      "Enough," he says softly, frustration clear in his voice but no violence behind it. "Running won't help either of us."
      He releases me carefully, motioning toward the temple's interior. I hesitate, but I follow him inside. He kneels, striking a match and lighting a few scattered candles, the dim flames flickering to life, pushing back the heavy shadows. The faint glow dances over Rowan's face, softening his hardened expression just slightly.
      With nowhere else to go, I sit down, exhaling slowly. Rowan watches me carefully, and after a moment, I speak. Everything comes out—the waking in darkness, the strange map, my empty memory. He listens quietly, lighting more candles as I continue.
      When I'm done, Rowan considers me thoughtfully, his eyes calm. "Rowan," he finally says. "My name is Rowan."
      Before I can respond, he rises, extinguishing the candles one by one. "Rest now," he whispers, leaving me alone in the dark.
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
      'The stranger leads me to a half-buried temple. Though cautious, I decided to trust the stranger and followed him inside.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 21,
    reward: { xp: 50 },
    poiSlug: 'ancient-temple',
    audioFile: require('@/../assets/audio/quest-7b.mp3'),
    story: `
      Rowan nudges me forward with quiet urgency, sword lowered but still close enough to discourage resistance. We step through the temple's weathered entrance, the air thick with dust and echoes of time. 
      Without a word, Rowan kneels, lighting several candles scattered across the stone floor, their flames weak but enough to cast flickering light across his tired face. He gestures silently, urging me to speak.
      The story tumbles from me—the confusion, the map, the emptiness in my memory. Rowan listens patiently, lighting another candle each time my voice falters.
      Finally, he nods, satisfied. "Rowan," he says simply, meeting my eyes. "My name is Rowan."
      He rises slowly, extinguishing each candle in turn. "You need sleep," he mutters softly, darkness enveloping us once more.
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
      'Rowan led me north to an ancient temple, revealing his name and offering shelter. Despite lingering doubts, I decided to trust him—at least for now.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 24,
    reward: { xp: 100 },
    poiSlug: 'stone-shrine',
    audioFile: require('@/../assets/audio/quest-8.mp3'),
    story: `
  I wake to a dusty sunbeam passing over my eyes. A shadow moves in the doorway. Rowan. He jerks his chin toward the outside, a silent command.
  We climb a wooded path, damp with morning mist, the temple fading behind. Ahead, a stone shrine appears—small, ancient, edges worn smooth by countless seasons. Rowan crouches by a shallow fire pit, coaxing weak flames to life.
  “This place was called Vaedros,” he says, voice raw from disuse. “It was alive, once. Rivers clear as glass, villages thriving. Then the light was taken. Everything decayed.”
  Rowan glances at me, then at the meager flames.
  “We'll need firewood,” he says, “and water to boil.”
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
      'Rowan began explaining the fall of Vaedros, but paused to have me collect wood for the fire. There was more he needed to say, and I felt certain it concerned me directly.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 24,
    reward: { xp: 50 },
    poiSlug: 'stone-shrine-woods',
    audioFile: require('@/../assets/audio/quest-8a.mp3'),
    story: `
  I gather fallen branches from beneath hollow trees, wondering again if I should run. But Rowan's words hold me—something about them rings true. I'm not ready to leave yet.
  When I return, Rowan feeds the fire slowly, sparks rising into the cool air. He sits back and continues, “Now Vaedros is broken. Fading. And no one knows how to fix it.” He meets my eyes steadily. “I've seen you before.”
  “Where?” I ask quietly.
  “Don’t know,” he says, frowning into the flames. “Don’t know when either. Just...seen you.”
  Silence returns, heavy with unanswered questions. Later, lying beneath an open sky, sleep is slow to come and uneasy when it does.
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
      "Rowan started to explain Vaedros's fall, pausing to have me fetch water. I could sense he had more to reveal, something about my role in all this.",
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 24,
    reward: { xp: 50 },
    poiSlug: 'stone-shrine-stream',
    audioFile: require('@/../assets/audio/quest-8b.mp3'),
    story: `
  I fill a dented pot from a nearby stream, water trickling gently over moss-covered stones. It occurs to me briefly—I could run, disappear now—but something holds me here. Rowan seems to know more than he's saying.
  Back at the shrine, Rowan hangs the pot above the fire, the water hissing softly as it warms. He leans back and speaks again.
  “Now Vaedros is broken. Fading. No one knows how to fix it.” His eyes find mine in the dim light. “But I know I've seen you before.”
  “Where?” I ask, voice catching slightly.
  He shakes his head slowly. “Not sure. Not sure when, either. Just know I've seen you.”
  I sit in silence, listening to the water boil, questions piling like kindling. Later, under the stars, sleep comes slowly and leaves too soon.
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
      "Rowan explained the fall of Vaedros, hinting that we've met before. Sleep was brief and restless, shattered by the arrival of soldiers searching our camp.",
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 27,
    reward: { xp: 100 },
    poiSlug: 'glass-ruin',
    audioFile: require('@/../assets/audio/quest-9.mp3'),
    story: `
  I wake to a hand clamped over my mouth.
  Rowan’s face looms close, eyes sharp, body coiled tight. He jerks his head toward the trees, and I hear it seconds later—the heavy tread of boots, the scrape of armor.
  Soldiers.
  We move fast, keeping low, scrambling uphill. A strange structure appears ahead—dark glass, sharp angles, out of place among trees. We slip inside, crouching behind a half-broken wall as soldiers storm our camp below.
  They tear through our things, kicking over embers. My map—*shit*—sits plainly in the dirt. A soldier snatches it, barking orders.
  One of them looks up, his gaze locking onto the glass ruin. He points.
  Rowan shifts beside me, breath steady. He whispers sharply, “Can you fight?”
  My eyes dart around, searching desperately for something—anything—to wield.
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
      'Soldiers have discovered our campsite, leaving us cornered. With no better option, I reach for a heavy iron candlestick, bracing for the fight.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 27,
    reward: { xp: 50 },
    poiSlug: 'glass-ruin-fight',
    audioFile: require('@/../assets/audio/quest-9a.mp3'),
    story: `
  I grip the candleholder, its iron base thick with years of melted wax, its weight unfamiliar in my hands.
  “Why don’t we just run?” I whisper. “We can’t survive this.”
  Rowan doesn’t take his eyes off the doorway. “There’s nowhere to run. We need that map.”
  The soldiers step inside, moving slow, sure of their numbers. We strike first.
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
      "The soldiers found us. Cornered and desperate, I grab a sturdy wooden table leg, hoping it's enough.",
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 27,
    reward: { xp: 50 },
    poiSlug: 'glass-ruin-fight',
    audioFile: require('@/../assets/audio/quest-9b.mp3'),
    story: `
  I grip the table leg, splintered wood rough against my palm, its heft oddly comforting despite our odds.
  “Why don’t we just run?” I whisper. “We can’t survive this.”
  Rowan doesn’t take his eyes off the doorway. “There’s nowhere to run. We need that map.”
  The soldiers step inside, moving slow, sure of their numbers. We strike first.
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
      'Discovered by soldiers, Rowan and I brace ourselves for a fight we can’t avoid. Our only advantage is surprise—and desperation.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 30,
    reward: { xp: 100 },
    poiSlug: 'glass-ruins-fight',
    audioFile: require('@/../assets/audio/quest-10.mp3'),
    story: `
      I grip my makeshift weapon tighter, knuckles white. The soldiers enter cautiously, eyes scanning the shadows.  
      Rowan lunges first, driving his sword into one soldier’s side—but the blade catches, trapped in armor. I swing wildly at another, the impact jarring up my arm as the man stumbles, stunned but not down.
      A third soldier emerges, untouched and deadly, blade slicing toward Rowan.
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
      'Cornered by soldiers, you and Rowan stood your ground. Amid the chaos, you shouted a warning to Rowan just before a deadly strike.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 30,
    reward: { xp: 100 },
    poiSlug: 'glass-ruins-fight',
    audioFile: require('@/../assets/audio/quest-10a.mp3'),
    story: `
      The soldier raises his blade behind Rowan, poised for a killing blow.  
      “Rowan, behind you!” I shout, my voice raw.
      Rowan spins just fast enough to avoid death, but the sword grazes his arm, drawing blood. He stumbles, his balance thrown off, blade momentarily lowered.
      The attacker steps in again, readying a final strike. My heart freezes—I raise my hand, desperation igniting something inside me. Power surges, fierce and raw, erupting outward.
      The soldier flies backward, crashing violently into the far wall. Silence follows, heavy and strange.
      Rowan stares at me, hand pressed against the shallow cut on his arm. His voice is quiet, awed.  
      “Who the hell are you?”
      I look down at my shaking hand, wishing I had an answer.
      In the distance, voices rise—more soldiers coming. Rowan grabs my arm, urgency in his eyes. "Come on—we have to run."
      We plunge into the woods, leaving the battlefield behind.
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
      'Trapped and facing death, you lunged to shield Rowan from a lethal attack, taking the blow yourself.',
    durationMinutes: Constants.expoConfig?.extra?.development ? 2 : 30,
    reward: { xp: 100 },
    poiSlug: 'glass-ruins-fight',
    audioFile: require('@/../assets/audio/quest-10b.mp3'),
    story: `
      Without thinking, I shove Rowan aside, feeling the sting of a blade grazing my shoulder. Warmth spreads down my sleeve—blood, sharp and real—but I’m alive.
      The soldier snarls, repositioning himself, blade raised to finish what he started. Fear twists into defiance—I lift my hand, feeling something ignite within me.
      A scream rips from my throat, unleashing a surge of force that slams the soldier into the stone wall, crumpling him to the floor.
      Rowan pulls himself up beside me, eyes wide, breath coming hard. He sees the blood on my shoulder, but it’s not that he’s staring at. It’s my hand.
      “Who the hell are you?” he whispers, stunned.
      I have no answer, only questions of my own.
      In the silence, distant shouts ring out—reinforcements. Rowan nods urgently toward the trees. "We need to move—now."
      We run, pushing through underbrush and shadows, leaving the fight behind us.
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

export const AVAILABLE_CUSTOM_QUEST_STORIES = [
  {
    id: 'X7Fh2pKqL8vB',
    title: "The Summit's Watchful Eye",
    story:
      "The climb was brutal, each step carving fire into your legs, but at last, you reached the summit. Below, the kingdom sprawled beneath a sky streaked with gold, the distant towers of Vaedros barely piercing the mist. As you caught your breath, a falcon landed beside you, a message tied to its leg—someone had been watching your ascent. Strength wasn't just about endurance; it was about proving, even to unseen eyes, that you could endure.",
    category: 'Fitness',
  },
  {
    id: 'P3XvL9KqJ2mN',
    title: 'The Forgotten Tome',
    story:
      'Deep in the ruins of an old monastery, you pried open a dust-choked chest, its wood crumbling under your touch. Inside lay a single book, bound in cracked leather, its pages whispering as they turned. The words were ancient, yet they unraveled a mystery you had never considered—a secret history of Vaedros, lost to time. You left the ruins wiser, the weight of knowledge sitting heavier on your shoulders than any sword.',
    category: 'Reading',
  },
  {
    id: 'Z5GhT8MlQ2nV',
    title: "The River's Reflection",
    story:
      "You knelt at the river's edge, the water so still it mirrored the sky like glass. Breathing deep, you let the hush of the forest quiet your thoughts, the chaos of your journey settling into stillness. When you opened your eyes, the reflection had shifted—a faint figure watching from the reeds, gone in the next blink. Whether spirit or trick of the light, you rose feeling lighter, as if something unseen had granted you peace.",
    category: 'Meditation',
  },
  {
    id: 'L9VnQ3XpK7YB',
    title: "The Stranger's Wager",
    story:
      'At the edge of the market, a hooded traveler challenged you to a game of wit and chance. Coins flashed, dice rolled, and laughter filled the air as the two of you traded victories back and forth. In the end, you left with no gold but something better—an ally who would remember your name when the time came. Sometimes, a shared moment meant more than the weight of a purse.',
    category: 'Social',
  },
  {
    id: 'K2XvT8LQ3MnP',
    title: "The Master's Challenge",
    story:
      "The old swordsman watched as you struggled through the intricate movements of the blade, your form raw but determined. He said nothing, only nodding once when your footwork finally landed true. 'Not bad,' he muttered, tossing you a battered silver coin, the mark of his approval. The lesson was over, but the real learning had just begun.",
    category: 'Learning',
  },
  {
    id: 'M8KXvT9QLJ3P',
    title: "The Hunter's Path",
    story:
      "A dense thicket barred your path, but beyond it lay the perfect vantage point over the valley below. Every step tested your endurance, each fallen branch and uneven rock another obstacle. Finally, at the ridge's peak, you spotted a stag, standing tall against the dawn. Not all victories end with a hunt—some end with quiet admiration.",
    category: 'Fitness',
  },
  {
    id: 'J2LXPQ9VMK7T',
    title: 'The Candlelit Study',
    story:
      "By flickering candlelight, you poured over ancient scripts, your eyes straining to decipher the faded ink. Hours passed, but then—a revelation. A single sentence, overlooked by generations, hinted at a forgotten passage beneath Vaedros's great halls. Knowledge, you realized, is sometimes more powerful than any sword.",
    category: 'Reading',
  },
  {
    id: 'T7NQX9VPK3LM',
    title: 'The Secret Passage',
    story:
      "Beneath the ruined chapel, you discovered a hidden tunnel, its walls lined with ancient inscriptions. Each carving spoke of a different path, a different choice. You traced a hand over the words, sensing the weight of the past pressing against your fingertips. Some knowledge wasn't found—it was remembered.",
    category: 'Reading',
  },
  {
    id: 'LQ9XP7VKM3NT',
    title: 'The Still Pool',
    story:
      'At the heart of the glade, a pool so still it reflected the stars at midday. You knelt at its edge, listening to the wind carry voices too faint to understand. As you breathed in the cool air, the world seemed to hold itself in perfect balance. In that moment, you understood why silence mattered.',
    category: 'Meditation',
  },
  {
    id: 'M7XPQ9VNLK3T',
    title: 'The Forgotten Laughter',
    story:
      'The night began with wary glances and hushed words, but somewhere between shared stories and stolen drinks, the tension melted away. Laughter filled the air, binding strangers together under flickering lantern light. You had come for information, but left with something better—a moment that reminded you what it meant to be human. Not all quests were meant to be won; some were meant to be lived.',
    category: 'Social',
  },
  {
    id: 'Q9XPV7NMLK3T',
    title: 'The Unfinished Manuscript',
    story:
      "In the deepest vault of the scholar's tower, you found a manuscript missing its final page. The last words trailed off mid-sentence, a mystery unsolved. The librarian sighed, shaking his head. 'Perhaps,' he mused, 'some things are meant to be finished by those who come after.'",
    category: 'Learning',
  },
  {
    id: 'K3XL9T7VPQMN',
    title: "The Healer's Meditation",
    story:
      "The old woman handed you a steaming cup of herbal tea and told you to breathe. 'Too much weight on your shoulders, traveler,' she murmured, watching the fire crackle. You closed your eyes, inhaling the earthy scent, and for the first time in days, your thoughts slowed. When you finally spoke, your voice felt clearer, lighter.",
    category: 'Meditation',
  },
  {
    id: 'LXP9Q7NMTV3K',
    title: 'The Stormrunner',
    story:
      "Thunder rumbled overhead as you sprinted through the open plains, rain pelting your skin like needles. Every step drove you forward, muscles screaming but refusing to falter. The storm didn't break you—it forged you, pushing you beyond your limits. When you finally reached shelter, you weren't the same person who had started the run.",
    category: 'Fitness',
  },
  {
    id: 'Q7VPX9NMLK3T',
    title: "The Astronomer's Gift",
    story:
      "An old stargazer invited you to sit beside him atop the temple steps, pointing to the constellations above. 'These stories are older than kingdoms,' he mused, tracing one with his finger. You followed his lead, connecting the stars into shapes that felt both familiar and brand new. Some lessons weren't written in books—they were written across the sky.",
    category: 'Learning',
  },
  {
    id: 'K7XPQ9NMLVT3',
    title: 'The Hidden Library',
    story:
      'Beneath the floorboards of an abandoned study, you discovered a trapdoor. Below, dust-covered books sat untouched by time, their spines glinting under torchlight. You reached for one at random, its title unreadable from age. Whatever knowledge lay within, it had waited centuries for someone like you.',
    category: 'Reading',
  },
  {
    id: 'A8NX7LKQ3VPZ',
    title: 'The Endless Stair',
    story:
      "You found an ancient stairway carved into the cliffs, each step weathered by centuries of wind. With aching legs, you climbed higher and higher, the world shrinking below. At the summit, a lone stone marked the spot where countless others had stood before you. You pressed a hand to its surface, knowing you'd joined a long lineage of those who refused to turn back.",
    category: 'Fitness',
  },
  {
    id: 'Z5KX9NQLV7MP',
    title: "The Scholar's Gamble",
    story:
      "A nervous apprentice dared you to answer a riddle his master had left unsolved. The question twisted your thoughts, each word leading deeper into the puzzle's depths. Then, with a sudden clarity, the answer emerged, simple as sunlight breaking through fog. The apprentice gasped, and from the shadows, the master finally smiled.",
    category: 'Learning',
  },
  {
    id: 'X9P7VQLK3MNT',
    title: 'The Mirror of Stillness',
    story:
      'A placid lake stretched before you, the surface unmoving, mirroring the sky. You sat at the edge, watching your own reflection stare back, patient and expectant. In the silence, your breath slowed, your thoughts softened, and the tension in your chest unwound. When you finally rose, the lake was still—but something in you had shifted.',
    category: 'Meditation',
  },
  {
    id: 'L7XKQ9NVP3MT',
    title: "The Stranger's Cup",
    story:
      'A weary traveler shared his last bottle of wine with you, despite having nothing else to his name. The two of you talked long into the night, trading tales of lost battles and foolish dreams. When dawn arrived, he left without a word, but a single silver coin sat beside the empty bottle. No message, no name—just proof that kindness asked for nothing in return.',
    category: 'Social',
  },
  {
    id: 'Q8NXP7VKL3MT',
    title: "The Librarian's Test",
    story:
      "Deep within the archive, a scholar pointed you to a wall of unmarked tomes. 'Find the truth,' he said, and left you alone among the towering shelves. Hours passed before your fingers traced a spine that hummed with quiet importance. As you opened the book, you realized—some knowledge chooses its seeker.",
    category: 'Reading',
  },
  {
    id: 'P9X7QVK3NMLT',
    title: 'The Shadow Sprint',
    story:
      "A challenge was whispered through the alleys—a race through the darkened streets before the town's bells rang. You ran, dodging barrels and leaping over broken carts, laughter and adrenaline carrying you forward. At the final stretch, you pushed harder, collapsing at the finish just as the bells tolled. Victory was sweet, but the thrill of the run was sweeter.",
    category: 'Fitness',
  },
  {
    id: 'K3X9NVQL7MPT',
    title: "The Elder's Silence",
    story:
      "An old monk sat beneath the temple's ruined archway, eyes closed, hands resting lightly on his knees. You sat beside him, waiting for wisdom, for a parable, for anything—but he only breathed. Minutes passed, then hours, until something within you shifted. When you finally stood to leave, the monk spoke only two words: 'You understand.'",
    category: 'Meditation',
  },
  {
    id: 'L9X7VPQK3NMT',
    title: 'The Market Gambit',
    story:
      "A fast-talking merchant challenged you to a game of dice, promising a reward greater than gold. You played cautiously, watching his every move, reading the flicker in his eyes. On the final roll, luck favored you, and he grinned, pushing a small, wrapped bundle across the table. Inside, a simple wooden token bore the mark of someone important—you just didn't know who.",
    category: 'Social',
  },
  {
    id: 'N7XVP9QK3LMT',
    title: 'The Forgotten Cipher',
    story:
      'A crumbling note led you to the ruins of a watchtower, its stones whispering of long-dead sentries. Carved into the wall was a cipher no one had cracked for a hundred years. With careful thought and a patient mind, the symbols unraveled beneath your fingertips. As the last piece fell into place, you understood—the message had been waiting for you.',
    category: 'Learning',
  },
  {
    id: 'M8X7VPQK9NLT',
    title: 'The Midnight Trail',
    story:
      'A hidden path through the forest revealed itself under the silver glow of the moon. You followed it, stepping carefully, guided only by instinct and the hush of the wind. At its end, an ancient oak bore carvings older than Vaedros itself, marking the journey of those who walked before. You added your own mark—proof that you, too, had made the climb.',
    category: 'Fitness',
  },
  {
    id: 'Q9X7VPMLK3NT',
    title: 'The Book of Whispers',
    story:
      "Buried beneath forgotten scrolls, you found a book with no title. The pages rustled as if they had been waiting, words shifting under your gaze. You traced a line with your finger, and the ink darkened, the letters rearranging to reveal a story you somehow already knew. Some books don't just tell history—they remember it.",
    category: 'Reading',
  },
  {
    id: 'K7X9VPQLM3NT',
    title: 'The Firelit Gathering',
    story:
      'A flickering bonfire welcomed wanderers and outcasts alike, their faces painted in the warm glow. You hesitated at the edge of the circle, but a stranger clapped your back, handing you a drink. The night stretched long, filled with songs and stories, and for once, you felt like you belonged. When the embers faded, so did the strangers—but their laughter stayed with you.',
    category: 'Social',
  },
  {
    id: 'L3X7VPQ9KMNT',
    title: 'The Tower of Echoes',
    story:
      'At the top of a long-abandoned bell tower, you called out into the abyss. The wind carried your voice, stretching it into something both familiar and strange. A second later, your words returned, but they were not your own. Some places, it seemed, did not forget the voices of those who came before.',
    category: 'Meditation',
  },
  {
    id: 'M9X7VPQLK3NT',
    title: "The Master's Puzzle",
    story:
      "A dying craftsman handed you a wooden box, its surface covered in intricate carvings. 'Solve it,' he rasped, closing his eyes for the last time. Days passed as you worked the puzzle, twisting, shifting, listening for its hidden logic. When it finally clicked open, a single note lay inside: 'You were always worthy.'",
    category: 'Learning',
  },
  {
    id: 'X7K9VPQLM3NT',
    title: "The Duelist's Bet",
    story:
      "A masked duelist stood in the town square, offering a prize to any who could best him. You accepted, blades clashing under the watchful eyes of a growing crowd. Though his skill far outmatched yours, he pulled back at the last moment, nodding in approval. 'One day,' he said, sheathing his sword. 'You'll win.'",
    category: 'Fitness',
  },
];
