This is FoundryVTT module for foundry VTT version 12.

This implements the Fight system for the Burning Wheel Role Playing Game.  It is implemented in javascript.

The way this works:
1)  Using the built in Toggle Combat state button, one or more actors can be added to a foundry combat encounter.
2) At the top of the Combat Encounters side panel, there is a new button called Fight!
3) When Fight! is pressed, a new dialog is shown.
4) On the Fight Dialog, it shows each actor in the current combat with their name an portrait.  
5) The dialog is divided into Fighting Groups, and each actor can be added to a fight group.
6) in each fight group, it shows the actor who had Advantage (and a drop down box to change it) and the current disadvantage penalty, which is a selectable number from 1-10 that is displayed as:  +<number>Ob
7) Each fight group subsection has 3 columns, one for each volley. This makes a grid with each row corresponding to an actor.  the name/portrait is the first column, then the 3 volleys are the next columns


This module should integrate with the following custom modules located at: ~/projects/foundry/bw-dice-pool and ~/projects/foundry/bw-character-sheet
