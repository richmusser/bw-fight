This is FoundryVTT module for foundry VTT version 12.

## How to create a release in github so Foundry will see it
1.  Modify module.json to bump the value for version by one and the version number in the zip file in the download link.  Bump the patch version by 1 if a small change, bump the minor version is a larger functional change. 
2.  Commit the changes and push to github.
3.  Use the github command line ('gh') to create a new release with the new version number.  Include the changes in the notes for the change.

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


## The complete list of actions are:

* Strike
Description:
*Test:* Strike tests your weapon, Brawling or Boxing skill.
<br>
*Effect:* Successes over the obstacle or margin of success in versus tests
are used to increase damage and target a specific location. See the
Weapons chapter for instructions on doing damage. You can only
Strike consecutively a number of times equal to your weapon speed.
If you’re alternating between different weapons, use the lower
weapon speed.


* Great Strike
(2 actions)
*Test:* Great Strike tests your weapon, Brawling or Boxing skill.

*Restrictions:* Great Strike costs two actions to perform. On the first
action, you take a breath to set up your attack. You are effectively
defenseless on this action; you count as performing a Physical
Action. Also, while any weapon can perform a Great Strike, you
must be able to put two hands on the weapon to do so. A Great
Strike counts as one action against your weapon speed limitation.

*Effect:* A Great Strike, is a lunging thrust, an overhand strike or a
half-sword technique. On the second action, Great Strike acts like
a Strike but with two exceptions: It bypasses the Block action (but
not shields) and it grants a bonus to damage or armor penetration.
Choose before you roll: +1 to your Incidental, Mark and Superb
damage results or +1 to your weapon’s versus armor rating.

* Block and Strike
*Restrictions:* Block and Strike is a special action reserved for characters
with Shield Training who are fighting with a shield or parrying
blade, or with Two-Fisted Fighting Training and two weapons.

*Test:* Block and Strike tests the character’s weapon skill. Divide your
dice into two pools before rolling—one for defense, one for attack.
Add any shield dice to the defense portion, less the versus armor
rating of your opponent’s weapon.

*Effect:* Successes from the Block portion reduce the successes of your
opponent’s action. The Strike dice act like a Strike action. Apply
penalties from wounds, light, weather and knock down to both
parts of the actions. Any advantages are only applied to one side.
You don’t have to allocate any skill dice to defense, you can rely
solely on your shield to protect you. Disadvantage from weapon
length or vying for position only applies to the Strike portion.
Interactions: Block and Strike counts as Block and a Strike for the
purposes of interactions. Test your divided pool against the possible
interactions for both of those actions. Against Counterstrike, both
characters defend and both attack according to their action.


* Lock and Strike
*Restrictions:* This action requires a special trait like Crushing Jaws.

*Test:* Savage Attack.

*Effect:* Successes over the obstacle count as damage as per the
standard IMS damage rules and as a Lock as per the Lock action.



* Avoid
*Test:* Avoid tests your Speed.

*Effect:* Successes from the Avoid action reduce the effectiveness of
the opposing action. If you roll one success on an Avoid, and your
opponent rolls two, you’ve reduced his effective total to one. If you
roll two and he rolls two, you have stopped his action altogether.

*Special:* Avoid defends against all incoming attack, basic and special
actions. Test once; let Avoid successes ride for the action. Avoid is
special: it never suffers a double-obstacle penalty for being unskilled.
It does not protect against Shooting, Throwing or Magical Actions.

* Block
*Test:* Block tests your weapon, Brawling or Boxing skill plus shield or
off-hand weapon dice.

*Effect:* Block deflects and redirects the incoming attack. Like Avoid,
your successes reduce the effectiveness of the opposed action. Each
Block success reduces your opponent’s total. If you roll successes
equal to your opponent, you’ve stopped his action completely.
Spend your margin of success as follows:
• One extra success: +1D to your next action or, to vying for position (
if Block is your last action of the exchange).
• Two extra successes: +1 Ob to the blocked character’s next action.
• Three extra successes: Blocked character loses his next action. He
hesitates, but may only Stand and Drool as a result.
Note: These effects can only be generated through the use of the
Block action. Counterstrike, Change Stance and the Block & Strike
actions do not gain these extra effects.

* Counterstrike
*Test:* Counterstrike tests your weapon, Brawling or Boxing skill. After
actions are revealed, but before your opponent rolls, divide your
fighting skill and any advantages into two pools—one for defense
and one for attack.

*Effect:* In versus tests, use the defensive portion to oppose your
opponent’s action. Successes from your defense reduce his successes.
The attack portion counts as a Strike action. However, the Strike
portion of Counterstrike doesn’t suffer disadvantages from weapon
length or vying for position.

* Assess
Assessing allows a player to look for specific details—easy exits,
the sources of that burning smell and unarmored locations on his
opponent.

*Test:* An assess nets the character a Perception test in search of what
he described in his intent and task.

*Special:* An assess takes one action. This is a quick, over the shoulder
glance. Additional actions may be spent on an assess in order to
gain advantage dice to the Perception test—+1D for a second action
and +2D for a third.

* Change Stance
*Test:* It does not require a test to change stances. There are three
fighting stances: neutral, defensive and aggressive. Decide which
stance you’re changing to when you select this action.
Neutral Stance: Neutral stance is the default. You start a fight in neutral
stance unless otherwise noted. It grants no advantage and suffers no
disadvantages. The Change Stance: Neutral action counts as a Feint.
Defensive stance: Defensive stance grants +2D to Avoid, Block and
Counterstrike. Strike and Great Strike suffer a +2 Ob penalty when
performed from defensive stance. The Change Stance: Defensive
action counts as a Block.
Aggressive stance: Aggressive stance grants +2D to Strike and Great
Strike. Block and Counterstrike suffer +2 Ob penalty. You may not
Avoid. If you accidently script Avoid while in aggressive stance,
you hesitate for an action. The Change Stance: Aggressive action
counts as the first action of Intimidate (found in the Social Actions
section). If you wish to complete the action, script one more action
of Intimidate. See Social Actions for rules on Intimidate.

*Special:* Instead of using the stance dice as a bonus to actions in the
script, a player may use his +2D bonus to aid in vying for position.
bviously, this must be declared at the top of the exchange. Stance
dice used to position cannot then be used as a bonus to actions, but
all other action/stance penalties apply.

*Restrictions:* You keep your stance until you change stance, disengage,
are incapacitated, hesitate or use the Charge/Tackle action. Any of
these conditions automatically drops the character back to neutral
stance. You may be Locked (but not incapacitated), on top of your
opponent, on your back, riding a horse or unskilled and still take
a stance.

* Charge/Tackle
*Test:* Charge/Tackle tests your Power with a +1D advantage plus stride
advantage. Charge/Tackle must be your first action in the volley.

*Effect:* When performing this action, choose whether you’re charging
your opponent or tackling him. If you charge, you attempt to knock
him down but you remain on your feet yourself. If you tackle, you
take your opponent down with you. If you win the versus test by
one or meet your obstacle in a standard test, you stagger your
opponent. He’s at +1 Ob to his next test, whatever it may be. If you
win the versus test by two or exceed your obstacle in the standard
test, you knock your opponent down. He is off his feet and suffers
the appropriate penalties until he rights himself.
Charge: If you successfully charge, you also take the advantage for
your hands or for whatever weapon you’re holding except spears
and missiles—your choice.

Tackle: If you tackle your opponent, you take the advantage at the
Hands fighting distance. If you successfully tackle your opponent,
he may not use the Shooting and Throwing or Magic actions. There
is one exception: He may discharge a pistol at this range.

*Restrictions:* Your stance reverts to neutral stance if you Charge/
Tackle. If you fail this action, you give your opponent the advantage
and you Stand and Drool for your next action.

*Special:* When you use this action you change weapons to your hands,
unless you’re charging specifically with a shield, which uses the
short weapon length.

* Draw Weapon
*Action Cost:* Two actions are required to unsheathe/unsling a handheld
weapon. This includes sheathed swords, throwing knives, slung
crossbows, etc. Readying a weapon before a fight—on a strap or in
an off hand—decreases draw time to one action. Counts as Physical
Action for action interaction.

* Physical Action
*Test:* Physical actions typically use Power (to rip something open),
Agility (to grab something) or Speed (to vault something).

*Action Cost:* Physical acts eat up two actions.

*Effect:* This category of actions covers everything from overturning
tables to opening doors and climbing through windows.

* Push
*Test:* Push tests Power. Push uses the Hands weapon length.

*Effect:* If you win the versus test by one or meet your obstacle in a
standard test, you stagger your opponent: He’s at +1 Ob to his next
test, whatever it may be. If you win the versus test by two or exceed
your obstacle in a standard test, you stagger your opponent and
take the advantage so long as your weapon length is long or shorter.
If you win the versus test by three or exceed your obstacle by two in
a standard test, you knock your opponent down. He is off his feet
and suffers the appropriate penalties until he rights himself.

*Special:* When you use this action you change weapons to your hands,
unless you’re using a shield which uses the short weapon length.

* Lock
*Test:* Lock tests Power. Lock uses the Hands weapon length.

*Effect:* If you win the versus test by one or meet your obstacle in
a standard test, you grab your opponent: His Agility, Speed,
Power and Forte and his fighting, shooting and magical skills 
re all reduced by one die. Each additional success reduces your
opponent’s abilities by another point. (Reflexes is not reduced.)
Pulled In: If you manage to grab your opponent with a Lock, you pull
him in. You have the advantage at the Hands fighting distance.

In Your Face: If you successfully Lock your opponent, he may not use
the Shooting and Throwing or Magic Actions with one exception:
He may shoot if he’s using a pistol.
Increase the Pressure: You can script multiple Lock actions and
increase the value of your Lock on your opponent. You maintain
your grip so long as your opponent fails to escape, you don’t hesitate
or voluntarily let go. Each additional successful Lock test further
reduces your opponent’s abilities by your margin of success.

Incapacitation: If you reduce your opponent’s Agility, Speed, Power
or Forte to zero dice, he is incapacitated. He may not resist or act
in any fashion until you release him. Skills cannot be used at all.

Escaping Locks: If you’re in a Lock and wish to escape, use the Avoid
action but replace Speed with Agility, Power or Forte (your choice).
If scripted against a Dash interaction, test Avoid against Ob 0,
otherwise use the results of the versus test. Margin of success for the
action reduces any standing Lock penalty. The dice are regained
and may be used on the next action.

*Special:* When you use this action you change weapons to your hands.
Restriction: You must have at least one hand free to perform this
action. If you do not, you drop one item that you’re holding as you
go for the grab. You cannot vie for position, engage or disengage
until you’ve broken or let go of any locks.

* Get Up
Characters are always getting knocked down. It requires two actions
to get up from being laid flat. See the Knocked Down rules later in
this chapter.

* Beat
*Test:* Beat tests your weapon skill.
*Effect:* If you meet the obstacle or win the versus test, you steal the
advantage from your opponent. He now suffers the appropriate
disadvantage according to your weapons and you gain an advantage
to the positioning test at the start of the next exchange (provided
you maintain advantage). If you already have the advantage, you
can give your opponent a +1 Ob penalty to his next action or you
can take +1D to your next action. You choose.

*Special:* Gain a +1D advantage to the Beat test if you’re using two
hands on your weapon. You cannot hold anything in your off hand!

* Disarm
Tests: Weapon or Boxing skill.
*Effect:* Disarm is a difficult action to pull off, but if successful its
results are spectacular. If successful, you knock your opponent’s
weapon away. A successful Disarm also grants you the advantage
for your weapon.

*Special Versus Test Rules:* In order to Disarm someone in a versus test,
you must win by a margin of success equal to his weapon skill—
except in the case of Disarm vs Feint. Hence the + sign in the
interactions tables for Disarm.

* Feint
Tests: Weapon or Boxing skill.
*Effect:* Feint is a special attack designed to defeat defenses. Feint does
damage like a Strike. See the Weapons chapter for the damage rules.

* Throw Person
Tests: Boxing skill.
*Effect:* If you win the versus test by one or meet your obstacle in a
standard test, you successfully throw your opponent off his feet and
he suffers the appropriate penalties until he rights himself. You can
choose how to spend additional successes: 

One additional success
can be spent to do an Incidental bare-fisted hit or cause a Steel test.

Two additional successes can be spent to cause a Mark hit or an
Incidental and a Steel test. Four additional successes can be spent
to deliver a Superb hit.
*Restrictions:* You must have a hand free to perform this action. If you
do not, you drop your weapon as you go for the grab.

* Throw Object
Action cost: It costs two actions to throw a weapon like a knife or stone.
Throw Object/Weapon
*Test:* Test Throwing skill. It’s an Ob 2 test to hit plus disadvantages
from vying for position, weather and light.
*Restrictions:* Once you throw, you cede advantage to your target.

* Aim
*Special:* A player may spend actions aiming a loaded and ready
weapon—a knife in the hand, nocked and drawn bow, a loaded
gun, etc. Each action spent gives a +1D advantage. Characters may
aim for as many actions as half their Perception exponent rounded
up. When aiming with a crossbow, gun or thrown weapon, script
your Aim actions first, then script your Throw or Fire actions.
When aiming a bow, put your Aim actions after your Nock and
Draw actions, before you script Release.

* Nock & Draw Bow
*Effect:* This extended action readies your bow to shoot. Each type of
bow has a different load time: Hunting bow, 5 actions; Elven bow, 5
actions; Great bow, 7 actions. To hit your target, script the Release
action after Nock and Draw.

*Special:* You can prep a bow and keep it ready by spending three
actions to nock the arrow. Then when you want to get down to
business, you can pay the remainder of the Nock and Draw action
to finish readying it. “Always keep an arrow nocked” is a good
Instinct.

* Reload Crossbow
*Special:* Crossbows and pistols require 16 actions to draw and load.
Heavy crossbows and muskets require 32 actions.

* Fire Crossbow
Action cost: It costs two actions to fire a gun or crossbow in combat.
*Test:* Firearms or Crossbow skill as appropriate. It’s an Ob 2 test to
hit with a gun (plus disadvantages for vying for position, light and
weather).

*Restrictions:* Once you fire, you cede advantage to your target.

*  Release Bow
Action cost: One action is required to release an arrow from your bow.

*Test:* Bow skill against Ob 1 plus disadvantages for vying for position,
wounds and other appropriate conditions.

*Restrictions:* Once your arrow is released you cede advantage to your target.

* Snapshot
You can use a snapshot with a bow, crossbow, gun or thrown weapon.

*Effect:* For a crossbow, gun or thrown weapon, a snapshot costs one
action. For a bow of any type, a snapshot reduces your draw and
nock time by one action. It allows you to release one action sooner.

*Test:* Snapshot is a base Ob 4 test for the Bow, Crossbow, Firearms,
or Throwing skill.

Restriction: You may not aim a Snapshot, and once you snap that shot
off, you cede advantage to your opponent.

* Cast Spell
*Special:* Spells take a number of actions to perform. Spell actions must
be performed continuously and without interruption (otherwise
bad things happen). Spells have weapon lengths. See the Sorcery
chapter for details. Spell casting suffers from weapon length and
vying for position disadvantage penalties at the time of its release.
If you have the advantage, there’s no worry. If you’ve lost (or never
gained) the advantage, apply the appropriate obstacle penalties.

*Test:* Sorcery or appropriate spell-casting skill after the sorcerer has
spent the prerequisite actions casting the spell.

*Effect:* Spells have effects listed in their individual descriptions.

* Drop Spell
*Special:* If a caster no longer wishes to concentrate on a spell being
sustained, it costs one action to drop it.

* Command Spirit
A summoner may command a spirit using Spirit Binding during
a fight. It only costs one action, but it’s very risky. These rules are
described in detail in the Burning Wheel Codex.

* Command
*Action Cost:* Commanding another character to get back into the fight
costs two actions.
*Effect:* Command can help reduce hesitation. See the Command skill
description for the rules.

* Intimidate
*Action Cost:* Using the Intimidation skill on another character in a
melee costs two actions.

*Test:* Intimidation Ob = Will.

*Effect:* If successful, target must test Steel. Your target hesitates for
one action per point of margin of failure.


* Stand and Drool
The character is stunned. He does nothing while hesitating.

* Fall Prone
The character falls to his knees or stomach and pleads for his life in
the name of compassion, honor, mercy or the gods.

* Run Screaming
The character drops what he is holding, turns about and bolts for the
exit. If the hesitation crosses the top of the exchange, the player must
choose to disengage. He does not have access to weapon length dice.


* Swoon
The character passes out. He’s out of the fight. If appropriate, he
appears dead! He cannot be acted against unless another character
pays special attention to him—to finish him, slit his throat, check his
pulse or whatever.

* No Action