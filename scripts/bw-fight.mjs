const SOCKET_NAME = "module.bw-fight";
const FLAG_SCOPE = "bw-fight";
const FLAG_GROUPS = "groups";
const FLAG_REVEALED = "revealed";
const FLAG_READY = "ready";
const FLAG_SCRIPTED = "scripted";

const ACTIONS = [
  { name: "Strike",
    description: "**Test:** Strike tests your weapon, Brawling or Boxing skill.\n\n**Effect:** Successes over the obstacle or margin of success in versus tests are used to increase damage and target a specific location. See the Weapons chapter for instructions on doing damage. You can only Strike consecutively a number of times equal to your weapon speed. If you're alternating between different weapons, use the lower weapon speed." },
  { name: "Great Strike", subtext: "2 actions",
    description: "**Test:** Great Strike tests your weapon, Brawling or Boxing skill.\n\n**Restrictions:** Great Strike costs two actions to perform. On the first action, you take a breath to set up your attack. You are effectively defenseless on this action; you count as performing a Physical Action. Also, while any weapon can perform a Great Strike, you must be able to put two hands on the weapon to do so. A Great Strike counts as one action against your weapon speed limitation.\n\n**Effect:** A Great Strike is a lunging thrust, an overhand strike or a half-sword technique. On the second action, Great Strike acts like a Strike but with two exceptions: It bypasses the Block action (but not shields) and it grants a bonus to damage or armor penetration. Choose before you roll: +1 to your Incidental, Mark and Superb damage results or +1 to your weapon's versus armor rating." },
  { name: "Block and Strike",
    description: "**Restrictions:** Block and Strike is a special action reserved for characters with Shield Training who are fighting with a shield or parrying blade, or with Two-Fisted Fighting Training and two weapons.\n\n**Test:** Block and Strike tests the character's weapon skill. Divide your dice into two pools before rolling\u2014one for defense, one for attack. Add any shield dice to the defense portion, less the versus armor rating of your opponent's weapon.\n\n**Effect:** Successes from the Block portion reduce the successes of your opponent's action. The Strike dice act like a Strike action. Apply penalties from wounds, light, weather and knock down to both parts of the actions. Any advantages are only applied to one side. You don't have to allocate any skill dice to defense, you can rely solely on your shield to protect you. Disadvantage from weapon length or vying for position only applies to the Strike portion. Block and Strike counts as Block and a Strike for the purposes of interactions." },
  { name: "Lock and Strike",
    description: "**Restrictions:** This action requires a special trait like Crushing Jaws.\n\n**Test:** Savage Attack.\n\n**Effect:** Successes over the obstacle count as damage as per the standard IMS damage rules and as a Lock as per the Lock action." },
  { name: "Avoid",
    description: "**Test:** Avoid tests your Speed.\n\n**Effect:** Successes from the Avoid action reduce the effectiveness of the opposing action. If you roll one success on an Avoid, and your opponent rolls two, you've reduced his effective total to one. If you roll two and he rolls two, you have stopped his action altogether.\n\n**Special:** Avoid defends against all incoming attack, basic and special actions. Test once; let Avoid successes ride for the action. Avoid is special: it never suffers a double-obstacle penalty for being unskilled. It does not protect against Shooting, Throwing or Magical Actions." },
  { name: "Block",
    description: "**Test:** Block tests your weapon, Brawling or Boxing skill plus shield or off-hand weapon dice.\n\n**Effect:** Block deflects and redirects the incoming attack. Like Avoid, your successes reduce the effectiveness of the opposed action. Each Block success reduces your opponent's total. If you roll successes equal to your opponent, you've stopped his action completely. Spend your margin of success as follows:\n\u2022 One extra success: +1D to your next action or to vying for position (if Block is your last action of the exchange).\n\u2022 Two extra successes: +1 Ob to the blocked character's next action.\n\u2022 Three extra successes: Blocked character loses his next action. He hesitates, but may only Stand and Drool as a result.\n\nNote: These effects can only be generated through the use of the Block action. Counterstrike, Change Stance and the Block & Strike actions do not gain these extra effects." },
  { name: "Counterstrike",
    description: "**Test:** Counterstrike tests your weapon, Brawling or Boxing skill. After actions are revealed, but before your opponent rolls, divide your fighting skill and any advantages into two pools\u2014one for defense and one for attack.\n\n**Effect:** In versus tests, use the defensive portion to oppose your opponent's action. Successes from your defense reduce his successes. The attack portion counts as a Strike action. However, the Strike portion of Counterstrike doesn't suffer disadvantages from weapon length or vying for position." },
  { name: "Assess",
    description: "Assessing allows a player to look for specific details\u2014easy exits, the sources of that burning smell and unarmored locations on his opponent.\n\n**Test:** An assess nets the character a Perception test in search of what he described in his intent and task.\n\n**Special:** An assess takes one action. This is a quick, over the shoulder glance. Additional actions may be spent on an assess in order to gain advantage dice to the Perception test\u2014+1D for a second action and +2D for a third." },
  { name: "Change Stance",
    description: "**Test:** It does not require a test to change stances. There are three fighting stances: neutral, defensive and aggressive. Decide which stance you're changing to when you select this action.\n\nNeutral Stance: Neutral stance is the default. You start a fight in neutral stance unless otherwise noted. It grants no advantage and suffers no disadvantages. The Change Stance: Neutral action counts as a Feint.\n\nDefensive Stance: Defensive stance grants +2D to Avoid, Block and Counterstrike. Strike and Great Strike suffer a +2 Ob penalty when performed from defensive stance. The Change Stance: Defensive action counts as a Block.\n\nAggressive Stance: Aggressive stance grants +2D to Strike and Great Strike. Block and Counterstrike suffer +2 Ob penalty. You may not Avoid. If you accidentally script Avoid while in aggressive stance, you hesitate for an action. The Change Stance: Aggressive action counts as the first action of Intimidate.\n\n**Special:** Instead of using the stance dice as a bonus to actions in the script, a player may use his +2D bonus to aid in vying for position.\n\n**Restrictions:** You keep your stance until you change stance, disengage, are incapacitated, hesitate or use the Charge/Tackle action. Any of these conditions automatically drops the character back to neutral stance." },
  { name: "Charge/Tackle",
    description: "**Test:** Charge/Tackle tests your Power with a +1D advantage plus stride advantage. Charge/Tackle must be your first action in the volley.\n\n**Effect:** When performing this action, choose whether you're charging your opponent or tackling him. If you charge, you attempt to knock him down but you remain on your feet yourself. If you tackle, you take your opponent down with you. If you win the versus test by one or meet your obstacle in a standard test, you stagger your opponent. He's at +1 Ob to his next test. If you win the versus test by two or exceed your obstacle in the standard test, you knock your opponent down.\n\nCharge: If you successfully charge, you also take the advantage for your hands or for whatever weapon you're holding except spears and missiles.\n\nTackle: If you tackle your opponent, you take the advantage at the Hands fighting distance. If you successfully tackle your opponent, he may not use the Shooting and Throwing or Magic actions.\n\n**Restrictions:** Your stance reverts to neutral stance if you Charge/Tackle. If you fail this action, you give your opponent the advantage and you Stand and Drool for your next action.\n\n**Special:** When you use this action you change weapons to your hands, unless you're charging specifically with a shield, which uses the short weapon length." },
  { name: "Draw Weapon",
    description: "**Action Cost:** Two actions are required to unsheathe/unsling a handheld weapon. This includes sheathed swords, throwing knives, slung crossbows, etc. Readying a weapon before a fight\u2014on a strap or in an off hand\u2014decreases draw time to one action. Counts as Physical Action for action interaction." },
  { name: "Physical Action",
    description: "**Test:** Physical actions typically use Power (to rip something open), Agility (to grab something) or Speed (to vault something).\n\n**Action Cost:** Physical acts eat up two actions.\n\n**Effect:** This category of actions covers everything from overturning tables to opening doors and climbing through windows." },
  { name: "Push",
    description: "**Test:** Push tests Power. Push uses the Hands weapon length.\n\n**Effect:** If you win the versus test by one or meet your obstacle in a standard test, you stagger your opponent: He's at +1 Ob to his next test. If you win the versus test by two or exceed your obstacle in a standard test, you stagger your opponent and take the advantage so long as your weapon length is long or shorter. If you win the versus test by three or exceed your obstacle by two in a standard test, you knock your opponent down.\n\n**Special:** When you use this action you change weapons to your hands, unless you're using a shield which uses the short weapon length." },
  { name: "Lock",
    description: "**Test:** Lock tests Power. Lock uses the Hands weapon length.\n\n**Effect:** If you win the versus test by one or meet your obstacle in a standard test, you grab your opponent: His Agility, Speed, Power and Forte and his fighting, shooting and magical skills are all reduced by one die. Each additional success reduces your opponent's abilities by another point. (Reflexes is not reduced.)\n\nPulled In: If you manage to grab your opponent with a Lock, you pull him in. You have the advantage at the Hands fighting distance.\n\nIn Your Face: If you successfully Lock your opponent, he may not use the Shooting and Throwing or Magic Actions with one exception: He may shoot if he's using a pistol.\n\nIncrease the Pressure: You can script multiple Lock actions and increase the value of your Lock on your opponent. Each additional successful Lock test further reduces your opponent's abilities by your margin of success.\n\nIncapacitation: If you reduce your opponent's Agility, Speed, Power or Forte to zero dice, he is incapacitated.\n\nEscaping Locks: If you're in a Lock and wish to escape, use the Avoid action but replace Speed with Agility, Power or Forte (your choice). Margin of success reduces any standing Lock penalty.\n\n**Special:** When you use this action you change weapons to your hands.\n\n**Restrictions:** You must have at least one hand free to perform this action. If you do not, you drop one item that you're holding as you go for the grab." },
  { name: "Get Up",
    description: "Characters are always getting knocked down. It requires two actions to get up from being laid flat. See the Knocked Down rules later in this chapter." },
  { name: "Beat",
    description: "**Test:** Beat tests your weapon skill.\n\n**Effect:** If you meet the obstacle or win the versus test, you steal the advantage from your opponent. He now suffers the appropriate disadvantage according to your weapons and you gain an advantage to the positioning test at the start of the next exchange (provided you maintain advantage). If you already have the advantage, you can give your opponent a +1 Ob penalty to his next action or you can take +1D to your next action. You choose.\n\n**Special:** Gain a +1D advantage to the Beat test if you're using two hands on your weapon. You cannot hold anything in your off hand!" },
  { name: "Disarm",
    description: "**Test:** Weapon or Boxing skill.\n\n**Effect:** Disarm is a difficult action to pull off, but if successful its results are spectacular. If successful, you knock your opponent's weapon away. A successful Disarm also grants you the advantage for your weapon.\n\n**Special Versus Test Rules:** In order to Disarm someone in a versus test, you must win by a margin of success equal to his weapon skill\u2014except in the case of Disarm vs Feint." },
  { name: "Feint",
    description: "**Test:** Weapon or Boxing skill.\n\n**Effect:** Feint is a special attack designed to defeat defenses. Feint does damage like a Strike. See the Weapons chapter for the damage rules." },
  { name: "Throw Person",
    description: "**Test:** Boxing skill.\n\n**Effect:** If you win the versus test by one or meet your obstacle in a standard test, you successfully throw your opponent off his feet and he suffers the appropriate penalties until he rights himself. You can choose how to spend additional successes:\n\nOne additional success can be spent to do an Incidental bare-fisted hit or cause a Steel test. Two additional successes can be spent to cause a Mark hit or an Incidental and a Steel test. Four additional successes can be spent to deliver a Superb hit.\n\n**Restrictions:** You must have a hand free to perform this action. If you do not, you drop your weapon as you go for the grab." },
  { name: "Throw Object",
    description: "**Action Cost:** It costs two actions to throw a weapon like a knife or stone.\n\n**Test:** Test Throwing skill. It's an Ob 2 test to hit plus disadvantages from vying for position, weather and light.\n\n**Restrictions:** Once you throw, you cede advantage to your target." },
  { name: "Aim",
    description: "**Special:** A player may spend actions aiming a loaded and ready weapon\u2014a knife in the hand, nocked and drawn bow, a loaded gun, etc. Each action spent gives a +1D advantage. Characters may aim for as many actions as half their Perception exponent rounded up. When aiming with a crossbow, gun or thrown weapon, script your Aim actions first, then script your Throw or Fire actions. When aiming a bow, put your Aim actions after your Nock and Draw actions, before you script Release." },
  { name: "Nock & Draw Bow",
    description: "**Effect:** This extended action readies your bow to shoot. Each type of bow has a different load time: Hunting bow, 5 actions; Elven bow, 5 actions; Great bow, 7 actions. To hit your target, script the Release action after Nock and Draw.\n\n**Special:** You can prep a bow and keep it ready by spending three actions to nock the arrow. Then when you want to get down to business, you can pay the remainder of the Nock and Draw action to finish readying it." },
  { name: "Reload Crossbow",
    description: "**Special:** Crossbows and pistols require 16 actions to draw and load. Heavy crossbows and muskets require 32 actions." },
  { name: "Fire Crossbow",
    description: "**Action Cost:** It costs two actions to fire a gun or crossbow in combat.\n\n**Test:** Firearms or Crossbow skill as appropriate. It's an Ob 2 test to hit with a gun (plus disadvantages for vying for position, light and weather).\n\n**Restrictions:** Once you fire, you cede advantage to your target." },
  { name: "Release Bow",
    description: "**Action Cost:** One action is required to release an arrow from your bow.\n\n**Test:** Bow skill against Ob 1 plus disadvantages for vying for position, wounds and other appropriate conditions.\n\n**Restrictions:** Once your arrow is released you cede advantage to your target." },
  { name: "Snapshot",
    description: "You can use a snapshot with a bow, crossbow, gun or thrown weapon.\n\n**Effect:** For a crossbow, gun or thrown weapon, a snapshot costs one action. For a bow of any type, a snapshot reduces your draw and nock time by one action. It allows you to release one action sooner.\n\n**Test:** Snapshot is a base Ob 4 test for the Bow, Crossbow, Firearms, or Throwing skill.\n\n**Restrictions:** You may not aim a Snapshot, and once you snap that shot off, you cede advantage to your opponent." },
  { name: "Cast Spell",
    description: "**Special:** Spells take a number of actions to perform. Spell actions must be performed continuously and without interruption (otherwise bad things happen). Spells have weapon lengths. Spell casting suffers from weapon length and vying for position disadvantage penalties at the time of its release.\n\n**Test:** Sorcery or appropriate spell-casting skill after the sorcerer has spent the prerequisite actions casting the spell.\n\n**Effect:** Spells have effects listed in their individual descriptions." },
  { name: "Drop Spell",
    description: "**Special:** If a caster no longer wishes to concentrate on a spell being sustained, it costs one action to drop it." },
  { name: "Command Spirit",
    description: "A summoner may command a spirit using Spirit Binding during a fight. It only costs one action, but it's very risky. These rules are described in detail in the Burning Wheel Codex." },
  { name: "Command",
    description: "**Action Cost:** Commanding another character to get back into the fight costs two actions.\n\n**Effect:** Command can help reduce hesitation. See the Command skill description for the rules." },
  { name: "Intimidate",
    description: "**Action Cost:** Using the Intimidation skill on another character in a melee costs two actions.\n\n**Test:** Intimidation Ob = Will.\n\n**Effect:** If successful, target must test Steel. Your target hesitates for one action per point of margin of failure." },
  { name: "Stand and Drool",
    description: "The character is stunned. He does nothing while hesitating." },
  { name: "Fall Prone",
    description: "The character falls to his knees or stomach and pleads for his life in the name of compassion, honor, mercy or the gods." },
  { name: "Run Screaming",
    description: "The character drops what he is holding, turns about and bolts for the exit. If the hesitation crosses the top of the exchange, the player must choose to disengage. He does not have access to weapon length dice." },
  { name: "Swoon",
    description: "The character passes out. He's out of the fight. If appropriate, he appears dead! He cannot be acted against unless another character pays special attention to him\u2014to finish him, slit his throat, check his pulse or whatever." },
  { name: "No Action" },
];

function getActionData(name) {
  return ACTIONS.find(a => a.name === name);
}

// Fight action interaction table.
// Keys: "YourAction-OpponentAction" → obstacle string
// Obstacle types:
//   "Ob 1"       = standard test, obstacle 1
//   "½ Skill"    = standard test, obstacle = half opponent's weapon skill (round up)
//   "½ Pow"      = standard test, obstacle = half opponent's Power
//   "½ Spd"      = standard test, obstacle = half opponent's Speed
//   "½ For"      = standard test, obstacle = half opponent's Forte
//   "½ Agi"      = standard test, obstacle = half opponent's Agility
//   "Ob = Skill" = standard test, obstacle = opponent's full weapon skill exponent
//   "Vs Spd"     = versus test vs opponent's Speed
//   "Vs Skill"   = versus test vs opponent's weapon skill
//   "Vs Pow"     = versus test vs opponent's Power
//   "Vs Agi"     = versus test vs opponent's Agility
//   "Vs+ Spd"    = versus test, opponent adds Speed exponent to successes
//   "Vs+ Skill"  = versus test, opponent adds weapon skill exponent to successes
//   "Vs÷ Skill"  = versus test, you use divided skill pool (Counterstrike)
//   "Vs+÷ Skill" = versus test +, you use divided skill pool (Disarm vs Counterstrike)
//   "—"          = no test / dash (you do not test; check opponent's action for their obstacle)
const FIGHT_INTERACTIONS = {
  // ── Strike ──
  "Strike-Strike": "Ob 1",
  "Strike-Great Strike": "Ob 1",
  "Strike-Avoid": "Vs Spd",
  "Strike-Block": "Vs Skill",
  "Strike-Counterstrike": "Vs÷ Skill",
  "Strike-Beat": "Ob 1",
  "Strike-Disarm": "Ob 1",
  "Strike-Feint": "Ob 1",
  "Strike-Charge/Tackle": "Ob 1",
  "Strike-Lock": "Ob 1",
  "Strike-Push": "Ob 1",
  "Strike-Throw Person": "Ob 1",
  "Strike-Assess": "Ob 1",
  "Strike-Change Stance": "Ob 1",
  "Strike-Physical Action": "Ob 1",
  "Strike-Draw Weapon": "Ob 1",
  "Strike-Get Up": "Ob 1",
  "Strike-No Action": "Ob 1",
  "Strike-Shooting/Throwing": "Ob 1",
  "Strike-Magic": "Ob 1",
  "Strike-Social": "Ob 1",
  "Strike-Stand and Drool": "Ob 1",
  "Strike-Fall Prone": "Ob 1",
  "Strike-Run Screaming": "½ Spd",
  "Strike-Swoon": "—",

  // ── Great Strike ──
  "Great Strike-Strike": "Ob 1",
  "Great Strike-Great Strike": "Ob 1",
  "Great Strike-Avoid": "Vs Spd",
  "Great Strike-Block": "Ob 1",
  "Great Strike-Counterstrike": "Vs Skill",
  "Great Strike-Beat": "Ob 1",
  "Great Strike-Disarm": "Ob 1",
  "Great Strike-Feint": "Ob 1",
  "Great Strike-Charge/Tackle": "Ob 1",
  "Great Strike-Lock": "Ob 1",
  "Great Strike-Push": "Ob 1",
  "Great Strike-Throw Person": "Ob 1",
  "Great Strike-Assess": "Ob 1",
  "Great Strike-Change Stance": "Ob 1",
  "Great Strike-Physical Action": "Ob 1",
  "Great Strike-Draw Weapon": "Ob 1",
  "Great Strike-Get Up": "Ob 1",
  "Great Strike-No Action": "Ob 1",
  "Great Strike-Shooting/Throwing": "Ob 1",
  "Great Strike-Magic": "Ob 1",
  "Great Strike-Social": "Ob 1",
  "Great Strike-Stand and Drool": "Ob 1",
  "Great Strike-Fall Prone": "Ob 1",
  "Great Strike-Run Screaming": "½ Spd",
  "Great Strike-Swoon": "—",

  // ── Lock & Strike ──
  "Lock & Strike-Strike": "Ob 1",
  "Lock & Strike-Great Strike": "Ob 1",
  "Lock & Strike-Avoid": "Vs Spd",
  "Lock & Strike-Block": "Vs Skill",
  "Lock & Strike-Counterstrike": "Vs÷ Skill",
  "Lock & Strike-Beat": "Ob 1",
  "Lock & Strike-Disarm": "Ob 1",
  "Lock & Strike-Feint": "Ob 1",
  "Lock & Strike-Charge/Tackle": "Ob 1",
  "Lock & Strike-Lock": "Ob 1",
  "Lock & Strike-Push": "Ob 1",
  "Lock & Strike-Throw Person": "Ob 1",
  "Lock & Strike-Assess": "Ob 1",
  "Lock & Strike-Change Stance": "Ob 1",
  "Lock & Strike-Physical Action": "Ob 1",
  "Lock & Strike-Draw Weapon": "Ob 1",
  "Lock & Strike-Get Up": "Ob 1",
  "Lock & Strike-No Action": "Ob 1",
  "Lock & Strike-Shooting/Throwing": "Ob 1",
  "Lock & Strike-Magic": "Ob 1",
  "Lock & Strike-Social": "Ob 1",
  "Lock & Strike-Stand and Drool": "Ob 1",
  "Lock & Strike-Fall Prone": "Ob 1",
  "Lock & Strike-Run Screaming": "½ Spd",
  "Lock & Strike-Swoon": "—",

  // ── Avoid ──
  "Avoid-Strike": "Vs Skill",
  "Avoid-Great Strike": "Vs Skill",
  "Avoid-Avoid": "—",
  "Avoid-Block": "—",
  "Avoid-Counterstrike": "—",
  "Avoid-Beat": "Vs Skill",
  "Avoid-Disarm": "Vs+ Skill",
  "Avoid-Feint": "—",
  "Avoid-Charge/Tackle": "Vs Pow",
  "Avoid-Lock": "Vs Pow",
  "Avoid-Push": "Vs Pow",
  "Avoid-Throw Person": "Vs Skill",

  // ── Block ──
  "Block-Strike": "Vs Skill",
  "Block-Great Strike": "—",
  "Block-Avoid": "—",
  "Block-Block": "—",
  "Block-Counterstrike": "—",
  "Block-Beat": "Vs Skill",
  "Block-Disarm": "Vs+ Skill",
  "Block-Feint": "—",
  "Block-Charge/Tackle": "—",
  "Block-Lock": "Vs Pow",
  "Block-Push": "Vs Pow",
  "Block-Throw Person": "Vs Skill",

  // ── Counterstrike ──
  "Counterstrike-Strike": "Vs÷ Skill",
  "Counterstrike-Great Strike": "Vs÷ Skill",
  "Counterstrike-Avoid": "—",
  "Counterstrike-Block": "—",
  "Counterstrike-Counterstrike": "—",
  "Counterstrike-Beat": "Vs÷ Skill",
  "Counterstrike-Disarm": "Vs+÷ Skill",
  "Counterstrike-Feint": "—",
  "Counterstrike-Charge/Tackle": "—",
  "Counterstrike-Lock": "Vs Pow",
  "Counterstrike-Push": "Vs Pow",
  "Counterstrike-Throw Person": "Vs÷ Skill",

  // ── Beat ──
  "Beat-Strike": "½ Skill",
  "Beat-Great Strike": "½ Skill",
  "Beat-Avoid": "Vs Spd",
  "Beat-Block": "Vs Skill",
  "Beat-Counterstrike": "Vs÷ Skill",
  "Beat-Beat": "Vs Skill",
  "Beat-Disarm": "Vs+ Skill",
  "Beat-Feint": "Vs Skill",
  "Beat-Charge/Tackle": "½ Skill",
  "Beat-Lock": "½ Skill",
  "Beat-Push": "½ Skill",
  "Beat-Throw Person": "½ Skill",
  "Beat-Assess": "½ Skill",
  "Beat-Change Stance": "½ Skill",
  "Beat-Physical Action": "½ Skill",
  "Beat-Draw Weapon": "½ Skill",
  "Beat-Get Up": "½ Skill",
  "Beat-No Action": "½ Skill",
  "Beat-Shooting/Throwing": "½ Skill",
  "Beat-Magic": "½ Skill",
  "Beat-Social": "½ Skill",
  "Beat-Stand and Drool": "Ob 1",
  "Beat-Fall Prone": "Ob 1",
  "Beat-Run Screaming": "Ob 1",
  "Beat-Swoon": "—",

  // ── Disarm ──
  "Disarm-Strike": "Ob = Skill",
  "Disarm-Great Strike": "Ob = Skill",
  "Disarm-Avoid": "Vs+ Spd",
  "Disarm-Block": "Vs+ Skill",
  "Disarm-Counterstrike": "Vs+÷ Skill",
  "Disarm-Beat": "Vs+ Skill",
  "Disarm-Disarm": "Ob = Skill",
  "Disarm-Feint": "Vs Skill",
  "Disarm-Charge/Tackle": "Ob = Skill",
  "Disarm-Lock": "Ob = Skill",
  "Disarm-Push": "Ob = Skill",
  "Disarm-Throw Person": "Ob = Skill",
  "Disarm-Assess": "Ob = Skill",
  "Disarm-Change Stance": "Ob = Skill",
  "Disarm-Physical Action": "Ob = Skill",
  "Disarm-Draw Weapon": "Ob = Skill",
  "Disarm-Get Up": "Ob = Skill",
  "Disarm-No Action": "Ob = Skill",
  "Disarm-Shooting/Throwing": "Ob = Skill",
  "Disarm-Magic": "Ob = Skill",
  "Disarm-Social": "Ob = Skill",
  "Disarm-Stand and Drool": "Ob 1",
  "Disarm-Fall Prone": "Ob 1",
  "Disarm-Run Screaming": "½ Skill",
  "Disarm-Swoon": "—",

  // ── Feint ──
  "Feint-Strike": "—",
  "Feint-Great Strike": "—",
  "Feint-Avoid": "—",
  "Feint-Block": "Ob 1",
  "Feint-Counterstrike": "Ob 1",
  "Feint-Beat": "Vs Skill",
  "Feint-Disarm": "Vs Skill",
  "Feint-Feint": "Vs Skill",
  "Feint-Charge/Tackle": "—",
  "Feint-Lock": "—",
  "Feint-Push": "—",
  "Feint-Throw Person": "—",

  // ── Charge/Tackle ──
  "Charge/Tackle-Strike": "½ For",
  "Charge/Tackle-Great Strike": "½ For",
  "Charge/Tackle-Avoid": "Vs Spd",
  "Charge/Tackle-Block": "½ Spd",
  "Charge/Tackle-Counterstrike": "½ Spd",
  "Charge/Tackle-Beat": "½ Spd",
  "Charge/Tackle-Disarm": "½ For",
  "Charge/Tackle-Feint": "½ For",
  "Charge/Tackle-Charge/Tackle": "Vs Pow",
  "Charge/Tackle-Lock": "½ For",
  "Charge/Tackle-Push": "Vs Pow",
  "Charge/Tackle-Throw Person": "Vs Skill",
  "Charge/Tackle-Assess": "½ Spd",
  "Charge/Tackle-Change Stance": "½ Spd",
  "Charge/Tackle-Physical Action": "½ Spd",
  "Charge/Tackle-Draw Weapon": "½ Spd",
  "Charge/Tackle-Get Up": "½ For",
  "Charge/Tackle-No Action": "½ For",
  "Charge/Tackle-Shooting/Throwing": "½ Spd",
  "Charge/Tackle-Magic": "½ Spd",
  "Charge/Tackle-Social": "½ Spd",
  "Charge/Tackle-Stand and Drool": "Ob 1",
  "Charge/Tackle-Fall Prone": "Ob 1",
  "Charge/Tackle-Run Screaming": "Vs Spd",
  "Charge/Tackle-Swoon": "—",

  // ── Lock ──
  "Lock-Strike": "½ Pow",
  "Lock-Great Strike": "½ Pow",
  "Lock-Avoid": "Vs Spd",
  "Lock-Block": "Vs Skill",
  "Lock-Counterstrike": "Vs÷ Skill",
  "Lock-Beat": "½ Pow",
  "Lock-Disarm": "Vs Skill",
  "Lock-Feint": "½ Pow",
  "Lock-Charge/Tackle": "½ Pow",
  "Lock-Lock": "Vs Pow",
  "Lock-Push": "½ Pow",
  "Lock-Throw Person": "½ Pow",
  "Lock-Assess": "½ Pow",
  "Lock-Change Stance": "½ Pow",
  "Lock-Physical Action": "½ Pow",
  "Lock-Draw Weapon": "½ Pow",
  "Lock-Get Up": "½ Pow",
  "Lock-No Action": "½ Pow",
  "Lock-Shooting/Throwing": "½ Pow",
  "Lock-Magic": "½ Pow",
  "Lock-Social": "½ Pow",
  "Lock-Stand and Drool": "Ob 1",
  "Lock-Fall Prone": "Ob 1",
  "Lock-Run Screaming": "Vs Agi",
  "Lock-Swoon": "—",

  // ── Push ──
  "Push-Strike": "½ Spd",
  "Push-Great Strike": "½ Spd",
  "Push-Avoid": "Vs Spd",
  "Push-Block": "Vs Skill",
  "Push-Counterstrike": "Vs÷ Skill",
  "Push-Beat": "½ Spd",
  "Push-Disarm": "½ Pow",
  "Push-Feint": "½ Spd",
  "Push-Charge/Tackle": "Vs Pow",
  "Push-Lock": "½ Spd",
  "Push-Push": "Vs Pow",
  "Push-Throw Person": "Vs Skill",
  "Push-Assess": "½ Pow",
  "Push-Change Stance": "½ Pow",
  "Push-Physical Action": "½ Spd",
  "Push-Draw Weapon": "½ Spd",
  "Push-Get Up": "½ Spd",
  "Push-No Action": "½ Spd",
  "Push-Shooting/Throwing": "½ Spd",
  "Push-Magic": "½ Spd",
  "Push-Social": "½ Spd",
  "Push-Stand and Drool": "Ob 1",
  "Push-Fall Prone": "Ob 1",
  "Push-Run Screaming": "Vs Spd",
  "Push-Swoon": "—",

  // ── Throw Person ──
  "Throw Person-Strike": "½ Spd",
  "Throw Person-Great Strike": "½ Spd",
  "Throw Person-Avoid": "Vs Spd",
  "Throw Person-Block": "Vs Skill",
  "Throw Person-Counterstrike": "Vs÷ Skill",
  "Throw Person-Beat": "½ Agi",
  "Throw Person-Disarm": "½ Agi",
  "Throw Person-Feint": "½ Spd",
  "Throw Person-Charge/Tackle": "Vs Pow",
  "Throw Person-Lock": "Vs Pow",
  "Throw Person-Push": "Vs Pow",
  "Throw Person-Throw Person": "Vs Skill",
  "Throw Person-Assess": "½ Spd",
  "Throw Person-Change Stance": "½ Spd",
  "Throw Person-Physical Action": "½ Spd",
  "Throw Person-Draw Weapon": "½ Spd",
  "Throw Person-Get Up": "½ Spd",
  "Throw Person-No Action": "½ Spd",
  "Throw Person-Shooting/Throwing": "½ Spd",
  "Throw Person-Magic": "½ Spd",
  "Throw Person-Social": "½ Spd",
  "Throw Person-Stand and Drool": "Ob 1",
  "Throw Person-Fall Prone": "Ob 1",
  "Throw Person-Run Screaming": "Vs Spd",
  "Throw Person-Swoon": "—",
};

function getFightInteraction(yourAction, opponentAction) {
  return FIGHT_INTERACTIONS[`${yourAction}-${opponentAction}`] || null;
}

// ---- Flag Helpers ----

async function saveGroups(combat, groups) {
  await combat.setFlag(FLAG_SCOPE, FLAG_GROUPS, foundry.utils.duplicate(groups));
}

function loadGroups(combat) {
  const raw = combat.getFlag(FLAG_SCOPE, FLAG_GROUPS);
  return raw ? foundry.utils.duplicate(raw) : [];
}

async function saveRevealed(combat, revealed) {
  await combat.setFlag(FLAG_SCOPE, FLAG_REVEALED, foundry.utils.duplicate(revealed));
}

function loadRevealed(combat) {
  const raw = combat.getFlag(FLAG_SCOPE, FLAG_REVEALED);
  return raw ? foundry.utils.duplicate(raw) : {};
}

async function saveReady(combat, ready) {
  await combat.setFlag(FLAG_SCOPE, FLAG_READY, foundry.utils.duplicate(ready));
}

function loadReady(combat) {
  const raw = combat.getFlag(FLAG_SCOPE, FLAG_READY);
  return raw ? foundry.utils.duplicate(raw) : {};
}

async function saveScripted(combat, scripted) {
  await combat.setFlag(FLAG_SCOPE, FLAG_SCRIPTED, foundry.utils.duplicate(scripted));
}

function loadScripted(combat) {
  const raw = combat.getFlag(FLAG_SCOPE, FLAG_SCRIPTED);
  return raw ? foundry.utils.duplicate(raw) : {};
}

// ---- FightDialog Registry (survives PopOut removing the dialog from ui.windows) ----
const _fightDialogs = new Map();

// ---- FightDialog ----

class FightDialog extends Application {
  constructor(combat, options = {}) {
    super(options);
    this.combat = combat;
    _fightDialogs.set(combat.id, this);
    // Local (unrevealed) actions: { [groupId]: { [combatantId]: [[], [], []] } }
    this.localActions = {};
    // Tracks combatants whose Ready has been sent but not yet saved to combat flags.
    // Maps "groupId-combatantId" → actions array so we can render locked cards locally.
    this._pendingReadyLocal = {};
    // Local disadvantage overrides received via socket before flags sync.
    // Maps "groupId-combatantId" → value
    this._localDisadvantage = {};
    // Local stance overrides received via socket before flags sync.
    // Maps "groupId-combatantId" → value
    this._localStance = {};
    // Local knocked-down overrides received via socket before flags sync.
    // Maps "groupId-combatantId" → boolean
    this._localKnockedDown = {};
    // Local weapon overrides received via socket before flags sync.
    // Maps "groupId-combatantId" → weapon key string
    this._localWeapon = {};
    // Tracks which group-volley combos have been revealed, for flip animation.
    // Seed from current flag state so existing reveals don't animate on open.
    this._previouslyRevealed = new Set();
    const existingRevealed = loadRevealed(combat);
    for (const [groupId, volleys] of Object.entries(existingRevealed)) {
      for (const vi of Object.keys(volleys)) {
        this._previouslyRevealed.add(`${groupId}-${vi}`);
      }
    }
    // Pending reveal callbacks
    this._pendingRevealResolvers = {};
    // Selected revealed cards for interaction lookup (max 2)
    this._selectedCards = [];
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: "modules/bw-fight/templates/fight-dialog.hbs",
      classes: ["bw-fight-dialog"],
      width: 720,
      height: 600,
      resizable: true,
      title: "Fight!",
    });
  }

  get id() {
    return `bw-fight-${this.combat.id}`;
  }

  async close(...args) {
    _fightDialogs.delete(this.combat.id);
    return super.close(...args);
  }

  async _render(...args) {
    await this._ensureDefaultGroup();
    return super._render(...args);
  }

  async _ensureDefaultGroup() {
    const groups = loadGroups(this.combat);
    if (groups.length === 0 && game.user.isGM) {
      groups.push({
        id: foundry.utils.randomID(),
        name: "Group 1",
        combatantIds: [],
        exchange: 1,
      });
      await saveGroups(this.combat, groups);
      this._emitGroupsUpdated();
    }
  }

  getData() {
    const groups = loadGroups(this.combat);
    const revealed = loadRevealed(this.combat);
    const ready = loadReady(this.combat);
    const scripted = loadScripted(this.combat);
    const isGM = game.user.isGM;

    const assignedSet = new Set();
    for (const group of groups) {
      for (const id of (group.combatantIds || [])) assignedSet.add(id);
    }

    const allCombatants = this.combat.combatants.map(c => {
      const actor = c.actor;
      const tokenDoc = c.token;
      return {
        combatantId: c.id,
        name: tokenDoc?.name ?? actor?.name ?? "Unknown",
        img: tokenDoc?.texture?.src ?? actor?.prototypeToken?.texture?.src ?? actor?.img ?? "icons/svg/mystery-man.svg",
        assigned: assignedSet.has(c.id),
      };
    });

    const groupsData = groups.map(group => {
      const groupRevealed = revealed[group.id] || {};
      const groupReady = ready[group.id] || {};
      const groupScripted = scripted[group.id] || {};
      const actors = (group.combatantIds || []).map(combatantId => {
        const combatant = this.combat.combatants.get(combatantId);
        const actor = combatant?.actor;
        const tokenDoc = combatant?.token;
        const isOwner = combatant?.isOwner ?? false;
        const pendingReadyKey = `${group.id}-${combatantId}`;
        const pendingReadyActions = this._pendingReadyLocal[pendingReadyKey];
        const isReady = !!groupReady[combatantId] || !!pendingReadyActions;
        const localGroupActions = this.localActions[group.id] || {};
        const localActorActions = localGroupActions[combatantId] || [[], [], []];
        const scriptedActions = groupScripted[combatantId] || [[], [], []];

        // Clear pendingReadyLocal once flags have caught up
        if (groupReady[combatantId] && pendingReadyActions) {
          delete this._pendingReadyLocal[pendingReadyKey];
        }

        // Compute max card count across all volleys for uniform hidden card display
        const hasScripted = scriptedActions.some(v => v && v.length > 0);
        const readySource = hasScripted ? scriptedActions : pendingReadyActions;
        const maxReadyCards = isReady && readySource
          ? Math.max(...[0, 1, 2].map(vi => (readySource[vi] || []).length), 1)
          : 1;

        const volleys = [0, 1, 2].map(vi => {
          const volleyRevealed = groupRevealed[vi];
          if (volleyRevealed && volleyRevealed[combatantId]) {
            const revealedActions = volleyRevealed[combatantId];
            // Pad with "No Action" so all revealed volleys show the same count
            const padded = [...revealedActions];
            while (padded.length < maxReadyCards) padded.push("No Action");
            return {
              volleyIndex: vi,
              cards: padded.map(a => {
                const ad = getActionData(a);
                return {
                  action: a,
                  subtext: ad?.subtext || null,
                  description: ad?.description || null,
                  state: "revealed",
                  isHidden: false,
                };
              }),
              canScript: false,
              isRevealed: true,
            };
          }

          // If actor is ready, show uniform hidden cards across all volleys
          if (isReady) {
            return {
              volleyIndex: vi,
              cards: Array.from({ length: maxReadyCards }, () => ({ action: "", state: "hidden", isHidden: true })),
              canScript: false,
              isRevealed: false,
            };
          }

          // Not yet revealed, not ready
          const localCards = localActorActions[vi] || [];
          if (isOwner) {
            return {
              volleyIndex: vi,
              cards: localCards.map(a => {
                const ad = getActionData(a);
                return {
                  action: a,
                  subtext: ad?.subtext || null,
                  description: ad?.description || null,
                  state: "owned",
                  isHidden: false,
                };
              }),
              canScript: true,
              isRevealed: false,
            };
          }
          // Other user's actor — show face-down cards
          return {
            volleyIndex: vi,
            cards: localCards.length > 0
              ? localCards.map(() => ({ action: "", state: "hidden", isHidden: true }))
              : [],
            canScript: false,
            isRevealed: false,
          };
        });

        const localKey = `${group.id}-${combatantId}`;
        const localOverride = this._localDisadvantage[localKey];
        const combatantDisadvantage = localOverride ?? (group.combatantDisadvantage || {})[combatantId] ?? 0;
        // Clear local override once flags have caught up
        if (localOverride != null && (group.combatantDisadvantage || {})[combatantId] === localOverride) {
          delete this._localDisadvantage[localKey];
        }
        const disadvantageOptions = Array.from({ length: 6 }, (_, i) => ({
          value: i,
          label: `+${i} Ob`,
          selected: i === combatantDisadvantage,
        }));

        const stanceLocalKey = `${group.id}-${combatantId}`;
        const stanceLocalOverride = this._localStance[stanceLocalKey];
        const combatantStance = stanceLocalOverride ?? (group.combatantStance || {})[combatantId] ?? "Neutral";
        if (stanceLocalOverride != null && (group.combatantStance || {})[combatantId] === stanceLocalOverride) {
          delete this._localStance[stanceLocalKey];
        }
        const stanceOptions = ["Neutral", "Aggressive", "Defensive"].map(s => ({
          value: s,
          label: s,
          selected: s === combatantStance,
        }));

        const kdLocalKey = `${group.id}-${combatantId}`;
        const kdLocalOverride = this._localKnockedDown[kdLocalKey];
        const knockedDown = kdLocalOverride ?? (group.combatantKnockedDown || {})[combatantId] ?? false;
        if (kdLocalOverride != null && (group.combatantKnockedDown || {})[combatantId] === kdLocalOverride) {
          delete this._localKnockedDown[kdLocalKey];
        }

        // Build weapon options from the actor's character sheet data
        const weaponOptions = [];
        const meleeWeapons = actor?.system?.gear?.weapons;
        if (meleeWeapons) {
          for (const [key, w] of Object.entries(meleeWeapons)) {
            if (w?.name) {
              weaponOptions.push({ value: `melee-${key}`, label: `${w.name} (${w.length || "—"})` });
            }
          }
        }
        const rangedWeapons = actor?.system?.gear?.rangedWeapons;
        if (rangedWeapons) {
          for (const [key, w] of Object.entries(rangedWeapons)) {
            if (w?.name) {
              const range = [w.optimalRange, w.extremeRange].filter(Boolean).join("/");
              weaponOptions.push({ value: `ranged-${key}`, label: `${w.name}${range ? ` (${range})` : ""}` });
            }
          }
        }

        const weaponLocalKey = `${group.id}-${combatantId}`;
        const weaponLocalOverride = this._localWeapon[weaponLocalKey];
        const combatantWeapon = weaponLocalOverride ?? (group.combatantWeapon || {})[combatantId] ?? "";
        if (weaponLocalOverride != null && (group.combatantWeapon || {})[combatantId] === weaponLocalOverride) {
          delete this._localWeapon[weaponLocalKey];
        }
        for (const opt of weaponOptions) {
          opt.selected = opt.value === combatantWeapon;
        }

        return {
          combatantId,
          name: tokenDoc?.name ?? actor?.name ?? "Unknown",
          img: tokenDoc?.texture?.src ?? actor?.prototypeToken?.texture?.src ?? actor?.img ?? "icons/svg/mystery-man.svg",
          woundedDice: actor?.system?.pgts?.woundedDice ?? 0,
          obstaclePenalty: actor?.system?.pgts?.obstaclePenalties ?? 0,
          isOwner,
          isReady,
          volleys,
          disadvantageOptions,
          stanceOptions,
          knockedDown,
          weaponOptions,
        };
      });

      // Check which volleys are revealed for this group
      const volleyRevealed = [0, 1, 2].map(vi => !!groupRevealed[vi]);

      return {
        id: group.id,
        name: group.name,
        actors,
        hasActors: actors.length > 0,
        volleyRevealed,
        exchange: group.exchange || 1,
      };
    });

    const data = {
      allCombatants,
      groups: groupsData,
      hasGroups: groupsData.length > 0,
      isGM,
    };
    return this._applyRemoteCardCounts(data);
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (game.user.isGM) {
      html.find(".add-group").on("click", this._onAddGroup.bind(this));
      html.find(".show-to-players").on("click", this._onShowToPlayers.bind(this));
      html.find(".reset-fight").on("click", this._onResetFight.bind(this));
      html.find(".remove-from-group").on("click", this._onRemoveFromGroup.bind(this));
      html.find(".remove-group").on("click", this._onRemoveGroup.bind(this));
      html.find(".move-actor-up").on("click", this._onMoveActorUp.bind(this));
      html.find(".move-actor-down").on("click", this._onMoveActorDown.bind(this));
      html.find(".reveal-volley").on("click", this._onRevealVolley.bind(this));
      html.find(".next-exchange").on("click", this._onNextExchange.bind(this));

      // Drag-and-drop listeners
      html.find(".combatant-draggable:not(.assigned)").on("dragstart", this._onDragStart.bind(this));
      html.find(".combatant-draggable:not(.assigned)").on("dragend", this._onDragEnd.bind(this));

      const groupEls = html.find(".fight-group");
      groupEls.on("dragover", this._onDragOver.bind(this));
      groupEls.on("dragleave", this._onDragLeave.bind(this));
      groupEls.on("drop", this._onDrop.bind(this));

      html.find(".group-drop-zone").on("dragover", (event) => {
        event.preventDefault();
      });
      html.find(".group-drop-zone").on("drop", (event) => {
        event.preventDefault();
        const groupEl = event.currentTarget.closest(".fight-group");
        if (groupEl) {
          const combatantId = event.originalEvent.dataTransfer.getData("text/plain");
          const groupId = groupEl.dataset.groupId;
          if (!combatantId || !groupId) return;
          this._addCombatantToGroup(combatantId, groupId);
        }
      });
    }

    // Double-click actor image to open character sheet
    html.find(".volley-grid .actor-thumb").on("dblclick", (event) => {
      const combatantId = event.currentTarget.closest("tr").querySelector("[data-combatant-id]")?.dataset.combatantId;
      const combatant = this.combat.combatants.get(combatantId);
      if (combatant?.actor) combatant.actor.sheet.render(true);
    });

    // All users can change disadvantage/stance, click action cards, and ready button
    html.find(".actor-disadvantage-select").on("change", this._onActorDisadvantageChange.bind(this));
    html.find(".actor-stance-select").on("change", this._onActorStanceChange.bind(this));
    html.find(".actor-knocked-down-check").on("change", this._onActorKnockedDownChange.bind(this));
    html.find(".actor-weapon-select").on("change", this._onActorWeaponChange.bind(this));
    html.find(".action-card.blank").on("click", this._onBlankCardClick.bind(this));
    html.find(".action-card.owned").on("click", this._onOwnedCardClick.bind(this));
    html.find(".card-chat-btn").on("click", this._onChatIconClick.bind(this));
    html.find(".action-card.revealed").on("click", this._onRevealedCardClick.bind(this));
    html.find(".ready-btn").on("click", this._onReadyClick.bind(this));

    // Restore selected state on re-render
    for (const sel of this._selectedCards) {
      html.find(`.action-card.revealed[data-group-id="${sel.groupId}"][data-combatant-id="${sel.combatantId}"][data-volley="${sel.volley}"][data-card-index="${sel.cardIndex}"]`).addClass("selected");
    }

    // Apply flip animation to newly revealed cards
    this._applyFlipAnimation(html);
  }

  _applyFlipAnimation(html) {
    const revealed = loadRevealed(this.combat);
    const currentRevealed = new Set();

    for (const [groupId, volleys] of Object.entries(revealed)) {
      for (const vi of Object.keys(volleys)) {
        currentRevealed.add(`${groupId}-${vi}`);
      }
    }

    // Find newly revealed volleys (in current but not in previous)
    const newlyRevealed = new Set();
    for (const key of currentRevealed) {
      if (!this._previouslyRevealed.has(key)) {
        newlyRevealed.add(key);
      }
    }

    // Add flip-in class to cards in newly revealed volleys
    if (newlyRevealed.size > 0) {
      html.find(".action-card.revealed").each((_, el) => {
        const groupId = el.dataset.groupId;
        const volley = el.dataset.volley;
        if (newlyRevealed.has(`${groupId}-${volley}`)) {
          el.classList.add("flip-in");
        }
      });
    }

    // Update tracking set
    this._previouslyRevealed = currentRevealed;
  }

  async _onShowToPlayers() {
    await this.combat.setFlag(FLAG_SCOPE, "showDialog", Date.now());
  }

  async _onResetFight() {
    if (!game.user.isGM) return;
    const confirm = await Dialog.confirm({
      title: "Reset Fight",
      content: "<p>Reset the entire fight? All groups, scripted actions and revealed data will be lost.</p>",
    });
    if (!confirm) return;

    // Clear all combat flags
    const flagPrefix = `flags.${FLAG_SCOPE}`;
    await this.combat.update({
      [`${flagPrefix}.-=${FLAG_GROUPS}`]: null,
      [`${flagPrefix}.-=${FLAG_REVEALED}`]: null,
      [`${flagPrefix}.-=${FLAG_READY}`]: null,
      [`${flagPrefix}.-=${FLAG_SCRIPTED}`]: null,
    });

    // Clear all local state
    this.localActions = {};
    this._pendingReadyLocal = {};
    this._localDisadvantage = {};
    this._localStance = {};
    this._localWeapon = {};
    this._previouslyRevealed = new Set();
    this._pendingRevealResolvers = {};
    if (this._remoteCardCounts) this._remoteCardCounts = {};

    // Create a fresh empty group
    const groups = [{
      id: foundry.utils.randomID(),
      name: "Group 1",
      combatantIds: [],
      exchange: 1,
    }];
    await saveGroups(this.combat, groups);

    // Notify other clients to reset
    this._emitGroupsUpdated();
    this.render(false);
  }

  // ---- GM Group Management ----

  async _onAddGroup() {
    const groups = loadGroups(this.combat);
    groups.push({
      id: foundry.utils.randomID(),
      name: `Group ${groups.length + 1}`,
      combatantIds: [],
      exchange: 1,
    });
    await saveGroups(this.combat, groups);
    this._emitGroupsUpdated();
    this.render(false);
  }

  async _onActorDisadvantageChange(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const combatantId = event.currentTarget.dataset.combatantId;
    const value = parseInt(event.currentTarget.value);

    // Broadcast to all other clients for immediate update
    game.socket.emit(SOCKET_NAME, {
      type: "disadvantageChange",
      combatId: this.combat.id,
      groupId,
      combatantId,
      value,
    });

    if (game.user.isGM) {
      // GM persists to combat flags (triggers updateCombat for all clients)
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantDisadvantage) group.combatantDisadvantage = {};
        group.combatantDisadvantage[combatantId] = value;
        await saveGroups(this.combat, groups);
      }
    } else {
      // Player can't write combat flags; user flag as fallback for GM to persist
      await game.user.setFlag(FLAG_SCOPE, "pendingDisadvantage", {
        combatId: this.combat.id,
        groupId,
        combatantId,
        value,
        t: Date.now(),
      });
    }
  }

  async _onActorStanceChange(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const combatantId = event.currentTarget.dataset.combatantId;
    const value = event.currentTarget.value;

    // Broadcast to all other clients for immediate update
    game.socket.emit(SOCKET_NAME, {
      type: "stanceChange",
      combatId: this.combat.id,
      groupId,
      combatantId,
      value,
    });

    if (game.user.isGM) {
      // GM persists to combat flags (triggers updateCombat for all clients)
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantStance) group.combatantStance = {};
        group.combatantStance[combatantId] = value;
        await saveGroups(this.combat, groups);
      }
    } else {
      // Player can't write combat flags; user flag as fallback for GM to persist
      await game.user.setFlag(FLAG_SCOPE, "pendingStance", {
        combatId: this.combat.id,
        groupId,
        combatantId,
        value,
        t: Date.now(),
      });
    }
  }

  async _onActorKnockedDownChange(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const combatantId = event.currentTarget.dataset.combatantId;
    const value = event.currentTarget.checked;

    game.socket.emit(SOCKET_NAME, {
      type: "knockedDownChange",
      combatId: this.combat.id,
      groupId,
      combatantId,
      value,
    });

    if (game.user.isGM) {
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantKnockedDown) group.combatantKnockedDown = {};
        group.combatantKnockedDown[combatantId] = value;
        await saveGroups(this.combat, groups);
      }
    } else {
      await game.user.setFlag(FLAG_SCOPE, "pendingKnockedDown", {
        combatId: this.combat.id,
        groupId,
        combatantId,
        value,
        t: Date.now(),
      });
    }
  }

  async _onActorWeaponChange(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const combatantId = event.currentTarget.dataset.combatantId;
    const value = event.currentTarget.value;

    game.socket.emit(SOCKET_NAME, {
      type: "weaponChange",
      combatId: this.combat.id,
      groupId,
      combatantId,
      value,
    });

    if (game.user.isGM) {
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantWeapon) group.combatantWeapon = {};
        group.combatantWeapon[combatantId] = value;
        await saveGroups(this.combat, groups);
      }
    } else {
      await game.user.setFlag(FLAG_SCOPE, "pendingWeapon", {
        combatId: this.combat.id,
        groupId,
        combatantId,
        value,
        t: Date.now(),
      });
    }

    // Sync weapon selection to the bw-dice-pool panel if installed
    this._syncWeaponToDicePool(combatantId, value);
  }

  _syncWeaponToDicePool(combatantId, weaponKey) {
    if (!game.poolPanel) return;

    const combatant = this.combat.combatants.get(combatantId);
    const actor = combatant?.actor;
    if (!actor) return;

    // Only sync if the dice pool's currently selected actor matches this combatant's actor
    const controlledTokens = canvas.tokens?.controlled ?? [];
    const poolActor = game.user.isGM
      ? controlledTokens[0]?.actor
      : (controlledTokens.filter(t => t.isOwner)[0]?.actor
        ?? canvas.tokens?.placeables?.find(t => t.isOwner)?.actor);
    if (!poolActor || poolActor.id !== actor.id) return;

    if (!weaponKey) {
      game.poolPanel.handleWeaponSelected("", "");
      return;
    }

    const [type, index] = weaponKey.split("-");
    if (type === "melee") {
      const w = actor.system?.gear?.weapons?.[index];
      if (!w?.name) return;
      const actorPower = actor.system?.stats?.power?.exponent || 0;
      const basePower = actorPower + (w.pow || 0);
      const weaponData = {
        name: w.name.trim(),
        label: w.name.trim(),
        i: Math.ceil(basePower / 2),
        m: basePower,
        s: Math.floor(basePower * 1.5),
        shade: w.shade ?? "B",
        type: "weapons",
        va: w.va,
        ws: w.ws,
        add: w.add,
        length: w.length,
      };
      game.poolPanel.handleWeaponSelected(weaponData.name, JSON.stringify(weaponData));
    } else if (type === "ranged") {
      const w = actor.system?.gear?.rangedWeapons?.[index];
      if (!w?.name) return;
      const weaponData = {
        name: w.name.trim(),
        label: w.name.trim(),
        i: w.dofI,
        m: w.dofM,
        s: w.dofS,
        shade: w.shade ?? "B",
        add: "1/2",
        type: "rangedWeapons",
        ws: "-",
        va: w.va,
        length: `${w.optimalRange || ""} / ${w.extremeRange || ""}`,
      };
      game.poolPanel.handleWeaponSelected(weaponData.name, JSON.stringify(weaponData));
    }
  }

  async _addCombatantToGroup(combatantId, groupId) {
    const groups = loadGroups(this.combat);
    // Check not already assigned
    const alreadyAssigned = groups.some(g => (g.combatantIds || []).includes(combatantId));
    if (alreadyAssigned) return;

    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.combatantIds.push(combatantId);
      await saveGroups(this.combat, groups);
      this._emitGroupsUpdated();
      this.render(false);
    }
  }

  async _onRemoveFromGroup(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const combatantId = event.currentTarget.dataset.combatantId;
    const combatant = this.combat.combatants.get(combatantId);
    const name = combatant?.token?.name ?? combatant?.actor?.name ?? "this combatant";
    const confirm = await Dialog.confirm({
      title: "Remove Combatant",
      content: `<p>Remove <strong>${name}</strong> from the group?</p>`,
    });
    if (!confirm) return;

    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.combatantIds = group.combatantIds.filter(id => id !== combatantId);
      if (group.combatantDisadvantage) delete group.combatantDisadvantage[combatantId];
      if (group.combatantStance) delete group.combatantStance[combatantId];
      if (group.combatantKnockedDown) delete group.combatantKnockedDown[combatantId];
      if (group.combatantWeapon) delete group.combatantWeapon[combatantId];
      await saveGroups(this.combat, groups);
      // Clean local actions
      if (this.localActions[groupId]) delete this.localActions[groupId][combatantId];
      this._emitGroupsUpdated();
      this.render(false);
    }
  }

  async _onRemoveGroup(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    const confirm = await Dialog.confirm({
      title: "Remove Group",
      content: `<p>Remove <strong>${group?.name ?? "this group"}</strong> and all its contents?</p>`,
    });
    if (!confirm) return;

    const remaining = groups.filter(g => g.id !== groupId);
    delete this.localActions[groupId];
    await saveGroups(this.combat, remaining);
    this._emitGroupsUpdated();
    this.render(false);
  }

  async _onMoveActorUp(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const combatantId = event.currentTarget.dataset.combatantId;
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const idx = group.combatantIds.indexOf(combatantId);
    if (idx <= 0) return;
    [group.combatantIds[idx - 1], group.combatantIds[idx]] = [group.combatantIds[idx], group.combatantIds[idx - 1]];
    await saveGroups(this.combat, groups);
    this._emitGroupsUpdated();
    this.render(false);
  }

  async _onMoveActorDown(event) {
    const groupId = event.currentTarget.dataset.groupId;
    const combatantId = event.currentTarget.dataset.combatantId;
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const idx = group.combatantIds.indexOf(combatantId);
    if (idx < 0 || idx >= group.combatantIds.length - 1) return;
    [group.combatantIds[idx], group.combatantIds[idx + 1]] = [group.combatantIds[idx + 1], group.combatantIds[idx]];
    await saveGroups(this.combat, groups);
    this._emitGroupsUpdated();
    this.render(false);
  }

  async _onNextExchange(event) {
    if (!game.user.isGM) return;
    const groupId = event.currentTarget.dataset.groupId;

    // Increment exchange counter in group flags
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.exchange = (group.exchange || 1) + 1;
      await saveGroups(this.combat, groups);
    }

    // Use Foundry's -= deletion syntax to actually remove nested keys.
    // setFlag deep-merges, so `delete obj[key]` + setFlag doesn't remove the key.
    const flagPrefix = `flags.${FLAG_SCOPE}`;
    await this.combat.update({
      [`${flagPrefix}.${FLAG_REVEALED}.-=${groupId}`]: null,
      [`${flagPrefix}.${FLAG_READY}.-=${groupId}`]: null,
      [`${flagPrefix}.${FLAG_SCRIPTED}.-=${groupId}`]: null,
    });

    // Clear local actions for this group
    delete this.localActions[groupId];

    // Clear remote card counts for this group
    if (this._remoteCardCounts) {
      for (const key of Object.keys(this._remoteCardCounts)) {
        if (key.startsWith(`${groupId}-`)) {
          delete this._remoteCardCounts[key];
        }
      }
    }

    // Reset flip animation tracking so reveals animate again
    for (const key of this._previouslyRevealed) {
      if (key.startsWith(`${groupId}-`)) {
        this._previouslyRevealed.delete(key);
      }
    }

    // Tell all clients to clear their local state for this group
    game.socket.emit(SOCKET_NAME, {
      type: "nextExchange",
      combatId: this.combat.id,
      groupId,
    });
    this.render(false);
  }

  // ---- Drag and Drop ----

  _onDragStart(event) {
    const combatantId = event.currentTarget.dataset.combatantId;
    event.originalEvent.dataTransfer.setData("text/plain", combatantId);
    event.currentTarget.classList.add("dragging");
  }

  _onDragEnd(event) {
    event.currentTarget.classList.remove("dragging");
  }

  _onDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  }

  _onDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      event.currentTarget.classList.remove("drag-over");
    }
  }

  _onDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");
    const combatantId = event.originalEvent.dataTransfer.getData("text/plain");
    const groupId = event.currentTarget.dataset.groupId;
    if (!combatantId || !groupId) return;
    this._addCombatantToGroup(combatantId, groupId);
  }

  // ---- Action Scripting (Cards) ----

  _onBlankCardClick(event) {
    const el = event.currentTarget;
    const groupId = el.dataset.groupId;
    const combatantId = el.dataset.combatantId;
    const volleyIndex = parseInt(el.dataset.volley);

    // Only allow scripting for owned combatants
    const combatant = this.combat.combatants.get(combatantId);
    if (!combatant?.isOwner) return;

    this._showActionPicker(el, groupId, combatantId, volleyIndex);
  }

  _onOwnedCardClick(event) {
    const el = event.currentTarget;
    const groupId = el.dataset.groupId;
    const combatantId = el.dataset.combatantId;
    const volleyIndex = parseInt(el.dataset.volley);
    const cardIndex = parseInt(el.dataset.cardIndex);

    // Remove the action
    const combatant = this.combat.combatants.get(combatantId);
    if (!combatant?.isOwner) return;

    if (!this.localActions[groupId]?.[combatantId]?.[volleyIndex]) return;
    this.localActions[groupId][combatantId][volleyIndex].splice(cardIndex, 1);
    this._emitLocalActionCount(groupId, combatantId, volleyIndex);
    this.render(false);
  }

  _onChatIconClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const card = event.currentTarget.closest(".action-card");
    if (!card) return;
    const actionName = card.querySelector(".card-label")?.textContent?.trim();
    if (!actionName) return;

    const actionData = getActionData(actionName);
    let content = `<div style="text-align:left"><strong>${actionName}</strong>`;
    if (actionData?.subtext) content += ` <em>(${actionData.subtext})</em>`;
    if (actionData?.description) {
      const descHtml = actionData.description
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n/g, "<br>");
      content += `<hr>${descHtml}`;
    }
    content += `</div>`;

    ChatMessage.create({ content });
  }

  _onRevealedCardClick(event) {
    // Don't interfere with the chat icon
    if (event.target.closest(".card-chat-btn")) return;
    event.preventDefault();

    const card = event.currentTarget;
    const actionName = card.querySelector(".card-label")?.textContent?.trim();
    if (!actionName) return;

    const info = {
      groupId: card.dataset.groupId,
      combatantId: card.dataset.combatantId,
      volley: card.dataset.volley,
      cardIndex: card.dataset.cardIndex,
      action: actionName,
    };

    // If clicking an already-selected card, deselect it
    const existingIdx = this._selectedCards.findIndex(
      s => s.groupId === info.groupId && s.combatantId === info.combatantId
        && s.volley === info.volley && s.cardIndex === info.cardIndex
    );
    if (existingIdx >= 0) {
      this._selectedCards.splice(existingIdx, 1);
      card.classList.remove("selected");
      return;
    }

    // If we already have 2 selected, clear them
    if (this._selectedCards.length >= 2) {
      this._selectedCards = [];
      this.element.find(".action-card.revealed.selected").removeClass("selected");
    }

    this._selectedCards.push(info);
    card.classList.add("selected");

    // When 2 cards selected, show the interaction overlay
    if (this._selectedCards.length === 2) {
      const action1 = this._selectedCards[0].action;
      const action2 = this._selectedCards[1].action;
      this._showInteractionOverlay(action1, action2);

      // Broadcast to all other clients
      game.socket.emit(SOCKET_NAME, {
        type: "showInteraction",
        combatId: this.combat.id,
        action1,
        action2,
      });
    }
  }

  _showInteractionOverlay(action1, action2) {
    // Remove any existing overlay
    document.querySelectorAll(".fight-resolved-overlay").forEach(el => el.remove());

    const interaction1 = getFightInteraction(action1, action2) ?? "—";
    const interaction2 = getFightInteraction(action2, action1) ?? "—";

    const data1 = getActionData(action1);
    const data2 = getActionData(action2);

    const toHtml = (desc) => {
      if (!desc) return "";
      return desc
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n/g, "<br>");
    };

    const overlay = document.createElement("div");
    overlay.classList.add("fight-resolved-overlay");
    overlay.innerHTML = `
      <div class="fight-resolved-header">
        <h3>Action Interaction</h3>
      </div>
      <div class="fight-resolved-sides">
        <div class="fight-resolved-side">
          <div class="fight-resolved-action-name">${action1}</div>
          <div class="fight-resolved-interaction">Resolution: <strong>${interaction1}</strong></div>
          <div class="fight-resolved-description">${toHtml(data1?.description)}</div>
        </div>
        <div class="fight-resolved-vs">VS</div>
        <div class="fight-resolved-side">
          <div class="fight-resolved-action-name">${action2}</div>
          <div class="fight-resolved-interaction">Resolution: <strong>${interaction2}</strong></div>
          <div class="fight-resolved-description">${toHtml(data2?.description)}</div>
        </div>
      </div>
    `;

    // Create close button and position it absolutely via inline style
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.title = "Close";
    closeBtn.innerHTML = `<i class="fas fa-times"></i>`;
    closeBtn.style.cssText = "position:absolute;top:6px;right:6px;width:auto;height:auto;margin:0;background:none;border:none;font-size:1em;cursor:pointer;color:#888;padding:2px 4px;z-index:1;";
    closeBtn.addEventListener("mouseenter", () => closeBtn.style.color = "#c00");
    closeBtn.addEventListener("mouseleave", () => closeBtn.style.color = "#888");
    overlay.appendChild(closeBtn);

    document.body.appendChild(overlay);

    const closeOverlay = () => {
      overlay.remove();
      document.removeEventListener("keydown", escHandler, true);
      this._selectedCards = [];
      this.element?.find(".action-card.revealed.selected").removeClass("selected");
    };

    const escHandler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeOverlay();
      }
    };

    // Use capture phase so Escape closes this before any other dialog
    document.addEventListener("keydown", escHandler, true);
    closeBtn.addEventListener("click", closeOverlay);
  }

  _showActionPicker(anchorEl, groupId, combatantId, volleyIndex) {
    // Use the anchor element's document so this works in pop-out windows
    const doc = anchorEl.ownerDocument;

    // Remove any existing picker
    doc.querySelectorAll(".bw-action-picker").forEach(el => el.remove());

    const picker = doc.createElement("div");
    picker.classList.add("bw-action-picker");

    for (const action of ACTIONS) {
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.textContent = action.subtext ? `${action.name} (${action.subtext})` : action.name;
      btn.classList.add("action-pick-btn");
      if (action.description) btn.title = action.description;
      btn.addEventListener("click", () => {
        this._scriptAction(groupId, combatantId, volleyIndex, action.name);
        picker.remove();
      });
      picker.appendChild(btn);
    }

    // Position near the clicked element
    doc.body.appendChild(picker);
    const rect = anchorEl.getBoundingClientRect();
    picker.style.position = "fixed";
    picker.style.left = `${rect.left}px`;
    picker.style.top = `${rect.bottom + 4}px`;
    picker.style.zIndex = "10000";

    // Close on outside click
    const closeHandler = (e) => {
      if (!picker.contains(e.target)) {
        picker.remove();
        doc.removeEventListener("pointerdown", closeHandler, true);
      }
    };
    setTimeout(() => doc.addEventListener("pointerdown", closeHandler, true), 0);
  }

  _scriptAction(groupId, combatantId, volleyIndex, action) {
    if (!this.localActions[groupId]) this.localActions[groupId] = {};
    if (!this.localActions[groupId][combatantId]) this.localActions[groupId][combatantId] = [[], [], []];
    this.localActions[groupId][combatantId][volleyIndex].push(action);
    this._emitLocalActionCount(groupId, combatantId, volleyIndex);
    this.render(false);
  }

  // ---- Ready Flow ----

  async _onReadyClick(event) {
    const el = event.currentTarget;
    const groupId = el.dataset.groupId;
    const combatantId = el.dataset.combatantId;

    const combatant = this.combat.combatants.get(combatantId);
    if (!combatant?.isOwner) return;

    const localGroupActions = this.localActions[groupId] || {};
    const actions = localGroupActions[combatantId] || [[], [], []];

    // Stash actions locally so we can render locked cards while waiting for flags
    const key = `${groupId}-${combatantId}`;
    this._pendingReadyLocal[key] = foundry.utils.duplicate(actions);

    // Clear local actions and re-render immediately to show locked state
    if (this.localActions[groupId]) {
      delete this.localActions[groupId][combatantId];
    }
    this.render(false);

    if (game.user.isGM) {
      await this._saveReadyState(groupId, combatantId, actions);
      delete this._pendingReadyLocal[key];
    } else {
      // Players can't write combat flags, so write to own user flags.
      // The GM picks this up via the updateUser hook.
      await game.user.setFlag(FLAG_SCOPE, "pendingReady", {
        combatId: this.combat.id,
        groupId,
        combatantId,
        actions: foundry.utils.duplicate(actions),
        t: Date.now(),
      });
    }
  }

  async _saveReadyState(groupId, combatantId, actions) {
    const ready = loadReady(this.combat);
    if (!ready[groupId]) ready[groupId] = {};
    ready[groupId][combatantId] = true;
    await saveReady(this.combat, ready);

    const scripted = loadScripted(this.combat);
    if (!scripted[groupId]) scripted[groupId] = {};
    scripted[groupId][combatantId] = foundry.utils.duplicate(actions);
    await saveScripted(this.combat, scripted);
  }

  // ---- Reveal Flow ----

  async _onRevealVolley(event) {
    if (!game.user.isGM) return;
    const groupId = event.currentTarget.dataset.groupId;
    const volleyIndex = parseInt(event.currentTarget.dataset.volley);

    // Get all actors in this group so every actor gets a revealed entry
    const groups = loadGroups(this.combat);
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    // Initialize collected with empty arrays for all combatants in the group
    const collected = {};
    for (const combatantId of (group.combatantIds || [])) {
      collected[combatantId] = [];
    }

    // Fill from scripted (ready) combatants — already stored in flags
    const scriptedData = loadScripted(this.combat);
    const groupScripted = scriptedData[groupId] || {};
    for (const [combatantId, volleys] of Object.entries(groupScripted)) {
      const actions = Array.isArray(volleys) ? volleys[volleyIndex] : [];
      if (actions && actions.length > 0) collected[combatantId] = [...actions];
    }

    // Add GM's own local (non-ready) actions
    const gmGroupActions = this.localActions[groupId] || {};
    for (const [combatantId, volleys] of Object.entries(gmGroupActions)) {
      if (collected[combatantId]?.length > 0) continue; // Already have from scripted
      const actions = volleys[volleyIndex] || [];
      if (actions.length > 0) collected[combatantId] = [...actions];
    }

    // Check if any non-GM players might have unscripted actions to submit
    const readyData = loadReady(this.combat);
    const groupReady = readyData[groupId] || {};
    const needsPlayerInput = (group.combatantIds || []).some(combatantId => {
      if (collected[combatantId]?.length > 0) return false; // Already have actions
      const combatant = this.combat.combatants.get(combatantId);
      if (!combatant) return false;
      if (combatant.isOwner) return false; // GM owns this combatant
      if (groupReady[combatantId]) return false; // Already submitted via Ready
      return true; // Non-GM combatant without scripted actions
    });

    if (needsPlayerInput) {
      // Store pending collection for updateUser handler to fill
      const key = `${groupId}-${volleyIndex}`;
      this._pendingRevealResolvers[key] = { collected };

      // Request actions from players via combat flag (reliable, unlike sockets)
      await this.combat.setFlag(FLAG_SCOPE, "pendingReveal", {
        groupId,
        volleyIndex,
        t: Date.now(),
      });

      // Wait for player submissions via updateUser hook
      await new Promise(resolve => {
        this._pendingRevealResolvers[key].resolve = resolve;
        this._pendingRevealResolvers[key].timer = setTimeout(resolve, 30);
      });

      delete this._pendingRevealResolvers[key];
    }

    // Save revealed actions
    const revealed = loadRevealed(this.combat);
    if (!revealed[groupId]) revealed[groupId] = {};
    revealed[groupId][volleyIndex] = collected;
    await saveRevealed(this.combat, revealed);

    // Clear local actions for this volley
    if (this.localActions[groupId]) {
      for (const combatantId of Object.keys(this.localActions[groupId])) {
        if (this.localActions[groupId][combatantId]) {
          this.localActions[groupId][combatantId][volleyIndex] = [];
        }
      }
    }

    // All clients (including GM) re-render via updateCombat hook triggered by saveRevealed.
    // Do NOT call this.render(false) here — it would cause a double render that kills
    // the flip animation (the first render from the hook adds flip-in and updates
    // _previouslyRevealed, then the second render replaces the DOM without flip-in).
  }

  // ---- Socket Handlers ----

  _handleSocket(data) {
    if (data.combatId !== this.combat.id) return;

    switch (data.type) {
      case "groupsUpdated":
        this.render(false);
        break;

      case "actionCount":
        this._handleActionCount(data);
        break;

      case "nextExchange":
        this._handleNextExchange(data);
        break;

      case "disadvantageChange":
        this._handleDisadvantageChange(data);
        break;

      case "stanceChange":
        this._handleStanceChange(data);
        break;

      case "knockedDownChange":
        this._handleKnockedDownChange(data);
        break;

      case "weaponChange":
        this._handleWeaponChange(data);
        break;

      case "showInteraction":
        this._showInteractionOverlay(data.action1, data.action2);
        break;
    }
  }

  _submitActionsForReveal({ groupId, volleyIndex }) {
    const readyData = loadReady(this.combat);
    const groupReady = readyData[groupId] || {};
    const groupActions = this.localActions[groupId] || {};
    const submission = {};
    for (const [combatantId, volleys] of Object.entries(groupActions)) {
      if (groupReady[combatantId]) continue; // Already submitted via ready
      const actions = volleys[volleyIndex] || [];
      if (actions.length > 0) submission[combatantId] = [...actions];
    }

    if (Object.keys(submission).length > 0) {
      game.user.setFlag(FLAG_SCOPE, "pendingRevealSubmission", {
        combatId: this.combat.id,
        groupId,
        volleyIndex,
        actions: submission,
        t: Date.now(),
      });
    }

    // Clear local actions for this volley since they're being revealed
    if (this.localActions[groupId]) {
      for (const combatantId of Object.keys(this.localActions[groupId])) {
        if (this.localActions[groupId][combatantId]) {
          this.localActions[groupId][combatantId][volleyIndex] = [];
        }
      }
    }
  }

  // Notify other clients about how many cards an actor has scripted (for face-down display)
  _emitLocalActionCount(groupId, combatantId, volleyIndex) {
    const count = this.localActions[groupId]?.[combatantId]?.[volleyIndex]?.length || 0;
    game.socket.emit(SOCKET_NAME, {
      type: "actionCount",
      combatId: this.combat.id,
      groupId,
      combatantId,
      volleyIndex,
      count,
      userId: game.user.id,
    });
  }

  _handleActionCount(data) {
    // Update remote card counts for face-down display
    if (data.userId === game.user.id) return;
    const combatant = this.combat.combatants.get(data.combatantId);
    if (combatant?.isOwner) return; // We own this combatant, ignore remote counts

    if (!this._remoteCardCounts) this._remoteCardCounts = {};
    const key = `${data.groupId}-${data.combatantId}-${data.volleyIndex}`;
    this._remoteCardCounts[key] = data.count;
    this.render(false);
  }

  async _handleDisadvantageChange(data) {
    const { groupId, combatantId, value } = data;

    // Store locally for immediate display on all clients
    this._localDisadvantage[`${groupId}-${combatantId}`] = value;

    if (game.user.isGM) {
      // GM persists to combat flags (triggers updateCombat for all clients)
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantDisadvantage) group.combatantDisadvantage = {};
        group.combatantDisadvantage[combatantId] = value;
        await saveGroups(this.combat, groups);
      }
    }

    this.render(false);
  }

  async _handleStanceChange(data) {
    const { groupId, combatantId, value } = data;

    // Store locally for immediate display on all clients
    this._localStance[`${groupId}-${combatantId}`] = value;

    if (game.user.isGM) {
      // GM persists to combat flags (triggers updateCombat for all clients)
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantStance) group.combatantStance = {};
        group.combatantStance[combatantId] = value;
        await saveGroups(this.combat, groups);
      }
    }

    this.render(false);
  }

  async _handleKnockedDownChange(data) {
    const { groupId, combatantId, value } = data;

    this._localKnockedDown[`${groupId}-${combatantId}`] = value;

    if (game.user.isGM) {
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantKnockedDown) group.combatantKnockedDown = {};
        group.combatantKnockedDown[combatantId] = value;
        await saveGroups(this.combat, groups);
      }
    }

    this.render(false);
  }

  async _handleWeaponChange(data) {
    const { groupId, combatantId, value } = data;

    this._localWeapon[`${groupId}-${combatantId}`] = value;

    if (game.user.isGM) {
      const groups = loadGroups(this.combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantWeapon) group.combatantWeapon = {};
        group.combatantWeapon[combatantId] = value;
        await saveGroups(this.combat, groups);
      }
    }

    this.render(false);
  }

  _handleNextExchange(data) {
    const { groupId } = data;
    // Clear local actions for this group
    delete this.localActions[groupId];
    // Clear remote card counts for this group
    if (this._remoteCardCounts) {
      for (const key of Object.keys(this._remoteCardCounts)) {
        if (key.startsWith(`${groupId}-`)) {
          delete this._remoteCardCounts[key];
        }
      }
    }
    // Reset flip animation tracking so reveals animate again
    for (const key of this._previouslyRevealed) {
      if (key.startsWith(`${groupId}-`)) {
        this._previouslyRevealed.delete(key);
      }
    }
    // Defer render slightly so flag sync from updateCombat arrives first
    setTimeout(() => this.render(false), 500);
  }

  _getRemoteCardCount(groupId, combatantId, volleyIndex) {
    if (!this._remoteCardCounts) return 0;
    return this._remoteCardCounts[`${groupId}-${combatantId}-${volleyIndex}`] || 0;
  }

  _applyRemoteCardCounts(data) {
    for (const group of data.groups) {
      for (const actor of group.actors) {
        for (const volley of actor.volleys) {
          if (!volley.isRevealed && !actor.isOwner) {
            const remoteCount = this._getRemoteCardCount(group.id, actor.combatantId, volley.volleyIndex);
            if (remoteCount > 0) {
              volley.cards = Array.from({ length: remoteCount }, () => ({
                action: "",
                state: "hidden",
                isHidden: true,
              }));
            }
          }
        }
      }
    }
    return data;
  }

  // ---- Socket Emitters ----

  _emitGroupsUpdated() {
    game.socket.emit(SOCKET_NAME, {
      type: "groupsUpdated",
      combatId: this.combat.id,
    });
  }
}

// ---- Global Dialog Registry ----

function findFightDialog(combatId) {
  return _fightDialogs.get(combatId) ?? null;
}

// ---- Hooks ----

Hooks.once("ready", () => {
  game.socket.on(SOCKET_NAME, (data) => {
    // Dispatch to all subsystems via a shared hook
    Hooks.callAll("bw-fight-socket", data);
  });
});

// Fight dialog socket handler
Hooks.on("bw-fight-socket", (data) => {
  if (!data.combatId) return;
  const dialog = findFightDialog(data.combatId);
  if (dialog) dialog._handleSocket(data);
});

// Re-render dialog when combat flags change (ensures revealed data syncs to all clients)
Hooks.on("updateCombat", (combat, change) => {

  console.log("Combat updated", combat.id, change);

  if (!change?.flags?.[FLAG_SCOPE]) return;

  // If showDialog flag changed, open the dialog for non-GM clients
  if (change.flags[FLAG_SCOPE].showDialog && !game.user.isGM) {
    const existing = findFightDialog(combat.id);
    if (existing) {
      existing.bringToTop();
    } else {
      new FightDialog(combat).render(true);
    }
    return;
  }

  // If pendingReveal flag changed, players submit their local actions
  if (change.flags[FLAG_SCOPE].pendingReveal && !game.user.isGM) {
    const dialog = findFightDialog(combat.id);
    if (dialog) dialog._submitActionsForReveal(change.flags[FLAG_SCOPE].pendingReveal);
  }

  const dialog = findFightDialog(combat.id);
  if (dialog) dialog.render(false);
});

// GM picks up player ready requests and reveal submissions written to user flags.
// Read directly from the user document rather than relying on the change diff,
// since Foundry may deliver the diff in dot-notation or nested form.
Hooks.on("updateUser", (user, change) => {
  if (!game.user.isGM) return;
  if (user.id === game.user.id) return; // Ignore GM's own user updates

  // Check if bw-fight flags were part of this update
  const hasBwFightChange = change?.flags?.[FLAG_SCOPE]
    || Object.keys(change).some(k => k.startsWith(`flags.${FLAG_SCOPE}`));
  if (!hasBwFightChange) return;

  const pendingReady = user.getFlag(FLAG_SCOPE, "pendingReady");
  if (pendingReady) {
    const { combatId, groupId, combatantId, actions } = pendingReady;
    const combat = game.combats.get(combatId);
    if (combat) {
      const ready = loadReady(combat);
      if (!ready[groupId]) ready[groupId] = {};
      ready[groupId][combatantId] = true;
      saveReady(combat, ready).then(() => {
        const scripted = loadScripted(combat);
        if (!scripted[groupId]) scripted[groupId] = {};
        scripted[groupId][combatantId] = foundry.utils.duplicate(actions);
        return saveScripted(combat, scripted);
      });
    }
  }

  const pendingRevealSubmission = user.getFlag(FLAG_SCOPE, "pendingRevealSubmission");
  if (pendingRevealSubmission) {
    const { combatId, groupId, volleyIndex, actions } = pendingRevealSubmission;
    const dialog = findFightDialog(combatId);
    if (dialog) {
      const key = `${groupId}-${volleyIndex}`;
      const pending = dialog._pendingRevealResolvers[key];
      if (pending) {
        for (const [combatantId, combatantActions] of Object.entries(actions)) {
          if (!pending.collected[combatantId]?.length) {
            pending.collected[combatantId] = combatantActions;
          }
        }
      }
    }
  }

  const pendingDisadvantage = user.getFlag(FLAG_SCOPE, "pendingDisadvantage");
  if (pendingDisadvantage) {
    const { combatId, groupId, combatantId, value } = pendingDisadvantage;
    const combat = game.combats.get(combatId);
    if (combat) {
      const groups = loadGroups(combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantDisadvantage) group.combatantDisadvantage = {};
        group.combatantDisadvantage[combatantId] = value;
        saveGroups(combat, groups);
      }
    }
  }

  const pendingStance = user.getFlag(FLAG_SCOPE, "pendingStance");
  if (pendingStance) {
    const { combatId, groupId, combatantId, value } = pendingStance;
    const combat = game.combats.get(combatId);
    if (combat) {
      const groups = loadGroups(combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantStance) group.combatantStance = {};
        group.combatantStance[combatantId] = value;
        saveGroups(combat, groups);
      }
    }
  }

  const pendingKnockedDown = user.getFlag(FLAG_SCOPE, "pendingKnockedDown");
  if (pendingKnockedDown) {
    const { combatId, groupId, combatantId, value } = pendingKnockedDown;
    const combat = game.combats.get(combatId);
    if (combat) {
      const groups = loadGroups(combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantKnockedDown) group.combatantKnockedDown = {};
        group.combatantKnockedDown[combatantId] = value;
        saveGroups(combat, groups);
      }
    }
  }

  const pendingWeapon = user.getFlag(FLAG_SCOPE, "pendingWeapon");
  if (pendingWeapon) {
    const { combatId, groupId, combatantId, value } = pendingWeapon;
    const combat = game.combats.get(combatId);
    if (combat) {
      const groups = loadGroups(combat);
      const group = groups.find(g => g.id === groupId);
      if (group) {
        if (!group.combatantWeapon) group.combatantWeapon = {};
        group.combatantWeapon[combatantId] = value;
        saveGroups(combat, groups);
      }
    }
  }
});

// Re-render dialog when actor data changes (e.g. wound penalties)
Hooks.on("updateActor", () => {
  for (const dialog of _fightDialogs.values()) {
    dialog.render(false);
  }
});

Hooks.on("renderCombatTracker", (app, html, data) => {
  if (!game.combat) return;

  html.find(".bw-fight-btn").remove();

  const button = $(`<a class="combat-button bw-fight-btn" title="Fight!"><i class="fas fa-fist-raised"></i> Fight!</a>`);
  button.on("click", () => {
    const existing = findFightDialog(game.combat.id);
    if (existing) {
      existing.bringToTop();
    } else {
      new FightDialog(game.combat).render(true);
    }
  });

  const controls = html.find(".encounter-controls");
  if (controls.length) {
    controls.after(button);
  }
});
