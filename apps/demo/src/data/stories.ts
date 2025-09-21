import { ZFFlow } from '@zflo/core';

export interface Story {
  id: string;
  title: string;
  description: string;
  category: 'adventure' | 'mystery' | 'sci-fi' | 'fantasy';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  flowchart: ZFFlow;
  mermaidCode?: string;
}

// Dragon Quest Adventure with State Management
const dragonQuestStory: ZFFlow = {
  id: 'dragon-quest',
  title: 'Dragon Quest Adventure',
  description:
    'A classic fantasy adventure with inventory management, combat, and multiple paths to victory.',
  startNodeId: 'start',
  expressionLanguage: 'cel',
  globalState: {
    inventory: [],
    gold: 50,
    health: 100,
  },
  nodes: [
    {
      id: 'start',
      title: 'The Village',
      content:
        'You are a brave adventurer in the village of Millbrook. A terrible dragon has been terrorizing the countryside. Will you take on this quest?',
      outlets: [
        { id: 'start-accept', to: 'accept-quest', label: 'Accept the quest' },
        { id: 'start-decline', to: 'retreat', label: 'Decline the quest' },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'accept-quest',
      title: 'Quest Accepted',
      content:
        'The village elder gives you a map and some supplies. You now have a sword and a healing potion in your inventory.',
      actions: [
        {
          type: 'set',
          target: 'inventory',
          expression:
            '"sword" in inventory ? inventory : inventory + ["sword"]',
        },
        {
          type: 'set',
          target: 'inventory',
          expression:
            '"healing_potion" in inventory ? inventory : inventory + ["healing_potion"]',
        },
      ],
      outlets: [{ id: 'accept-forest', to: 'forest-path' }],
      isAutoAdvance: false,
    },
    {
      id: 'forest-path',
      title: 'The Dark Forest',
      content:
        'You enter the dark forest. The path splits in two directions. Which way do you go?',
      outlets: [
        { id: 'forest-left', to: 'left-path', label: 'Take the left path' },
        { id: 'forest-right', to: 'right-path', label: 'Take the right path' },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'left-path',
      title: 'The Merchant',
      content:
        'You meet a traveling merchant who offers to sell you a magic shield for 30 gold.',
      outlets: [
        {
          id: 'merchant-buy',
          to: 'buy-shield',
          label: 'Consider buying the shield',
        },
        {
          id: 'merchant-skip',
          to: 'dragon-lair',
          label: 'Continue without buying',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'buy-shield',
      title: 'Purchase Decision',
      outlets: [
        {
          id: 'can-buy',
          to: 'shield-bought',
          label: 'Buy the shield',
          condition: 'gold >= 30',
        },
        { id: 'cannot-buy', to: 'dragon-lair', label: 'Cannot afford it' },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'shield-bought',
      title: 'Shield Acquired',
      content:
        'You purchase the magic shield. It gleams with protective enchantments.',
      actions: [
        {
          type: 'set',
          target: 'inventory',
          expression:
            '"magic_shield" in inventory ? inventory : inventory + ["magic_shield"]',
        },
        { type: 'set', target: 'gold', expression: 'gold - 30' },
      ],
      outlets: [{ id: 'shield-to-dragon', to: 'dragon-lair' }],
      isAutoAdvance: false,
    },
    {
      id: 'right-path',
      title: 'Ancient Ruins',
      content:
        'You discover ancient ruins with mysterious symbols. There might be treasure here.',
      outlets: [
        { id: 'ruins-search', to: 'find-key', label: 'Search the ruins' },
        {
          id: 'ruins-skip',
          to: 'dragon-lair',
          label: 'Continue to dragon lair',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'find-key',
      title: 'Ancient Key',
      content:
        'You find an ancient key that pulses with magical energy. This might be useful against the dragon.',
      actions: [
        {
          type: 'set',
          target: 'inventory',
          expression:
            '"ancient_key" in inventory ? inventory : inventory + ["ancient_key"]',
        },
      ],
      outlets: [{ id: 'key-to-dragon', to: 'dragon-lair' }],
      isAutoAdvance: false,
    },
    {
      id: 'dragon-lair',
      title: "The Dragon's Lair",
      content:
        "You arrive at the dragon's lair. The massive beast awakens and prepares to fight. Your equipment will determine your fate.",
      outlets: [
        {
          id: 'well-equipped',
          to: 'epic-battle',
          label: 'Fight with superior equipment',
          condition:
            '"magic_shield" in inventory || "ancient_key" in inventory',
        },
        {
          id: 'basic-fight',
          to: 'tough-battle',
          label: 'Fight with basic equipment',
          condition: '"sword" in inventory',
        },
        {
          id: 'no-weapon',
          to: 'retreat',
          label: 'Retreat without proper equipment',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'epic-battle',
      title: 'Epic Battle',
      content:
        'With your sword, shield, and ancient key, you engage in an epic battle with the dragon. Your preparation pays off!',
      outlets: [{ id: 'epic-victory', to: 'victory' }],
      isAutoAdvance: false,
    },
    {
      id: 'tough-battle',
      title: 'Tough Battle',
      content:
        'With only your sword, the battle is difficult but you manage to defeat the dragon through determination and skill.',
      outlets: [{ id: 'tough-victory', to: 'victory' }],
      isAutoAdvance: false,
    },
    {
      id: 'victory',
      title: 'Victory!',
      content:
        'You have defeated the dragon and saved the village! The grateful villagers reward you with gold and honor. You are now a legendary hero!',
      isAutoAdvance: false,
    },
    {
      id: 'retreat',
      title: 'Strategic Retreat',
      content:
        'Without proper equipment, you decide to retreat and prepare better for the battle. Sometimes wisdom is the better part of valor.',
      isAutoAdvance: false,
    },
  ],
};

// Mystery Manor Adventure
const mysteryManorStory: ZFFlow = {
  id: 'mystery-manor',
  title: 'Mystery at Ravenshollow Manor',
  description: 'A detective mystery with clues to gather and puzzles to solve.',
  startNodeId: 'arrival',
  expressionLanguage: 'cel',
  globalState: {
    clues: [],
    suspicion: 0,
    hasKey: false,
  },
  nodes: [
    {
      id: 'arrival',
      title: 'Arrival at the Manor',
      content:
        'You arrive at the imposing Ravenshollow Manor as a detective investigating the mysterious disappearance of Lord Ravenshollow.',
      outlets: [
        { id: 'enter-manor', to: 'entrance-hall', label: 'Enter the manor' },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'entrance-hall',
      title: 'The Grand Entrance',
      content:
        "The entrance hall is dimly lit with portraits watching from the walls. You notice three doors: library, study, and servants' quarters.",
      outlets: [
        { id: 'to-library', to: 'library', label: 'Investigate the library' },
        { id: 'to-study', to: 'study', label: 'Check the study' },
        {
          id: 'to-servants',
          to: 'servants-quarters',
          label: "Visit servants' quarters",
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'library',
      title: 'The Library',
      content:
        'Among the dusty books, you find a diary with strange entries about "midnight meetings" and "the secret beneath".',
      actions: [
        {
          type: 'set',
          target: 'clues',
          expression: '"diary" in clues ? clues : clues + ["diary"]',
        },
      ],
      outlets: [
        {
          id: 'library-back',
          to: 'entrance-hall',
          label: 'Return to entrance hall',
        },
        {
          id: 'library-secret',
          to: 'secret-passage',
          label: 'Look for secret passages',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'study',
      title: "Lord Ravenshollow's Study",
      content:
        'The study is in disarray. You find a torn letter mentioning a "betrayal" and notice the safe is open and empty.',
      actions: [
        {
          type: 'set',
          target: 'clues',
          expression:
            '"torn_letter" in clues ? clues : clues + ["torn_letter"]',
        },
        { type: 'set', target: 'suspicion', expression: 'suspicion + 1' },
      ],
      outlets: [
        {
          id: 'study-back',
          to: 'entrance-hall',
          label: 'Return to entrance hall',
        },
        {
          id: 'study-investigate',
          to: 'investigate-safe',
          label: 'Examine the safe more closely',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'servants-quarters',
      title: "Servants' Quarters",
      content:
        'You speak with the nervous butler who mentions seeing "strange lights" in the cellar at night.',
      actions: [
        {
          type: 'set',
          target: 'clues',
          expression:
            '"butler_testimony" in clues ? clues : clues + ["butler_testimony"]',
        },
      ],
      outlets: [
        {
          id: 'servants-back',
          to: 'entrance-hall',
          label: 'Return to entrance hall',
        },
        {
          id: 'servants-cellar',
          to: 'cellar',
          label: 'Investigate the cellar',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'secret-passage',
      title: 'Hidden Passage',
      content:
        'Behind a bookshelf, you discover a hidden passage leading to an underground chamber.',
      outlets: [{ id: 'passage-chamber', to: 'underground-chamber' }],
      isAutoAdvance: false,
    },
    {
      id: 'investigate-safe',
      title: 'The Empty Safe',
      content:
        'Inside the safe, you find a hidden compartment containing a brass key and a note: "The truth lies beneath".',
      actions: [
        { type: 'set', target: 'hasKey', value: true },
        {
          type: 'set',
          target: 'clues',
          expression: '"brass_key" in clues ? clues : clues + ["brass_key"]',
        },
      ],
      outlets: [{ id: 'safe-back', to: 'study', label: 'Return to study' }],
      isAutoAdvance: false,
    },
    {
      id: 'cellar',
      title: 'The Manor Cellar',
      content:
        'The cellar is dark and musty. You notice a locked door that seems to lead to something important.',
      outlets: [
        {
          id: 'unlock-door',
          to: 'underground-chamber',
          label: 'Unlock the door',
          condition: 'hasKey',
        },
        {
          id: 'cellar-locked',
          to: 'entrance-hall',
          label: 'Return upstairs (door is locked)',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'underground-chamber',
      title: 'The Truth Revealed',
      content:
        'In the underground chamber, you discover Lord Ravenshollow, alive but imprisoned! The mystery deepens.',
      outlets: [
        {
          id: 'solve-mystery',
          to: 'mystery-solved',
          label: 'Solve the mystery with evidence',
          condition: 'size(clues) >= 3',
        },
        {
          id: 'incomplete-evidence',
          to: 'partial-solution',
          label: 'Confront with incomplete evidence',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'mystery-solved',
      title: 'Mystery Solved',
      content:
        'With all the clues gathered, you expose the butler as the culprit who imprisoned Lord Ravenshollow to steal his fortune. Justice is served!',
      isAutoAdvance: false,
    },
    {
      id: 'partial-solution',
      title: 'Partial Success',
      content:
        'You rescue Lord Ravenshollow, but without enough evidence, the true culprit escapes. The case remains partially unsolved.',
      isAutoAdvance: false,
    },
  ],
};

// Enchanted Forest Adventure
const enchantedForestStory: ZFFlow = {
  id: 'enchanted-forest',
  title: 'The Enchanted Forest',
  description:
    'A magical adventure through an enchanted forest with mystical creatures and hidden treasures.',
  startNodeId: 'lost',
  expressionLanguage: 'cel',
  globalState: {
    hasMap: false,
    foundTreasure: false,
  },
  nodes: [
    {
      id: 'lost',
      title: 'Lost in the Forest',
      content:
        'You find yourself lost in a mysterious enchanted forest. The trees seem to whisper secrets, and magical creatures dart between the shadows.',
      outlets: [{ id: 'lost-choice', to: 'path-choice' }],
      isAutoAdvance: false,
    },
    {
      id: 'path-choice',
      title: 'Choose Your Path',
      content:
        'You see two paths ahead. One leads deeper into the forest where you hear beautiful singing. The other leads toward a clearing with bright sunlight.',
      outlets: [
        {
          id: 'choice-singing',
          to: 'singing-path',
          label: 'Follow the singing',
        },
        {
          id: 'choice-sunny',
          to: 'sunny-path',
          label: 'Go to the sunny clearing',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'singing-path',
      title: 'The Fairy Glade',
      content:
        'Following the singing, you discover a glade filled with friendly fairies. They offer you a magical map that will help you navigate the forest.',
      actions: [{ type: 'set', target: 'hasMap', value: true }],
      outlets: [{ id: 'singing-exit', to: 'forest-exit' }],
      isAutoAdvance: false,
    },
    {
      id: 'sunny-path',
      title: 'The Sunny Clearing',
      content:
        'You reach a beautiful clearing bathed in golden sunlight. In the center, you spot something glinting in the grass.',
      outlets: [
        {
          id: 'sunny-treasure',
          to: 'treasure-found',
          label: 'Investigate the glinting object',
        },
        {
          id: 'sunny-exit',
          to: 'forest-exit',
          label: 'Continue looking for an exit',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'treasure-found',
      title: 'Hidden Treasure',
      content:
        "You've found a small chest filled with magical gems! This treasure will be valuable in the outside world.",
      actions: [{ type: 'set', target: 'foundTreasure', value: true }],
      outlets: [{ id: 'treasure-exit-edge', to: 'forest-exit' }],
      isAutoAdvance: false,
    },
    {
      id: 'forest-exit',
      title: 'Finding the Way Out',
      content:
        'You search for a way out of the enchanted forest. Your choices and discoveries will determine how easily you escape.',
      outlets: [
        {
          id: 'treasure-exit-condition',
          to: 'treasure-exit',
          label: 'Go to Wealthy Adventure',
          condition: 'foundTreasure',
        },
        {
          id: 'easy-exit',
          to: 'guided-exit',
          label: 'Go to Guided Home',
          condition: 'hasMap',
        },
        {
          id: 'hard-exit',
          to: 'difficult-exit',
          label: 'Go to Eventually Home',
        },
      ],
      isAutoAdvance: false,
    },
    {
      id: 'guided-exit',
      title: 'Guided Home',
      content:
        'Thanks to the fairy map, you easily find your way out of the forest. The magical experience will stay with you forever.',
      isAutoAdvance: false,
    },
    {
      id: 'treasure-exit',
      title: 'Wealthy Adventure',
      content:
        'You manage to find your way out of the forest, and the treasure you found makes you wealthy! What an incredible adventure!',
      isAutoAdvance: false,
    },
    {
      id: 'difficult-exit',
      title: 'Eventually Home',
      content:
        'Without a map, it takes you much longer to find your way out, but you eventually make it home safely. The forest will always hold its mysteries.',
      isAutoAdvance: false,
    },
  ],
};

export const adventureStories: Story[] = [
  {
    id: 'enchanted-forest',
    title: 'The Enchanted Forest',
    description:
      'A magical adventure through an enchanted forest with mystical creatures and hidden treasures.',
    category: 'fantasy',
    difficulty: 'beginner',
    flowchart: enchantedForestStory,
  },
  {
    id: 'dragon-quest',
    title: 'Dragon Quest Adventure',
    description:
      'A classic fantasy adventure with inventory management, combat, and multiple paths to victory.',
    category: 'fantasy',
    difficulty: 'intermediate',
    flowchart: dragonQuestStory,
  },
  {
    id: 'mystery-manor',
    title: 'Mystery at Ravenshollow Manor',
    description:
      'A detective mystery with clues to gather and puzzles to solve.',
    category: 'mystery',
    difficulty: 'advanced',
    flowchart: mysteryManorStory,
  },
];
