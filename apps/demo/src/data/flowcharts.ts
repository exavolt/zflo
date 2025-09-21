export const flowchartExamples = [
  {
    name: 'Adventure Story (basic)',
    code: `flowchart TD
    A[Start Your Adventure] --> B{What do you choose?}
    B -->|Explore the cave| C[Dark Cave]
    B -->|Climb the mountain| D[Mountain Peak]
    C --> E[Find treasure!]
    D --> F[Amazing view!]
    E --> G[Victory!]
    F --> G`,
  },
  {
    name: 'A guide to understanding flow charts (XKCD)',
    code: `digraph HowToUnderstandFlowcharts {
    # https://xkcd.com/518/
    label="A guide to understanding flow charts (XKCD)";
    node [shape=box];

    Start [label="START", shape=oval];
    A [label="DO YOU UNDERSTAND\\nFLOW CHARTS?", shape=diamond];
    B [label="OKAY,\\nYOU SEE THE LINE\\nLABELED \\"YES\\"?", shape=diamond];
    C [label="...AND YOU CAN\\nSEE THE ONES\\nLABELED \\"NO\\"?", shape=diamond];
    D [label="BUT YOU\\nJUST FOLLOWED\\nTHEM TWICE!", shape=diamond];
    E [label="BUT YOU\\nSEE THE ONES\\nLABELED \\"NO\\"?", shape=diamond];
    F [label="GOOD"];
    G [label="LET'S GO\\nDRINK."];
    H [label="SCREW IT."];
    I [label="(THAT WASN'T\\nA QUESTION.)"];
    J [label="WAIT,\\nWHAT?"];
    K [label="LISTEN."];
    L [label="I HATE\\nYOU."];
    M [label="HEY, I SHOULD\\nTRY INSTALLING\\nFreeBSD!"];

    Start -> A;
    A -> F [label="YES"];
    A -> B [label="NO"];
    B -> C [label="YES"];
    B -> E [label="NO"];
    C -> F [label="YES"];
    C -> D [label="NO"];
    D -> I [label="YES"];
    D -> H [label="NO"];
    E -> J [label="YES"];
    E -> K [label="NO"];
    F -> G;
    G -> M [label="6 DRINKS"];
    H -> G;
    I -> H;
    J -> B;
    K -> L;
}
`,
  },
  {
    name: 'How to play Pictionary (thedoghousediaries.com)',
    code: `digraph HowToPlayPictionary {
    # http://www.thedoghousediaries.com/2659
    label="How to play Pictionary";
    node [shape=box];
    
    A [label="DRAW A PICTURE"];
    B [label="DID THEY GUESS IT?", shape=diamond];
    C [label="POINT REPEATEDLY\\nTO THE SAME PICTURE"];
    D [label="You Win.", shape=oval];
    
    A -> B;
    B -> D [label="Yes", color=black];
    B -> C [label="No", color=black];
    C -> B;
    }`,
  },
  {
    name: 'PlantUML Adventure',
    code: `@startuml
title Adventure Story
start
:Welcome to the mystical forest;
if (Choose your path?) then (left)
  :Take the left path through the dark woods;
  :Encounter a friendly wizard;
  :Receive a magical sword;
else (right)
  :Take the right path to the mountain;
  :Find an ancient treasure chest;
  :Discover gold coins;
endif
:Continue your journey;
:Reach the castle;
stop
@enduml`,
  },
  {
    name: 'PlantUML Troubleshooting',
    code: `@startuml
title Device Troubleshooting
start
:Device not working;
if (Is it plugged in?) then (no)
  :Plug in the device;
  :Try again;
else (yes)
  if (Is the power button on?) then (no)
    :Press the power button;
  else (yes)
    :Check for error messages;
    if (Any error messages?) then (yes)
      :Look up error code;
      :Follow error instructions;
    else (no)
      :Contact technical support;
    endif
  endif
endif
:Problem resolved;
stop
@enduml`,
  },
];
